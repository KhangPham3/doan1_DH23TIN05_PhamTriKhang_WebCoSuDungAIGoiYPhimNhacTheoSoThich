import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
    // Quản lý 3 trạng thái màn hình (1: Nhập Mail, 2: Nhập OTP, 3: Đặt Pass)
    const [step, setStep] = useState(1);
    
    const [emailPrefix, setEmailPrefix] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 🟢 HÀM XỬ LÝ NHẬP EMAIL (Ghim @gmail.com)
    const handleEmailChange = (e) => {
        let value = e.target.value;
        value = value.replace(/[@\s]/g, ''); 
        setEmailPrefix(value);
    };

    // ==========================================
    // BƯỚC 1: YÊU CẦU GỬI OTP
    // ==========================================
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const fullEmail = emailPrefix ? `${emailPrefix}@gmail.com` : '';

        try {
            const response = await fetch('http://localhost:5000/api/forgot-password/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: fullEmail })
            });
            const data = await response.json();
            
            if (data.success) {
                setStep(2); // Thành công -> Trượt sang form 2 (Nhập OTP)
            } else {
                setError(data.message);
            }
        } catch (err) { setError('Lỗi kết nối máy chủ.'); }
        setLoading(false);
    };

    // ==========================================
    // BƯỚC 2: GỬI OTP LÊN SERVER KIỂM TRA
    // ==========================================
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const fullEmail = emailPrefix ? `${emailPrefix}@gmail.com` : '';

        try {
            const response = await fetch('http://localhost:5000/api/forgot-password/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: fullEmail, otp })
            });
            const data = await response.json();
            
            if (data.success) {
                setStep(3); // Đúng OTP -> Trượt sang form 3 (Tạo pass)
            } else {
                setError(data.message);
            }
        } catch (err) { setError('Lỗi kết nối máy chủ.'); }
        setLoading(false);
    };

    // ==========================================
    // BƯỚC 3: ĐẶT LẠI MẬT KHẨU
    // ==========================================
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const fullEmail = emailPrefix ? `${emailPrefix}@gmail.com` : '';

        try {
            const response = await fetch('http://localhost:5000/api/forgot-password/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: fullEmail, newPassword })
            });
            const data = await response.json();
            
            if (data.success) {
                alert('🎉 Đổi mật khẩu thành công! Hãy đăng nhập lại.');
                navigate('/login');
            } else {
                setError(data.message);
            }
        } catch (err) { setError('Lỗi kết nối máy chủ.'); }
        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="glass-panel">
                
                <h2 className="title">
                    {step === 1 && "Khôi Phục Mật Khẩu"}
                    {step === 2 && "Nhập Mã Xác Thực"}
                    {step === 3 && "Tạo Mật Khẩu Mới"}
                </h2>
                
                {error && <div className="error-box">{error}</div>}

                {/* ======================================= */}
                {/* --- BƯỚC 1: FORM NHẬP EMAIL YÊU CẦU --- */}
                {/* ======================================= */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="auth-form animate-slide-left">
                        <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '25px', fontSize: '0.95rem' }}>
                            Vui lòng nhập Email mà bạn đã dùng để đăng ký tài khoản. Hệ thống sẽ gửi một mã số xác thực vào hòm thư của bạn.
                        </p>

                        {/* Ô Email thiết kế xịn không bị tràn chữ */}
                        <div className="input-group email-group">
                            <div className="email-wrapper">
                                <input 
                                    type="text" required value={emailPrefix} 
                                    onChange={handleEmailChange} placeholder=" " 
                                    className="email-input-field" 
                                />
                                <span className="email-addon">@gmail.com</span>
                            </div>
                            <label className="floating-label">Email tài khoản</label>
                        </div>

                        <button type="submit" disabled={loading} className="submit-btn shine-effect">
                            {loading ? 'ĐANG XỬ LÝ...' : 'GỬI MÃ XÁC THỰC'}
                        </button>
                        
                        <div style={{ textAlign: 'center', marginTop: '25px' }}>
                            <a href="/login" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                ⬅ Quay lại Đăng nhập
                            </a>
                        </div>
                    </form>
                )}

                {/* ======================================= */}
                {/* --- BƯỚC 2: FORM NHẬP OTP (Mã 6 số) --- */}
                {/* ======================================= */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="auth-form animate-slide-left">
                        <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '20px', fontSize: '0.95rem' }}>
                            Mã số bí mật đã được gửi tới <strong style={{color: 'white'}}>{emailPrefix}@gmail.com</strong>.<br/>Vui lòng kiểm tra Hộp thư đến hoặc Thư rác.
                        </p>

                        <div className="input-group">
                            <input 
                                type="text" required value={otp} 
                                onChange={(e) => setOtp(e.target.value)} 
                                placeholder=" " 
                                style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.1)' }}
                                maxLength={6}
                            />
                            <label style={{left: '50%', transform: 'translate(-50%, -50%)'}}>Mã xác thực 6 số</label>
                        </div>

                        <button type="submit" disabled={loading} className="submit-btn shine-effect">
                            {loading ? 'ĐANG KIỂM TRA...' : 'XÁC NHẬN MÃ'}
                        </button>
                        
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button type="button" onClick={() => {setStep(1); setError('');}} style={{ background: 'transparent', border: 'none', color: '#00bcd4', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
                                Nhập sai Email? Quay lại bước 1.
                            </button>
                        </div>
                    </form>
                )}

                {/* ======================================= */}
                {/* --- BƯỚC 3: FORM NHẬP MẬT KHẨU MỚI  --- */}
                {/* ======================================= */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="auth-form animate-slide-left">
                        <p style={{ color: '#1db954', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>
                            ✅ Xác thực thành công! Hãy tạo mật khẩu mới.
                        </p>

                        <div className="input-group">
                            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder=" " />
                            <label>Nhập mật khẩu mới</label>
                        </div>

                        <button type="submit" disabled={loading} className="submit-btn shine-effect" style={{ background: 'linear-gradient(45deg, #1db954, #128c3c)', boxShadow: '0 8px 20px rgba(29, 185, 84, 0.4)' }}>
                            {loading ? 'ĐANG LƯU...' : 'LƯU MẬT KHẨU'}
                        </button>
                    </form>
                )}
            </div>

            {/* --- CSS DÙNG CHUNG --- */}
            <style dangerouslySetInnerHTML={{__html: `
                .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(to bottom right, rgba(10,10,10,0.9), rgba(20,20,20,0.7)), url('https://image.tmdb.org/t/p/original/mRGmNnh6pBAGGp6fMBMwI8iTBUO.jpg'); background-size: cover; background-position: center; padding: 20px; padding-top: 80px; }
                .glass-panel { background: rgba(15, 15, 15, 0.8); backdrop-filter: blur(20px); padding: 40px 35px; border-radius: 20px; width: 100%; max-width: 420px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
                .title { color: white; text-align: center; margin-bottom: 25px; font-weight: 900; font-size: 1.8rem; }
                .error-box { background: rgba(229, 9, 20, 0.15); color: #ff4d4d; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid rgba(229, 9, 20, 0.3); font-size: 0.9rem; animation: shake 0.4s ease-in-out; }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

                .input-group { position: relative; margin-bottom: 25px; width: 100%; }
                .input-group input:not(.email-input-field) { width: 100%; padding: 15px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: white; outline: none; transition: 0.3s; box-sizing: border-box; }
                .input-group label:not(.floating-label) { position: absolute; top: 50%; left: 15px; transform: translateY(-50%); color: #666; transition: 0.3s; pointer-events: none; padding: 0 5px; }
                .input-group input:focus:not(.email-input-field) ~ label:not(.floating-label), .input-group input:not(:placeholder-shown):not(.email-input-field) ~ label:not(.floating-label) { top: 0; font-size: 0.8rem; color: #e50914; background: #111; transform: translateY(-50%); }

                /* CSS Email (Không tràn chữ) */
                .email-group { position: relative; }
                .email-wrapper { display: flex; align-items: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; transition: 0.3s; overflow: hidden; width: 100%; box-sizing: border-box; }
                .email-wrapper:focus-within { border-color: #e50914; background: rgba(255,255,255,0.08); box-shadow: 0 0 15px rgba(229,9,20,0.15); }
                .email-input-field { flex: 1; background: transparent; border: none; padding: 15px; color: white; outline: none; width: 100%; }
                .email-addon { padding-right: 15px; color: #555; font-weight: bold; user-select: none; }
                
                .email-group .floating-label { position: absolute; top: 50%; left: 15px; transform: translateY(-50%); color: #666; pointer-events: none; transition: all 0.3s; z-index: 5; background: transparent; }
                .email-wrapper:focus-within + .floating-label, .email-wrapper:has(.email-input-field:not(:placeholder-shown)) + .floating-label { top: 0; left: 12px; font-size: 0.8rem; color: #e50914; background: #111; padding: 0 6px; font-weight: bold; border-radius: 4px; z-index: 10; }

                /* Nút Bấm */
                .submit-btn { width: 100%; padding: 15px; background: linear-gradient(45deg, #e50914, #b20710); color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; transition: 0.3s; font-size: 1.1rem; box-shadow: 0 8px 20px rgba(229,9,20,0.4); overflow: hidden; position: relative; }
                .submit-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(229,9,20,0.6); }
                .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                
                .shine-effect::before { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); transition: all 0.7s ease; z-index: 1; }
                .submit-btn:hover::before { left: 200%; transition: all 0.7s ease; }

                .animate-slide-left { animation: slideLeft 0.4s ease-out forwards; }
                @keyframes slideLeft { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
            `}} />
        </div>
    );
};

export default ForgotPasswordPage;