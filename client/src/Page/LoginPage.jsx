import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '', password: '', fullName: '', email: '', birthYear: '', gender: 'Nam'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    const [emailPrefix, setEmailPrefix] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEmailChange = (e) => {
        let value = e.target.value;
        value = value.replace(/[@\s]/g, ''); 
        setEmailPrefix(value);
    };

    // --- XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ TRUYỀN THỐNG ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const fullEmail = emailPrefix ? `${emailPrefix}@gmail.com` : '';
        const endpoint = isLogin ? '/api/login' : '/api/register';
        
        try {
            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, email: fullEmail })
            });
            const data = await response.json();
            
            if (data.success) {
                if (isLogin) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    if (data.user.role === 'admin') {
                        alert('🎉 Chào mừng Admin! Bạn sẽ được chuyển đến trang quản trị.');
                        window.location.href = '/admin';
                    }else {
                        if (!data.user.isOnboarded) {
                            window.location.href = '/onboarding';
                        } else {
                            window.location.href = '/'; 
                        }
                    }
                } else {
                    alert('🎉 Đăng ký thành công! Vui lòng đăng nhập để trải nghiệm.');
                    setIsLogin(true); 
                }
            } else {
                setError(data.message || 'Có lỗi xảy ra, vui lòng thử lại!');
            }
        } catch (err) {
            setError('Không thể kết nối đến máy chủ.');
        }
        setLoading(false);
    };

    // ==========================================
    // 🟢 XỬ LÝ ĐĂNG NHẬP GOOGLE
    // ==========================================
    const loginGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const authRes = await fetch('http://localhost:5000/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: tokenResponse.access_token })
                });
                
                const data = await authRes.json();
                if (data.success) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    window.location.href = data.user.isOnboarded ? '/' : '/onboarding';
                } else {
                    setError(data.message || 'Lỗi xác thực Google');
                }
            } catch (err) {
                setError("Đăng nhập Google thất bại.");
            }
        },
        onError: () => {
            setError("Đăng nhập Google bị hủy.");
        }
    });

    // ==========================================
    // 🟢 XỬ LÝ ĐĂNG NHẬP FACEBOOK
    // ==========================================
    const responseFacebook = async (response) => {
        if (response.accessToken) {
            try {
                const res = await fetch('http://localhost:5000/api/auth/facebook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken: response.accessToken })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    window.location.href = data.user.isOnboarded ? '/' : '/onboarding';
                } else {
                    setError(data.message || 'Lỗi xác thực Facebook');
                }
            } catch (error) {
                setError('Lỗi kết nối máy chủ Facebook.');
            }
        }
    };

    return (
        <div className="login-container">
            <div className="glass-panel">
                
                <div className="toggle-box">
                    <button type="button" className={`toggle-btn ${isLogin ? 'active' : ''}`} onClick={() => {setIsLogin(true); setError('');}}>
                        ĐĂNG NHẬP
                    </button>
                    <button type="button" className={`toggle-btn ${!isLogin ? 'active' : ''}`} onClick={() => {setIsLogin(false); setError('');}}>
                        ĐĂNG KÝ
                    </button>
                    <div className={`slider ${isLogin ? 'left' : 'right'}`}></div>
                </div>

                <h2 className="title">{isLogin ? 'Chào Mừng Trở Lại!' : 'Tạo Tài Khoản Mới'}</h2>
                
                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    
                    {!isLogin && (
                        <div className="animate-slide-down">
                            <div className="input-group">
                                <input type="text" name="fullName" required={!isLogin} value={formData.fullName} onChange={handleChange} placeholder=" " />
                                <label>Họ và Tên</label>
                            </div>
                            
                            <div className="input-group email-group">
                                <div className="email-wrapper">
                                    <input 
                                        type="text" 
                                        name="email" 
                                        required={!isLogin} 
                                        value={emailPrefix} 
                                        onChange={handleEmailChange} 
                                        placeholder=" " 
                                        className="email-input-field"
                                    />
                                    <span className="email-addon">@gmail.com</span>
                                </div>
                                <label>Tên tài khoản Email</label>
                            </div>

                            <div className="input-row">
                                <div className="input-group" style={{ flex: 1 }}>
                                    <input type="number" name="birthYear" required={!isLogin} value={formData.birthYear} onChange={handleChange} placeholder=" " />
                                    <label>Năm sinh</label>
                                </div>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="select-input">
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                        <option value="Khác">Khác</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <input type="text" name="username" required value={formData.username} onChange={handleChange} placeholder=" " />
                        <label>Tên đăng nhập</label>
                    </div>

                    <div className="input-group">
                        <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder=" " />
                        <label>Mật khẩu</label>
                    </div>

                    {isLogin && (
                        <div className="forgot-password">
                            <a href="/forgot-password">Bạn quên mật khẩu?</a>
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="submit-btn shine-effect">
                        {loading ? 'ĐANG XỬ LÝ...' : (isLogin ? 'ĐĂNG NHẬP VÀO HỆ THỐNG' : 'HOÀN TẤT ĐĂNG KÝ')}
                    </button>
                </form>

                <div className="social-divider">
                    <span>HOẶC TIẾP TỤC VỚI</span>
                </div>

                <div className="social-login">
                    {/* NÚT GOOGLE */}
                    <button type="button" className="social-btn google" onClick={() => loginGoogle()}>
                        <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" width="24" />
                        Google
                    </button>

                    {/* NÚT FACEBOOK */}
                    <FacebookLogin
                        appId="8681bd4cc68507b3ca2a3455ad07ccd5"
                        autoLoad={false}
                        fields="name,email,picture"
                        callback={responseFacebook}
                        render={renderProps => (
                            <button type="button" className="social-btn facebook" onClick={renderProps.onClick}>
                                <img src="https://img.icons8.com/color/48/000000/facebook-new.png" alt="Facebook" width="24" />
                                Facebook
                            </button>
                        )}
                    />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(to bottom right, rgba(10,10,10,0.9), rgba(20,20,20,0.7)), url('https://image.tmdb.org/t/p/original/mRGmNnh6pBAGGp6fMBMwI8iTBUO.jpg');
                    background-size: cover;
                    background-position: center;
                    padding: 20px;
                    padding-top: 80px;
                }

                .glass-panel {
                    background: rgba(15, 15, 15, 0.75);
                    backdrop-filter: blur(25px);
                    -webkit-backdrop-filter: blur(25px);
                    padding: 40px 35px;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 420px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                    border: 1px solid rgba(255,255,255,0.08);
                    animation: popIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.9) translateY(20px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }

                .title {
                    color: white;
                    text-align: center;
                    margin-bottom: 25px;
                    font-size: 1.8rem;
                    font-weight: 900;
                    letter-spacing: 0.5px;
                }

                .error-box {
                    background: rgba(229, 9, 20, 0.15);
                    color: #ff4d4d;
                    padding: 12px;
                    border-radius: 8px;
                    text-align: center;
                    margin-bottom: 20px;
                    border: 1px solid rgba(229, 9, 20, 0.3);
                    font-size: 0.9rem;
                    animation: shake 0.4s ease-in-out;
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }

                .toggle-box {
                    display: flex;
                    position: relative;
                    background: rgba(255,255,255,0.05);
                    border-radius: 30px;
                    margin-bottom: 30px;
                    padding: 5px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .toggle-btn {
                    flex: 1; padding: 12px; background: transparent; border: none;
                    color: #888; cursor: pointer; z-index: 2; font-weight: bold;
                    transition: color 0.3s; font-size: 0.95rem;
                }
                .toggle-btn.active { color: white; }
                .slider {
                    position: absolute; top: 5px; left: 5px; width: calc(50% - 5px); height: calc(100% - 10px);
                    background: linear-gradient(45deg, #e50914, #b20710);
                    border-radius: 25px; z-index: 1; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 15px rgba(229, 9, 20, 0.4);
                }
                .slider.right { transform: translateX(100%); }

                .input-group {
                    position: relative;
                    margin-bottom: 22px;
                    width: 100%;
                }
                .input-row { display: flex; gap: 15px; }
                
                .input-group input:not(.email-input-field), .select-input {
                    width: 100%;
                    padding: 16px 15px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    color: white;
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.3s;
                    box-sizing: border-box;
                }
                .select-input { padding: 15px; color: #ccc; cursor: pointer; }
                .select-input option { background: #1a1a1a; color: white; }
                
                .input-group label {
                    position: absolute;
                    top: 50%; left: 15px;
                    transform: translateY(-50%);
                    color: #888; pointer-events: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    background: transparent;
                }

                .input-group input:not(.email-input-field):focus, 
                .input-group input:not(.email-input-field):not(:placeholder-shown) {
                    background: rgba(255,255,255,0.06);
                    border-color: #e50914;
                    box-shadow: 0 0 15px rgba(229,9,20,0.15);
                }

                .input-group input:not(.email-input-field):focus ~ label, 
                .input-group input:not(.email-input-field):not(:placeholder-shown) ~ label {
                    top: 0; left: 12px;
                    font-size: 0.8rem;
                    color: #e50914;
                    background: #141414;
                    padding: 0 6px;
                    font-weight: bold;
                    border-radius: 4px;
                }
                
                .email-group { position: relative; }

                .email-wrapper {
                    display: flex;
                    align-items: center;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    transition: all 0.3s;
                    overflow: hidden;
                    box-sizing: border-box;
                    width: 100%;
                }

                .email-wrapper:focus-within {
                    background: rgba(255,255,255,0.06);
                    border-color: #e50914;
                    box-shadow: 0 0 15px rgba(229,9,20,0.15);
                }

                .email-input-field {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: white;
                    padding: 16px 15px;
                    font-size: 1rem;
                    outline: none;
                }

                .email-addon {
                    background: rgba(255, 255, 255, 0.08);
                    color: #ccc;
                    padding: 16px 15px;
                    font-size: 0.95rem;
                    font-weight: bold;
                    border-left: 1px solid rgba(255,255,255,0.1);
                    user-select: none;
                }

                .email-group label {
                    position: absolute;
                    top: 50%;
                    left: 15px;
                    transform: translateY(-50%);
                    color: #888;
                    pointer-events: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 5;
                    background: transparent; 
                }

                .email-wrapper:focus-within + label,
                .email-wrapper:has(.email-input-field:not(:placeholder-shown)) + label {
                    top: 0; 
                    left: 12px;
                    font-size: 0.8rem;
                    color: #e50914;
                    background: #141414; 
                    padding: 0 6px;
                    font-weight: bold;
                    border-radius: 4px;
                    z-index: 10;
                }

                .forgot-password {
                    text-align: right;
                    margin-top: -10px;
                    margin-bottom: 25px;
                }
                .forgot-password a {
                    color: #888;
                    font-size: 0.85rem;
                    text-decoration: none;
                    transition: all 0.3s;
                }
                .forgot-password a:hover {
                    color: #00bcd4;
                    text-shadow: 0 0 8px rgba(0, 188, 212, 0.5);
                }

                .submit-btn {
                    width: 100%; padding: 16px;
                    background: linear-gradient(45deg, #e50914, #b20710);
                    color: white; border: none; border-radius: 12px;
                    font-weight: 900; font-size: 1.1rem; cursor: pointer;
                    transition: all 0.3s ease; position: relative; overflow: hidden;
                    box-shadow: 0 8px 20px rgba(229,9,20,0.4);
                }
                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 25px rgba(229,9,20,0.6);
                }
                .submit-btn:active:not(:disabled) { transform: scale(0.97); }
                .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                .shine-effect::before {
                    content: ''; position: absolute; top: 0; left: -100%;
                    width: 50%; height: 100%;
                    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
                    transform: skewX(-25deg); transition: all 0.7s ease; z-index: 1;
                }
                .submit-btn:hover::before { left: 200%; transition: all 0.7s ease; }

                .social-divider {
                    display: flex; align-items: center; text-align: center; margin: 30px 0 20px;
                }
                .social-divider::before, .social-divider::after {
                    content: ''; flex: 1; border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .social-divider span {
                    padding: 0 15px; color: #666; font-size: 0.8rem; font-weight: bold; letter-spacing: 1px;
                }

                .social-login { display: flex; gap: 15px; }
                .social-btn {
                    flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px;
                    padding: 12px; border-radius: 12px; border: none; cursor: pointer;
                    font-weight: bold; font-size: 0.95rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .social-btn.google { background: white; color: #333; }
                .social-btn.google:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(255,255,255,0.2); }
                .social-btn.facebook { background: #1877F2; color: white; }
                .social-btn.facebook:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(24,119,242,0.4); }

                .animate-slide-down { animation: slideDown 0.4s ease-out forwards; overflow: hidden; }
                @keyframes slideDown {
                    from { opacity: 0; max-height: 0; transform: translateY(-10px); }
                    to { opacity: 1; max-height: 300px; transform: translateY(0); }
                }
            `}} />
        </div>
    );
};

export default LoginPage;