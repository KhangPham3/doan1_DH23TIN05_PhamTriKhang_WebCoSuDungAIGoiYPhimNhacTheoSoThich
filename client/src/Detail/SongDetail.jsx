import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSongDetailAI } from '../API/MusicAPI';

const SongDetail = () => {
    const { id } = useParams(); // Lấy ID từ URL (VD: dQw4w9WgXcQ)
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDetail = async () => {
            setLoading(true);
            window.scrollTo(0, 0);
            
            // Gọi API lấy thông tin (để hiển thị tên, lời bài hát)
            // Lưu ý: Dù API này lỗi thì vẫn phát nhạc được vì ta có ID rồi
            const result = await fetchSongDetailAI(id);
            setData(result || {}); // Nếu lỗi thì gán object rỗng để không crash
            
            setLoading(false);
        };
        
        if (id && id !== 'undefined') {
            loadDetail();
        }
    }, [id]);

    // Nếu ID lỗi thì báo ngay
    if (!id || id === 'undefined') return <div style={{color:'white', textAlign:'center', paddingTop: 100}}>❌ Lỗi ID bài hát</div>;

    return (
        <div style={{ color: 'white', paddingBottom: 50 }}>
            {/* --- TRÌNH PHÁT NHẠC (LUÔN HIỆN) --- */}
            <div style={{ 
                background: 'linear-gradient(to bottom, #1f1f1f, #121212)',
                padding: '100px 5% 50px',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                <div style={{ maxWidth: '800px', width: '100%' }}>
                    {/* 👇 IFRAME YOUTUBE: Dùng trực tiếp ID để phát */}
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

                    {/* Thông tin bài hát (Hiển thị khi tải xong data) */}
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
                <div style={{ padding: '0 10%', marginTop: '40px' }}>
                    <h3 style={{ color: '#1db954', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Lời bài hát</h3>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#ddd', background: '#222', padding: '30px', borderRadius: '10px', marginTop: '20px' }}>
                        {data.lyrics}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SongDetail;