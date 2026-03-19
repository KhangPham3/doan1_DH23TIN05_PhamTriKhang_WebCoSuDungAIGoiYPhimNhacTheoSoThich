import React, { useState, useEffect } from 'react';
import { searchMovies, IMAGE_URL, BASE_URL, API_KEY } from '../API/tmdbAPI';
import { searchMusic, fetchSongDetailAI } from '../API/MusicAPI';
import Card from '../Components/UI/Card';

const RecommendPage = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userId = currentUser?.id || currentUser?.UserID || 0;

    const [prompt, setPrompt] = useState('');
    const [loadingGemini, setLoadingGemini] = useState(false);
    const [aiResults, setAiResults] = useState(null);

    const [activeTab, setActiveTab] = useState('movie');
    const [loadingDefault, setLoadingDefault] = useState(true);
    const [movieData, setMovieData] = useState({
        history: [], popular: [], age: [], gender: [], content_based: [], personalized: []
    });
    const [songData, setSongData] = useState({
        history: [], popular: [], age: [], gender: [], content_based: [], personalized: []
    });

    const suggestedPrompts = [
        "Tôi đang rất buồn, cần phim và nhạc chữa lành 🌧️",
        "Gợi ý list nhạc cực căng để tập Gym 💪",
        "Những bộ phim có cú twist hack não hay nhất 🤯",
        "Nhạc chill nhẹ nhàng để làm việc đêm khuya ☕",
        "Phim tình cảm lãng mạn hay nhất thập kỷ này ❤️",
        "Nhạc rap Việt mới hot nhất hiện nay 🔥",
        "Phim siêu anh hùng Marvel hay nhất mọi thời đại 🦸",
        "Gợi ý nhạc buồn để khóc một trận cho đã 😭"
    ];

    // FALLBACK RANDOM

    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

    const fetchPopularSongs = async () => {
        const popularNames = [
            "See Tình", "Đế Vương", "Em Của Ngày Hôm Qua", "Sài Gòn Đau Lòng Quá",
            "Shape of You", "Blinding Lights", "Levitating", "Đi Để Trở Về",
            "Bigcityboi", "Rap Việt 2024", "Hoàng Thùy Linh", "Sài Gòn Đau Lòng Quá"
        ];
        const promises = shuffle(popularNames).slice(0, 8).map(async name => {
            try {
                let res = await searchMusic(name);
                let songs = Array.isArray(res) ? res : (res?.songs || []);
                if (songs.length > 0) {
                    const s = songs[0];
                    return {
                        id: s.videoId,
                        type: 'song',
                        title: s.title,
                        artist: s.artists?.[0]?.name || "YouTube",
                        image: s.thumbnails?.[s.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`
                    };
                }
            } catch {}
            return null;
        });
        const results = await Promise.all(promises);
        return results.filter(Boolean);
    };

    const fetchPopularMovies = async () => {
        const popularNames = [
            "Interstellar", "Parasite", "The Pursuit of Happyness", "La La Land",
            "Your Name", "Spirited Away", "Oppenheimer", "Dune", "Everything Everywhere All at Once",
            "Hố Đen Từ Thần", "Mưu Cầu Hạnh Phúc"
        ];
        const promises = shuffle(popularNames).slice(0, 6).map(async name => {
            try {
                let res = await searchMovies(name);
                if (res?.length > 0) {
                    const m = res[0];
                    return { id: m.id, type: 'movie', title: m.title, poster_path: m.poster_path, vote_average: m.vote_average };
                }
            } catch {}
            return null;
        });
        const results = await Promise.all(promises);
        return results.filter(Boolean);
    };

    // 1. LOAD DEFAULT
    useEffect(() => {
        if (!userId) return;

        const loadDefaultData = async () => {
            setLoadingDefault(true);
            try {
                const [mRes, sRes] = await Promise.all([
                    fetch(`http://localhost:8000/api/recommend/dashboard?userId=${userId}&type=movie`).catch(() => null),
                    fetch(`http://localhost:8000/api/recommend/dashboard?userId=${userId}&type=song`).catch(() => null)
                ]);

                const mIds = (mRes && mRes.ok) ? await mRes.json() : {};
                const sIds = (sRes && sRes.ok) ? await sRes.json() : {};

                const fetchMovies = async (ids) => {
                    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
                    const safeIds = ids.slice(0, 10);
                    const p = safeIds.map(id =>
                        fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=vi-VN`)
                            .then(r => r.json())
                            .catch(() => null)
                    );
                    const res = await Promise.all(p);
                    return res.filter(m => m && m.id).map(m => ({
                        id: m.id,
                        type: 'movie',
                        title: m.title,
                        poster_path: m.poster_path,
                        vote_average: m.vote_average
                    }));
                };

                const fetchSongs = async (ids) => {
                    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
                    const safeIds = ids.slice(0, 10);
                    const promises = safeIds.map(async (id) => {
                        try {
                            let detail = await fetchSongDetailAI(id).catch(() => null);
                            if (detail?.info?.videoDetails) {
                                const vd = detail.info.videoDetails;
                                return {
                                    id: vd.videoId || id,
                                    type: 'song',
                                    title: vd.title || "Unknown Song",
                                    artist: vd.author || "YouTube Music",
                                    image: `https://img.youtube.com/vi/${vd.videoId || id}/hqdefault.jpg`
                                };
                            }
                            const searchRes = await searchMusic(id.toString()).catch(() => null);
                            const songs = Array.isArray(searchRes) ? searchRes : (searchRes?.songs || []);
                            if (songs.length > 0) {
                                const s = songs[0];
                                return {
                                    id: s.videoId || id,
                                    type: 'song',
                                    title: s.title || "Unknown Song",
                                    artist: s.artists?.[0]?.name || "YouTube",
                                    image: `https://img.youtube.com/vi/${s.videoId || id}/hqdefault.jpg`
                                };
                            }
                        } catch {}
                        return null;
                    });
                    const results = await Promise.all(promises);
                    return results.filter(Boolean);
                };

                const songPersonalized = (sIds.personalized && sIds.personalized.length > 0)
                    ? await fetchSongs(sIds.personalized)
                    : await fetchPopularSongs();

                const songContentBased = (sIds.content_based && sIds.content_based.length > 0)
                    ? await fetchSongs(sIds.content_based)
                    : await fetchPopularSongs();

                const [movieDataRes, songOtherRes] = await Promise.all([
                    Promise.all([
                        fetchMovies(mIds.history),
                        fetchMovies(mIds.popular),
                        fetchMovies(mIds.age),
                        fetchMovies(mIds.gender),
                        fetchMovies(mIds.content_based),
                        fetchMovies(mIds.personalized)
                    ]),
                    Promise.all([
                        fetchSongs(sIds.history),
                        fetchSongs(sIds.popular),
                        fetchSongs(sIds.age),
                        fetchSongs(sIds.gender)
                    ])
                ]);

                setMovieData({
                    history: movieDataRes[0] || [],
                    popular: movieDataRes[1] || [],
                    age: movieDataRes[2] || [],
                    gender: movieDataRes[3] || [],
                    content_based: movieDataRes[4] || [],
                    personalized: movieDataRes[5] || []
                });

                setSongData({
                    history: songOtherRes[0] || [],
                    popular: songOtherRes[1] || [],
                    age: songOtherRes[2] || [],
                    gender: songOtherRes[3] || [],
                    personalized: songPersonalized,
                    content_based: songContentBased
                });

            } catch (error) {
                console.error("Lỗi tải dữ liệu gợi ý mặc định:", error);
            } finally {
                setLoadingDefault(false);
            }
        };

        loadDefaultData();
    }, [userId]);

    // 2. CHAT GEMINI 

    const handleAskGemini = async (textPrompt) => {
        const finalPrompt = textPrompt || prompt;
        if (!finalPrompt.trim()) return;

        setPrompt(finalPrompt);
        setLoadingGemini(true);
        setAiResults(null);                    

        window.scrollTo({ top: 400, behavior: 'smooth' });

        try {
            let movieNames = [];
            let songNames = [];

            try {
                const aiRes = await fetch('http://localhost:8000/api/ai/gemini-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ prompt: finalPrompt, userId })
                });
                if (aiRes.ok) {
                    const aiData = await aiRes.json();
                    if (aiData.success && aiData.data) {
                        movieNames = aiData.data.movies || [];
                        songNames = aiData.data.songs || [];
                    }
                }
            } catch {}

            // fallback Gemini
            if (movieNames.length === 0 && songNames.length === 0) {
                const API_KEY_GEMINI = "AIzaSyC1X8gn39nCf5_MU503YtLGPjs0XUCVUt0";
                const fallbackRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY_GEMINI}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Bạn là chuyên gia gợi ý giải trí Việt Nam. 
                        Yêu cầu: "${finalPrompt}". 
                        Trả về JSON đúng chuẩn: {"movies": ["tên phim chính xác"], "songs": ["tên bài hát Việt Nam chính xác nhất"]}. 
                        Chỉ dùng tên HOT NHẤT, dễ tìm. Không giải thích.` }] }]
                    })
                });

                const fallbackData = await fallbackRes.json();
                if (fallbackData.candidates?.[0]?.content?.parts?.[0]?.text) {
                    let text = fallbackData.candidates[0].content.parts[0].text;
                    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
                    const start = text.indexOf('{');
                    const end = text.lastIndexOf('}') + 1;
                    if (start !== -1 && end !== -1) {
                        const parsed = JSON.parse(text.substring(start, end));
                        movieNames = parsed.movies || [];
                        songNames = parsed.songs || [];
                    }
                }
            }

            const safeSearchMovie = async (name) => {
                try {
                    let res = await searchMovies(name);
                    if (res?.length) return res[0];
                    if (name.includes('(')) return await searchMovies(name.split('(')[0].trim());
                    return null;
                } catch { return null; }
            };

            const safeSearchMusic = async (name) => {
                try {
                    let res = await searchMusic(name);
                    let songs = Array.isArray(res) ? res : (res?.songs || []);
                    if (songs.length) return songs[0];
                    let clean = name.replace(/\(.*?\)/g, '').replace(/Official.*$/i, '').trim();
                    res = await searchMusic(clean);
                    songs = Array.isArray(res) ? res : (res?.songs || []);
                    return songs.length ? songs[0] : null;
                } catch { return null; }
            };

            const [moviesRaw, songsRaw] = await Promise.all([
                Promise.all(movieNames.map(safeSearchMovie)),
                Promise.all(songNames.map(safeSearchMusic))
            ]);

            let validMovies = moviesRaw.filter(Boolean).map(m => ({
                id: m.id, type: 'movie', title: m.title,
                poster_path: m.poster_path, vote_average: m.vote_average
            }));

            let validSongs = songsRaw.filter(Boolean).map(s => ({
                id: s.videoId,
                type: 'song',
                title: s.title,
                artist: s.artists?.[0]?.name || 'YouTube',
                image: s.thumbnails?.[s.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`
            }));

            // KHẮC PHỤC LẶP LẠI: luôn fallback random nếu rỗng
            if (validMovies.length === 0) validMovies = await fetchPopularMovies();
            if (validSongs.length === 0) validSongs = await fetchPopularSongs();

            setAiResults({ movies: validMovies, songs: validSongs });

        } catch (error) {
            console.error("Lỗi Gemini:", error);
            alert("AI đang bận, vui lòng thử lại sau 5 giây!");
        } finally {
            setLoadingGemini(false);
        }
    };

    const renderSection = (title, desc, items, type, icon) => {
        const finalItems = items || [];

        return (
            <div style={{ marginTop: '60px' }}>
                <h2 style={{ color: type === 'movie' ? '#e50914' : '#1db954', marginBottom: '5px', fontSize: '2rem' }}>
                    <span style={{ marginRight: '10px' }}>{icon}</span> {title}
                </h2>
                <p style={{ color: '#888', marginBottom: '30px', fontStyle: 'italic', fontSize: '1rem' }}>{desc}</p>

                {finalItems.length === 0 ? (
                    <div style={{ 
                        padding: '40px 20px', 
                        background: 'rgba(255,255,255,0.03)', 
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: '#666',
                        fontStyle: 'italic'
                    }}>
                        Hiện chưa có dữ liệu gợi ý cho mục này. Hãy thử dùng AI Chat phía trên ✨
                    </div>
                ) : (
                    <div className="media-grid">
                        {finalItems.map((i, idx) => (
                            <div key={`${i.id}-${idx}`} className="animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <Card 
                                    id={i.id} 
                                    type={type} 
                                    title={i.title}
                                    image={type === 'movie' 
                                        ? (i.poster_path ? `${IMAGE_URL}${i.poster_path}` : 'https://placehold.co/300x450/png?text=No+Image') 
                                        : i.image}
                                    subtitle={type === 'movie' 
                                        ? `⭐ ${i.vote_average?.toFixed(1) || 'N/A'}` 
                                        : i.artist}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (!currentUser) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#0a0a0a' }}>
                <h1 style={{ fontSize: '3rem', color: '#00bcd4', marginBottom: '10px' }}>🔐 Yêu cầu đăng nhập</h1>
                <p style={{ color: '#aaa' }}>Hệ thống AI cần biết bạn là ai để phục vụ tốt nhất.</p>
            </div>
        );
    }

    return (
        <div className="recommend-page-container">
            {/* Hero Chat Gemini */}
            <div className="hero-chat-section">
                <div className="glow-orb"></div>
                <div className="hero-content animate-fade-down">
                    <h1 className="ai-title">✨ Trợ Lý Giải Trí AI</h1>
                    <p className="ai-subtitle">Tôi đã học sở thích của bạn. Hãy nói cho tôi nghe tâm trạng lúc này, tôi sẽ tìm ra những tác phẩm hoàn hảo nhất!</p>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleAskGemini(); }} className={`chat-form ${loadingGemini ? 'loading-glow' : ''}`}>
                        <input 
                            type="text" 
                            className="chat-input" 
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)} 
                            placeholder="Ví dụ: Tôi vừa được thăng chức, hãy cho tôi xem phim và nhạc ăn mừng..." 
                        />
                        <button type="submit" disabled={loadingGemini} className="chat-submit-btn shine-effect">
                            {loadingGemini ? <div className="spinner"></div> : 'GỬI YÊU CẦU'}
                        </button>
                    </form>

                    <div className="suggestion-chips">
                        {suggestedPrompts.map((text, idx) => (
                            <button key={idx} className="chip-btn" onClick={() => handleAskGemini(text)}>
                                {text}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Kết quả Gemini */}
            {(loadingGemini || aiResults) && (
                <div className="ai-results-section animate-fade-up" style={{ padding: '0 5%', marginBottom: '60px' }}>
                    <div className="section-divider">
                        <span className="divider-text">KẾT QUẢ PHÂN TÍCH CỦA GEMINI 🎀</span>
                    </div>

                    {loadingGemini ? (
                        <div className="loading-state">
                            <div className="ai-brain-pulse">🤖</div>
                            <h3>AI đang phân tích tâm trạng và tìm kiếm...</h3>
                        </div>
                    ) : (
                        <div className="results-container">
                            {aiResults.movies.length > 0 && renderSection("Điện Ảnh Đề Xuất", "Những bộ phim hoàn hảo cho ngữ cảnh của bạn.", aiResults.movies, 'movie', '🎬')}
                            {aiResults.songs.length > 0 && renderSection("Âm Nhạc Đề Xuất", "Giai điệu phù hợp nhất lúc này.", aiResults.songs, 'song', '🎵')}
                        </div>
                    )}
                </div>
            )}

            {/* Tổng hợp gợi ý mặc định */}
            <div style={{ paddingLeft: '5%', paddingRight: '5%' }}>
                <h1 style={{ color: 'white', borderBottom: '1px solid #333', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '15px', marginTop: '60px' }}>
                    <span style={{ fontSize: '3rem', textShadow: '0 0 20px rgba(0, 188, 212, 0.8)' }}>✨</span>
                    TỔNG HỢP GỢI Ý CHO RIÊNG BẠN
                </h1>

                <div style={{ display: 'flex', gap: '20px', marginTop: '40px', justifyContent: 'center' }}>
                    <button onClick={() => setActiveTab('movie')} style={{ padding: '12px 40px', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '30px', cursor: 'pointer', transition: 'all 0.3s', border: activeTab === 'movie' ? 'none' : '1px solid #333', background: activeTab === 'movie' ? 'linear-gradient(45deg, #e50914, #b20710)' : 'rgba(255,255,255,0.05)', color: 'white', boxShadow: activeTab === 'movie' ? '0 5px 20px rgba(229, 9, 20, 0.5)' : 'none' }}>🎬 ĐIỆN ẢNH</button>
                    <button onClick={() => setActiveTab('song')} style={{ padding: '12px 40px', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '30px', cursor: 'pointer', transition: 'all 0.3s', border: activeTab === 'song' ? 'none' : '1px solid #333', background: activeTab === 'song' ? 'linear-gradient(45deg, #1db954, #128c3c)' : 'rgba(255,255,255,0.05)', color: 'white', boxShadow: activeTab === 'song' ? '0 5px 20px rgba(29, 185, 84, 0.5)' : 'none' }}>🎵 ÂM NHẠC</button>
                </div>
                
                {loadingDefault ? (
                    <div style={{ textAlign: 'center', marginTop: '100px', color: '#00bcd4' }}>
                        <div className="modern-spinner" style={{ borderColor: '#00bcd4 transparent #00bcd4 transparent', margin: '0 auto' }}></div>
                        <h3 style={{ marginTop: '20px', letterSpacing: '2px' }}>ĐANG TẢI DỮ LIỆU...</h3>
                    </div>
                ) : (
                    <div style={{ marginTop: '20px', paddingBottom: '100px' }}>
                        {activeTab === 'movie' ? (
                            <>
                                {renderSection("Yêu Thích Gần Đây", "Những bộ phim bạn đã 'Thích' hoặc đánh giá trên 3 sao.", movieData.history, 'movie', '❤️')}
                                {renderSection("Phim Thịnh Hành", "Những bộ phim đang hot nhất hiện nay.", movieData.popular, 'movie', '🔥')}
                                {renderSection("Dành Cho Độ Tuổi Của Bạn", "Xu hướng điện ảnh được thế hệ của bạn quan tâm nhất.", movieData.age, 'movie', '🎓')}
                                {renderSection("Thịnh Hành Cùng Giới Tính", "Những bộ phim đang làm mưa làm gió trong cộng đồng cùng giới tính với bạn.", movieData.gender, 'movie', '👫')}
                                {renderSection("Có Thể Bạn Sẽ Thích", "Phân tích AI chuyên sâu dựa trên người dùng có chung gu.", movieData.personalized, 'movie', '🧠')}
                                {renderSection("Dành Riêng Theo Sở Thích", "Gợi ý dựa vào thể loại, tác giả và từ khóa bạn từng tìm kiếm.", movieData.content_based, 'movie', '🎯')}
                            </>
                        ) : (
                            <>
                                {renderSection("Playlist Yêu Thích", "Những bài hát bạn nghe đi nghe lại hoặc đánh giá cao.", songData.history, 'song', '❤️')}
                                {renderSection("Nhạc Thịnh Hành", "Những bài hát đang được nghe nhiều nhất.", songData.popular, 'song', '🔥')}
                                {renderSection("Giai Điệu Thế Hệ", "Những bản nhạc mang đậm dấu ấn tuổi trẻ của thế hệ bạn.", songData.age, 'song', '🎧')}
                                {renderSection("Giai Điệu Cùng Giới Tính", "Âm nhạc đang được phái của bạn ưu ái nhất.", songData.gender, 'song', '👫')}
                                {renderSection("Khám Phá Gu Âm Nhạc Mới", "AI tự động học từ lượt view/like.", songData.personalized, 'song', '🧠')}
                                {renderSection("Dành Riêng Theo Sở Thích", "Gợi ý dựa vào thể loại, tác giả và từ khóa bạn từng tìm kiếm.", songData.content_based, 'song', '🎯')}
                            </>
                        )}
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .recommend-page-container { background: #0a0a0a; min-height: 100vh; color: white; font-family: 'Inter', sans-serif; overflow-x: hidden; }
                .hero-chat-section { position: relative; padding: 120px 20px 60px; display: flex; justify-content: center; align-items: center; text-align: center; }
                .glow-orb { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 800px; height: 300px; background: linear-gradient(45deg, rgba(0,188,212,0.2), rgba(33,150,243,0.2)); filter: blur(100px); z-index: 1; pointer-events: none; border-radius: 50%; }
                .hero-content { position: relative; z-index: 2; width: 100%; max-width: 900px; }
                .ai-title { font-size: 3.5rem; font-weight: 900; margin-bottom: 15px; background: linear-gradient(to right, #00bcd4, #2196f3, #b2ebf2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -1px; text-shadow: 0 0 30px rgba(0,188,212,0.3); }
                .ai-subtitle { font-size: 1.1rem; color: '#aaa'; margin-bottom: 40px; line-height: 1.6; }
                .chat-form { position: relative; display: flex; background: rgba(25,25,25,0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 50px; padding: 10px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); transition: 0.3s; }
                .chat-form:focus-within { border-color: rgba(0,188,212,0.6); box-shadow: 0 0 30px rgba(0,188,212,0.2); transform: translateY(-2px); }
                .loading-glow { animation: formGlow 2s infinite alternate; }
                @keyframes formGlow { 0% { box-shadow: 0 0 20px rgba(0,188,212,0.2); } 100% { box-shadow: 0 0 40px rgba(33,150,243,0.6); border-color: #2196f3; } }
                .chat-input { flex: 1; background: transparent; border: none; outline: none; color: white; font-size: 1.15rem; padding: 15px 25px; width: 100%; }
                .chat-submit-btn { background: linear-gradient(45deg, #00bcd4, #2196f3); color: white; border: none; border-radius: 40px; padding: 0 35px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; min-width: 160px; }
                .chat-submit-btn:hover:not(:disabled) { transform: scale(1.05); }
                .chat-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .suggestion-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin-top: 30px; }
                .chip-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ccc; padding: 10px 20px; border-radius: 30px; cursor: pointer; transition: 0.3s; }
                .chip-btn:hover { background: rgba(0,188,212,0.1); border-color: #00bcd4; color: white; transform: translateY(-3px); }
                .section-divider { display: flex; align-items: center; text-align: center; margin: 40px 0; }
                .section-divider::before, .section-divider::after { content: ''; flex: 1; border-bottom: 1px dashed rgba(255,255,255,0.15); }
                .divider-text { padding: 0 20px; font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: 2px; text-transform: uppercase; }
                .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 25px; }
                .spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
                .modern-spinner { width: 60px; height: 60px; border-radius: 50%; border: 4px solid; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .loading-state { text-align: center; padding: 60px 20px; background: rgba(0,188,212,0.05); border-radius: 20px; border: 1px solid rgba(0,188,212,0.2); }
                .ai-brain-pulse { font-size: 5rem; animation: pulse 1.5s infinite alternate; margin-bottom: 20px; }
                @keyframes pulse { 0% { transform: scale(1); filter: drop-shadow(0 0 10px #00bcd4); } 100% { transform: scale(1.15); filter: drop-shadow(0 0 30px #2196f3); } }
                .animate-fade-down { animation: fadeDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes fadeUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .animate-fade-up img { border-radius: 15px !important; box-shadow: 0 8px 25px rgba(0,0,0,0.6); }
                @keyframes fadeDown { 0% { opacity: 0; transform: translateY(-30px); } 100% { opacity: 1; transform: translateY(0); } }
                .shine-effect::before { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); transition: 0.7s; z-index: 1; }
                .shine-effect:hover::before { left: 200%; }
            `}} />
        </div>
    );
};

export default RecommendPage;