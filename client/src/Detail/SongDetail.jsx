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
                    .slice(0, 5) // Lấy 5 bài đầu tiên cho đẹp 1 hàng
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
                    const filteredIds = songIds.filter(sid => sid !== id).slice(0, 5);
                    
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
                    <h3 style={{ color: '#e50914', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
                        ✨ AI Gợi ý dựa trên sở thích của bạn
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