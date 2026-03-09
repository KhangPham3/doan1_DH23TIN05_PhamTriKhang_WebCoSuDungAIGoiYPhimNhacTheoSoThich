import React, { useState, useEffect } from 'react';
import Card from '../Components/UI/Card'; 
import { fetchMusicCharts, searchMusic } from '../API/MusicAPI';

// 🟢 NÂNG CẤP: Thêm Emoji trực quan cho từng thể loại
const GENRES = [
    { name: "Thịnh Hành", icon: "🔥" },
    { name: "Nhạc Trẻ", icon: "🎧" },
    { name: "Rap Việt", icon: "🎤" },
    { name: "K-Pop", icon: "✨" },
    { name: "US-UK", icon: "🎸" },
    { name: "EDM", icon: "🎛️" },
    { name: "Lofi", icon: "☕" },
    { name: "Bolero", icon: "🎷" },
    { name: "V-POP", icon: "🌟" }
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
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'transparent', WebkitTextStroke: '1px #1db954', backgroundImage: 'linear-gradient(to right, #1db954, #128c3c)', WebkitBackgroundClip: 'text', margin: 0 }}>
                    KHO NHẠC & BẢNG XẾP HẠNG
                </h1>
                <p style={{ color: '#888', marginTop: '10px', fontSize: '1.1rem' }}>Khám phá những giai điệu thịnh hành nhất toàn cầu</p>
            </div>

            {/* --- THANH BỘ LỌC (SIÊU CẤP GLASSMORPHISM) --- */}
            <div style={{ 
                display: 'flex', gap: '15px', padding: '25px 5%', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '40px',
                position: 'sticky', top: '70px', zIndex: 90, 
                background: 'rgba(15, 15, 15, 0.85)', backdropFilter: 'blur(20px)', 
                borderBottom: '1px solid rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                {GENRES.map((g) => (
                    <button 
                        key={g.name} onClick={() => loadSongs(g.name)}
                        className={`genre-btn ${activeGenre === g.name ? 'active shine-effect' : ''}`}
                    >
                        <span style={{ position: 'relative', zIndex: 2 }}>{g.icon} {g.name}</span>
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
                                /* Hiệu ứng trượt Stagger đuổi nhau (Giữ nguyên) */
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
                /* ANIMATION TRƯỢT LÊN */
                @keyframes fadeUp {
                    0% { opacity: 0; transform: translateY(30px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-up { 
                    animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); 
                }

                /* BO GÓC ẢNH VÀ ĐỔ BÓNG GIỐNG TRANG PHIM */
                .animate-fade-up img {
                    border-radius: 15px !important;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.6);
                    transition: all 0.3s ease;
                }

                /* NÚT THỂ LOẠI (GENRE BUTTONS) MỚI */
                .genre-btn {
                    padding: 10px 22px; 
                    border-radius: 30px; 
                    border: 1px solid rgba(255,255,255,0.1); 
                    cursor: pointer; 
                    font-weight: bold; 
                    font-size: 0.95rem; 
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    background: rgba(255,255,255,0.03);
                    color: #aaa;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .genre-btn:hover {
                    transform: translateY(-4px) scale(1.05);
                    color: white;
                    border-color: #1db954;
                    background: rgba(29, 185, 84, 0.1);
                    box-shadow: 0 8px 20px rgba(29, 185, 84, 0.3);
                }
                
                .genre-btn.active {
                    background: linear-gradient(45deg, #1db954, #128c3c);
                    color: white;
                    border: none;
                    box-shadow: 0 8px 25px rgba(29, 185, 84, 0.5);
                    transform: translateY(-3px);
                }

                /* HIỆU ỨNG TIA SÁNG QUÉT QUA NÚT ACTIVE */
                .shine-effect::before {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%;
                    width: 50%; height: 100%;
                    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
                    transform: skewX(-25deg);
                    animation: shine 2s infinite;
                    z-index: 1;
                }

                @keyframes shine {
                    0% { left: -100%; }
                    20% { left: 200%; }
                    100% { left: 200%; }
                }

                /* SPINNER LOADING XANH LÁ */
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