import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const [userData, setUserData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    // State cho Form Edit
    const [editForm, setEditForm] = useState({ fullName: '', birthYear: '', gender: '' });

    useEffect(() => {
        if (!currentUser) return window.location.href = '/login';
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/user/${currentUser.id}`);
            const data = await res.json();
            if (data.success) {
                setUserData(data.user);
                setEditForm({
                    fullName: data.user.FullName,
                    birthYear: data.user.BirthYear,
                    gender: data.user.Gender
                });
            }
        } catch (err) { console.error("Lỗi tải dữ liệu", err); }
        setLoading(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/user/${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            
            if (data.success) {
                alert("🎉 " + data.message);
                setUserData({ ...userData, FullName: editForm.fullName, BirthYear: editForm.birthYear, Gender: editForm.gender });
                
                // Cập nhật lại localStorage để header/nav nhận tên mới
                const updatedUser = { ...currentUser, fullName: editForm.fullName };
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                
                setIsEditing(false);
            } else {
                alert("❌ " + data.message); // Báo lỗi nếu < 16 tuổi
            }
        } catch (err) { alert("Lỗi kết nối máy chủ!"); }
    };

    if (loading) return <div style={{height: '100vh', background: '#0a0a0a'}}></div>;

    return (
        <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white', paddingTop: '80px', paddingBottom: '50px' }}>
            <div className="profile-container">
                
                {/* --- SIDEBAR ĐIỀU HƯỚNG --- */}
                <div className="profile-sidebar animate-fade-right">
                    <div className="avatar-section">
                        <div className="avatar-circle">
                            {userData?.FullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h2 className="user-name">{userData?.FullName}</h2>
                        <p className="user-role">Thành viên Hệ thống</p>
                    </div>

                    <div className="nav-menu">
                        <button className="nav-item active">👤 Hồ Sơ Cá Nhân</button>
                        <Link to="/watchlist" className="nav-item">🔖 Danh Sách Xem Sau</Link>
                        <Link to="/history" className="nav-item">🕒 Lịch Sử Tương Tác</Link>
                        <button className="nav-item logout" onClick={() => { localStorage.removeItem('currentUser'); window.location.href='/login'; }}>
                            🚪 Đăng Xuất
                        </button>
                    </div>
                </div>

                {/* --- MAIN CONTENT --- */}
                <div className="profile-main animate-fade-up">
                    
                    {/* BẢNG TÓM TẮT CHUYỂN HƯỚNG (PORTALS) */}
                    <div className="stats-grid">
                        <Link to="/watchlist" className="stat-card shine-effect">
                            <div className="stat-icon" style={{background: 'rgba(29, 185, 84, 0.2)', color: '#1db954'}}>🔖</div>
                            <div>
                                <h3>Xem Sau</h3>
                                <p>Quản lý phim & nhạc yêu thích</p>
                            </div>
                        </Link>
                        <Link to="/history" className="stat-card shine-effect">
                            <div className="stat-icon" style={{background: 'rgba(229, 9, 20, 0.2)', color: '#e50914'}}>🕒</div>
                            <div>
                                <h3>Lịch Sử</h3>
                                <p>Xem lại các tác phẩm đã thưởng thức</p>
                            </div>
                        </Link>
                    </div>

                    {/* THÔNG TIN TÀI KHOẢN */}
                    <div className="info-box">
                        <div className="box-header">
                            <h2 style={{margin: 0, fontSize: '1.5rem'}}>Thông Tin Tài Khoản</h2>
                            <button className="edit-toggle-btn" onClick={() => setIsEditing(!isEditing)}>
                                {isEditing ? 'Hủy' : '✏️ Chỉnh Sửa'}
                            </button>
                        </div>

                        {!isEditing ? (
                            <div className="info-grid animate-fade-up">
                                <div className="info-item">
                                    <label>Tên đăng nhập</label>
                                    <p>@{userData?.Username}</p>
                                </div>
                                <div className="info-item">
                                    <label>Email liên kết</label>
                                    <p>{userData?.Email}</p>
                                </div>
                                <div className="info-item">
                                    <label>Họ và Tên</label>
                                    <p>{userData?.FullName}</p>
                                </div>
                                <div className="info-item">
                                    <label>Năm sinh</label>
                                    <p>{userData?.BirthYear} ({new Date().getFullYear() - userData?.BirthYear} tuổi)</p>
                                </div>
                                <div className="info-item">
                                    <label>Giới tính</label>
                                    <p>{userData?.Gender}</p>
                                </div>
                                <div className="info-item">
                                    <label>Ngày tham gia</label>
                                    <p>{userData?.CreatedAt ? new Date(userData.CreatedAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdate} className="edit-form animate-slide-down">
                                <div className="input-group">
                                    <label>Họ và Tên</label>
                                    <input type="text" required value={editForm.fullName} onChange={(e) => setEditForm({...editForm, fullName: e.target.value})} className="modern-input" />
                                </div>
                                
                                <div style={{display: 'flex', gap: '20px'}}>
                                    <div className="input-group" style={{flex: 1}}>
                                        <label>Năm sinh (Tối thiểu 16 tuổi)</label>
                                        <input type="number" required value={editForm.birthYear} onChange={(e) => setEditForm({...editForm, birthYear: e.target.value})} className="modern-input" />
                                    </div>
                                    <div className="input-group" style={{flex: 1}}>
                                        <label>Giới tính</label>
                                        <select value={editForm.gender} onChange={(e) => setEditForm({...editForm, gender: e.target.value})} className="modern-input">
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" className="save-btn shine-effect">💾 Lưu Thay Đổi</button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .profile-container { display: flex; max-width: 1100px; margin: 0 auto; gap: 40px; padding: 20px; }
                @media (max-width: 800px) { .profile-container { flex-direction: column; } }

                /* SIDEBAR */
                .profile-sidebar { width: 300px; background: rgba(20,20,20,0.8); backdrop-filter: blur(10px); border-radius: 20px; padding: 30px; border: 1px solid rgba(255,255,255,0.05); height: fit-content; }
                .avatar-section { text-align: center; margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
                .avatar-circle { width: 100px; height: 100px; background: linear-gradient(45deg, #e50914, #b20710); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 900; box-shadow: 0 10px 25px rgba(229,9,20,0.4); }
                .user-name { font-size: 1.5rem; margin: 0 0 5px; }
                .user-role { color: #888; font-size: 0.9rem; margin: 0; }

                .nav-menu { display: flex; flex-direction: column; gap: 10px; }
                .nav-item { padding: 15px; border-radius: 12px; border: none; background: transparent; color: #aaa; font-weight: bold; text-align: left; cursor: pointer; text-decoration: none; transition: 0.3s; display: block; }
                .nav-item:hover { background: rgba(255,255,255,0.05); color: white; transform: translateX(5px); }
                .nav-item.active { background: rgba(0, 188, 212, 0.1); color: #00bcd4; border-left: 4px solid #00bcd4; }
                .nav-item.logout { color: #ff4d4d; margin-top: 20px; border: 1px solid rgba(255,77,77,0.2); text-align: center; }
                .nav-item.logout:hover { background: #ff4d4d; color: white; }

                /* MAIN CONTENT */
                .profile-main { flex: 1; display: flex; flex-direction: column; gap: 30px; }
                
                .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .stat-card { display: flex; align-items: center; gap: 20px; background: rgba(20,20,20,0.8); padding: 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); text-decoration: none; color: white; transition: 0.3s; position: relative; overflow: hidden; }
                .stat-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.2); box-shadow: 0 15px 30px rgba(0,0,0,0.5); }
                .stat-icon { width: 60px; height: 60px; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
                .stat-card h3 { margin: 0 0 5px; font-size: 1.3rem; }
                .stat-card p { margin: 0; color: #888; font-size: 0.9rem; }

                .info-box { background: rgba(20,20,20,0.8); backdrop-filter: blur(10px); padding: 40px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
                .box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; }
                .edit-toggle-btn { background: transparent; border: 1px solid #aaa; color: #ccc; padding: 8px 20px; border-radius: 20px; cursor: pointer; font-weight: bold; transition: 0.3s; }
                .edit-toggle-btn:hover { background: white; color: black; }

                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
                .info-item label { color: #888; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
                .info-item p { margin: 5px 0 0; font-size: 1.1rem; font-weight: bold; color: #ddd; }

                .edit-form { display: flex; flex-direction: column; gap: 20px; }
                .input-group label { display: block; margin-bottom: 8px; color: #aaa; font-weight: bold; font-size: 0.9rem; }
                .modern-input { width: 100%; padding: 15px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; font-size: 1rem; outline: none; transition: 0.3s; box-sizing: border-box; }
                .modern-input:focus { border-color: #00bcd4; background: rgba(255,255,255,0.1); }
                
                .save-btn { padding: 15px; background: #00bcd4; color: black; border: none; border-radius: 10px; font-weight: 900; font-size: 1.1rem; cursor: pointer; margin-top: 10px; transition: 0.3s; position: relative; overflow: hidden; }
                .save-btn:hover { background: #0097a7; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0, 188, 212, 0.4); }

                /* Animations */
                .shine-effect::before { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); transition: all 0.7s ease; z-index: 1; }
                .shine-effect:hover::before { left: 200%; transition: all 0.7s ease; }
                @keyframes fadeUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                @keyframes fadeRight { 0% { opacity: 0; transform: translateX(-20px); } 100% { opacity: 1; transform: translateX(0); } }
                @keyframes slideDown { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fade-right { animation: fadeRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-slide-down { animation: slideDown 0.4s ease-out forwards; }
            `}} />
        </div>
    );
};

export default ProfilePage;