import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true); // true: Login, false: Register
    const navigate = useNavigate();

    // Form data
    const [formData, setFormData] = useState({
        username: '', password: '', fullName: '', email: '', birthYear: '', gender: 'Nam'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/api/login' : '/api/register';
        
        try {
            const res = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                if (isLogin) {
                    // Lưu thông tin user vào localStorage để dùng toàn web
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    alert(`Chào mừng ${data.user.fullName}!`);
                    navigate('/'); // Về trang chủ
                    window.location.reload(); // Reload để cập nhật Navigation
                } else {
                    alert("Đăng ký thành công! Hãy đăng nhập.");
                    setIsLogin(true); // Chuyển sang tab đăng nhập
                }
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Lỗi kết nối Server");
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: 'white' }}>
            <div style={{ width: '400px', padding: '40px', background: '#1e1e1e', borderRadius: '10px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#e50914' }}>
                    {isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ THÀNH VIÊN'}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input name="username" placeholder="Tên đăng nhập" onChange={handleChange} required style={inputStyle} />
                    <input name="password" type="password" placeholder="Mật khẩu" onChange={handleChange} required style={inputStyle} />
                    
                    {!isLogin && (
                        <>
                            <input name="fullName" placeholder="Họ và tên" onChange={handleChange} required style={inputStyle} />
                            <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={inputStyle} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input name="birthYear" type="number" placeholder="Năm sinh" onChange={handleChange} required style={inputStyle} />
                                <select name="gender" onChange={handleChange} style={inputStyle}>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                        </>
                    )}

                    <button type="submit" style={btnStyle}>
                        {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', cursor: 'pointer', color: '#aaa' }} onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                </p>
            </div>
        </div>
    );
};

const inputStyle = { padding: '12px', borderRadius: '5px', border: 'none', background: '#333', color: 'white' };
const btnStyle = { padding: '12px', borderRadius: '5px', border: 'none', background: '#e50914', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };

export default LoginPage;