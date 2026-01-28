import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { logInteraction } from '../API/trackingService';

// Hàm xử lý link YouTube (biến link thường thành link phát được)
const getEmbedUrl = (url) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    // Regex bắt tất cả các dạng link YouTube (ngắn, dài, embed)
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = cleanUrl.match(regExp);
    if (match && match[2]) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=1`; // Thêm autoplay=1 để tự hát
    }
    return null;
};

function SongDetail() {
    const { id } = useParams();
    const [song, setSong] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        window.scrollTo(0, 0); 
        
        // 1. Lấy chi tiết bài hát
        fetch(`http://localhost:5000/api/songs/${id}`)
            .then(res => res.json())
            .then(data => setSong(data))
            .catch(err => console.error(err));

        // 2. Lấy gợi ý
        fetch(`http://localhost:5000/api/songs/${id}/recommend`)
            .then(res => res.json())
            .then(data => setRecommendations(data))
            .catch(err => console.error(err));

        if(id){
            logInteraction(id, 'song', 'view');
            }
    }, [id]);

    if (!song) return <div style={{color:'white', padding: 20}}>⏳ Đang tải nhạc...</div>;

    return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: '#141414', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <Link to="/songs" style={{ color: '#aaa', textDecoration: 'none', display:'flex', alignItems:'center', gap: 5, marginBottom: 20 }}>
                <span>⬅</span> Quay lại danh sách nhạc
            </Link>
            
            {/* --- KHUNG CHÍNH: CHIA 2 CỘT (FLEXBOX) --- */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginBottom: '50px' }}>
                
                {/* 1. CỘT TRÁI: THÔNG TIN & PLAYER (Chiếm phần lớn) */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0', color: '#ffcc00' }}>{song.Title}</h1>
                    <p style={{ fontSize: '1.2rem', color: '#ddd' }}>
                        🎤 Nghệ sĩ: <strong style={{color: 'white'}}>{song.Artist}</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', fontSize: '0.9rem', color: '#ccc' }}>
                        <span style={{ border: '1px solid #ffcc00', color: '#ffcc00', padding: '2px 8px', borderRadius: '4px' }}>{song.Genre}</span>
                        <span>⏱ {song.DurationSeconds ? `${Math.floor(song.DurationSeconds / 60)} phút` : 'N/A'}</span>
                    </div>

                    {/* TRÌNH PHÁT NHẠC (YOUTUBE) */}
                    <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(255, 204, 0, 0.2)', border: '1px solid #333' }}>
                        {getEmbedUrl(song.Mp3URL) ? (
                             <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                                <iframe 
                                    src={getEmbedUrl(song.Mp3URL)} 
                                    title="Music Player"
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                ></iframe>
                            </div>
                        ) : (
                            <div style={{ padding: 40, textAlign: 'center', color: '#777' }}>
                                🚫 Chưa có link nhạc
                            </div>
                        )}
                    </div>

                </div>

                {/* 2. CỘT PHẢI: POSTER / ẢNH BÌA (Cố định kích thước) */}
                <div style={{ width: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                        width: '300px', 
                        height: '300px', 
                        borderRadius: '50%', // Làm tròn ảnh như đĩa than
                        overflow: 'hidden', 
                        boxShadow: '0 0 30px rgba(255, 204, 0, 0.3)',
                        border: '5px solid #222',
                        animation: 'spin 10s linear infinite' // Hiệu ứng xoay (nếu muốn)
                    }}>
                        <img 
                            src={song.CoverImageURL || "/img/disk.png"} 
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/300?text=Music" }}
                            alt={song.Title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                    
                    {/* Note nhỏ bên dưới ảnh */}
                    <p style={{ marginTop: 20 }}><strong>🏷️ Tags:</strong> <span style={{color: '#aaa', fontStyle: 'italic'}}>{song.Tags}</span></p>

                </div>

            </div>

            {/* --- PHẦN GỢI Ý (GIỮ NGUYÊN) --- */}
            <div style={{ marginTop: '50px', borderTop: '1px solid #333', paddingTop: '30px' }}>
                <h2 style={{ color: '#61dafb' }}>🎧 Có thể bạn cũng thích:</h2>
                {recommendations.length === 0 ? <p>Chưa có gợi ý nào.</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {recommendations.map(rec => (
                            <Link key={rec.SongID} to={`/song/${rec.SongID}`} style={{ textDecoration: 'none', color: 'white' }}>
                                <div style={{ backgroundColor: '#222', padding: '15px', borderRadius: '8px', cursor: 'pointer', transition: '0.3s' }}>
                                    <div style={{width: '100%', height: '150px', overflow:'hidden', marginBottom: 10, borderRadius: 4}}>
                                        <img src={rec.CoverImageURL} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                    </div>
                                    <h3 style={{ margin: '0 0 5px 0', color: '#ffcc00', fontSize: '1rem' }}>{rec.Title}</h3>
                                    <small>{rec.Artist}</small>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            
            {/* CSS Animation xoay đĩa nhạc */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default SongDetail;