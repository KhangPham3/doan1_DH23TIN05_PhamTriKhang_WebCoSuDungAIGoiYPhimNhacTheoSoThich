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
                    // Loại bỏ ID của phim hiện tại (không gợi ý lại chính nó)
                    const filteredIds = movieIds.filter(mid => sidToString(mid) !== id).slice(0, 5);
                    
                    // Dịch ID ra dữ liệu TMDB
                    const promises = filteredIds.map(mid => 
                        fetch(`${BASE_URL}/movie/${mid}?api_key=${API_KEY}&language=vi-VN`).then(r => r.json())
                    );
                    const detailsRaw = await Promise.all(promises);
                    
                    setAiRecommendedMovies(detailsRaw.filter(m => m && !m.success===false && m.id));
                }
            } catch (err) {
                console.error("Lỗi lấy AI:", err);
            }
            setLoadingAI(false);
        };

        // Hàm helper để convert ID cho chắc (đề phòng Python trả về dạng int)
        const sidToString = (val) => val ? String(val) : '';

        if (id) {
            fetchDetail();
            fetchAIRecommendations();
        }
    }, [id]); // Bỏ currentUser ra khỏi dependency để tránh loop

    // Hàm xử lý "Xem thêm" phim liên quan
    const handleLoadMoreSimilar = () => {
        setVisibleSimilarCount(prevCount => prevCount + 5);
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