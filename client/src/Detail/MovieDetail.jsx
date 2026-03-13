import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_KEY, BASE_URL, IMAGE_URL } from '../API/tmdbAPI';
import Card from '../Components/UI/Card'; 

function MovieDetail() {
    const { id } = useParams(); 
    const [movie, setMovie] = useState(null);
    const [trailerKey, setTrailerKey] = useState(null); 
    const [similarMovies, setSimilarMovies] = useState([]);
    const [visibleSimilarCount, setVisibleSimilarCount] = useState(5); 
    
    const [aiRecommendedMovies, setAiRecommendedMovies] = useState([]);
    const [loadingAI, setLoadingAI] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // STATE LƯU TRỮ CẢM XÚC
    const [likeStatus, setLikeStatus] = useState(null); 
    const [userRating, setUserRating] = useState(0);    
    const [hoverStar, setHoverStar] = useState(0);
    const [stats, setStats] = useState({ views: 0, likes: 0, dislikes: 0, avgRating: 0, rateCount: 0 });

    // 🟢 SỬA LỖI: RESET LẠI CẢM XÚC VÀ ĐÁNH GIÁ KHI ĐỔI PHIM MỚI
    useEffect(() => {
        setLikeStatus(null);
        setUserRating(0);
        setHoverStar(0);
    }, [id]);

    useEffect(() => {
        const fetchDetail = async () => {
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
            try {
                const detailResponse = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=vi-VN&append_to_response=similar`);
                const data = await detailResponse.json();
                setMovie(data);

                const videoResponse = await fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`);
                const videoData = await videoResponse.json();

                if (videoData.results && videoData.results.length > 0) {
                    const trailer = videoData.results.find(vid => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser'));
                    setTrailerKey(trailer ? trailer.key : videoData.results[0].key);
                } else {
                    setTrailerKey(null);
                }

                if (data.similar && data.similar.results) setSimilarMovies(data.similar.results);
                setVisibleSimilarCount(5);

            } catch (error) { console.error("Lỗi lấy chi tiết:", error); }
            
            if (id && currentUser && currentUser.id) {
                try {
                    fetch('http://localhost:5000/api/log-interaction', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser.id, itemId: id, itemType: 'movie', actionType: 'VIEW' })
                    });
                } catch (error) {}
            }
        };

        const fetchAIRecommendations = async () => {
            if (!currentUser || !currentUser.id) return;
            setLoadingAI(true);
            try {
                const res = await fetch(`http://localhost:8000/api/recommend/movies?userId=${currentUser.id}`);
                const movieIds = await res.json();
                if (Array.isArray(movieIds) && movieIds.length > 0) {
                    const filteredIds = movieIds.filter(mid => String(mid) !== id).slice(0, 10);
                    const promises = filteredIds.map(mid => fetch(`${BASE_URL}/movie/${mid}?api_key=${API_KEY}&language=vi-VN`).then(r => r.json()));
                    const detailsRaw = await Promise.all(promises);
                    setAiRecommendedMovies(detailsRaw.filter(m => m && m.id));
                }
            } catch (err) {}
            setLoadingAI(false);
        };

        if (id) {
            fetchDetail();
            fetchAIRecommendations();
        }
    }, [id]); 

    const fetchStats = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/stats/movie/${id}`); 
            const data = await res.json();
            setStats(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { if (id) fetchStats(); }, [id]);

    const handleLikeStatus = async (status) => {
        if (!currentUser) { alert("Bạn cần đăng nhập để thả cảm xúc!"); return; }
        setLikeStatus(status); 
        try {
            await fetch('http://localhost:5000/api/log-interaction', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, itemId: String(id), itemType: 'movie', actionType: status })
            });
            fetchStats(); 
        } catch (err) {}
    };

    const handleRating = async (star) => {
        if (!currentUser) { alert("Bạn cần đăng nhập để đánh giá!"); return; }
        setUserRating(star); 
        try {
            await fetch('http://localhost:5000/api/log-interaction', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, itemId: String(id), itemType: 'movie', actionType: `RATE_${star}` })
            });
            fetchStats(); 
        } catch (err) {}
    };

    if (!movie) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div style={{ color: 'white', paddingBottom: '100px', background: '#0a0a0a', minHeight: '100vh' }}>
            
            {/* --- BANNER --- */}
            <div className="hero-banner" style={{ backgroundImage: `url(${IMAGE_URL}${movie.backdrop_path})` }}>
                <div className="hero-overlay"></div>
                
                <img 
                    src={movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster'} 
                    alt={movie.title} className="poster-img animate-fade-right"
                />

                <div className="hero-content animate-fade-up">
                    <h1 className="movie-title">{movie.title}</h1>
                    {movie.tagline && <p className="movie-tagline">"{movie.tagline}"</p>}
                    
                    <div className="movie-meta">
                        <span className="meta-badge rating-badge">⭐ {movie.vote_average?.toFixed(1)}</span>
                        <span className="meta-badge">{movie.release_date?.split('-')[0] || 'N/A'}</span>
                        <span className="meta-badge">{movie.runtime} phút</span>
                    </div>

                    <h3 className="section-heading">Nội dung chính</h3>
                    <p className="movie-overview">{movie.overview || "Chưa có mô tả tiếng Việt cho phim này."}</p>
                    
                    <div className="genres-container">
                        {movie.genres?.map(g => ( <span key={g.id} className="genre-tag">{g.name}</span> ))}
                    </div>
                </div>
            </div>

            {/* --- CONTAINER CHÍNH --- */}
            <div className="content-container">
                {/* TRAILER */}
                {trailerKey && (
                    <div className="trailer-section animate-fade-up" style={{ animationDelay: '0.3s' }}>
                        <h2 className="gradient-text-red">🎬 Trailer Chính Thức</h2>
                        <div className="video-wrapper">
                            <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=0`} title="Movie Trailer" frameBorder="0" allowFullScreen></iframe>
                        </div>
                    </div>
                )}
                
                {/* BẢNG ĐIỀU KHIỂN TƯƠNG TÁC */}
                <div className="action-panel animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <div className="stats-row">
                        <span><i className="icon">👁️</i> <strong className="stat-num">{stats.views}</strong> lượt xem</span>
                        <span><i className="icon">❤️</i> <strong className="stat-num highlight-green">{stats.likes}</strong> người thích</span>
                        <span><i className="icon">⭐</i> <strong className="stat-num highlight-yellow">{stats.avgRating}</strong>/5 ({stats.rateCount} đánh giá)</span>
                    </div>

                    <div className="actions-row">
                        <div className="btn-group">
                            <button className={`action-btn ${likeStatus === 'LIKE' ? 'active-like' : ''}`} onClick={() => handleLikeStatus('LIKE')}>
                                👍 Thích
                            </button>
                            <button className={`action-btn ${likeStatus === 'DISLIKE' ? 'active-dislike' : ''}`} onClick={() => handleLikeStatus('DISLIKE')}>
                                👎 Không
                            </button>
                        </div>
                        
                        <div className="rating-box">
                            <span className="rating-text">Đánh giá của bạn: </span>
                            <div className="stars-container">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span 
                                        key={star} onClick={() => handleRating(star)}
                                        onMouseEnter={() => setHoverStar(star)} onMouseLeave={() => setHoverStar(0)}
                                        className={`star ${ (hoverStar || userRating) >= star ? 'star-active' : '' }`}
                                    >★</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                

                {/* PHIM TƯƠNG TỰ */}
                {similarMovies.length > 0 && (
                    <div className="section-margin animate-fade-up" style={{ animationDelay: '0.4s' }}>
                        <h2 className="gradient-text-red border-left-red">🍿 Phim Tương Tự</h2>
                        <div className="media-grid">
                            {similarMovies.slice(0, visibleSimilarCount).map(m => (
                                <Card key={m.id} id={m.id} type="movie" title={m.title} image={m.poster_path ? `${IMAGE_URL}${m.poster_path}` : 'https://via.placeholder.com/300x450'} subtitle={`⭐ ${m.vote_average?.toFixed(1)}`} />
                            ))}
                        </div>
                        {visibleSimilarCount < similarMovies.length && (
                            <div className="load-more-container">
                                <button className="load-more-btn" onClick={() => setVisibleSimilarCount(p => p + 5)}>Hiển thị thêm 👇</button>
                            </div>
                        )}
                    </div>
                )}

                {/* GỢI Ý AI */}
                {currentUser && (
                    <div className="section-margin animate-fade-up" style={{ animationDelay: '0.5s' }}>
                        <h2 className="gradient-text-blue border-left-blue">✨ Dành riêng cho bạn (AI)</h2>
                        {loadingAI ? (
                            <div style={{ textAlign: 'center', color: '#00bcd4' }}>🤖 AI đang phân tích dữ liệu...</div>
                        ) : aiRecommendedMovies.length > 0 ? (
                            <div className="media-grid">
                                {aiRecommendedMovies.map(m => (
                                    <Card key={m.id} id={m.id} type="movie" title={m.title} image={m.poster_path ? `${IMAGE_URL}${m.poster_path}` : 'https://via.placeholder.com/300x450'} subtitle={`⭐ ${m.vote_average?.toFixed(1)}`} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-ai-box">🤖 <strong>Hệ thống chưa đủ dữ liệu!</strong><br/>Hãy tương tác thêm để chúng tôi hiểu bạn hơn.</div>
                        )}
                    </div>
                )}
            </div>

            {/* --- CSS TÍCH HỢP --- */}
            <style dangerouslySetInnerHTML={{__html: `
                .loading-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0a0a; }
                .spinner { width: 50px; height: 50px; border-radius: 50%; border: 3px solid #e50914; border-top-color: transparent; animation: spin 1s linear infinite; }
                
                .hero-banner { position: relative; padding: 120px 5% 60px; display: flex; gap: 50px; align-items: center; flex-wrap: wrap; background-size: cover; background-position: top center; background-attachment: fixed; }
                .hero-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(10,10,10,0.2) 0%, rgba(10,10,10,1) 100%), linear-gradient(to right, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.5) 50%, rgba(10,10,10,0.8) 100%); z-index: 1; }
                .poster-img { width: 320px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.8); z-index: 2; border: 1px solid rgba(255,255,255,0.1); }
                .hero-content { position: relative; z-index: 2; flex: 1; min-width: 300px; text-shadow: 0 2px 10px rgba(0,0,0,0.8); }
                
                .movie-title { font-size: 3.5rem; margin: 0 0 5px; font-weight: 900; background: linear-gradient(to right, #fff, #ccc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .movie-tagline { font-style: italic; color: #aaa; font-size: 1.3rem; margin-bottom: 25px; }
                .movie-meta { display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap; }
                .meta-badge { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 6px 15px; border-radius: 8px; font-weight: bold; backdrop-filter: blur(5px); }
                .rating-badge { background: rgba(229, 9, 20, 0.2); border-color: #e50914; color: #ffc107; }
                .section-heading { border-bottom: 2px solid #e50914; display: inline-block; margin-bottom: 15px; padding-bottom: 5px; font-size: 1.2rem; }
                .movie-overview { line-height: 1.8; font-size: 1.1rem; color: #ddd; max-width: 900px; margin-bottom: 25px; }
                .genres-container { display: flex; gap: 10px; flex-wrap: wrap; }
                .genre-tag { color: #fff; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 18px; border-radius: 30px; font-size: 0.9rem; transition: all 0.3s; cursor: default; }
                .genre-tag:hover { background: #e50914; border-color: #e50914; }

                .content-container { padding: 0 5%; position: relative; z-index: 5; margin-top: -30px; }
                
                /* Action Panel Glassmorphism */
                .action-panel { background: rgba(20,20,20,0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 25px 35px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 50px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 20px; }
                .stats-row { display: flex; gap: 40px; color: #aaa; font-size: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; flex-wrap: wrap; }
                .stat-num { color: white; font-size: 1.3rem; margin-left: 5px; }
                .highlight-green { color: #1db954; } .highlight-yellow { color: #ffc107; }
                .actions-row { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; justify-content: space-between; }
                
                .btn-group { display: flex; gap: 15px; }
                .action-btn { display: flex; align-items: center; gap: 8px; padding: 12px 30px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: #ccc; cursor: pointer; font-weight: bold; font-size: 1rem; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
                .action-btn:hover { background: rgba(255,255,255,0.1); color: white; transform: translateY(-2px); }
                .action-btn:active { transform: scale(0.95); }
                .active-like { background: linear-gradient(45deg, #1db954, #128c3c); border-color: transparent; color: white; box-shadow: 0 10px 20px rgba(29, 185, 84, 0.4); }
                .active-dislike { background: linear-gradient(45deg, #e50914, #b20710); border-color: transparent; color: white; box-shadow: 0 10px 20px rgba(229, 9, 20, 0.4); }

                .rating-box { display: flex; align-items: center; gap: 15px; background: rgba(0,0,0,0.4); padding: 10px 25px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05); }
                .rating-text { color: #ccc; font-weight: bold; font-size: 0.95rem; }
                .stars-container { display: flex; gap: 5px; }
                .star { color: #444; cursor: pointer; font-size: 2rem; transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); line-height: 1; }
                .star-active { color: #ffc107; text-shadow: 0 0 15px rgba(255, 193, 7, 0.8); transform: scale(1.1); }
                
                .trailer-section { margin-top: 50px; }
                .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; border-radius: 15px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); background: #000; }
                .video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
                
                .section-margin { margin-top: 60px; }
                .gradient-text-red { font-size: 1.8rem; margin-bottom: 25px; color: #fff; display: flex; align-items: center; }
                .border-left-red { border-left: 5px solid #e50914; padding-left: 15px; }
                .gradient-text-blue { font-size: 1.8rem; margin-bottom: 25px; color: #fff; display: flex; align-items: center; }
                .border-left-blue { border-left: 5px solid #00bcd4; padding-left: 15px; }
                
                .load-more-container { text-align: center; margin-top: 40px; }
                .load-more-btn { padding: 12px 40px; background: transparent; color: white; border: 2px solid #e50914; border-radius: 30px; cursor: pointer; font-size: 1rem; font-weight: bold; transition: all 0.3s; }
                .load-more-btn:hover { background: #e50914; box-shadow: 0 10px 20px rgba(229,9,20,0.3); transform: translateY(-3px); }
                
                .empty-ai-box { padding: 30px; background: rgba(0,188,212,0.05); border: 1px dashed rgba(0,188,212,0.3); border-radius: 15px; color: #aaa; text-align: center; font-size: 1.1rem; line-height: 1.6; }

                @keyframes fadeUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
                @keyframes fadeRight { 0% { opacity: 0; transform: translateX(-30px); } 100% { opacity: 1; transform: translateX(0); } }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .animate-fade-right { animation: fadeRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
            `}} />
        </div>
    );
}

export default MovieDetail;