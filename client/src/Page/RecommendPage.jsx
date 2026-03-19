import React, { useState, useEffect } from 'react';
import { searchMovies, IMAGE_URL, BASE_URL, API_KEY } from '../API/tmdbAPI';
import { searchMusic, fetchSongDetailAI } from '../API/MusicAPI';
import Card from '../Components/UI/Card';

const RecommendPage = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    // Đảm bảo lấy đúng UserID dù nó được lưu dưới dạng nào
    const userId = currentUser?.id || currentUser?.UserID || 0;
    
    // --- STATE CHO CHAT GEMINI ---
    const [prompt, setPrompt] = useState('');
    const [loadingGemini, setLoadingGemini] = useState(false);
    const [aiResults, setAiResults] = useState(null); 
    
    // --- STATE CHO GỢI Ý MẶC ĐỊNH (SQL) ---
    const [activeTab, setActiveTab] = useState('movie'); // 'movie' hoặc 'song'
    const [loadingDefault, setLoadingDefault] = useState(true);
    const [movieData, setMovieData] = useState({ history: [], popular: [], age: [], gender: [], content_based: [], personalized: [] });
    const [songData, setSongData] = useState({ history: [], popular: [], age: [], gender: [], content_based: [], personalized: [] });

    const suggestedPrompts = [
        "Tôi đang rất buồn, cần phim và nhạc chữa lành 🌧️",
        "Gợi ý list nhạc cực căng để tập Gym 💪",
        "Những bộ phim có cú twist 'hack não' nhất 🤯",
        "Nhạc chill nhẹ nhàng để làm việc vào ban đêm ☕"
    ];

    // ==========================================
    // 1. LẤY GỢI Ý MẶC ĐỊNH THEO TỪNG HẠNG MỤC
    // ==========================================
    useEffect(() => {
        if (!userId) return;

        const loadDefaultData = async () => {
            setLoadingDefault(true);
            try {
                // 🟢 ĐÃ FIX LỖI PORT VÀ BỔ SUNG CƠ CHẾ CHỐNG CRASH
                const [mRes, sRes] = await Promise.all([
                    fetch(`http://localhost:8000/api/recommend/dashboard?userId=${userId}&type=movie`).catch(() => null),
                    fetch(`http://localhost:8000/api/recommend/dashboard?userId=${userId}&type=song`).catch(() => null)
                ]);
                
                const mIds = (mRes && mRes.ok) ? await mRes.json() : {};
                const sIds = (sRes && sRes.ok) ? await sRes.json() : {};

                // Hàm fetch Phim (Giữ nguyên vì đã chạy tốt)
                const fetchMovies = async (ids) => {
                    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
                    const safeIds = ids.slice(0, 10);
                    const p = safeIds.map(id => 
                        fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=vi-VN`)
                        .then(r => r.json())
                        .catch(() => null)
                    );
                    const res = await Promise.all(p);
                    return res.filter(m => m && m.id && m.title).map(m => ({
                        id: m.id, type: 'movie', title: m.title, 
                        image: m.poster_path ? `${IMAGE_URL}${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image', 
                        subtitle: m.release_date?.substring(0, 4)
                    }));
                };

                // 🟢 HÀM FETCH NHẠC (ĐÃ SỬA CƠ CHẾ FALLBACK CHỐNG TRẮNG TRANG)
                const fetchSongs = async (ids) => {
                    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
                    const safeIds = ids.slice(0, 10);
                    const p = safeIds.map(async (id) => {
                        try {
                            const detail = await fetchSongDetailAI(id);
                            if (detail && detail.info && detail.info.videoDetails) {
                                return detail;
                            }
                            // Nếu id bị lỗi (không lấy được info), gọi fallback tìm kiếm lại chính ID đó
                            const fallbackRes = await searchMusic(id);
                            const list = Array.isArray(fallbackRes) ? fallbackRes : (fallbackRes.songs || []);
                            if (list.length > 0) {
                                return {
                                    info: {
                                        videoDetails: {
                                            videoId: list[0].videoId || id,
                                            title: list[0].title || "Đang cập nhật...",
                                            author: list[0].artists?.[0]?.name || "YouTube"
                                        }
                                    }
                                };
                            }
                        } catch(e) {}
                        return null; // Bỏ qua nếu lỗi hoàn toàn
                    });

                    const res = await Promise.all(p);
                    return res.filter(s => s && s.info).map(s => ({
                        id: s.info.videoDetails.videoId, type: 'song',
                        title: s.info.videoDetails.title,
                        artist: s.info.videoDetails.author,
                        image: `https://img.youtube.com/vi/${s.info.videoDetails.videoId}/hqdefault.jpg`,
                        subtitle: s.info.videoDetails.author
                    }));
                };

                // Tối ưu tốc độ: Render toàn bộ song song
                const [movieDataRes, songDataRes] = await Promise.all([
                    Promise.all([
                        fetchMovies(mIds.history), fetchMovies(mIds.popular), fetchMovies(mIds.age),
                        fetchMovies(mIds.gender), fetchMovies(mIds.content_based), fetchMovies(mIds.personalized)
                    ]),
                    Promise.all([
                        fetchSongs(sIds.history), fetchSongs(sIds.popular), fetchSongs(sIds.age),
                        fetchSongs(sIds.gender), fetchSongs(sIds.content_based), fetchSongs(sIds.personalized)
                    ])
                ]);

                setMovieData({
                    history: movieDataRes[0], popular: movieDataRes[1], age: movieDataRes[2],
                    gender: movieDataRes[3], content_based: movieDataRes[4], personalized: movieDataRes[5]
                });

                setSongData({
                    history: songDataRes[0], popular: songDataRes[1], age: songDataRes[2],
                    gender: songDataRes[3], content_based: songDataRes[4], personalized: songDataRes[5]
                });

            } catch (error) { console.error("Lỗi tải AI mặc định:", error); }
            setLoadingDefault(false);
        };
        loadDefaultData();
    }, [userId]);

    // ==========================================
    // 2. XỬ LÝ CHAT VỚI GEMINI (GIẢI PHÁP DỰ PHÒNG CHỐNG SẬP 100%)
    // ==========================================
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
                // ƯU TIÊN 1: GỌI QUA BACKEND PYTHON
                const aiRes = await fetch('http://localhost:8000/api/ai/gemini-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ prompt: finalPrompt, userId: userId })
                });
                
                const aiData = await aiRes.json();
                if (aiData.success && aiData.data) {
                    movieNames = aiData.data.movies || [];
                    songNames = aiData.data.songs || [];
                } else {
                    throw new Error("Backend Python từ chối.");
                }
            } catch (backendError) {
                console.warn("Backend lỗi, tự động chuyển sang gọi trực tiếp API Gemini...", backendError);
                // 🟢 ƯU TIÊN 2 (FALLBACK BẤT TỬ): GỌI TRỰC TIẾP API TỪ BROWSER NẾU PYTHON CHẾT
                const API_KEY_GEMINI = "AIzaSyC1X8gn39nCf5_MU503YtLGPjs0XUCVUt0";
                const fallbackRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY_GEMINI}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Bạn là một chuyên gia gợi ý giải trí. Yêu cầu của người dùng: "${finalPrompt}". Hãy trả về JSON ĐÚNG CHUẨN chứa 5 phim và 5 nhạc phổ biến nhất hợp với tâm trạng đó. Cấu trúc {"movies": ["tên phim 1"], "songs": ["tên bài hát 1"]}. Tuyệt đối không giải thích, không dùng code block markdown.` }] }]
                    })
                });
                
                const fallbackData = await fallbackRes.json();
                if (fallbackData.candidates && fallbackData.candidates.length > 0) {
                    let textResult = fallbackData.candidates[0].content.parts[0].text;
                    // Làm sạch JSON
                    textResult = textResult.replace(/```json/gi, "").replace(/```/g, "").trim();
                    const startIdx = textResult.indexOf('{');
                    const endIdx = textResult.lastIndexOf('}') + 1;
                    if (startIdx !== -1 && endIdx !== -1) {
                        const parsed = JSON.parse(textResult.substring(startIdx, endIdx));
                        movieNames = parsed.movies || [];
                        songNames = parsed.songs || [];
                    } else throw new Error("Format JSON lỗi");
                } else {
                    throw new Error("API Gemini sập hoàn toàn.");
                }
            }

            // 🟢 TIẾN HÀNH MAP TÊN RA TÁC PHẨM TỪ YOUTUBE VÀ TMDB
            const safeSearchMovie = async (name) => {
                try { 
                    const res = await searchMovies(name); 
                    return (res && res.length > 0) ? res[0] : null; 
                } catch (e) { return null; }
            };

            const safeSearchMusic = async (name) => {
                try { 
                    const res = await searchMusic(name); 
                    let safeRes = Array.isArray(res) ? res : (res.songs || []);
                    return (safeRes && safeRes.length > 0) ? safeRes[0] : null; 
                } catch (e) { return null; }
            };

            const fetchedMovies = await Promise.all(movieNames.map(name => safeSearchMovie(name)));
            const fetchedSongs = await Promise.all(songNames.map(name => safeSearchMusic(name)));

            const validMovies = fetchedMovies.filter(m => m && m.id).map(m => ({
                id: m.id, type: 'movie', title: m.title, 
                image: m.poster_path ? `${IMAGE_URL}${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image', 
                subtitle: m.release_date?.substring(0, 4)
            }));

            const validSongs = fetchedSongs
                .filter(s => s && s.videoId) 
                .map(s => {
                    let imageUrl = `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`;
                    if (s.thumbnails && s.thumbnails.length > 0) {
                        imageUrl = s.thumbnails[s.thumbnails.length - 1].url;
                    }
                    let artistName = 'YouTube';
                    if (s.artists && s.artists.length > 0 && s.artists[0].name) {
                        artistName = s.artists[0].name;
                    }
                    return {
                        id: s.videoId, type: 'song', title: s.title, 
                        image: imageUrl, subtitle: artistName
                    };
                });

            setAiResults({ movies: validMovies, songs: validSongs });

        } catch (error) {
            console.error("Lỗi Gemini Hoàn Toàn:", error);
            alert("Rất tiếc, máy chủ AI đang gặp sự cố. Bạn vui lòng thử lại sau nhé!");
        }
        setLoadingGemini(false);
    };

    // ==========================================
    // 3. HÀM RENDER CÁC MỤC (SECTION)
    // ==========================================
    const renderSection = (title, desc, items, type, icon) => {
        if (!items || items.length === 0) return null; 
        return (
            <div className="recommend-category">
                <h2 className={`category-title ${type === 'movie' ? 'movie-title' : 'song-title'}`}>
                    <span style={{marginRight: '10px'}}>{icon}</span> {title}
                </h2>
                <p className="category-desc">{desc}</p>
                <div className="media-grid">
                    {items.map((i, idx) => (
                        <div key={i.id || idx} className="animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <Card {...i} />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (!currentUser) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#0a0a0a' }}>
            <h1 style={{ fontSize: '3rem', color: '#00bcd4', marginBottom: '10px' }}>🔐 Yêu cầu đăng nhập</h1>
            <p style={{ color: '#aaa' }}>Trợ lý AI cần biết bạn là ai để có thể gợi ý chính xác nhất.</p>
        </div>
    );

    return (
        <div className="recommend-page-container">
            {/* --- KHU VỰC HERO CHAT (GEMINI) --- */}
            <div className="hero-chat-section">
                <div className="glow-orb"></div>
                <div className="hero-content animate-fade-down">
                    <h1 className="ai-title">✨ Trợ Lý Giải Trí AI</h1>
                    <p className="ai-subtitle">Tôi đã học sở thích của bạn. Hãy nói cho tôi nghe tâm trạng lúc này, tôi sẽ tìm ra những tác phẩm hoàn hảo nhất!</p>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleAskGemini(); }} className={`chat-form ${loadingGemini ? 'loading-glow' : ''}`}>
                        <input type="text" className="chat-input" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ví dụ: Tôi vừa được thăng chức, hãy cho tôi xem phim và nhạc ăn mừng..." />
                        <button type="submit" disabled={loadingGemini} className="chat-submit-btn shine-effect">
                            {loadingGemini ? <div className="spinner"></div> : 'GỬI YÊU CẦU'}
                        </button>
                    </form>

                    <div className="suggestion-chips">
                        {suggestedPrompts.map((text, idx) => (
                            <button key={idx} className="chip-btn" onClick={() => handleAskGemini(text)}>{text}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KHU VỰC KẾT QUẢ TỪ GEMINI */}
            {(loadingGemini || aiResults) && (
                <div className="ai-results-section animate-fade-up">
                    <div className="section-divider">
                        <span className="divider-text">Kết Quả Phân Tích Của Gemini 🧠</span>
                    </div>

                    {loadingGemini ? (
                        <div className="loading-state">
                            <div className="ai-brain-pulse">🤖</div>
                            <h3>AI đang phân tích tâm trạng và tìm kiếm trong vũ trụ giải trí...</h3>
                        </div>
                    ) : (
                        <div className="results-container">
                            {aiResults.movies.length > 0 && renderSection("Điện Ảnh Đề Xuất", "Những bộ phim hoàn hảo cho ngữ cảnh của bạn.", aiResults.movies, 'movie', '🎬')}
                            {aiResults.songs.length > 0 && renderSection("Âm Nhạc Đề Xuất", "Giai điệu phù hợp nhất lúc này.", aiResults.songs, 'song', '🎵')}
                            
                            {aiResults.movies.length === 0 && aiResults.songs.length === 0 && (
                                <div style={{textAlign:'center', color:'#ff4d4d', marginTop: 20}}>
                                    Không tìm thấy kết quả hợp lệ với cơ sở dữ liệu. Vui lòng thử mô tả khác!
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* --- KHU VỰC GỢI Ý MẶC ĐỊNH CHIA TAB (SQL) --- */}
            <div className="default-recommend-section animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <div className="section-divider">
                    <span className="divider-text">Phân Tích Chuyên Sâu Hôm Nay 🌟</span>
                </div>

                <div className="tab-container">
                    <button onClick={() => setActiveTab('movie')} className={`tab-btn ${activeTab === 'movie' ? 'active-movie' : ''}`}>🎬 ĐIỆN ẢNH</button>
                    
                </div>
                
                {loadingDefault ? (
                    <div style={{ textAlign: 'center', color: '#00bcd4', padding: '100px 0' }}>
                        <div className="modern-spinner" style={{ borderColor: '#00bcd4 transparent #00bcd4 transparent', margin: '0 auto' }}></div>
                        <h3 style={{ marginTop: '20px', letterSpacing: '2px' }}>ĐANG TẢI DỮ LIỆU...</h3>
                    </div>
                ) : (
                    <div className="tab-content">
                        {activeTab === 'movie' ? (
                            <>
                                {renderSection("Yêu Thích Gần Đây", "Những bộ phim bạn đã 'Thích' hoặc xem gần đây.", movieData.history, 'movie', '❤️')}
                                {renderSection("Dành Cho Độ Tuổi Của Bạn", "Xu hướng điện ảnh được thế hệ của bạn quan tâm nhất.", movieData.age, 'movie', '🎓')}
                                {renderSection("Thịnh Hành Cùng Giới Tính", "Những bộ phim đang làm mưa làm gió trong cộng đồng cùng giới tính với bạn.", movieData.gender, 'movie', '👫')}
                                {renderSection("Có Thể Bạn Sẽ Thích", "Phân tích AI chuyên sâu (Collaborative Filtering) dựa trên những người dùng có chung gu.", movieData.personalized, 'movie', '🧠')}
                                {renderSection("Khám Phá Sở Thích Mới", "Gợi ý thông minh dựa vào Thể loại và những từ khóa bạn từng tìm kiếm.", movieData.content_based, 'movie', '🎯')}
                            </>
                        ) : (
                            <>
                                {renderSection("Playlist Yêu Thích", "Những bài hát bạn nghe đi nghe lại hoặc đánh giá cao.", songData.history, 'song', '❤️')}
                                {renderSection("Giai Điệu Thế Hệ", "Những bản nhạc mang đậm dấu ấn tuổi trẻ của thế hệ bạn.", songData.age, 'song', '🎧')}
                                {renderSection("Giai Điệu Cùng Giới Tính", "Âm nhạc đang được phái của bạn ưu ái nhất.", songData.gender, 'song', '👫')}
                                {renderSection("Khám Phá Gu Âm Nhạc Mới", "AI tự động học từ lượt view/like để tìm ra những bài hát hoàn hảo cho bạn.", songData.personalized, 'song', '🧠')}
                                {renderSection("Mở Rộng Sở Thích", "Gợi ý thông minh dựa vào Thể loại và ca sĩ bạn từng tìm kiếm.", songData.content_based, 'song', '🎯')}
                            </>
                        )}
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .recommend-page-container { background: #0a0a0a; min-height: 100vh; color: white; padding-top: 80px; padding-bottom: 80px; font-family: 'Inter', sans-serif; overflow-x: hidden; }
                
                .hero-chat-section { position: relative; padding: 60px 20px; display: flex; justify-content: center; align-items: center; text-align: center; }
                .glow-orb { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 800px; height: 300px; background: linear-gradient(45deg, rgba(0,188,212,0.2), rgba(33,150,243,0.2)); filter: blur(100px); z-index: 1; pointer-events: none; border-radius: 50%; }
                .hero-content { position: relative; z-index: 2; width: 100%; max-width: 900px; }
                .ai-title { font-size: 3.5rem; font-weight: 900; margin-bottom: 15px; background: linear-gradient(to right, #00bcd4, #2196f3, #b2ebf2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -1px; text-shadow: 0 0 30px rgba(0,188,212,0.3); }
                .ai-subtitle { font-size: 1.1rem; color: #aaa; margin-bottom: 40px; line-height: 1.6; }

                .chat-form { position: relative; display: flex; background: rgba(25, 25, 25, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 50px; padding: 10px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); transition: 0.3s; }
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

                .section-divider { display: flex; align-items: center; text-align: center; margin: 60px 5% 40px; }
                .section-divider::before, .section-divider::after { content: ''; flex: 1; border-bottom: 1px dashed rgba(255,255,255,0.15); }
                .divider-text { padding: 0 20px; font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: 2px; text-transform: uppercase; }

                .tab-container { display: flex; gap: 20px; justify-content: center; margin-bottom: 40px; }
                .tab-btn { padding: 12px 40px; font-size: 1.2rem; font-weight: bold; border-radius: 30px; cursor: pointer; transition: all 0.3s; background: rgba(255,255,255,0.05); border: 1px solid #333; color: white; }
                .active-movie { background: linear-gradient(45deg, #e50914, #b20710) !important; border: none; box-shadow: 0 5px 20px rgba(229, 9, 20, 0.5); }
                .active-song { background: linear-gradient(45deg, #1db954, #128c3c) !important; border: none; box-shadow: 0 5px 20px rgba(29, 185, 84, 0.5); }

                .ai-results-section, .default-recommend-section { padding: 0 5%; }
                .recommend-category { margin-top: 60px; }
                .category-title { font-size: 1.8rem; font-weight: bold; margin-bottom: 5px; }
                .movie-title { color: #e50914; }
                .song-title { color: #1db954; }
                .category-desc { color: #888; margin-bottom: 30px; font-style: italic; font-size: 1rem; }
                .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 25px; }

                .spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
                .modern-spinner { width: 60px; height: 60px; border-radius: 50%; border: 4px solid; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                
                .loading-state { text-align: center; padding: 60px 20px; background: rgba(0,188,212,0.05); border-radius: 20px; border: 1px solid rgba(0,188,212,0.2); }
                .ai-brain-pulse { font-size: 5rem; animation: pulse 1.5s infinite alternate; margin-bottom: 20px; }
                @keyframes pulse { 0% { transform: scale(1); filter: drop-shadow(0 0 10px #00bcd4); } 100% { transform: scale(1.15); filter: drop-shadow(0 0 30px #2196f3); } }

                .animate-fade-down { animation: fadeDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                @keyframes fadeDown { 0% { opacity: 0; transform: translateY(-30px); } 100% { opacity: 1; transform: translateY(0); } }
                @keyframes fadeUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
                .shine-effect::before { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); transition: 0.7s; z-index: 1; }
                .shine-effect:hover::before { left: 200%; }
            `}} />
        </div>
    );
};

export default RecommendPage;