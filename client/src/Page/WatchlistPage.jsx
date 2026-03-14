import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const WatchlistPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, movie, song
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // Số lượng hiển thị 1 trang để chống tràn
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    useEffect(() => {
        if (!currentUser) return window.location.href = '/login';
        loadWatchlist();
    }, []);

    const loadWatchlist = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/watchlist/${currentUser.id}`);
            const data = await res.json();
            setItems(data);
        } catch (e) {}
        setLoading(false);
    };

    // Lọc và phân trang
    const filteredItems = useMemo(() => items.filter(i => filter === 'all' ? true : i.ItemType === filter), [items, filter]);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset trang khi đổi filter
    useEffect(() => { setCurrentPage(1); }, [filter]);

    const handleRemove = async (id) => {
        // Animation xóa (đánh dấu class css trước khi xóa data)
        document.getElementById(`watch-item-${id}`).classList.add('removing');
        setTimeout(async () => {
            await fetch(`http://localhost:5000/api/watchlist/item/${id}`, { method: 'DELETE' });
            setItems(items.filter(i => i.ID !== id));
        }, 300); // Đợi 300ms cho animation chạy xong
    };

    const handleClearAll = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa TOÀN BỘ danh sách xem sau?")) return;
        await fetch(`http://localhost:5000/api/watchlist/${currentUser.id}/clear`, { method: 'DELETE' });
        setItems([]);
    };

    if (loading) return <div style={{height: '100vh', background: '#0a0a0a'}}></div>;

    return (
        <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', paddingTop: '80px', paddingBottom: '50px' }}>
            <div className="layout-container">
                
                {/* --- CỘT TRÁI: THÔNG TIN PLAYLIST YOUTUBE STYLE --- */}
                <div className="info-panel animate-fade-up">
                    <div className="cover-image-container">
                        <img 
                            src={filteredItems[0]?.ItemImage || 'https://via.placeholder.com/400x400?text=Danh+Sách+Trống'} 
                            alt="Cover" className="cover-image" 
                        />
                        <div className="cover-overlay">
                            <span style={{ fontSize: '3rem' }}>▶</span>
                        </div>
                    </div>
                    
                    <h1 className="playlist-title">Danh sách Xem sau</h1>
                    <p className="playlist-meta">Của <strong>{currentUser?.fullName}</strong> • {filteredItems.length} mục</p>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button className="play-all-btn shine-effect" disabled={filteredItems.length === 0}>
                            Phát Tất Cả
                        </button>
                        <button className="clear-all-btn" onClick={handleClearAll} disabled={items.length === 0}>
                            🗑 Xóa Hết
                        </button>
                    </div>

                    {/* Bộ lọc */}
                    <div className="filter-group">
                        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={()=>setFilter('all')}>Tất cả</button>
                        <button className={`filter-btn ${filter === 'movie' ? 'active' : ''}`} onClick={()=>setFilter('movie')}>🎬 Phim</button>
                        <button className={`filter-btn ${filter === 'song' ? 'active' : ''}`} onClick={()=>setFilter('song')}>🎵 Nhạc</button>
                    </div>
                </div>

                {/* --- CỘT PHẢI: DANH SÁCH ITEMS --- */}
                <div className="list-panel">
                    {currentItems.length > 0 ? (
                        <div className="item-list">
                            {currentItems.map((item, index) => (
                                <div key={item.ID} id={`watch-item-${item.ID}`} className="list-item animate-fade-left" style={{ animationDelay: `${index * 0.05}s` }}>
                                    <div className="item-number">{(currentPage - 1) * itemsPerPage + index + 1}</div>
                                    
                                    <Link to={`/${item.ItemType}/${item.ItemID}`} className="item-link">
                                        <img src={item.ItemImage} alt="" className={`item-img ${item.ItemType === 'song' ? 'img-song' : ''}`} />
                                        <div className="item-details">
                                            <h3 className="item-title">{item.ItemTitle}</h3>
                                            <p className="item-type">{item.ItemType === 'movie' ? 'Phim điện ảnh' : 'Bài hát / Âm nhạc'}</p>
                                        </div>
                                    </Link>
                                    
                                    <button className="remove-btn" onClick={() => handleRemove(item.ID)} title="Xóa khỏi danh sách">✕</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state animate-fade-up">
                            <span style={{ fontSize: '4rem' }}>📭</span>
                            <h2>Danh sách trống</h2>
                            <p style={{ color: '#888' }}>Bạn chưa thêm tác phẩm nào vào mục Xem sau.</p>
                        </div>
                    )}

                    {/* PHÂN TRANG CHỐNG TRÀN */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>«</button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} className={currentPage === i + 1 ? 'active' : ''} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                            ))}
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>»</button>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .layout-container { display: flex; gap: 40px; max-width: 1200px; margin: 0 auto; padding: 20px; align-items: flex-start; }
                
                @media (max-width: 800px) {
                    .layout-container { flex-direction: column; }
                    .info-panel { position: static !important; width: 100% !important; }
                }

                /* CỘT TRÁI - INFO PANEL (Dính chặt khi cuộn) */
                .info-panel { width: 350px; background: linear-gradient(to bottom, rgba(255,255,255,0.1), transparent); padding: 30px; border-radius: 20px; position: sticky; top: 100px; box-sizing: border-box; }
                
                .cover-image-container { position: relative; width: 100%; aspect-ratio: 1/1; border-radius: 15px; overflow: hidden; box-shadow: 0 15px 30px rgba(0,0,0,0.8); margin-bottom: 20px; }
                .cover-image { width: 100%; height: 100%; object-fit: cover; filter: blur(2px) brightness(0.8); transition: 0.3s; }
                .cover-image-container:hover .cover-image { filter: blur(0) brightness(1); transform: scale(1.05); }
                .cover-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); opacity: 0; transition: 0.3s; cursor: pointer; }
                .cover-image-container:hover .cover-overlay { opacity: 1; }

                .playlist-title { font-size: 2rem; font-weight: 900; margin: 0 0 10px; }
                .playlist-meta { color: #aaa; margin: 0; font-size: 0.95rem; }
                
                .play-all-btn { flex: 2; padding: 15px; background: white; color: black; border: none; border-radius: 30px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: 0.2s; position: relative; overflow: hidden; }
                .play-all-btn:hover:not(:disabled) { transform: scale(1.02); }
                .play-all-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .clear-all-btn { flex: 1; padding: 15px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 30px; font-weight: bold; cursor: pointer; transition: 0.2s; }
                .clear-all-btn:hover:not(:disabled) { background: rgba(255,77,77,0.2); color: #ff4d4d; }
                
                .filter-group { display: flex; gap: 10px; margin-top: 30px; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 20px; }
                .filter-btn { flex: 1; background: transparent; border: none; color: #888; padding: 10px; border-radius: 15px; cursor: pointer; font-weight: bold; transition: 0.3s; }
                .filter-btn.active { background: #333; color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.5); }

                /* CỘT PHẢI - LIST PANEL */
                .list-panel { flex: 1; width: 100%; }
                .item-list { display: flex; flex-direction: column; gap: 10px; }
                
                .list-item { display: flex; align-items: center; padding: 10px 15px; border-radius: 12px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); border-bottom: 1px solid rgba(255,255,255,0.05); }
                .list-item:hover { background: rgba(255,255,255,0.08); transform: translateX(10px); border-bottom-color: transparent; }
                
                /* Hiệu ứng xóa */
                .list-item.removing { transform: translateX(100px); opacity: 0; }

                .item-number { width: 30px; color: #666; font-weight: bold; font-size: 1.1rem; }
                .list-item:hover .item-number { color: white; }
                
                .item-link { flex: 1; display: flex; align-items: center; text-decoration: none; color: white; overflow: hidden; }
                .item-img { width: 120px; height: 68px; object-fit: cover; border-radius: 8px; margin-right: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                .img-song { aspect-ratio: 1/1; width: 68px; border-radius: 50%; } /* Phân biệt nhạc (tròn) và phim (chữ nhật) */
                
                .item-details { flex: 1; overflow: hidden; }
                .item-title { font-size: 1.1rem; margin: 0 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .item-type { font-size: 0.85rem; color: #888; margin: 0; }

                .remove-btn { background: transparent; border: none; color: #666; font-size: 1.5rem; cursor: pointer; padding: 10px; opacity: 0; transition: 0.3s; }
                .list-item:hover .remove-btn { opacity: 1; }
                .remove-btn:hover { color: #ff4d4d; transform: scale(1.2); }

                .empty-state { text-align: center; padding: 100px 0; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px dashed rgba(255,255,255,0.1); }
                
                .pagination { display: flex; justify-content: center; gap: 10px; margin-top: 40px; }
                .pagination button { width: 40px; height: 40px; border-radius: 50%; border: none; background: rgba(255,255,255,0.1); color: white; font-weight: bold; cursor: pointer; transition: 0.3s; }
                .pagination button:hover:not(:disabled) { background: rgba(255,255,255,0.3); }
                .pagination button.active { background: #e50914; }
                .pagination button:disabled { opacity: 0.3; cursor: not-allowed; }

                /* Animations */
                .shine-effect::before { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); transition: all 0.7s ease; z-index: 1; }
                .shine-effect:hover::before { left: 200%; transition: all 0.7s ease; }
                @keyframes fadeUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                @keyframes fadeLeft { 0% { opacity: 0; transform: translateX(20px); } 100% { opacity: 1; transform: translateX(0); } }
                .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fade-left { animation: fadeLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
            `}} />
        </div>
    );
};

export default WatchlistPage;