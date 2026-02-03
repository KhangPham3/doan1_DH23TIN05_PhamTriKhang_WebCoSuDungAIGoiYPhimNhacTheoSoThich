import React, { useState, useEffect } from 'react';
import Card from '../Components/UI/Card'; 
import { fetchMusicCharts, searchMusic } from '../API/MusicAPI';

const GENRES = [
    "Thịnh Hành", 
    "Nhạc Trẻ Việt Nam", 
    "Rap Việt", 
    "K-Pop", 
    "US-UK Top Hits", 
    "EDM Remix", 
    "Lofi Chill", 
    "Bolero Trữ Tình",
    "V-POP"
];

function SongPage() {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeGenre, setActiveGenre] = useState("Thịnh Hành");

    // Hàm tải nhạc theo thể loại
    const loadSongs = async (genre) => {
        setLoading(true);
        setActiveGenre(genre);
        let data = [];

        try {
            if (genre === "Thịnh Hành") {
                // Gọi API Top 100
                data = await fetchMusicCharts();
            } else {
                // Gọi API Tìm kiếm theo từ khóa thể loại
                // Thêm chữ "song" hoặc "audio" để kết quả chính xác hơn
                const searchResults = await searchMusic(`${genre} audio`);
                // Lọc chỉ lấy những item có videoId (là bài hát)
                data = searchResults.filter(item => item.videoId);
            }

            if (Array.isArray(data)) {
                setSongs(data);
            }
        } catch (error) {
            console.error("Lỗi tải nhạc:", error);
        }
        setLoading(false);
    };

    // Tải lần đầu (Thịnh hành)
    useEffect(() => {
        loadSongs("Thịnh Hành");
    }, []);

    return (
        <div style={{ paddingTop: '80px', paddingBottom: '50px', minHeight: '100vh', background: '#121212' }}>
            <h2 style={{ 
                color: '#1db954', paddingLeft: '40px', 
                borderLeft: '5px solid #1db954', marginLeft: '20px',
                textTransform: 'uppercase' 
            }}>
                KHO NHẠC & BẢNG XẾP HẠNG
            </h2>

            {/* --- THANH BỘ LỌC (QUICK FILTERS) --- */}
            <div style={{ 
                display: 'flex', gap: '15px', padding: '20px 40px', 
                flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' 
            }}>
                {GENRES.map((genre) => (
                    <button 
                        key={genre}
                        onClick={() => loadSongs(genre)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                            // Logic đổi màu nút đang chọn
                            background: activeGenre === genre ? '#1db954' : '#333',
                            color: activeGenre === genre ? 'black' : 'white',
                            transform: activeGenre === genre ? 'scale(1.05)' : 'scale(1)'
                        }}
                    >
                        {genre}
                    </button>
                ))}
            </div>

            {/* --- TRẠNG THÁI LOADING --- */}
            {loading ? (
                <div style={{ textAlign: 'center', color: '#1db954', marginTop: '50px', fontSize: '1.2rem' }}>
                    <p>🎵 Đang kết nối máy chủ âm nhạc...</p>
                    <img src="https://i.gifer.com/VAyR.gif" alt="loading" style={{width: '50px'}}/>
                </div>
            ) : (
                /* --- DANH SÁCH NHẠC --- */
                <div className="media-grid">
                    {songs.length > 0 ? (
                        songs.map((s, index) => (
                            <Card 
                                key={s.videoId || index}
                                id={s.videoId} 
                                type="song"
                                title={s.title}
                                subtitle={s.artists ? s.artists.map(a => a.name).join(', ') : 'N/A'}
                                // Lấy ảnh nét nhất
                                image={s.thumbnails && s.thumbnails.length > 0 ? s.thumbnails[s.thumbnails.length - 1].url : ''} 
                            />
                        ))
                    ) : (
                        <p style={{ color: '#777', width: '100%', textAlign: 'center' }}>Không tìm thấy bài hát nào.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default SongPage;