import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSongDetailAI } from '../API/MusicAPI';
import Card from '../Components/UI/Card'; // 👇 IMPORT THEO ĐÚNG ĐƯỜNG DẪN CỦA BẠN

const SongDetail = () => {
    const { id } = useParams(); 
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // 👇 Thêm 2 state mới để chứa danh sách bài hát gợi ý
    const [relatedSongs, setRelatedSongs] = useState([]); 
    const [aiRecommendedSongs, setAiRecommendedSongs] = useState([]);

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    useEffect(() => {
        // 1. HÀM TẢI CHI TIẾT VÀ BÀI HÁT LIÊN QUAN (YOUTUBE)
        const loadDetail = async () => {
            setLoading(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            const result = await fetchSongDetailAI(id);
            setData(result || {}); 
            
            // Xử lý mảng "related" từ YouTube (Cùng thể loại/Quốc gia)
            if (result && result.related) {
                const formattedRelated = result.related
                    .filter(s => s.videoId && s.videoId !== id) // Loại bỏ bài đang phát
                    .slice(0, 10) 
                    .map(s => ({
                        id: s.videoId,
                        title: s.title,
                        artist: s.artists ? s.artists.map(a => a.name).join(', ') : 'Unknown',
                        // Lấy ảnh thumbnail chất lượng cao
                        image: `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`
                    }));
                setRelatedSongs(formattedRelated);
            }

            setLoading(false);
        };

        // 2. HÀM GỌI TRÍ TUỆ NHÂN TẠO (AI)
        const loadAIRecommendations = async () => {
            if (!currentUser || !currentUser.id) return; // Không đăng nhập thì không có AI
            try {
                const res = await fetch(`http://localhost:8000/api/recommend/songs?userId=${currentUser.id}`);
                const songIds = await res.json();
                
                if (Array.isArray(songIds) && songIds.length > 0) {
                    // Lọc bỏ bài hát hiện tại khỏi danh sách gợi ý AI
                    const filteredIds = songIds.filter(sid => sid !== id).slice(0, 10);
                    
                    // Dịch ID thành thông tin bài hát
                    const promises = filteredIds.map(sid => fetchSongDetailAI(sid));
                    const detailsRaw = await Promise.all(promises);
                    
                    const formattedAI = detailsRaw.filter(s => s && s.info).map(s => ({
                        id: s.info.videoDetails.videoId,
                        title: s.info.videoDetails.title,
                        artist: s.info.videoDetails.author,
                        image: `https://img.youtube.com/vi/${s.info.videoDetails.videoId}/hqdefault.jpg`
                    }));
                    setAiRecommendedSongs(formattedAI);
                }
            } catch (err) {
                console.error("Lỗi lấy AI:", err);
            }
        };
        
        if (id && id !== 'undefined') {
            loadDetail();
            loadAIRecommendations(); // Gọi AI chạy song song
            
            // Ghi nhận hành động xem (Huấn luyện AI)
            if (currentUser && currentUser.id) {
                try {
                    fetch('http://localhost:5000/api/log-interaction', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: currentUser.id,
                            itemId: id, 
                            itemType: 'song',
                            actionType: 'VIEW'
                        })
                    });
                } catch (err) {
                    console.error("Lỗi ghi log:", err);
                }
            }
        }
    }, [id]); // Chỉ chạy lại khi đổi ID bài hát

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

    if (!id || id === 'undefined') return <div style={{color:'white', textAlign:'center', paddingTop: 100}}>❌ Lỗi ID bài hát</div>;

    return (
        <div style={{ color: 'white', paddingBottom: 100 }}>
            {/* --- TRÌNH PHÁT NHẠC (LUÔN HIỆN) --- */}
            <div style={{ 
                background: 'linear-gradient(to bottom, #1f1f1f, #121212)',
                padding: '100px 5% 50px',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                <div style={{ maxWidth: '800px', width: '100%' }}>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(29, 185, 84, 0.3)' }}>
                        <iframe 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            src={`https://www.youtube.com/embed/${id}?autoplay=1`} 
                            title="Music Player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>

                    {!loading && data?.info && (
                        <div style={{ marginTop: '30px', textAlign: 'left' }}>
                            <h1 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#1db954' }}>
                                {data.info.videoDetails?.title || "Đang phát..."}
                            </h1>
                            <p style={{ fontSize: '1.2rem', color: '#ccc' }}>
                                {data.info.videoDetails?.author || ""}
                            </p>
                        </div>
                    )}
                </div>
            </div>

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

            {/* --- LỜI BÀI HÁT --- */}
            {!loading && data?.lyrics && (
                <div style={{ padding: '0 10%', marginTop: '20px' }}>
                    <h3 style={{ color: '#1db954', borderBottom: '1px solid #333', paddingBottom: '10px' }}>📝 Lời bài hát</h3>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#ddd', background: '#222', padding: '30px', borderRadius: '10px', marginTop: '20px' }}>
                        {data.lyrics}
                    </div>
                </div>
            )}

            {/* 👇 HÀNG 1: BÀI HÁT CÙNG THỂ LOẠI (RELATED) */}
            {relatedSongs.length > 0 && (
                <div style={{ padding: '0 10%', marginTop: '60px' }}>
                    <h3 style={{ color: '#1db954', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
                        🎧 Bài hát cùng thể loại
                    </h3>
                    <div className="media-grid">
                        {relatedSongs.map(s => (
                            <Card 
                                key={s.id} id={s.id} type="song" title={s.title}
                                image={s.image} subtitle={s.artist}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 👇 HÀNG 2: AI TỰ ĐỘNG GỢI Ý DỰA TRÊN LƯỢT VIEW/LIKE */}
            {currentUser && aiRecommendedSongs.length > 0 && (
                <div style={{ padding: '0 10%', marginTop: '60px' }}>
                    <h3 style={{ color: '#1db954', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
                        ✨ Dựa trên sở thích của bạn
                    </h3>
                    <div className="media-grid">
                        {aiRecommendedSongs.map(s => (
                            <Card 
                                key={s.id} id={s.id} type="song" title={s.title}
                                image={s.image} subtitle={s.artist}
                            />
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default SongDetail;