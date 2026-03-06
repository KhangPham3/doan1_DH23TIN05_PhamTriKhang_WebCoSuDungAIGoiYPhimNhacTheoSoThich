import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './UI/Button';
// Import BACKDROP_URL vừa tạo
import { fetchMovies, BACKDROP_URL } from '../API/tmdbAPI';

const HeroSection = () => {
  const [movie, setMovie] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHeroMovie = async () => {
      // Lấy 1 trang phim (20 phim hot nhất)
      const movies = await fetchMovies(1);
      if (movies && movies.length > 0) {
        // Chọn phim đầu tiên (Top 1) hoặc random tùy bạn
        // Ở đây mình lấy random 1 phim trong Top 5 cho nó thay đổi
        const randomIndex = Math.floor(Math.random() * 5);
        setMovie(movies[randomIndex]);
      }
    };
    loadHeroMovie();
  }, []);

  if (!movie) return <div style={{ height: '80vh', background: 'black' }}></div>;

  return (
    <div className="hero-container" style={{
      // 👇 Dùng BACKDROP_URL để ghép link ảnh nền
      backgroundImage: `linear-gradient(to top, #141414, rgba(0,0,0,0) 50%), linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%), url(${BACKDROP_URL}${movie.backdrop_path})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      height: '85vh',
      display: 'flex',
      alignItems: 'center',
      color: 'white',
      position: 'relative'
    }}>
      <div style={{ paddingLeft: '5%', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '15px', textShadow: '2px 2px 4px black' }}>
          {movie.title}
        </h1>
        
        <p style={{ fontSize: '1.2rem', marginBottom: '30px', textShadow: '1px 1px 2px black', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {movie.overview || "Phim đang cực hot, hãy xem ngay để cảm nhận!"}
        </p>

        <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
    {/* Nút Xem Ngay (Mặc định là primary đỏ) */}
    <Button 
        icon="▶" 
        type="primary" 
        onClick={() => navigate(`/movie/${movie.id}`)}
    >
        Xem Ngay
    </Button>

    {/* Nút Chi Tiết (Secondary kính mờ) */}
  
    </div>
      </div>
    </div>
  );
};

export default HeroSection;