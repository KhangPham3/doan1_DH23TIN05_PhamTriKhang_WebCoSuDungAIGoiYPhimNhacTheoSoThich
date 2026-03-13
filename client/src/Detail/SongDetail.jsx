import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSongDetailAI } from '../API/MusicAPI';
import Card from '../Components/UI/Card'; 

const SongDetail = () => {
    const { id } = useParams(); 
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [relatedSongs, setRelatedSongs] = useState([]); 
    const [aiRecommendedSongs, setAiRecommendedSongs] = useState([]);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // STATE LƯU TRỮ
    const [likeStatus, setLikeStatus] = useState(null); 
    const [userRating, setUserRating] = useState(0);    
    const [hoverStar, setHoverStar] = useState(0);
    const [stats, setStats] = useState({ views: 0, likes: 0, dislikes: 0, avgRating: 0, rateCount: 0 });

    // 🟢 SỬA LỖI: RESET LẠI CẢM XÚC VÀ ĐÁNH GIÁ KHI ĐỔI BÀI HÁT MỚI
    useEffect(() => {
        setLikeStatus(null);
        setUserRating(0);
        setHoverStar(0);
    }, [id]);

    useEffect(() => {
        const loadDetail = async () => {
            setLoading(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            const result = await fetchSongDetailAI(id);
            setData(result || {}); 
            
            if (result && result.related) {
                const formattedRelated = result.related
                    .filter(s => s.videoId && s.videoId !== id) 
                    .slice(0, 10) 
                    .map(s => ({
                        id: s.videoId, title: s.title,
                        artist: s.artists ? s.artists.map(a => a.name).join(', ') : 'Unknown',
                        image: `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`
                    }));
                setRelatedSongs(formattedRelated);
            }
            setLoading(false);
        };

        const loadAIRecommendations = async () => {
            if (!currentUser || !currentUser.id) return; 
            try {
                const res = await fetch(`http://localhost:8000/api/recommend/songs?userId=${currentUser.id}`);
                const songIds = await res.json();
                
                if (Array.isArray(songIds) && songIds.length > 0) {
                    const filteredIds = songIds.filter(sid => sid !== id).slice(0, 10);
                    const promises = filteredIds.map(sid => fetchSongDetailAI(sid));
                    const detailsRaw = await Promise.all(promises);
                    
                    const formattedAI = detailsRaw.filter(s => s && s.info).map(s => ({
                        id: s.info.videoDetails.videoId, title: s.info.videoDetails.title,
                        artist: s.info.videoDetails.author, image: `https://img.youtube.com/vi/${s.info.videoDetails.videoId}/hqdefault.jpg`
                    }));
                    setAiRecommendedSongs(formattedAI);
                }
            } catch (err) {}
        };
        
        if (id && id !== 'undefined') {
            loadDetail();
            loadAIRecommendations(); 
            
            if (currentUser && currentUser.id) {
                try {
                    fetch('http://localhost:5000/api/log-interaction', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser.id, itemId: id, itemType: 'song', actionType: 'VIEW' })
                    });
                } catch (err) {}
            }
        }
    }, [id]); 

    const fetchStats = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/stats/song/${id}`); 
            const data = await res.json();
            setStats(data);
        } catch (err) {}
    };

    useEffect(() => { if (id) fetchStats(); }, [id]);

    const handleLikeStatus = async (status) => {
        if (!currentUser) { alert("Bạn cần đăng nhập để thả cảm xúc!"); return; }
        setLikeStatus(status); 
        try {
            await fetch('http://localhost:5000/api/log-interaction', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, itemId: String(id), itemType: 'song', actionType: status })
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
                body: JSON.stringify({ userId: currentUser.id, itemId: String(id), itemType: 'song', actionType: `RATE_${star}` })
            });
            fetchStats(); 
        } catch (err) {}
    };

    if (!id || id === 'undefined') return <div style={{color:'white', textAlign:'center', paddingTop: 100}}>❌ Lỗi ID bài hát</div>;

    return (
        <div style={{ color: 'white', paddingBottom: 100, background: '#0a0a0a', minHeight: '100vh' }}>
            
            {/* --- TRÌNH PHÁT NHẠC --- */}
            <div className="music-player-section">
                <div className="player-glow"></div> {/* Hiệu ứng phát sáng đằng sau */}
                <div className="player-container animate-fade-up">
                    <div className="video-wrapper">
                        <iframe 
                            src={`https://www.youtube.com/embed/${id}?autoplay=1`} 
                            title="Music Player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                        ></iframe>
                    </div>

                    {!loading && data?.info && (
                        <div className="song-info">
                            <h1 className="song-title">{data.info.videoDetails?.title || "Đang phát..."}</h1>
                            <p className="song-artist">🎤 {data.info.videoDetails?.author || "Nghệ sĩ ẩn danh"}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- CONTAINER CHÍNH --- */}
            <div className="content-container">
                
                {/* BẢNG ĐIỀU KHIỂN TƯƠNG TÁC */}
                <div className="action-panel animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <div className="stats-row">
                        <span><i className="icon">🎧</i> <strong className="stat-num">{stats.views}</strong> lượt nghe</span>
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
                            <span className="rating-text">Đánh giá bài hát: </span>
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

                {/* LỜI BÀI HÁT */}
                {!loading && data?.lyrics && (
                    <div className="lyrics-section animate-fade-up" style={{ animationDelay: '0.3s' }}>
                        <h3 className="section-heading border-left-green">📝 Lời bài hát</h3>
                        <div className="lyrics-box">
                            {data.lyrics}
                        </div>
                    </div>
                )}

                {/* BÀI HÁT TƯƠNG TỰ */}
                {relatedSongs.length > 0 && (
                    <div className="section-margin animate-fade-up" style={{ animationDelay: '0.4s' }}>
                        <h3 className="section-heading border-left-green">🎧 Bài hát cùng thể loại</h3>
                        <div className="media-grid">
                            {relatedSongs.map(s => (
                                <Card key={s.id} id={s.id} type="song" title={s.title} image={s.image} subtitle={s.artist} />
                            ))}
                        </div>
                    </div>
                )}

                {/* GỢI Ý AI */}
                {currentUser && aiRecommendedSongs.length > 0 && (
                    <div className="section-margin animate-fade-up" style={{ animationDelay: '0.5s' }}>
                        <h3 className="section-heading border-left-blue">✨ Playlist dành riêng cho bạn</h3>
                        <div className="media-grid">
                            {aiRecommendedSongs.map(s => (
                                <Card key={s.id} id={s.id} type="song" title={s.title} image={s.image} subtitle={s.artist} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- CSS TÍCH HỢP --- */}
            <style dangerouslySetInnerHTML={{__html: `
                .music-player-section { position: relative; padding: 100px 5% 50px; display: flex; justify-content: center; background: radial-gradient(circle at top, #1a2c20 0%, #0a0a0a 60%); }
                .player-glow { position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%); width: 60%; height: 50%; background: #1db954; filter: blur(150px); opacity: 0.15; z-index: 1; pointer-events: none; }
                .player-container { position: relative; z-index: 2; max-width: 850px; width: 100%; }
                
                .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1); background: #000; }
                .video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
                
                .song-info { margin-top: 30px; text-align: center; }
                .song-title { font-size: 2.2rem; margin: 0 0 10px; font-weight: 900; background: linear-gradient(to right, #1db954, #fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .song-artist { font-size: 1.2rem; color: #aaa; letter-spacing: 1px; }

                .content-container { padding: 0 5%; position: relative; z-index: 5; }
                
                /* Action Panel Glassmorphism */
                .action-panel { background: rgba(20,20,20,0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 25px 35px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 50px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 20px; margin-top: 20px; }
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
                
                .lyrics-section { margin-top: 50px; }
                .lyrics-box { white-space: pre-wrap; line-height: 1.9; color: #ccc; font-size: 1.05rem; background: rgba(255,255,255,0.02); padding: 40px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); max-height: 500px; overflow-y: auto; text-align: center; font-style: italic; }
                /* Tùy chỉnh thanh cuộn cho Lời bài hát */
                .lyrics-box::-webkit-scrollbar { width: 8px; }
                .lyrics-box::-webkit-scrollbar-track { background: transparent; }
                .lyrics-box::-webkit-scrollbar-thumb { background: rgba(29, 185, 84, 0.5); border-radius: 10px; }
                .lyrics-box::-webkit-scrollbar-thumb:hover { background: #1db954; }

                .section-margin { margin-top: 60px; }
                .section-heading { font-size: 1.6rem; margin-bottom: 25px; color: #fff; }
                .border-left-green { border-left: 5px solid #1db954; padding-left: 15px; }
                .border-left-blue { border-left: 5px solid #00bcd4; padding-left: 15px; }

                @keyframes fadeUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
            `}} />
        </div>
    );
};

export default SongDetail;