import React, { useState, useEffect } from 'react';
import Card from '../Components/UI/Card';
import { API_KEY, BASE_URL, IMAGE_URL } from '../API/tmdbAPI';
import { fetchSongDetailAI } from '../API/MusicAPI';

const HistoryPage = () => {
    const [activeTab, setActiveTab] = useState('movie'); // 'movie' hoặc 'song'
    const [historyData, setHistoryData] = useState({ movies: [], songs: [] });
    const [loading, setLoading] = useState(true);
    
    // State cho bộ lọc thời gian
    const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'today', '7days', '30days'
    
    // Lưu trữ dữ liệu gốc chưa bị lọc để tiện bề khôi phục
    const [originalHistoryRaw, setOriginalHistoryRaw] = useState([]);

    const user = JSON.parse(localStorage.getItem('currentUser'));

    // Hàm tiện ích format thời gian
    const formatTime = (isoString) => {
        if(!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/history/${user.id}`);
            const historyRecords = await res.json();
            setOriginalHistoryRaw(historyRecords); // Lưu bản gốc
            
            await processHistoryData(historyRecords, timeFilter);
            
        } catch (error) {
            console.error("Lỗi tải lịch sử:", error);
        }
        setLoading(false);
    };

    // Hàm xử lý data (Áp dụng bộ lọc + Gọi API TMDB/YT)
    const processHistoryData = async (rawRecords, filterType) => {
        const now = new Date();
        
        const filteredRecords = rawRecords.filter(item => {
            if (filterType === 'all') return true;
            if (!item.LastViewed) return true; // Fix lỗi data cũ ko có LastViewed
            
            const viewDate = new Date(item.LastViewed);
            const diffTime = Math.abs(now - viewDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (filterType === 'today') return diffDays <= 1;
            if (filterType === '7days') return diffDays <= 7;
            if (filterType === '30days') return diffDays <= 30;
            return true;
        });

        const movieRecords = filteredRecords.filter(item => item.ItemType === 'movie');
        const songRecords = filteredRecords.filter(item => item.ItemType === 'song');

        const fetchMovieDetails = async (records) => {
            const promises = records.slice(0, 30).map(async (record) => {
                try{
                   const r = await fetch(`${BASE_URL}/movie/${record.ItemID}?api_key=${API_KEY}&language=vi-VN`);
                   const data = await r.json();
                   if(data.id) return { ...data, viewTime: record.LastViewed };
                   return null;
                } catch(e) { return null; }
            });
            const results = await Promise.all(promises);
            return results.filter(m => m !== null);
        };

        const fetchSongDetails = async (records) => {
            const promises = records.slice(0, 30).map(async (record) => {
                 try{
                    const s = await fetchSongDetailAI(record.ItemID);
                    if(s && s.info) {
                        return {
                            id: s.info.videoDetails.videoId,
                            title: s.info.videoDetails.title,
                            artist: s.info.videoDetails.author,
                            image: `https://img.youtube.com/vi/${s.info.videoDetails.videoId}/hqdefault.jpg`,
                            viewTime: record.LastViewed
                        };
                    }
                    return null;
                 } catch(e){ return null; }
            });
            const results = await Promise.all(promises);
            return results.filter(s => s !== null);
        };

        setHistoryData({
            movies: await fetchMovieDetails(movieRecords),
            songs: await fetchSongDetails(songRecords)
        });
    };

    useEffect(() => {
        if (user && user.id) {
            fetchHistory();
        }
    }, [user?.id]);

    // Khi thay đổi bộ lọc, chạy lại hàm process với data gốc đã lưu
    useEffect(() => {
        if(originalHistoryRaw.length > 0) {
            setLoading(true);
            processHistoryData(originalHistoryRaw, timeFilter).then(()=> setLoading(false));
        }
    }, [timeFilter]);


    // 🔴 HÀM XÓA 1 MỤC LỊCH SỬ
    const handleDeleteItem = async (itemId, itemType) => {
        if(!window.confirm("Bạn có chắc muốn xóa mục này khỏi lịch sử?")) return;
        
        try {
            await fetch(`http://localhost:5000/api/history/${user.id}/${itemType}/${itemId}`, { method: 'DELETE' });
            // Cập nhật giao diện mượt mà ko cần reload trang
            if(itemType === 'movie') {
                setHistoryData(prev => ({ ...prev, movies: prev.movies.filter(m => String(m.id) !== String(itemId)) }));
            } else {
                setHistoryData(prev => ({ ...prev, songs: prev.songs.filter(s => String(s.id) !== String(itemId)) }));
            }
            // Cập nhật Data gốc
            setOriginalHistoryRaw(prev => prev.filter(r => !(r.ItemType === itemType && String(r.ItemID) === String(itemId))));
            
        } catch (err) {
            alert("Lỗi khi xóa!");
        }
    };

    // 🔴 HÀM XÓA TOÀN BỘ LỊCH SỬ THEO TAB
    const handleDeleteAll = async () => {
        if(!window.confirm(`Bạn có CHẮC CHẮN muốn xóa TOÀN BỘ lịch sử ${activeTab === 'movie' ? 'PHIM' : 'NHẠC'} không? Hành động này không thể hoàn tác!`)) return;
        
        setLoading(true);
        try {
            await fetch(`http://localhost:5000/api/history/${user.id}/${activeTab}/all`, { method: 'DELETE' });
            if(activeTab === 'movie') {
                setHistoryData(prev => ({ ...prev, movies: [] }));
            } else {
                setHistoryData(prev => ({ ...prev, songs: [] }));
            }
            setOriginalHistoryRaw(prev => prev.filter(r => r.ItemType !== activeTab));
            
        } catch (err) {
            alert("Lỗi khi xóa toàn bộ!");
        }
        setLoading(false);
    };


    if (!user) {
        return (
            <div style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#0a0a0a', color: 'white' }}>
                <h1 style={{ fontSize: '4rem', margin: '0 0 20px 0' }}>👻</h1>
                <h2 style={{ color: '#e50914', marginBottom: '10px' }}>Chưa Đăng Nhập</h2>
                <p style={{ color: '#aaa', marginBottom: '30px' }}>Vui lòng đăng nhập để hệ thống có thể lưu trữ và hiển thị lịch sử của bạn.</p>
                <a href="/login" className="btn-modern shine-effect" style={{ textDecoration: 'none' }}>Đăng Nhập Ngay</a>
            </div>
        );
    }

    const currentList = activeTab === 'movie' ? historyData.movies : historyData.songs;

    return (
        <div style={{ 
            paddingTop: '100px', paddingBottom: '80px', 
            minHeight: 'calc(100vh - 100px)', // ĐẨY FOOTER XUỐNG DƯỚI
            background: '#0a0a0a', paddingLeft: '5%', paddingRight: '5%',
            display: 'flex', flexDirection: 'column' 
        }}>
            
            {/* TIÊU ĐỀ */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', margin: 0 }}>
                    🕒 LỊCH SỬ CỦA TÔI
                </h1>
                <p style={{ color: '#888', marginTop: '10px', fontSize: '1rem' }}>
                    Chào <span style={{ color: '#00bcd4', fontWeight: 'bold' }}>{user.fullName}</span>, bạn đang xem những nội dung đã lưu vết.
                </p>
            </div>

            {/* CONTROL PANEL: TAB + BỘ LỌC + XÓA TẤT CẢ */}
            <div style={{ 
                display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '40px'
            }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setActiveTab('movie')} className={`tab-btn ${activeTab === 'movie' ? 'active-movie' : ''}`}>
                        🎬 Phim ({historyData.movies.length})
                    </button>
                    <button onClick={() => setActiveTab('song')} className={`tab-btn ${activeTab === 'song' ? 'active-song' : ''}`}>
                        🎵 Nhạc ({historyData.songs.length})
                    </button>
                </div>

                {/* Công cụ bên phải */}
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <select 
                        value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}
                        style={{ padding: '10px 15px', background: '#111', color: 'white', border: '1px solid #333', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="all">🕒 Tất cả thời gian</option>
                        <option value="today">📅 Hôm nay</option>
                        <option value="7days">🗓️ 7 ngày qua</option>
                        <option value="30days">📆 30 ngày qua</option>
                    </select>

                    {currentList.length > 0 && (
                        <button onClick={handleDeleteAll} className="btn-delete-all">
                            🗑️ Xóa Tất Cả
                        </button>
                    )}
                </div>
            </div>

            {/* DANH SÁCH HIỂN THỊ */}
            <div style={{ flex: 1 }}> 
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '80px' }}>
                        <div className="modern-spinner" style={{ borderColor: activeTab === 'movie' ? '#e50914 transparent #e50914 transparent' : '#1db954 transparent #1db954 transparent' }}></div>
                        <p style={{ color: activeTab === 'movie' ? '#e50914' : '#1db954', marginTop: '20px', fontWeight: 'bold' }}>ĐANG TẢI DỮ LIỆU...</p>
                    </div>
                ) : (
                    currentList.length > 0 ? (
                        <div className="media-grid">
                            {currentList.map((item, idx) => (
                                <div key={item.id + idx} className="history-card-wrapper animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                                    
                                    {/* Nút Xóa đè lên trên Card */}
                                    <button 
                                        className="btn-delete-item" 
                                        onClick={() => handleDeleteItem(item.id, activeTab)}
                                        title="Xóa khỏi lịch sử"
                                    >
                                        ✖
                                    </button>

                                    <Card 
                                        id={item.id} type={activeTab} title={item.title}
                                        image={activeTab === 'movie' ? (item.poster_path ? `${IMAGE_URL}${item.poster_path}` : 'https://via.placeholder.com/300x450') : item.image}
                                        subtitle={
                                            <span style={{ fontSize: '0.8rem', color: '#ffeb3b' }}>
                                                {formatTime(item.viewTime)}
                                            </span>
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h1>{activeTab === 'movie' ? '🍿' : '🎧'}</h1>
                            <h2>{activeTab === 'movie' ? 'Chưa xem bộ phim nào' : 'Chưa nghe bài hát nào'}</h2>
                            <p>Không có dữ liệu trong khoảng thời gian này. Hãy tiếp tục khám phá nhé!</p>
                        </div>
                    )
                )}
            </div>

            {/* CSS TÍCH HỢP */}
            <style dangerouslySetInnerHTML={{__html: `
                .tab-btn {
                    padding: 10px 25px; fontSize: 1rem; font-weight: bold; border-radius: 30px;
                    cursor: pointer; transition: all 0.3s ease; border: 1px solid transparent;
                    background: rgba(255,255,255,0.05); color: #888;
                }
                .tab-btn:hover { color: white; background: rgba(255,255,255,0.1); }
                .active-movie { background: rgba(229, 9, 20, 0.2); color: #e50914; border: 1px solid #e50914; }
                .active-song { background: rgba(29, 185, 84, 0.2); color: #1db954; border: 1px solid #1db954; }

                /* Nút Login Modern */
                .btn-modern {
                    padding: 12px 30px; background: linear-gradient(45deg, #e50914, #b20710); 
                    color: white; border-radius: 10px; font-weight: bold; position: relative; overflow: hidden;
                    box-shadow: 0 5px 20px rgba(229, 9, 20, 0.4);
                }

                /* Nút Xóa Tất Cả */
                .btn-delete-all {
                    padding: 10px 20px; background: transparent; color: #ff4d4d;
                    border: 1px solid #ff4d4d; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.3s;
                }
                .btn-delete-all:hover { background: #ff4d4d; color: white; box-shadow: 0 0 15px rgba(255, 77, 77, 0.5); }

                /* Wrapper cho Card Lịch Sử để đặt nút Xóa tương đối */
                .history-card-wrapper { position: relative; }
                
                /* Nút Xóa 1 Item (Dấu X đỏ góc trên bên phải) */
                .btn-delete-item {
                    position: absolute; top: -10px; right: -10px; z-index: 10;
                    width: 30px; height: 30px; border-radius: 50%; background: #222; color: #888;
                    border: 2px solid #333; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    font-size: 12px; font-weight: bold; transition: all 0.3s; opacity: 0; transform: scale(0.8);
                }
                .history-card-wrapper:hover .btn-delete-item { opacity: 1; transform: scale(1); }
                .btn-delete-item:hover { background: #e50914; color: white; border-color: #ff4d4d; box-shadow: 0 0 10px rgba(229,9,20,0.8); transform: scale(1.1) !important; }

                /* Trạng thái trống */
                .empty-state {
                    text-align: center; padding: 60px 20px;
                    background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px dashed rgba(255,255,255,0.1);
                    margin-top: 20px;
                }
                .empty-state h1 { font-size: 4rem; margin: 0 0 10px 0; opacity: 0.5; }
                .empty-state h2 { color: #ccc; margin-bottom: 10px; font-size: 1.5rem; }
                .empty-state p { color: #666; }

                /* Animation */
                @keyframes fadeUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-up { animation: fadeUp 0.5s forwards; opacity: 0; }
                
                .modern-spinner { width: 50px; height: 50px; border-radius: 50%; border: 3px solid; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}} />
        </div>
    );
};

export default HistoryPage;