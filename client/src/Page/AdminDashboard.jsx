import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_KEY, BASE_URL } from '../API/tmdbAPI';
import { fetchSongDetailAI } from '../API/MusicAPI';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ totalUsers: 0, totalInteractions: 0 });
    const [users, setUsers] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [demographics, setDemographics] = useState({ genders: [], registrations: [] });
    const [loading, setLoading] = useState(true);

    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

    const [userFilter, setUserFilter] = useState({ gender: 'all', age: 'all' });
    const [userPageSize, setUserPageSize] = useState(10);
    const [userCurrentPage, setUserCurrentPage] = useState(1);
    const [banModal, setBanModal] = useState({ isOpen: false, user: null, reason: '' });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [trendingList, setTrendingList] = useState([]);
    const [topItems, setTopItems] = useState([]); 

    const PIE_COLORS = ['#00bcd4', '#e50914', '#ffc107', '#1db954'];

    useEffect(() => {
        if (currentUser?.role !== 'admin') { window.location.href = '/'; return; }
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'movies') { loadTrending('movie'); loadTopItems('movie'); setSearchQuery(''); setSearchResults([]); } 
        else if (activeTab === 'songs') { loadTrending('song'); loadTopItems('song'); setSearchQuery(''); setSearchResults([]); }
    }, [activeTab]);

    const fetchData = async () => {
        try {
            const [st, us, ch, dem] = await Promise.all([
                fetch('http://localhost:5000/api/admin/stats').then(r => r.json()).catch(()=>({})),
                fetch('http://localhost:5000/api/admin/users').then(r => r.json()).catch(()=>[]),
                fetch('http://localhost:5000/api/admin/chart-data').then(r => r.json()).catch(()=>[]),
                fetch('http://localhost:5000/api/admin/demographics').then(r => r.json()).catch(()=>({genders:[], registrations:[]}))
            ]);
            
            if(st.totalUsers) setStats(st);
            if(Array.isArray(us)) setUsers(us);
            if(Array.isArray(ch)) setChartData(ch.map(i => ({ ...i, date: i.date?.substring(5).replace('-','/') || '' })));
            if(dem.genders) {
                const genderMap = { 'Nam': 0, 'Nữ': 0 };
                dem.genders.forEach(g => { if(g.Gender) genderMap[g.Gender] = g.count; });
                setDemographics({ 
                    genders: [{ name: 'Nam', count: genderMap['Nam'] }, { name: 'Nữ', count: genderMap['Nữ'] }], 
                    registrations: dem.registrations.map(i => ({...i, date: i.date?.substring(5).replace('-','/') || '' })) 
                });
            }
        } finally { setLoading(false); }
    };

    // USER LOGIC
    const currentYear = new Date().getFullYear();
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            if (userFilter.gender !== 'all' && u.Gender !== userFilter.gender) return false;
            const age = currentYear - u.BirthYear;
            if (userFilter.age === 'under18' && age >= 18) return false;
            if (userFilter.age === '18to30' && (age < 18 || age > 30)) return false;
            if (userFilter.age === 'over30' && age <= 30) return false;
            return true;
        });
    }, [users, userFilter]);

    const totalPages = Math.ceil(filteredUsers.length / userPageSize);
    const currentUsersToShow = filteredUsers.slice((userCurrentPage - 1) * userPageSize, userCurrentPage * userPageSize);
    useEffect(() => { setUserCurrentPage(1); }, [userFilter, userPageSize]);

    const handleToggleStatus = async (user) => {
        if (user.Role === 'admin') return alert("Không thể khóa Admin!");
        if (user.Status === 'banned') {
            if(!window.confirm("Mở khóa tài khoản này?")) return;
            await executeBan(user.UserID, 'active', '');
        } else {
            setBanModal({ isOpen: true, user: user, reason: '' });
        }
    };
    const executeBan = async (userId, status, reason) => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, reason })
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.UserID === userId ? { ...u, Status: status, BanReason: reason } : u));
                setBanModal({ isOpen: false, user: null, reason: '' });
            }
        } catch (e) {}
    };

    // SEARCH & TRENDING LOGIC
    const handleSearch = async () => {
        if(!searchQuery) return;
        try {
            const res = await fetch(`http://localhost:5000/api/search?q=${searchQuery}`);
            const data = await res.json();
            setSearchResults(activeTab === 'movies' ? data.movies : data.songs);
        } catch(e) {}
    };

    const loadTrending = async (type) => {
        const res = await fetch(`http://localhost:5000/api/admin/trending/${type}`);
        if(res.ok) setTrendingList(await res.json());
    };

    // FIX LỖI GẮN TRENDING: Đảm bảo Image không bao giờ null
    const addToTrending = async (item) => {
        const targetId = activeTab === 'movies' ? item.id : (item.videoId || item.videoID || item.id);
        if(!targetId) return alert("Lỗi: Không tìm thấy ID tác phẩm!");

        let imageUrl = 'https://via.placeholder.com/200x300?text=No+Image';
        if (activeTab === 'movies' && item.poster_path) {
            imageUrl = `https://image.tmdb.org/t/p/w200${item.poster_path}`;
        } else if (activeTab === 'songs') {
            imageUrl = item.thumbnails?.[0]?.url || item.thumbnail || item.image || `https://img.youtube.com/vi/${targetId}/hqdefault.jpg`;
        }

        const payload = {
            itemId: String(targetId), 
            itemType: activeTab === 'movies' ? 'movie' : 'song',
            itemTitle: item.title || item.Title || item.name || 'Unknown Title',
            itemImage: imageUrl
        };

        try {
            const res = await fetch('http://localhost:5000/api/admin/trending', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            const data = await res.json();
            if(data.success) { alert("Thêm thành công!"); loadTrending(payload.itemType); }
            else alert(data.message);
        } catch(e) {}
    };

    const removeFromTrending = async (id, type) => {
        if(!window.confirm("Bỏ tác phẩm này khỏi Trending?")) return;
        await fetch(`http://localhost:5000/api/admin/trending/${id}`, { method: 'DELETE' });
        loadTrending(type);
    };

    // TẢI TOP ITEMS VÀ DỊCH ID SANG TÊN
    const loadTopItems = async (type) => {
        const res = await fetch(`http://localhost:5000/api/admin/top-items/${type}`);
        if(res.ok) {
            const rawData = await res.json();
            
            // Dịch ID thành Tên bằng cách gọi API TMDB/YouTube
            const dataWithNames = await Promise.all(rawData.map(async (item) => {
                let name = "Đang tải...";
                try {
                    if(type === 'movie') {
                        const mRes = await fetch(`${BASE_URL}/movie/${item.ItemID}?api_key=${API_KEY}&language=vi-VN`);
                        const mData = await mRes.json();
                        name = mData.title || item.ItemID;
                    } else {
                        const sRes = await fetchSongDetailAI(item.ItemID);
                        name = sRes?.info?.videoDetails?.title || item.ItemID;
                    }
                } catch(e) { name = item.ItemID; }
                return { ...item, ItemName: name };
            }));
            setTopItems(dataWithNames);
        }
    };


    if (loading) return <div className="loading-screen"><div className="modern-spinner"></div></div>;

    const renderContent = () => {
        if (activeTab === 'overview') {
            return (
                <div className="animate-fade-up">
                    <h1 style={{ margin: '0 0 30px 0', fontSize: '2.5rem', fontWeight: '900' }}>BẢNG ĐIỀU KHIỂN</h1>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginBottom: '40px' }}>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(29, 185, 84, 0.2)', color: '#1db954' }}>👥</div>
                            <div><div className="stat-title">TỔNG NGƯỜI DÙNG</div><div className="stat-value">{stats?.totalUsers || 0}</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(229, 9, 20, 0.2)', color: '#e50914' }}>🔥</div>
                            <div><div className="stat-title">LƯỢT TƯƠNG TÁC</div><div className="stat-value">{stats?.totalInteractions || 0}</div></div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginBottom: '40px' }}>
                        <div className="admin-box">
                            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', textAlign: 'center' }}>📊 Tỉ lệ Giới tính</h2>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={demographics.genders} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                                            {demographics.genders.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '10px' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="admin-box">
                            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.2rem' }}>📈 Tốc độ tăng trưởng User Mới</h2>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer>
                                    <BarChart data={demographics.registrations}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                        <XAxis dataKey="date" stroke="#888" tick={{fontSize: 12}} />
                                        <YAxis stroke="#888" allowDecimals={false} />
                                        <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '10px' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                        <Bar dataKey="count" name="Thành viên mới" fill="#00bcd4" radius={[5, 5, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'users') {
            return (
                <div className="animate-fade-up">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: '#00bcd4' }}>👥 QUẢN LÝ NGƯỜI DÙNG</h1>
                    </div>
                    <div className="admin-box" style={{ padding: '20px', marginBottom: '30px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <select className="modern-select" value={userFilter.gender} onChange={e => setUserFilter({...userFilter, gender: e.target.value})}><option value="all">Tất cả Giới tính</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select>
                        <select className="modern-select" value={userFilter.age} onChange={e => setUserFilter({...userFilter, age: e.target.value})}><option value="all">Tất cả Độ tuổi</option><option value="under18">Dưới 18</option><option value="18to30">18 - 30</option><option value="over30">Trên 30</option></select>
                        <div style={{ flex: 1 }}></div>
                        <select className="modern-select" value={userPageSize} onChange={e => setUserPageSize(Number(e.target.value))}><option value={10}>10 dòng / trang</option><option value={20}>20 dòng</option><option value={50}>50 dòng</option></select>
                    </div>

                    <div className="admin-box">
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', color: '#888' }}>
                                    <th style={{ padding: '15px 10px' }}>STT</th><th style={{ padding: '15px 10px' }}>Tài khoản</th>
                                    <th style={{ padding: '15px 10px' }}>Thông tin</th><th style={{ padding: '15px 10px' }}>Trạng thái</th>
                                    <th style={{ padding: '15px 10px', textAlign: 'center' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsersToShow.map((u, idx) => (
                                    <tr key={u.UserID} className="table-row">
                                        <td style={{ padding: '15px 10px', color: '#555', fontWeight: 'bold' }}>{(userCurrentPage-1)*userPageSize + idx + 1}</td>
                                        <td style={{ padding: '15px 10px' }}>
                                            <div style={{ fontWeight: 'bold', color: 'white' }}>{u.Username}</div>
                                            <div style={{ color: '#666', fontSize: '0.8rem' }}>{u.Role?.toUpperCase() || 'USER'}</div>
                                        </td>
                                        <td style={{ padding: '15px 10px' }}>
                                            <div style={{ color: '#ccc' }}>{u.FullName}</div>
                                            <div style={{ color: '#888', fontSize: '0.85rem' }}>{u.Gender} • {currentYear - u.BirthYear} tuổi</div>
                                        </td>
                                        <td style={{ padding: '15px 10px' }}>
                                            {u.Status === 'banned' ? (<div><span className="status-badge status-banned">BỊ KHÓA</span><br/><small style={{color:'#ff4d4d'}}>{u.BanReason}</small></div>) : <span className="status-badge status-active">HOẠT ĐỘNG</span>}
                                        </td>
                                        <td style={{ padding: '15px 10px', textAlign: 'center' }}>
                                            <button className={`action-btn ${u.Status === 'banned' ? 'btn-unlock' : 'btn-ban'}`} onClick={() => handleToggleStatus(u)} disabled={u.Role === 'admin'}>
                                                {u.Status === 'banned' ? 'Mở Khóa' : 'Khóa Acc'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                                {[...Array(totalPages)].map((_, i) => (<button key={i} className={`page-btn ${userCurrentPage === i + 1 ? 'page-active' : ''}`} onClick={() => setUserCurrentPage(i + 1)}>{i + 1}</button>))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (activeTab === 'movies' || activeTab === 'songs') {
            const isMovie = activeTab === 'movies';
            const color = isMovie ? '#e50914' : '#1db954';
            return (
                <div className="animate-fade-up">
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', color: color }}>
                        {isMovie ? '🎬 QUẢN LÝ PHIM' : '🎵 QUẢN LÝ NHẠC'}
                    </h1>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                        <div className="admin-box" style={{ borderTop: `4px solid ${color}` }}>
                            <h2 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>🔍 Gắn Tag Trending (Trang Chủ)</h2>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <input type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder={`Nhập tên ${isMovie ? 'phim' : 'bài hát'}...`} className="modern-input" style={{marginBottom: 0}} />
                                <button onClick={handleSearch} className="action-btn" style={{ background: color, color: 'white' }}>Tìm</button>
                            </div>
                            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                {searchResults.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderBottom: '1px solid #333' }}>
                                        <img src={isMovie ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : (item.thumbnails?.[0]?.url || item.thumbnail)} alt="" style={{width: 40, height: 40, borderRadius: 5, objectFit: 'cover'}}/>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.Title || item.title || item.name}</div>
                                        </div>
                                        <button onClick={() => addToTrending(item)} className="action-btn" style={{ fontSize: '0.8rem', padding: '5px 10px', border: `1px solid ${color}`, color: color }}>Gắn</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="admin-box" style={{ borderTop: `4px solid #ff9800` }}>
                            <h2 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>🌟 Đang xuất hiện trên Web</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                                {trendingList.map((t, idx) => (
                                    <div key={t.ID} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#888' }}>#{idx+1}</div>
                                        <img src={t.ItemImage} alt="" style={{ width: '40px', height: '40px', borderRadius: '5px', objectFit: 'cover' }} />
                                        <div style={{ flex: 1, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.ItemTitle}</div>
                                        <button onClick={() => removeFromTrending(t.ID, isMovie ? 'movie' : 'song')} className="action-btn btn-ban" style={{ padding: '5px 10px' }}>Gỡ</button>
                                    </div>
                                ))}
                                {trendingList.length === 0 && <div style={{ color: '#888' }}>Chưa có tác phẩm Trending tự cấu hình.</div>}
                            </div>
                        </div>
                    </div>

                    <div className="admin-box">
                        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', color: color }}>🔥 TOP 20 TÁC PHẨM ĐƯỢC XEM NHIỀU NHẤT</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', color: '#888' }}>
                                    <th style={{ padding: '15px 10px', width: '60px' }}>Rank</th>
                                    {/* 🟢 ĐÃ THÊM CỘT TÊN TÁC PHẨM */}
                                    <th style={{ padding: '15px 10px' }}>Tên Tác Phẩm</th>
                                    <th style={{ padding: '15px 10px' }}>ID</th>
                                    <th style={{ padding: '15px 10px', textAlign: 'center' }}>Lượt Xem</th>
                                    <th style={{ padding: '15px 10px', textAlign: 'center' }}>Lượt Thích</th>
                                    <th style={{ padding: '15px 10px', textAlign: 'center' }}>Đánh giá</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topItems.map((item, idx) => (
                                    <tr key={idx} className="table-row">
                                        <td style={{ padding: '15px 10px', fontSize: '1.5rem', fontWeight: '900', color: idx < 3 ? color : '#666' }}>#{idx+1}</td>
                                        <td style={{ padding: '15px 10px', fontWeight: 'bold', color: 'white' }}>
                                            {item.ItemName}
                                        </td>
                                        <td style={{ padding: '15px 10px', color: '#888', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                            <a href={`/${isMovie ? 'movie' : 'song'}/${item.ItemID}`} target="_blank" style={{color: '#00bcd4', textDecoration: 'none'}}>{item.ItemID}</a>
                                        </td>
                                        <td style={{ padding: '15px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>{item.TotalViews} 👁️</td>
                                        <td style={{ padding: '15px 10px', textAlign: 'center', color: '#1db954', fontWeight: 'bold' }}>{item.TotalLikes} ❤️</td>
                                        <td style={{ padding: '15px 10px', textAlign: 'center', color: '#ffc107', fontWeight: 'bold' }}>{item.AvgRating ? item.AvgRating.toFixed(1) : '0.0'} ⭐</td>
                                    </tr>
                                ))}
                                {topItems.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>Chưa có dữ liệu tương tác.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
    };

    return (
        <div style={{ height: '100vh', background: '#0a0a0a', color: 'white', display: 'flex', overflow: 'hidden' }}>
            {banModal.isOpen && (
                <div className="modal-overlay animate-fade-up">
                    <div className="modal-box">
                        <h2 style={{ color: '#ff4d4d', marginTop: 0 }}>Khóa tài khoản {banModal.user?.Username}</h2>
                        <textarea className="modern-input" rows="4" placeholder="Nhập lý do khóa..." value={banModal.reason} onChange={e => setBanModal({...banModal, reason: e.target.value})}></textarea>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                            <button className="page-btn" onClick={() => setBanModal({isOpen: false, user: null, reason: ''})}>Hủy</button>
                            <button className="action-btn btn-ban" onClick={() => executeBan(banModal.user.UserID, 'banned', banModal.reason)}>Khóa</button>
                        </div>
                    </div>
                </div>
            )}
            <div style={{ width: '260px', background: 'rgba(15,15,15,0.9)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 10 }}>
                <h2 style={{ color: 'white', paddingBottom: '20px', margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><span style={{ color: '#00bcd4' }}>⬢</span> ADMIN</h2>
                <button onClick={() => setActiveTab('overview')} className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}>📊 Tổng quan</button>
                <button onClick={() => setActiveTab('users')} className={`nav-btn ${activeTab === 'users' ? 'active-users' : ''}`}>👥 Quản lý User</button>
                <button onClick={() => setActiveTab('movies')} className={`nav-btn ${activeTab === 'movies' ? 'active-movies' : ''}`}>🎬 Quản lý Phim</button>
                <button onClick={() => setActiveTab('songs')} className={`nav-btn ${activeTab === 'songs' ? 'active-songs' : ''}`}>🎵 Quản lý Nhạc</button>
                <div style={{ flex: 1 }}></div>
                <button className="logout-btn" onClick={() => { localStorage.removeItem('currentUser'); window.location.href='/login'; }}>🚪 Đăng xuất</button>
            </div>
            <div style={{ flex: 1, padding: '40px 50px', overflowY: 'auto', background: 'radial-gradient(circle at top right, rgba(229, 9, 20, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(29, 185, 84, 0.05), transparent 40%)' }}>
                {renderContent()}
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                .modern-select { background: #111; color: white; border: 1px solid #333; padding: 10px 15px; border-radius: 8px; outline: none; }
                .modern-input { background: #111; color: white; border: 1px solid #333; padding: 12px; border-radius: 8px; outline: none; width: 100%; box-sizing: border-box; margin-bottom:10px; }
                .nav-btn { padding: 15px; background: transparent; border: none; color: #888; text-align: left; font-weight: bold; border-radius: 12px; cursor: pointer; transition: 0.3s; }
                .nav-btn:hover { background: rgba(255,255,255,0.05); color: white; transform: translateX(5px); }
                .active { background: linear-gradient(90deg, rgba(255, 193, 7, 0.2), transparent); color: #ffc107; border-left: 4px solid #ffc107; }
                .active-users { background: linear-gradient(90deg, rgba(0, 188, 212, 0.2), transparent); color: #00bcd4; border-left: 4px solid #00bcd4; }
                .active-movies { background: linear-gradient(90deg, rgba(229, 9, 20, 0.2), transparent); color: #e50914; border-left: 4px solid #e50914; }
                .active-songs { background: linear-gradient(90deg, rgba(29, 185, 84, 0.2), transparent); color: #1db954; border-left: 4px solid #1db954; }

                .action-btn { padding: 8px 15px; border-radius: 8px; font-weight: bold; border: none; cursor: pointer; transition: 0.2s; background: transparent; }
                .action-btn:active { transform: scale(0.95); }
                .btn-ban { border: 1px solid #ff4d4d; color: #ff4d4d; } .btn-ban:hover { background: #ff4d4d; color: white; }
                .btn-unlock { border: 1px solid #1db954; color: #1db954; } .btn-unlock:hover { background: #1db954; color: white; }

                .status-badge { padding: 5px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: bold; }
                .status-active { color: #1db954; background: rgba(29, 185, 84, 0.1); }
                .status-banned { color: #ff4d4d; background: rgba(255, 77, 77, 0.1); }
                
                .page-btn { padding: 8px 15px; background: #222; color: #aaa; border: none; border-radius: 8px; cursor: pointer; transition: 0.2s; }
                .page-btn:hover { background: #444; color: white; }
                .page-active { background: #00bcd4; color: black; }

                .admin-box { background: rgba(20,20,20,0.8); backdrop-filter: blur(10px); border-radius: 20px; padding: 30px; border: 1px solid rgba(255,255,255,0.05); }
                .table-row { border-bottom: 1px solid rgba(255,255,255,0.05); transition: 0.3s; } .table-row:hover { background: rgba(255,255,255,0.03); }
                .stat-card { background: rgba(20,20,20,0.8); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 25px; display: flex; align-items: center; gap: 20px; }
                .stat-icon { width: 60px; height: 60px; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 2rem; }
                .stat-title { color: #888; font-size: 0.85rem; font-weight: bold; margin-bottom: 5px; } .stat-value { font-size: 2.5rem; font-weight: 900; }
                .logout-btn { padding: 15px; background: rgba(255,77,77,0.1); border: 1px solid rgba(255,77,77,0.3); color: #ff4d4d; font-weight: bold; border-radius: 12px; cursor: pointer; }
                .logout-btn:hover { background: #ff4d4d; color: white; }

                .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-box { background: #111; padding: 30px; border-radius: 20px; border: 1px solid #333; width: 400px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }

                @keyframes fadeUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-up { animation: fadeUp 0.4s ease-out forwards; }
                .loading-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0a0a; }
                .modern-spinner { width: 50px; height: 50px; border-radius: 50%; border: 3px solid #00bcd4; border-top-color: transparent; animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}} />
        </div>
    );
};

export default AdminDashboard;