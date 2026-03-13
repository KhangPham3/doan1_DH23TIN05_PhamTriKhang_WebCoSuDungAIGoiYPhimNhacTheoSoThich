import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users'); // Mặc định mở tab Users để xem trước
    const [stats, setStats] = useState({ totalUsers: 0, totalInteractions: 0 });
    const [users, setUsers] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

    // --- CÁC STATE CHO PHÂN TRANG VÀ LỌC USER ---
    const [userFilter, setUserFilter] = useState({ gender: 'all', age: 'all' });
    const [userPageSize, setUserPageSize] = useState(10);
    const [userCurrentPage, setUserCurrentPage] = useState(1);

    // Fetch dữ liệu tổng
    useEffect(() => {
        if (currentUser?.role !== 'admin') {
            window.location.href = '/';
            return;
        }

        const fetchAdminData = async () => {
            try {
                try {
                    const statsRes = await fetch('http://localhost:5000/api/admin/stats');
                    if (statsRes.ok) setStats(await statsRes.json());
                } catch (e) {}

                try {
                    const usersRes = await fetch('http://localhost:5000/api/admin/users');
                    if (usersRes.ok) {
                        const uData = await usersRes.json();
                        setUsers(Array.isArray(uData) ? uData : []);
                    }
                } catch (e) {}

                try {
                    const chartRes = await fetch('http://localhost:5000/api/admin/chart-data');
                    if (chartRes.ok) {
                        const cData = await chartRes.json();
                        if (Array.isArray(cData)) {
                            const formattedChart = cData.map(item => ({
                                ...item,
                                date: item.date ? String(item.date).split('-').slice(1).join('/') : 'N/A'
                            }));
                            setChartData(formattedChart);
                        }
                    }
                } catch (e) {}

            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [currentUser?.role]);


    // ==========================================
    // LOGIC XỬ LÝ LỌC VÀ PHÂN TRANG USER
    // ==========================================
    const currentYear = new Date().getFullYear();

    // 1. Lọc danh sách Users bằng useMemo (để tối ưu hiệu suất)
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            // Lọc giới tính
            if (userFilter.gender !== 'all' && u.Gender !== userFilter.gender) return false;
            
            // Lọc độ tuổi
            const age = currentYear - u.BirthYear;
            if (userFilter.age === 'under18' && age >= 18) return false;
            if (userFilter.age === '18to30' && (age < 18 || age > 30)) return false;
            if (userFilter.age === 'over30' && age <= 30) return false;

            return true;
        });
    }, [users, userFilter, currentYear]);

    // 2. Tính toán phân trang
    const totalPages = Math.ceil(filteredUsers.length / userPageSize);
    const indexOfLastUser = userCurrentPage * userPageSize;
    const indexOfFirstUser = indexOfLastUser - userPageSize;
    const currentUsersToShow = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

    // Reset về trang 1 nếu thay đổi bộ lọc
    useEffect(() => { setUserCurrentPage(1); }, [userFilter, userPageSize]);

    // 3. API Gọi khóa/Mở khóa User
    const handleToggleStatus = async (userId, currentStatus, role) => {
        if (role === 'admin') return alert("Không thể khóa tài khoản Admin khác!");
        
        const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
        const confirmMsg = newStatus === 'banned' ? "Bạn có chắc chắn muốn KHÓA tài khoản này?" : "Mở khóa tài khoản này?";
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                // Cập nhật lại UI không cần reload trang
                setUsers(prev => prev.map(u => u.UserID === userId ? { ...u, Status: newStatus } : u));
            }
        } catch (err) {
            alert("Lỗi khi cập nhật trạng thái!");
        }
    };


    // ==========================================
    // RENDER GIAO DIỆN CÁC TAB
    // ==========================================
    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
            <div className="modern-spinner" style={{ borderColor: '#e50914 transparent #e50914 transparent' }}></div>
        </div>
    );

    const renderContent = () => {
        
        // --- TAB 1: QUẢN LÝ USER ---
        if (activeTab === 'users') {
            return (
                <div className="animate-fade-up">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: '#00bcd4' }}>👥 QUẢN LÝ NGƯỜI DÙNG</h1>
                        <div style={{ color: '#888' }}>Tổng số: <strong style={{ color: 'white' }}>{filteredUsers.length}</strong> user</div>
                    </div>

                    {/* CONTROL PANEL: BỘ LỌC & HIỂN THỊ */}
                    <div className="admin-box" style={{ padding: '20px', marginBottom: '30px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#aaa', fontWeight: 'bold' }}>Giới tính:</span>
                            <select className="modern-select" value={userFilter.gender} onChange={(e) => setUserFilter({...userFilter, gender: e.target.value})}>
                                <option value="all">Tất cả</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#aaa', fontWeight: 'bold' }}>Độ tuổi:</span>
                            <select className="modern-select" value={userFilter.age} onChange={(e) => setUserFilter({...userFilter, age: e.target.value})}>
                                <option value="all">Tất cả</option>
                                <option value="under18">Dưới 18 tuổi</option>
                                <option value="18to30">18 - 30 tuổi</option>
                                <option value="over30">Trên 30 tuổi</option>
                            </select>
                        </div>

                        <div style={{ flex: 1 }}></div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#aaa', fontWeight: 'bold' }}>Hiển thị:</span>
                            <select className="modern-select" value={userPageSize} onChange={(e) => setUserPageSize(Number(e.target.value))}>
                                <option value={10}>10 dòng / trang</option>
                                <option value={20}>20 dòng / trang</option>
                                <option value={50}>50 dòng / trang</option>
                            </select>
                        </div>
                    </div>

                    {/* BẢNG NGƯỜI DÙNG */}
                    <div className="admin-box">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', color: '#888' }}>
                                        <th style={{ padding: '15px 10px', width: '50px' }}>STT</th>
                                        <th style={{ padding: '15px 10px' }}>Tài khoản</th>
                                        <th style={{ padding: '15px 10px' }}>Thông tin</th>
                                        <th style={{ padding: '15px 10px', textAlign: 'center' }}>Vai trò</th>
                                        <th style={{ padding: '15px 10px', textAlign: 'center' }}>Trạng thái</th>
                                        <th style={{ padding: '15px 10px', textAlign: 'center' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentUsersToShow.map((u, index) => (
                                        <tr key={u.UserID} className="table-row">
                                            <td style={{ padding: '15px 10px', color: '#555', fontWeight: 'bold' }}>
                                                {indexOfFirstUser + index + 1}
                                            </td>
                                            <td style={{ padding: '15px 10px' }}>
                                                <div style={{ fontWeight: 'bold', color: 'white', fontSize: '1.1rem' }}>{u.Username}</div>
                                                <div style={{ color: '#666', fontSize: '0.8rem' }}>ID: #{u.UserID}</div>
                                            </td>
                                            <td style={{ padding: '15px 10px' }}>
                                                <div style={{ color: '#ccc' }}>{u.FullName}</div>
                                                <div style={{ color: '#888', fontSize: '0.85rem' }}>{u.Gender} • {currentYear - u.BirthYear} tuổi</div>
                                            </td>
                                            <td style={{ padding: '15px 10px', textAlign: 'center' }}>
                                                <span className={`role-badge ${u.Role === 'admin' ? 'role-admin' : 'role-user'}`}>
                                                    {u.Role?.toUpperCase() || 'USER'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px 10px', textAlign: 'center' }}>
                                                <span className={`status-badge ${u.Status === 'banned' ? 'status-banned' : 'status-active'}`}>
                                                    {u.Status === 'banned' ? 'BỊ KHÓA ❌' : 'HOẠT ĐỘNG 🟢'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px 10px', textAlign: 'center' }}>
                                                <button 
                                                    className={`action-btn ${u.Status === 'banned' ? 'btn-unlock' : 'btn-ban'}`}
                                                    onClick={() => handleToggleStatus(u.UserID, u.Status, u.Role)}
                                                    disabled={u.Role === 'admin'}
                                                    style={{ opacity: u.Role === 'admin' ? 0.3 : 1, cursor: u.Role === 'admin' ? 'not-allowed' : 'pointer' }}
                                                >
                                                    {u.Status === 'banned' ? 'Mở Khóa' : 'Khóa Acc'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {currentUsersToShow.length === 0 && (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Không tìm thấy người dùng nào phù hợp.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* THANH PHÂN TRANG (PAGINATION) */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
                                <button className="page-btn" disabled={userCurrentPage === 1} onClick={() => setUserCurrentPage(p => p - 1)}>« Trước</button>
                                
                                {[...Array(totalPages)].map((_, i) => (
                                    <button 
                                        key={i} 
                                        className={`page-btn ${userCurrentPage === i + 1 ? 'page-active' : ''}`}
                                        onClick={() => setUserCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button className="page-btn" disabled={userCurrentPage === totalPages} onClick={() => setUserCurrentPage(p => p + 1)}>Sau »</button>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // --- TAB 2 & 3: QUẢN LÝ PHIM / NHẠC (MOCKUP CHỨC NĂNG) ---
        if (activeTab === 'movies' || activeTab === 'songs') {
            const isMovie = activeTab === 'movies';
            const color = isMovie ? '#e50914' : '#1db954';
            return (
                <div className="animate-fade-up">
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', color: color }}>
                        {isMovie ? '🎬 QUẢN LÝ PHIM & GỢI Ý TRENDING' : '🎵 QUẢN LÝ NHẠC & GỢI Ý TRENDING'}
                    </h1>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        {/* Box 1: Đẩy lên Trending */}
                        <div className="admin-box" style={{ borderTop: `4px solid ${color}` }}>
                            <h2 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>🌟 Gắn thẻ Trending (Hero Section)</h2>
                            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>Nhập ID của {isMovie ? 'Phim' : 'Bài Hát'} để ép hệ thống đưa tác phẩm này lên làm gợi ý hàng đầu trên Banner Trang chủ.</p>
                            
                            <input type="text" placeholder={`Nhập ID ${isMovie ? 'TMDB' : 'YouTube'}...`} className="modern-input" />
                            <button className="action-btn" style={{ background: color, color: 'white', marginTop: '15px', width: '100%' }}>Gắn lên Trending</button>
                        </div>

                        {/* Box 2: Khóa tác phẩm */}
                        <div className="admin-box" style={{ borderTop: `4px solid #ff9800` }}>
                            <h2 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>🗑️ Ẩn / Chặn Tác phẩm</h2>
                            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>Chặn tác phẩm vi phạm bản quyền hoặc nội dung xấu để người dùng không thể tìm kiếm hay xem được.</p>
                            
                            <input type="text" placeholder={`Nhập ID ${isMovie ? 'TMDB' : 'YouTube'} cần chặn...`} className="modern-input" />
                            <button className="action-btn btn-ban" style={{ marginTop: '15px', width: '100%' }}>Đưa vào Blacklist</button>
                        </div>
                    </div>
                </div>
            );
        }

        // --- TAB 0: TỔNG QUAN (CHART) ---
        return (
            <div className="animate-fade-up">
                <h1 style={{ margin: '0 0 30px 0', fontSize: '2.5rem', fontWeight: '900' }}>BẢNG ĐIỀU KHIỂN</h1>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginBottom: '40px' }}>
                    <div className="stat-card" onClick={() => setActiveTab('users')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon" style={{ background: 'rgba(29, 185, 84, 0.2)', color: '#1db954' }}>👥</div>
                        <div>
                            <div className="stat-title">TỔNG NGƯỜI DÙNG</div>
                            <div className="stat-value">{stats?.totalUsers || 0}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(229, 9, 20, 0.2)', color: '#e50914' }}>🔥</div>
                        <div>
                            <div className="stat-title">LƯỢT TƯƠNG TÁC</div>
                            <div className="stat-value">{stats?.totalInteractions || 0}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(0, 188, 212, 0.2)', color: '#00bcd4' }}>🤖</div>
                        <div>
                            <div className="stat-title">TRẠNG THÁI AI</div>
                            <div className="stat-value" style={{ color: '#00bcd4', fontSize: '1.5rem' }}>ĐANG HOẠT ĐỘNG</div>
                        </div>
                    </div>
                </div>

                <div className="admin-box">
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>📈 Lưu lượng tương tác 7 ngày qua</h2>
                    <div style={{ width: '100%', height: '400px' }}>
                        <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} />
                                <YAxis stroke="#888" tick={{ fill: '#888' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', backdropFilter: 'blur(10px)' }} 
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line type="monotone" name="Lượt xem Phim" dataKey="movie" stroke="#e50914" strokeWidth={4} activeDot={{ r: 8, fill: '#e50914', stroke: 'white', strokeWidth: 2 }} animationDuration={1500} />
                                <Line type="monotone" name="Lượt nghe Nhạc" dataKey="song" stroke="#1db954" strokeWidth={4} activeDot={{ r: 8, fill: '#1db954', stroke: 'white', strokeWidth: 2 }} animationDuration={1500} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ height: '100vh', background: '#0a0a0a', color: 'white', display: 'flex', overflow: 'hidden' }}>
            
            {/* SIDEBAR BÊN TRÁI */}
            <div style={{ width: '260px', background: 'rgba(15,15,15,0.9)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 10 }}>
                <h2 style={{ color: 'white', paddingBottom: '20px', margin: '0 0 10px 0', fontWeight: '900', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: '#00bcd4', marginRight: '10px' }}>⬢</span> ADMIN 
                </h2>
                
                <button onClick={() => setActiveTab('overview')} className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}>📊 Tổng quan</button>
                <button onClick={() => setActiveTab('users')} className={`nav-btn ${activeTab === 'users' ? 'active-users' : ''}`}>👥 Quản lý Người dùng</button>
                <button onClick={() => setActiveTab('movies')} className={`nav-btn ${activeTab === 'movies' ? 'active-movies' : ''}`}>🎬 Quản lý Phim</button>
                <button onClick={() => setActiveTab('songs')} className={`nav-btn ${activeTab === 'songs' ? 'active-songs' : ''}`}>🎵 Quản lý Nhạc</button>
                
                <div style={{ flex: 1 }}></div>
                
                <button className="logout-btn" onClick={() => { localStorage.removeItem('currentUser'); window.location.href='/login'; }}>
                    🚪 Đăng xuất
                </button>
            </div>

            {/* NỘI DUNG CHÍNH BÊN PHẢI */}
            <div style={{ flex: 1, padding: '40px 50px', overflowY: 'auto', boxSizing: 'border-box', background: 'radial-gradient(circle at top right, rgba(229, 9, 20, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(29, 185, 84, 0.05), transparent 40%)' }}>
                {renderContent()}
            </div>

            {/* CSS TÍCH HỢP */}
            <style dangerouslySetInnerHTML={{__html: `
                /* CSS Form Elements */
                .modern-select { background: #111; color: white; border: 1px solid #333; padding: 10px 15px; border-radius: 8px; outline: none; cursor: pointer; font-size: 0.9rem; transition: border 0.3s; }
                .modern-select:hover { border-color: #666; }
                .modern-input { background: #111; color: white; border: 1px solid #333; padding: 15px; border-radius: 8px; outline: none; width: 100%; box-sizing: border-box; font-size: 1rem; transition: border 0.3s; }
                .modern-input:focus { border-color: #00bcd4; }

                /* CSS Buttons */
                .nav-btn { padding: 15px; background: transparent; border: none; color: #888; text-align: left; font-size: 1rem; font-weight: bold; border-radius: 12px; cursor: pointer; transition: all 0.3s; }
                .nav-btn:hover { background: rgba(255,255,255,0.05); color: white; transform: translateX(5px); }
                .active { background: linear-gradient(90deg, rgba(255, 193, 7, 0.2), transparent); color: #ffc107; border-left: 4px solid #ffc107; }
                .active-users { background: linear-gradient(90deg, rgba(0, 188, 212, 0.2), transparent); color: #00bcd4; border-left: 4px solid #00bcd4; }
                .active-movies { background: linear-gradient(90deg, rgba(229, 9, 20, 0.2), transparent); color: #e50914; border-left: 4px solid #e50914; }
                .active-songs { background: linear-gradient(90deg, rgba(29, 185, 84, 0.2), transparent); color: #1db954; border-left: 4px solid #1db954; }

                .action-btn { padding: 8px 15px; border-radius: 8px; font-weight: bold; border: none; cursor: pointer; transition: all 0.2s; }
                .action-btn:active { transform: scale(0.95); }
                .btn-ban { background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; }
                .btn-ban:hover { background: #ff4d4d; color: white; box-shadow: 0 0 10px rgba(255,77,77,0.5); }
                .btn-unlock { background: transparent; border: 1px solid #1db954; color: #1db954; }
                .btn-unlock:hover { background: #1db954; color: white; box-shadow: 0 0 10px rgba(29,185,84,0.5); }

                /* CSS Table Badges */
                .role-badge { padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 900; letter-spacing: 1px; }
                .role-admin { background: rgba(255, 193, 7, 0.2); color: #ffc107; border: 1px solid #ffc107; }
                .role-user { background: rgba(255, 255, 255, 0.1); color: #ccc; border: 1px solid #555; }
                
                .status-badge { padding: 5px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: bold; }
                .status-active { color: #1db954; background: rgba(29, 185, 84, 0.1); }
                .status-banned { color: #ff4d4d; background: rgba(255, 77, 77, 0.1); text-decoration: line-through; }

                /* CSS Pagination */
                .page-btn { padding: 10px 15px; background: rgba(255,255,255,0.05); color: #aaa; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s; }
                .page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.15); color: white; }
                .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .page-active { background: #00bcd4; color: black !important; }

                /* CSS General */
                .admin-box { background: rgba(20,20,20,0.8); backdrop-filter: blur(10px); border-radius: 20px; padding: 30px; border: 1px solid rgba(255,255,255,0.05); }
                .table-row { border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s; }
                .table-row:hover { background: rgba(255,255,255,0.03); }
                
                .stat-card { background: rgba(20,20,20,0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 25px; display: flex; align-items: center; gap: 20px; transition: all 0.3s; }
                .stat-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.5); border-color: rgba(255,255,255,0.15); }
                .stat-icon { width: 65px; height: 65px; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; }
                .stat-title { color: #888; font-size: 0.85rem; font-weight: bold; letter-spacing: 1px; margin-bottom: 5px; }
                .stat-value { font-size: 2.5rem; font-weight: 900; line-height: 1; }
                .logout-btn { padding: 15px; background: rgba(255,77,77,0.1); border: 1px solid rgba(255,77,77,0.3); color: #ff4d4d; font-weight: bold; border-radius: 12px; cursor: pointer; transition: all 0.3s; }
                .logout-btn:hover { background: #ff4d4d; color: white; }

                @keyframes fadeUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-up { animation: fadeUp 0.5s ease-out forwards; }
                .modern-spinner { width: 60px; height: 60px; border-radius: 50%; border: 4px solid; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}} />
        </div>
    );
};

export default AdminDashboard;