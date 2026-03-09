import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp!");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessage(data.message);
                // Sau 2 giây tự động chuyển về trang đăng nhập
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Lỗi kết nối đến Server!");
        }
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.6)), url('https://image.tmdb.org/t/p/original/mRGmNnh6pBAGGp6fMBMwI8iTBUO.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: 'rgba(15, 15, 15, 0.85)',
                backdropFilter: 'blur(20px)',
                padding: '40px',
                borderRadius: '15px',
                width: '100%',
                maxWidth: '450px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '10px', fontSize: '2rem' }}>Khôi phục mật khẩu</h2>
                <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '30px', fontSize: '0.9rem' }}>Nhập tài khoản và email để đặt lại mật khẩu của bạn.</p>
                
                {error && <div style={{ background: 'rgba(229,9,20,0.2)', color: '#e50914', padding: '10px', borderRadius: '5px', marginBottom: '20px', textAlign: 'center', border: '1px solid #e50914' }}>{error}</div>}
                {message && <div style={{ background: 'rgba(29,185,84,0.2)', color: '#1db954', padding: '10px', borderRadius: '5px', marginBottom: '20px', textAlign: 'center', border: '1px solid #1db954' }}>{message}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <input 
                        type="text" name="username" placeholder="Tên đăng nhập của bạn" required
                        value={formData.username} onChange={handleChange}
                        className="modern-input"
                    />
                    <input 
                        type="email" name="email" placeholder="Email đã đăng ký" required
                        value={formData.email} onChange={handleChange}
                        className="modern-input"
                    />
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '5px 0' }}></div>
                    <input 
                        type="password" name="newPassword" placeholder="Mật khẩu mới" required minLength="6"
                        value={formData.newPassword} onChange={handleChange}
                        className="modern-input"
                    />
                    <input 
                        type="password" name="confirmPassword" placeholder="Xác nhận mật khẩu mới" required minLength="6"
                        value={formData.confirmPassword} onChange={handleChange}
                        className="modern-input"
                    />
                    
                    <button type="submit" disabled={loading} style={{
                        padding: '15px', background: '#e50914', color: 'white', border: 'none', borderRadius: '8px', 
                        fontWeight: 'bold', fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s', marginTop: '10px'
                    }}>
                        {loading ? 'ĐANG XỬ LÝ...' : 'ĐẶT LẠI MẬT KHẨU'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '25px' }}>
                    <span style={{ color: '#888' }}>Nhớ mật khẩu rồi? </span>
                    <a href="/login" style={{ color: '#e50914', textDecoration: 'none', fontWeight: 'bold' }}>Đăng nhập ngay</a>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .modern-input {
                    padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white;
                    border: 1px solid rgba(255,255,255,0.1); outline: none; font-size: 1rem; transition: all 0.3s;
                }
                .modern-input:focus {
                    background: rgba(255,255,255,0.1);
                    border-color: #e50914;
                    box-shadow: 0 0 10px rgba(229,9,20,0.3);
                }
            `}} />
        </div>
    );
};

export default ForgotPasswordPage;