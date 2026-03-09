import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_KEY, BASE_URL, IMAGE_URL } from '../API/tmdbAPI';
import Card from '../Components/UI/Card'; // Đảm bảo import đúng đường dẫn Card

function MovieDetail() {
    const { id } = useParams(); // Lấy ID phim từ URL
    const [movie, setMovie] = useState(null);
    const [trailerKey, setTrailerKey] = useState(null); // Lưu ID video Youtube
    const [similarMovies, setSimilarMovies] = useState([]);
    
    // Số lượng phim "Cùng thể loại" hiển thị ban đầu, và khi bấm xem thêm
    const [visibleSimilarCount, setVisibleSimilarCount] = useState(5); 
    
    // State cho AI
    const [aiRecommendedMovies, setAiRecommendedMovies] = useState([]);
    const [loadingAI, setLoadingAI] = useState(false);

    // Lấy thông tin user hiện tại
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    useEffect(() => {
        const fetchDetail = async () => {
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu khi đổi phim
            try {
                // 1. GỌI API LẤY CHI TIẾT & PHIM LIÊN QUAN (Bằng Tiếng Việt)
                const detailResponse = await fetch(
                    `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=vi-VN&append_to_response=similar`
                );
                const data = await detailResponse.json();
                setMovie(data);

                // 2. GỌI API LẤY VIDEO RIÊNG (Bằng Tiếng Anh / Mặc định để chắc chắn có video)
                const videoResponse = await fetch(
                    `${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}` // KHÔNG dùng language=vi-VN ở đây
                );
                const videoData = await videoResponse.json();

                // 3. LỌC LẤY VIDEO TRAILER
                if (videoData.results && videoData.results.length > 0) {
                    const trailer = videoData.results.find(
                        vid => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
                    );
                    setTrailerKey(trailer ? trailer.key : videoData.results[0].key);
                } else {
                    setTrailerKey(null);
                }

                // 4. LƯU DANH SÁCH PHIM LIÊN QUAN
                if (data.similar && data.similar.results) {
                    setSimilarMovies(data.similar.results);
                }
                
                setVisibleSimilarCount(5);

            } catch (error) {
                console.error("Lỗi lấy chi tiết:", error);
            }
            
            // GHI NHẬN HÀNH ĐỘNG XEM
            if (id && currentUser && currentUser.id) {
                try {
                    fetch('http://localhost:5000/api/log-interaction', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: currentUser.id,
                            itemId: id, 
                            itemType: 'movie',
                            actionType: 'VIEW'
                        })
                    });
                } catch (error) {
                    console.error("Lỗi ghi log:", error);
                }
            }
        };

        const fetchAIRecommendations = async () => {
            if (!currentUser || !currentUser.id) return;
            setLoadingAI(true);
            try {
                // Gọi API AI
                const res = await fetch(`http://localhost:8000/api/recommend/movies?userId=${currentUser.id}`);
                const movieIds = await res.json();
                
                if (Array.isArray(movieIds) && movieIds.length > 0) {
                    const filteredIds = movieIds.filter(mid => sidToString(mid) !== id).slice(0, 10);
                    const promises = filteredIds.map(mid => 
                        fetch(`${BASE_URL}/movie/${mid}?api_key=${API_KEY}&language=vi-VN`).then(r => r.json())
                    );
                    const detailsRaw = await Promise.all(promises);
                    setAiRecommendedMovies(detailsRaw.filter(m => m && m.id));
                }
            } catch (err) {
                console.error("Lỗi lấy AI:", err);
            }
            setLoadingAI(false);
        };

       
        const sidToString = (val) => val ? String(val) : '';

        if (id) {
            fetchDetail();
            fetchAIRecommendations();
        }
    }, [id]); 

    // Hàm xử lý "Xem thêm" phim liên quan
    const handleLoadMoreSimilar = () => {
        setVisibleSimilarCount(prevCount => prevCount + 5);
    };

   // STATE LƯU TRỮ
    const [likeStatus, setLikeStatus] = useState(null); 
    const [userRating, setUserRating] = useState(0);    
    const [hoverStar, setHoverStar] = useState(0);
    const [stats, setStats] = useState({ views: 0, likes: 0, dislikes: 0, avgRating: 0, rateCount: 0 });

    // HÀM LẤY SỐ LIỆU TỪ DB
    const fetchStats = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/stats/movie/${id}`); // Đối với SongDetail thì đổi 'movie' thành 'song'
            const data = await res.json();
            setStats(data);
        } catch (err) { console.error(err); }
    };

    // Vừa vào trang là lấy số liệu ngay
    useEffect(() => {
        if (id) fetchStats();
    }, [id]);

    // HÀM CLICK LIKE/DISLIKE
    const handleLikeStatus = async (status) => {
        if (!currentUser) { alert("Bạn cần đăng nhập để thả cảm xúc!"); return; }
        setLikeStatus(status); // Cập nhật màu nút ngay lập tức cho mượt
        try {
            await fetch('http://localhost:5000/api/log-interaction', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, itemId: String(id), itemType: 'movie', actionType: status })
            });
            fetchStats(); // 👈 BÍ QUYẾT: GỌI LẠI HÀM NÀY ĐỂ SỐ LƯỢT LIKE NHẢY LÊN
        } catch (err) { console.error("Lỗi:", err); }
    };

    // HÀM CLICK ĐÁNH GIÁ SAO
    const handleRating = async (star) => {
        if (!currentUser) { alert("Bạn cần đăng nhập để đánh giá!"); return; }
        setUserRating(star); // Lưu số sao user vừa chọn
        try {
            await fetch('http://localhost:5000/api/log-interaction', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, itemId: String(id), itemType: 'movie', actionType: `RATE_${star}` })
            });
            fetchStats(); // 👈 GỌI LẠI ĐỂ CẬP NHẬT ĐIỂM TRUNG BÌNH
        } catch (err) { console.error("Lỗi:", err); }
    };

    if (!movie) return <div style={{color:'white', textAlign:'center', marginTop: 100}}>⏳ Đang tải chi tiết phim...</div>;

    return (
        <div style={{ color: 'white', paddingBottom: '100px' }}>
            {/* --- KHU VỰC 1: BANNER VÀ THÔNG TIN PHIM --- */}
            <div style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.8), #141414), url(${IMAGE_URL}${movie.backdrop_path})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '100px 5% 50px',
                display: 'flex',
                gap: '40px',
                alignItems: 'flex-start',
                flexWrap: 'wrap'
            }}>
                <img 
                    src={movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster'} 
                    alt={movie.title}
                    style={{ width: '300px', borderRadius: '10px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
                />

                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>{movie.title}</h1>
                    <p style={{ fontStyle: 'italic', color: '#ccc', fontSize: '1.2rem' }}>{movie.tagline}</p>
                    
                    <div style={{ display: 'flex', gap: '15px', margin: '20px 0' }}>
                        <span style={{ background: '#e50914', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold' }}>
                            {movie.vote_average?.toFixed(1)} ⭐
                        </span>
                        <span style={{ border: '1px solid white', padding: '5px 10px', borderRadius: '4px' }}>
                            {movie.release_date?.split('-')[0] || 'N/A'}
                        </span>
                        <span style={{ border: '1px solid white', padding: '5px 10px', borderRadius: '4px' }}>
                            {movie.runtime} phút
                        </span>
                    </div>

                    <h3 style={{ borderBottom: '2px solid #e50914', display: 'inline-block', marginBottom: '10px' }}>Nội dung</h3>
                    <p style={{ lineHeight: '1.6', fontSize: '1.1rem', color: '#ddd', maxWidth: '800px' }}>
                        {movie.overview || "Chưa có mô tả tiếng Việt cho phim này."}
                    </p>
                    
                    <div style={{ marginTop: '20px' }}>
                        {movie.genres?.map(g => (
                            <span key={g.id} style={{ marginRight: '10px', color: '#999', background: '#222', padding: '5px 10px', borderRadius: '20px', fontSize: '0.9rem' }}>
                                {g.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- KHU VỰC 2: VIDEO TRAILER PHIM --- */}
            {trailerKey && (
                <div style={{ padding: '0 5%', marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h2 style={{ color: 'white', marginBottom: '20px', alignSelf: 'flex-start' }}>🎬 Trailer Chính Thức</h2>
                    <div style={{ maxWidth: '1000px', width: '100%', position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        <iframe 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=0`} 
                            title="Movie Trailer"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}

            {/* --- KHU VỰC THỐNG KÊ VÀ TƯƠNG TÁC (MODERN UI) --- */}
                    <div style={{ background: 'linear-gradient(145deg, #1a1a1a, #121212)', padding: '20px 30px', borderRadius: '15px', marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        
                        {/* Dòng 1: Thống kê tổng quan */}
                        <div style={{ display: 'flex', gap: '30px', color: '#aaa', fontSize: '0.95rem', borderBottom: '1px solid #333', paddingBottom: '15px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>👁️ <strong style={{color: 'white', fontSize: '1.1rem'}}>{stats.views}</strong> lượt xem</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>❤️ <strong style={{color: '#1db954', fontSize: '1.1rem'}}>{stats.likes}</strong> người thích</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>⭐ <strong style={{color: '#ffc107', fontSize: '1.1rem'}}>{stats.avgRating}</strong>/5 ({stats.rateCount} đánh giá)</span>
                        </div>

                        {/* Dòng 2: Bảng Điều Khiển Tương Tác */}
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button 
                                    onClick={() => handleLikeStatus('LIKE')} 
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 25px', borderRadius: '30px', border: likeStatus === 'LIKE' ? 'none' : '1px solid #444', background: likeStatus === 'LIKE' ? 'linear-gradient(45deg, #1db954, #128c3c)' : 'transparent', color: likeStatus === 'LIKE' ? 'white' : '#ccc', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s', boxShadow: likeStatus === 'LIKE' ? '0 5px 15px rgba(29, 185, 84, 0.4)' : 'none' }}
                                >
                                    👍 Thích
                                </button>
                                <button 
                                    onClick={() => handleLikeStatus('DISLIKE')} 
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 25px', borderRadius: '30px', border: likeStatus === 'DISLIKE' ? 'none' : '1px solid #444', background: likeStatus === 'DISLIKE' ? 'linear-gradient(45deg, #e50914, #b20710)' : 'transparent', color: likeStatus === 'DISLIKE' ? 'white' : '#ccc', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s', boxShadow: likeStatus === 'DISLIKE' ? '0 5px 15px rgba(229, 9, 20, 0.4)' : 'none' }}
                                >
                                    👎 Không
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.3)', padding: '10px 20px', borderRadius: '30px' }}>
                                <span style={{ color: '#ccc', fontWeight: 'bold', fontSize: '0.9rem' }}>Đánh giá của bạn: </span>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span 
                                            key={star} onClick={() => handleRating(star)}
                                            onMouseEnter={() => setHoverStar(star)} onMouseLeave={() => setHoverStar(0)}
                                            style={{ 
                                                color: (hoverStar || userRating) >= star ? '#ffc107' : '#444', 
                                                cursor: 'pointer', fontSize: '1.8rem', transition: 'all 0.2s', 
                                                textShadow: (hoverStar || userRating) >= star ? '0 0 15px rgba(255, 193, 7, 0.8)' : 'none', 
                                                transform: hoverStar === star ? 'scale(1.2)' : 'scale(1)' 
                                            }}
                                        >★</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

            {/* --- KHU VỰC 3: PHIM CÙNG THỂ LOẠI (VỚI NÚT XEM THÊM) --- */}
            {similarMovies.length > 0 && (
                <div style={{ padding: '0 5%', marginTop: '60px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ color: '#e50914', borderLeft: '5px solid #e50914', paddingLeft: '15px' }}>
                            🍿 Phim Tương Tự
                        </h2>
                    </div>
                    
                    <div className="media-grid">
                        {/* Chỉ map ra đúng số lượng visibleSimilarCount */}
                        {similarMovies.slice(0, visibleSimilarCount).map(m => (
                            <Card 
                                key={m.id} id={m.id} type="movie" title={m.title}
                                image={m.poster_path ? `${IMAGE_URL}${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}
                                subtitle={`⭐ ${m.vote_average?.toFixed(1)}`}
                            />
                        ))}
                    </div>

                    {/* Nút Xem thêm: Nếu số phim đang hiện nhỏ hơn tổng số phim tương tự thì hiện nút */}
                    {visibleSimilarCount < similarMovies.length && (
                        <div style={{ textAlign: 'center', marginTop: '30px' }}>
                            <button 
                                onClick={handleLoadMoreSimilar}
                                style={{
                                    padding: '10px 30px', background: 'transparent', color: 'white',
                                    border: '1px solid #e50914', borderRadius: '30px', cursor: 'pointer',
                                    fontSize: '1rem', transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => { e.target.style.background = '#e50914'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                            >
                                Hiển thị thêm phim 👇
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- KHU VỰC 4: AI TỰ ĐỘNG GỢI Ý --- */}
            {currentUser && (
                <div style={{ padding: '0 5%', marginTop: '60px' }}>
                    <h2 style={{ color: '#00bcd4', borderLeft: '5px solid #00bcd4', paddingLeft: '15px', marginBottom: '20px' }}>
                        ✨ Các phim được dành riêng cho bạn
                    </h2>
                    
                    {loadingAI ? (
                        <div style={{ textAlign: 'center', color: '#888' }}>⏳ AI đang phân tích dữ liệu...</div>
                    ) : aiRecommendedMovies.length > 0 ? (
                        <div className="media-grid">
                            {aiRecommendedMovies.map(m => (
                                <Card 
                                    key={m.id} id={m.id} type="movie" title={m.title}
                                    image={m.poster_path ? `${IMAGE_URL}${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}
                                    subtitle={`⭐ ${m.vote_average?.toFixed(1)}`}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '20px', background: '#222', borderRadius: '10px', color: '#aaa', textAlign: 'center' }}>
                            🤖 <strong>Hệ thống chưa đủ dữ liệu!</strong><br/>
                            Hãy xem và tương tác thêm với các phim khác để chúng tôi hiểu rõ sở thích của bạn hơn.
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

export default MovieDetail;