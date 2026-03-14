import React, { useState } from 'react';

const MOVIE_GENRES = [
    { id: 28, name: "Hành động 💥" }, { id: 35, name: "Hài hước 😂" },
    { id: 10749, name: "Tình cảm ❤️" }, { id: 27, name: "Kinh dị 👻" },
    { id: 878, name: "Viễn tưởng 🚀" }, { id: 16, name: "Hoạt hình 🐼" }
];

const SONG_GENRES = [
    { id: 'pop', name: "Nhạc Trẻ (Pop) 🎤" }, { id: 'rap', name: "Rap / Hip-hop 🧢" },
    { id: 'edm', name: "EDM / Remix 🎧" }, { id: 'bolero', name: "Bolero / Trữ tình 🎸" },
    { id: 'lofi', name: "Lofi Chill ☕" }, { id: 'rock', name: "Rock 🤟" }
];

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const [selectedMovies, setSelectedMovies] = useState([]);
    const [selectedSongs, setSelectedSongs] = useState([]);
    const [loading, setLoading] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const toggleSelection = (item, type) => {
        if (type === 'movie') {
            if (selectedMovies.includes(item)) setSelectedMovies(selectedMovies.filter(i => i !== item));
            else if (selectedMovies.length < 3) setSelectedMovies([...selectedMovies, item]);
        } else {
            if (selectedSongs.includes(item)) setSelectedSongs(selectedSongs.filter(i => i !== item));
            else if (selectedSongs.length < 3) setSelectedSongs([...selectedSongs, item]);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/onboarding', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, movieGenres: selectedMovies, songGenres: selectedSongs })
            });
            const data = await res.json();
            if (data.success) {
                // Cập nhật LocalStorage
                const updatedUser = { ...currentUser, isOnboarded: true };
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                window.location.href = '/'; // Về trang chủ
            }
        } catch (err) { alert("Có lỗi xảy ra!"); }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #1a0b12, #000 70%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            
            <div className="onboarding-box animate-scale-up">
                
                {/* THANH TIẾN TRÌNH */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', justifyContent: 'center' }}>
                    <div className={`progress-dot ${step >= 1 ? 'active-dot' : ''}`}></div>
                    <div className={`progress-dot ${step >= 2 ? 'active-dot' : ''}`}></div>
                </div>

                {/* BƯỚC 1: CHỌN PHIM */}
                {step === 1 && (
                    <div className="animate-slide-left">
                        <h1 style={{ textAlign: 'center', color: '#e50914', margin: '0 0 10px 0', fontSize: '2.5rem' }}>Chào {currentUser?.fullName}! 👋</h1>
                        <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '30px', fontSize: '1.1rem' }}>Hãy chọn tối đa <strong>3 thể loại phim</strong> bạn yêu thích nhất để AI gợi ý chuẩn xác nhé.</p>
                        
                        <div className="genre-grid">
                            {MOVIE_GENRES.map(g => (
                                <button key={g.id} onClick={() => toggleSelection(g, 'movie')} className={`genre-btn ${selectedMovies.includes(g) ? 'movie-selected' : ''}`}>
                                    {g.name}
                                </button>
                            ))}
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '40px' }}>
                            <button className="next-btn shine-effect" onClick={() => setStep(2)} disabled={selectedMovies.length === 0}>
                                Tiếp Tục ➔
                            </button>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '10px' }}>Đã chọn: {selectedMovies.length}/3</p>
                        </div>
                    </div>
                )}

                {/* BƯỚC 2: CHỌN NHẠC */}
                {step === 2 && (
                    <div className="animate-slide-right">
                        <h1 style={{ textAlign: 'center', color: '#1db954', margin: '0 0 10px 0', fontSize: '2.5rem' }}>Tuyệt vời! 🎧</h1>
                        <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '30px', fontSize: '1.1rem' }}>Bây giờ, chọn tối đa <strong>3 gu âm nhạc</strong> của bạn.</p>
                        
                        <div className="genre-grid">
                            {SONG_GENRES.map(g => (
                                <button key={g.id} onClick={() => toggleSelection(g, 'song')} className={`genre-btn ${selectedSongs.includes(g) ? 'song-selected' : ''}`}>
                                    {g.name}
                                </button>
                            ))}
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '40px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
                            <button className="back-btn" onClick={() => setStep(1)}>⬅ Quay lại</button>
                            <button className="next-btn finish-btn shine-effect" onClick={handleFinish} disabled={selectedSongs.length === 0 || loading}>
                                {loading ? 'Đang phân tích AI...' : 'Hoàn Tất & Khám Phá 🚀'}
                            </button>
                        </div>
                        <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', marginTop: '10px' }}>Đã chọn: {selectedSongs.length}/3</p>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .onboarding-box { background: rgba(20,20,20,0.8); backdrop-filter: blur(20px); padding: 50px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); max-width: 700px; width: 100%; box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
                .progress-dot { width: 40px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 10px; transition: 0.5s; }
                .active-dot { background: white; box-shadow: 0 0 10px white; }
                
                .genre-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; }
                .genre-btn { padding: 20px; font-size: 1.1rem; font-weight: bold; color: #ccc; background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1); border-radius: 20px; cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
                .genre-btn:hover { background: rgba(255,255,255,0.1); transform: translateY(-5px); }
                
                /* Selection Glow */
                .movie-selected { background: rgba(229, 9, 20, 0.2); border-color: #e50914; color: white; transform: scale(1.05); box-shadow: 0 10px 25px rgba(229, 9, 20, 0.4); }
                .song-selected { background: rgba(29, 185, 84, 0.2); border-color: #1db954; color: white; transform: scale(1.05); box-shadow: 0 10px 25px rgba(29, 185, 84, 0.4); }

                .next-btn { padding: 15px 40px; font-size: 1.2rem; font-weight: bold; border-radius: 30px; border: none; cursor: pointer; background: white; color: black; transition: 0.3s; }
                .next-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .finish-btn { background: linear-gradient(45deg, #00bcd4, #1db954); color: white; }
                .back-btn { padding: 15px 30px; font-size: 1.2rem; font-weight: bold; border-radius: 30px; border: 1px solid #555; background: transparent; color: #aaa; cursor: pointer; }

                /* Animations */
                @keyframes scaleUp { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
                @keyframes slideLeft { 0% { opacity: 0; transform: translateX(50px); } 100% { opacity: 1; transform: translateX(0); } }
                @keyframes slideRight { 0% { opacity: 0; transform: translateX(-50px); } 100% { opacity: 1; transform: translateX(0); } }
                .animate-scale-up { animation: scaleUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                .animate-slide-left { animation: slideLeft 0.5s ease-out forwards; }
                .animate-slide-right { animation: slideRight 0.5s ease-out forwards; }
            `}} />
        </div>
    );
};

export default Onboarding;