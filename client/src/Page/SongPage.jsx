import React, { useState, useEffect } from 'react';
import Card from '../Components/UI/Card'; 
import { fetchMusicCharts, searchMusic } from '../API/MusicAPI';

const GENRES = [
    "Thịnh Hành", "Nhạc Trẻ", "Rap Việt", 
    "K-Pop", "US-UK", "EDM", 
    "Lofi Chill", "Bolero", "V-POP"
];

// Từ khóa ngắn gọn giúp YouTube trả về kết quả tốt nhất
const GENRE_QUERIES = {
    "Thịnh Hành": "", 
    "Nhạc Trẻ": "nhạc trẻ",
    "Rap Việt": "rap việt",
    "K-Pop": "kpop",
    "US-UK": "us uk pop",
    "EDM": "nhạc edm",
    "Lofi Chill": "lofi chill",
    "Bolero": "bolero",
    "V-POP": "vpop"
};

function SongPage() {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeGenre, setActiveGenre] = useState("Thịnh Hành");

    const loadSongs = async (genre) => {
        setLoading(true);
        setActiveGenre(genre);
        let data = [];

        try {
            if (genre === "Thịnh Hành") {
                data = await fetchMusicCharts();
            } else {
                const searchQuery = GENRE_QUERIES[genre] || genre;
                data = await searchMusic(searchQuery);
            }

            // Xử lý dữ liệu trả về để chống lỗi crash trang
            if (data && Array.isArray(data) && data.length > 0) {
                // Lọc bỏ rác, chỉ giữ lại item có videoId
                const validSongs = data.filter(item => item && item.videoId);

                const uniqueSongs = [];
                const seenIds = new Set(); 

                validSongs.forEach(song => {
                    // Dùng Set ID để chắc chắn 100% không bao giờ có 2 bài trùng nhau
                    if (!seenIds.has(song.videoId)) {
                        seenIds.add(song.videoId);
                        uniqueSongs.push(song);
                    }
                });

                setSongs(uniqueSongs);
            } else {
                // Xử lý an toàn khi API không trả về mảng
                setSongs([]); 
            }
        } catch (error) {
            console.error("Lỗi tải nhạc:", error);
            setSongs([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadSongs("Thịnh Hành");
    }, []);

    return (
        <div style={{ paddingTop: '80px', paddingBottom: '50px', minHeight: '100vh', background: '#121212' }}>
            <h2 style={{ color: '#1db954', paddingLeft: '40px', borderLeft: '5px solid #1db954', marginLeft: '20px', textTransform: 'uppercase' }}>
                KHO NHẠC & BẢNG XẾP HẠNG
            </h2>

            {/* --- THANH BỘ LỌC --- */}
            <div style={{ display: 'flex', gap: '15px', padding: '20px 40px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                {GENRES.map((genre) => (
                    <button 
                        key={genre}
                        onClick={() => loadSongs(genre)}
                        style={{
                            padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease',
                            background: activeGenre === genre ? '#1db954' : '#333',
                            color: activeGenre === genre ? 'black' : 'white',
                            transform: activeGenre === genre ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: activeGenre === genre ? '0 0 15px rgba(29, 185, 84, 0.4)' : 'none'
                        }}
                    >
                        {genre}
                    </button>
                ))}
            </div>

            {/* --- HIỂN THỊ --- */}
            {loading ? (
                <div style={{ textAlign: 'center', color: '#1db954', marginTop: '50px', fontSize: '1.2rem' }}>
                    <p>🎵 Đang tải dữ liệu âm nhạc...</p>
                    <img src="https://i.gifer.com/VAyR.gif" alt="loading" style={{width: '50px'}}/>
                </div>
            ) : (
                <div className="media-grid" style={{ padding: '0 40px' }}>
                    {songs.length > 0 ? (
                        songs.map((s, index) => {
                            // Cố gắng lấy tên nghệ sĩ an toàn nhất
                            let artistName = 'Unknown';
                            if (s.artists && Array.isArray(s.artists) && s.artists.length > 0) {
                                artistName = s.artists.map(a => a.name).join(', ');
                            } else if (s.author) {
                                // Fallback cho trường hợp API trả về 'author' thay vì 'artists'
                                artistName = typeof s.author === 'string' ? s.author : s.author.name || 'Unknown';
                            }

                            // Cố gắng lấy ảnh thumbnail an toàn
                            let thumbUrl = 'https://via.placeholder.com/300x300?text=No+Image';
                            if (s.thumbnails && Array.isArray(s.thumbnails) && s.thumbnails.length > 0) {
                                thumbUrl = s.thumbnails[s.thumbnails.length - 1].url;
                            }

                            return (
                                <Card 
                                    key={s.videoId || index}
                                    id={s.videoId} 
                                    type="song"
                                    title={s.title || "Unknown Title"}
                                    subtitle={artistName}
                                    image={thumbUrl} 
                                />
                            );
                        })
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '40px', color: '#777' }}>
                            <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>🎧</h1>
                            <p style={{ fontSize: '1.2rem' }}>Không tìm thấy bài hát nào cho thể loại này.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SongPage;