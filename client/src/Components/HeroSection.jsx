import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './UI/Button';
import { fetchMovies, BACKDROP_URL } from '../API/tmdbAPI';

const HeroSection = () => {
    const [movies, setMovies] = useState([]); // Lưu danh sách Top 5 phim
    const [currentIndex, setCurrentIndex] = useState(0); // Vị trí phim đang hiển thị
    const navigate = useNavigate();

    // 1. LẤY DỮ LIỆU PHIM KHI VỪA VÀO TRANG (ĐÃ TỐI ƯU LOGIC ADMIN)
    useEffect(() => {
        const loadHeroMovies = async () => {
            try {
                // Ưu tiên 1: Lấy danh sách phim mà Admin đã ghim từ Backend
                const adminRes = await fetch('http://localhost:5000/api/admin/trending');
                const adminData = await adminRes.json();
                const pinnedMovies = adminData.data?.filter(item => item.ItemType === 'movie') || [];

                if (pinnedMovies.length > 0) {
                    // Xử lý dữ liệu Admin khớp với cấu trúc UI của bạn
                    const formattedMovies = pinnedMovies.map(p => {
                        // Tách lấy tên file ảnh để khi ráp với BACKDROP_URL ở UI không bị lỗi
                        let cleanPath = p.Image;
                        if (cleanPath.includes('http')) {
                            cleanPath = '/' + cleanPath.split('/').pop();
                        }

                        return {
                            id: p.ItemID,
                            title: p.Title,
                            backdrop_path: cleanPath, // Đã cắt nối an toàn
                            vote_average: 10.0, // Phim ghim mặc định cho 10 điểm
                            release_date: new Date().getFullYear().toString(),
                            overview: 'Tác phẩm đang thịnh hành do Quản trị viên đề xuất. Đừng bỏ lỡ siêu phẩm này!'
                        };
                    });
                    setMovies(formattedMovies.slice(0, 5));
                } else {
                    // Ưu tiên 2: Nếu Admin không ghim, gọi API mặc định từ TMDB
                    const fetchedMovies = await fetchMovies(1);
                    if (fetchedMovies && fetchedMovies.length > 0) {
                        const validMovies = fetchedMovies.filter(m => m.backdrop_path !== null);
                        setMovies(validMovies.slice(0, 5));
                    }
                }
            } catch (error) {
                console.error("Lỗi tải phim Hero:", error);
                // Fallback: Lỗi server thì vẫn chạy TMDB bình thường
                const fetchedMovies = await fetchMovies(1);
                if (fetchedMovies && fetchedMovies.length > 0) {
                    setMovies(fetchedMovies.filter(m => m.backdrop_path !== null).slice(0, 5));
                }
            }
        };
        loadHeroMovies();
    }, []);

    // 2. TỰ ĐỘNG CHUYỂN SLIDE SAU MỖI 5 GIÂY
    useEffect(() => {
        if (movies.length === 0) return;

        // Cài đặt bộ đếm thời gian
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
        }, 5000); // 5000ms = 5 giây

        // Dọn dẹp bộ đếm khi người dùng rời khỏi trang
        return () => clearInterval(interval);
    }, [movies]);

    // Lấy bộ phim đang được chọn hiện tại
    const movie = movies[currentIndex];

    // Trạng thái chờ load dữ liệu
    if (!movie) return <div style={{ height: '85vh', background: '#141414' }}></div>;

    // KẾT CẤU GIAO DIỆN GIỮ NGUYÊN 100% CỦA BẠN
    return (
        <div className="hero-container" style={{
            backgroundImage: `linear-gradient(to top, #121212 0%, rgba(0,0,0,0) 50%), linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%), url(${BACKDROP_URL}${movie.backdrop_path})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '85vh',
            display: 'flex',
            alignItems: 'center',
            color: 'white',
            position: 'relative',
            transition: 'background-image 0.8s ease-in-out' // Hiệu ứng chuyển ảnh nền mượt mà
        }}>
            <div style={{ paddingLeft: '5%', maxWidth: '700px', zIndex: 10 }}>
                {/* Thêm hiệu ứng fade-in cho Title và Overview khi đổi phim */}
                <div key={movie.id} className="hero-content-animation" style={{ animation: 'fadeIn 1s ease-in-out' }}>
                    <h1 style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '15px', textShadow: '2px 2px 10px rgba(0,0,0,0.8)', lineHeight: '1.1' }}>
                        {movie.title}
                    </h1>
                    
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', fontSize: '1.1rem', fontWeight: 'bold', color: '#ccc' }}>
                        <span style={{ color: '#ffc107' }}>⭐ {movie.vote_average?.toFixed(1)} Điểm</span>
                        <span>{movie.release_date?.substring(0, 4)}</span>
                    </div>

                    <p style={{ fontSize: '1.2rem', marginBottom: '30px', textShadow: '1px 1px 5px rgba(0,0,0,0.8)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5', color: '#ddd' }}>
                        {movie.overview || "Siêu phẩm điện ảnh đang cực hot, hãy xem ngay để cảm nhận trọn vẹn từng khoảnh khắc!"}
                    </p>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
                        <Button 
                            icon="▶" 
                            type="primary" 
                            onClick={() => navigate(`/movie/${movie.id}`)}
                        >
                            Xem Chi Tiết Ngay
                        </Button>
                    </div>
                </div>
            </div>

            {/* 👇 3. THANH ĐIỀU HƯỚNG BẰNG DẤU CHẤM (DOTS NAVIGATION) */}
            <div style={{ position: 'absolute', bottom: '40px', left: '5%', display: 'flex', gap: '10px', zIndex: 10 }}>
                {movies.map((_, index) => (
                    <div 
                        key={index} 
                        onClick={() => setCurrentIndex(index)} // Bấm vào để nhảy thẳng tới phim đó
                        style={{ 
                            width: currentIndex === index ? '40px' : '10px', 
                            height: '10px', 
                            borderRadius: '5px', 
                            background: currentIndex === index ? '#e50914' : 'rgba(255,255,255,0.4)', 
                            cursor: 'pointer',
                            transition: 'all 0.4s ease'
                        }}
                    />
                ))}
            </div>

            {/* 👇 THÊM ĐOẠN CSS TRỰC TIẾP CHO ANIMATION FADE-IN */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
};

export default HeroSection;