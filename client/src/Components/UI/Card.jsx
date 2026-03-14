import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Card = ({ id, type, title, image, subtitle }) => {
    const [isSaved, setIsSaved] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const handleSave = async (e) => {
        e.preventDefault(); // Ngăn chặn thẻ Link chuyển trang khi bấm nút lưu
        if (!currentUser) return alert("Vui lòng đăng nhập để lưu!");
        
        try {
            const res = await fetch('http://localhost:5000/api/watchlist/toggle', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, itemId: String(id), itemType: type, itemTitle: title, itemImage: image })
            });
            const data = await res.json();
            if(data.success) {
                setIsSaved(data.action === 'added');
                // Tùy chọn: Thêm Toast Notification ở đây
            }
        } catch (err) {}
    };

    return (
        <div className="card-container">
            <Link to={`/${type}/${id}`} className="card-link">
                <div className="card-image-wrapper">
                    <img src={image} alt={title} className="card-image" loading="lazy" />
                    
                    {/* NÚT THÊM VÀO WATCHLIST */}
                    <button className={`save-btn ${isSaved ? 'saved' : ''}`} onClick={handleSave}>
                        {isSaved ? '✓' : '+'}
                    </button>
                    
                    <div className="card-overlay">
                        <div className="play-btn">▶</div>
                    </div>
                </div>
                <div className="card-info">
                    <h3 className="card-title">{title}</h3>
                    <p className="card-subtitle">{subtitle}</p>
                </div>
            </Link>

            <style dangerouslySetInnerHTML={{__html: `
                .card-container { position: relative; transition: 0.3s; }
                .card-container:hover { transform: translateY(-5px) scale(1.02); }
                .card-link { text-decoration: none; color: white; display: block; }
                .card-image-wrapper { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 2/3; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
                .card-image { width: 100%; height: 100%; object-fit: cover; transition: 0.3s; }
                .card-container:hover .card-image { filter: brightness(0.7); }
                
                /* CSS Nút Save */
                .save-btn { position: absolute; top: 10px; right: 10px; width: 35px; height: 35px; border-radius: 50%; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; backdrop-filter: blur(5px); transition: 0.3s; opacity: 0; transform: translateY(-10px); }
                .card-container:hover .save-btn { opacity: 1; transform: translateY(0); }
                .save-btn:hover { background: white; color: black; transform: scale(1.1) !important; }
                .save-btn.saved { background: #1db954; color: white; border-color: #1db954; opacity: 1; transform: translateY(0); }

                .card-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; }
                .card-container:hover .card-overlay { opacity: 1; }
                .play-btn { width: 50px; height: 50px; background: rgba(229, 9, 20, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 0 20px rgba(229,9,20,0.5); }
                .card-info { margin-top: 10px; }
                .card-title { font-size: 1rem; margin: 0 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: bold; }
                .card-subtitle { font-size: 0.85rem; color: #aaa; margin: 0; }
            `}} />
        </div>
    );
};

export default Card;