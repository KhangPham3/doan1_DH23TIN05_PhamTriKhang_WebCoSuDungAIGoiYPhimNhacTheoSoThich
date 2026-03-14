import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_KEY, BASE_URL } from '../../API/tmdbAPI';

const Card = ({ id, type, title, image, subtitle }) => {
    const [isSaved, setIsSaved] = useState(false);
    
    // --- STATE CHO MINI PLAYER TRÌNH PHÁT THU NHỎ ---
    const [showVideo, setShowVideo] = useState(false);
    const [videoKey, setVideoKey] = useState(null);
    const [hasLogged, setHasLogged] = useState(false); // Tránh gửi log liên tục nếu người dùng hover ra vào nhiều lần
    const hoverTimeoutRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // --- LOGIC: THÊM VÀO XEM SAU ---
    const handleSave = async (e) => {
        e.preventDefault(); 
        if (!currentUser) return alert("Vui lòng đăng nhập để lưu!");
        
        try {
            const res = await fetch('http://localhost:5000/api/watchlist/toggle', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, itemId: String(id), itemType: type, itemTitle: title, itemImage: image })
            });
            const data = await res.json();
            if(data.success) setIsSaved(data.action === 'added');
        } catch (err) {}
    };

    // --- LOGIC: HOVER ĐỂ PHÁT VIDEO & LƯU LỊCH SỬ ---
    const handleMouseEnter = () => {
        // Đợi 1.2 giây mới bắt đầu phát để tránh lướt chuột nhầm
        hoverTimeoutRef.current = setTimeout(async () => {
            let currentKey = videoKey;
            
            // 1. Lấy Video ID
            if (type === 'movie' && !currentKey) {
                try {
                    // Gọi TMDB lấy Trailer
                    const res = await fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`);
                    const data = await res.json();
                    if (data.results && data.results.length > 0) {
                        const trailer = data.results.find(vid => vid.site === 'YouTube' && vid.type === 'Trailer');
                        currentKey = trailer ? trailer.key : data.results[0].key;
                        setVideoKey(currentKey);
                    }
                } catch(e) {}
            } else if (type === 'song') {
                currentKey = id; // ID bài hát chính là ID Youtube
                if (!videoKey) setVideoKey(currentKey);
            }

            // 2. Hiển thị Video
            if (currentKey) setShowVideo(true);

            // 3. Âm thầm Lưu vào lịch sử (History) cho AI học
            if (currentUser && !hasLogged) {
                try {
                    await fetch('http://localhost:5000/api/log-interaction', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser.id, itemId: String(id), itemType: type, actionType: 'VIEW' })
                    });
                    setHasLogged(true); // Đánh dấu đã log để không spam database
                } catch(e) {}
            }
        }, 800); 
    };

    const handleMouseLeave = () => {
        // Nếu chuột rời đi trước 1.2 giây -> Hủy lệnh phát
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setShowVideo(false); 
    };

    // Hủy timeout nếu component bị unmount (chuyển trang)
    useEffect(() => {
        return () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }
    }, []);

    return (
        <div 
            className="card-container animate-fade-up" 
            onMouseEnter={handleMouseEnter} 
            onMouseLeave={handleMouseLeave}
        >
            <Link to={`/${type}/${id}`} className="card-link">
                <div className="card-image-wrapper">
                    
                    {/* NẾU ĐANG HOVER VÀ CÓ VIDEO KEY -> HIỆN TRÌNH PHÁT */}
                    {showVideo && videoKey ? (
                        <div className="video-wrapper">
                            <iframe 
                                className="mini-player"
                                // Autoplay, Tắt tiếng (Mute bắt buộc để browser cho phép tự phát), Ẩn Control
                                src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3`}
                                frameBorder="0"
                                allow="autoplay; encrypted-media"
                            ></iframe>
                            <div className="playing-badge">Đang phát trước...</div>
                        </div>
                    ) : (
                        <img src={image} alt={title} className="card-image" loading="lazy" />
                    )}
                    
                    {/* NÚT THÊM VÀO WATCHLIST */}
                    <button className={`save-btn ${isSaved ? 'saved' : ''}`} onClick={handleSave} title="Lưu xem sau">
                        {isSaved ? '✓' : '+'}
                    </button>
                    
                    {/* Lớp phủ icon Play (Ẩn đi khi đang phát video) */}
                    {!showVideo && (
                        <div className="card-overlay">
                            <div className="play-btn">▶</div>
                        </div>
                    )}
                </div>
                <div className="card-info">
                    <h3 className="card-title">{title}</h3>
                    <p className="card-subtitle">{subtitle}</p>
                </div>
            </Link>

            <style dangerouslySetInnerHTML={{__html: `
                .card-container { position: relative; transition: 0.3s; cursor: pointer; }
                .card-container:hover { transform: translateY(-5px) scale(1.03); z-index: 10; }
                .card-link { text-decoration: none; color: white; display: block; }
                .card-image-wrapper { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 2/3; box-shadow: 0 5px 15px rgba(0,0,0,0.5); background: #111; }
                .card-image { width: 100%; height: 100%; object-fit: cover; transition: 0.3s; }
                .card-container:hover .card-image { filter: brightness(0.7); }
                
                /* TRÌNH PHÁT THU NHỎ */
                .video-wrapper { position: absolute; inset: 0; width: 100%; height: 100%; background: #000; animation: fadeIn 0.5s ease-out; }
                .mini-player { 
                    width: 150%; height: 100%; 
                    position: absolute; top: 0; left: -25%; 
                    object-fit: cover; 
                    pointer-events: none; /* QUAN TRỌNG: Không cho click vào iframe để Link bên dưới vẫn hoạt động */
                }
                .playing-badge { position: absolute; bottom: 10px; left: 10px; background: rgba(229,9,20,0.8); color: white; font-size: 0.7rem; font-weight: bold; padding: 3px 8px; border-radius: 4px; pointer-events: none; }

                /* Nút Save Xem sau */
                .save-btn { position: absolute; top: 10px; right: 10px; width: 35px; height: 35px; border-radius: 50%; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 20; backdrop-filter: blur(5px); transition: 0.3s; opacity: 0; transform: translateY(-10px); }
                .card-container:hover .save-btn { opacity: 1; transform: translateY(0); }
                .save-btn:hover { background: white; color: black; transform: scale(1.1) !important; }
                .save-btn.saved { background: #1db954; color: white; border-color: #1db954; opacity: 1; transform: translateY(0); }

                .card-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; }
                .card-container:hover .card-overlay { opacity: 1; }
                .play-btn { width: 50px; height: 50px; background: rgba(229, 9, 20, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 0 20px rgba(229,9,20,0.5); padding-left: 4px; }
                
                .card-info { margin-top: 10px; }
                .card-title { font-size: 1rem; margin: 0 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: bold; }
                .card-subtitle { font-size: 0.85rem; color: #aaa; margin: 0; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}} />
        </div>
    );
};

export default Card;  