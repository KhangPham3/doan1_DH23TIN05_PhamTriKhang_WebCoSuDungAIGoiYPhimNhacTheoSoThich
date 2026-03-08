import React, { useState, useEffect } from 'react';
import Card from '../Components/UI/Card'; 
import { fetchMusicCharts, searchMusic } from '../API/MusicAPI';

const GENRES = [
    "Thịnh Hành", "Nhạc Trẻ", "Rap Việt", 
    "K-Pop", "US-UK", "EDM", 
    "Lofi", "Bolero", "V-POP"
];

const GENRE_QUERIES = {
    "Thịnh Hành": "", 
    "Nhạc Trẻ": "Nhạc trẻ hit", "Rap Việt": "Rap việt", "K-Pop": "Kpop hit",
    "US-UK": "Top US UK pop", "EDM": "EDM hit", "Lofi": "Lofi chill", 
    "Bolero": "Bolero", "V-POP": "Vpop hit"
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
                data = await searchMusic(GENRE_QUERIES[genre] || genre);
            }

            if (data && Array.isArray(data)) {
                let validSongs = data.filter(item => item && item.videoId);
                const uniqueSongs = [];
                const seenTitles = new Set();
                const seenIds = new Set();

                validSongs.forEach(song => {
                    const rawTitle = String(song.title || ""); 
                    let normalizedTitle = rawTitle.toLowerCase().replace(/\(official.*?\)|\[.*?\]|\(lyric.*?\)|mv|video|audio/g, '').trim();

                    if (!seenTitles.has(normalizedTitle) && !seenIds.has(song.videoId)) {
                        seenTitles.add(normalizedTitle);
                        seenIds.add(song.videoId);
                        uniqueSongs.push(song);
                    }
                });
                setSongs(uniqueSongs);
            } else { setSongs([]); }
        } catch (error) {
            console.error("Lỗi tải nhạc:", error);
            setSongs([]);
        }
        setLoading(false);
    };

    useEffect(() => { loadSongs("Thịnh Hành"); }, []);

    return (
        <div style={{ paddingTop: '100px', paddingBottom: '80px', minHeight: '100vh', background: '#0a0a0a', color: 'white' }}>
            {/* --- TIÊU ĐỀ --- */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'transparent', WebkitTextStroke: '1px #1db954', backgroundImage: 'linear-gradient(to right, #1db954, #128c3c)', WebkitBackgroundClip: 'text', margin: 0 }}>
                    KHO NHẠC & BẢNG XẾP HẠNG
                </h1>
                <p style={{ color: '#888', marginTop: '10px', fontSize: '1.1rem' }}>Khám phá những giai điệu thịnh hành nhất toàn cầu</p>
            </div>

            {/* --- THANH BỘ LỌC (GLASSMORPHISM) --- */}
            <div style={{ 
                display: 'flex', gap: '15px', padding: '20px 40px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '40px',
                position: 'sticky', top: '70px', zIndex: 90, background: 'rgba(10, 10, 10, 0.7)', backdropFilter: 'blur(15px)', borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                {GENRES.map((genre) => (
                    <button 
                        key={genre} onClick={() => loadSongs(genre)}
                        style={{
                            padding: '10px 25px', borderRadius: '30px', border: activeGenre === genre ? 'none' : '1px solid #333', 
                            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: activeGenre === genre ? 'linear-gradient(45deg, #1db954, #128c3c)' : 'rgba(255,255,255,0.05)',
                            color: activeGenre === genre ? 'white' : '#aaa',
                            boxShadow: activeGenre === genre ? '0 8px 20px rgba(29, 185, 84, 0.4)' : 'none',
                            transform: activeGenre === genre ? 'translateY(-3px)' : 'translateY(0)'
                        }}
                    >
                        {genre}
                    </button>
                ))}
            </div>

            {/* --- HIỂN THỊ KẾT QUẢ --- */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '80px' }}>
                    <div className="modern-spinner" style={{ borderColor: '#1db954 transparent #1db954 transparent' }}></div>
                    <p style={{ color: '#1db954', marginTop: '20px', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px' }}>ĐANG QUÉT VŨ TRỤ ÂM NHẠC...</p>
                </div>
            ) : (
                <div className="media-grid" style={{ padding: '0 5%' }}>
                    {songs.length > 0 ? (
                        songs.map((s, index) => {
                            let artistName = s.artists && s.artists.length > 0 ? s.artists.map(a => a.name).join(', ') : (s.author?.name || s.author || 'Unknown');
                            let thumbUrl = s.thumbnails && s.thumbnails.length > 0 ? s.thumbnails[s.thumbnails.length - 1].url : 'https://via.placeholder.com/300';
                            
                            return (
                                // Hiệu ứng trượt Stagger đuổi nhau
                                <div key={s.videoId || index} className="animate-fade-up" style={{ animationDelay: `${index * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}>
                                    <Card id={s.videoId} type="song" title={s.title || "Unknown"} subtitle={artistName} image={thumbUrl} />
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '60px', color: '#555' }}>
                            <h1 style={{ fontSize: '4rem', margin: '0 0 10px 0' }}>🎧</h1>
                            <h2 style={{ color: '#888' }}>Trống rỗng!</h2>
                            <p>Không tìm thấy bản Audio chính thức nào. Thử thể loại khác nhé!</p>
                        </div>
                    )}
                </div>
            )}

            {/* TÍCH HỢP CSS ANIMATION TRỰC TIẾP */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeUp {
                    0% { opacity: 0; transform: translateY(30px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                .modern-spinner {
                    width: 60px; height: 60px; border-radius: 50%;
                    border: 4px solid; animation: spin 1s linear infinite;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}} />
        </div>
    );
}

export default SongPage;