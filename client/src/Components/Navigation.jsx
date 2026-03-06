import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// 👇 Import API
import { searchMovies, IMAGE_URL } from '../API/tmdbAPI';
import { searchMusic } from '../API/MusicAPI'; // Nhớ đảm bảo file này đã tồn tại

function Navigation() {
    const [keyword, setKeyword] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const user = JSON.parse(localStorage.getItem('currentUser'));

    const navigate = useNavigate();
    const searchRef = useRef(null);
    const genreMenuTimeoutRef = useRef(null);

    // State
    const [suggestions, setSuggestions] = useState([]); 
    const [showSearchDropdown, setShowSearchDropdown] = useState(false); 
    const [showGenreMenu, setShowGenreMenu] = useState(false);

    // --- 1. XỬ LÝ LOGOUT ---
    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/login');
        window.location.reload();
    };

    // --- 2. XỬ LÝ SCROLL ---
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- 3. XỬ LÝ TÌM KIẾM ĐA NĂNG (PHIM + NHẠC) ---
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (keyword.trim().length > 1) {
                try {
                    // Gọi song song 2 API
                    const [movieRes, songRes] = await Promise.all([
                        searchMovies(keyword),
                        searchMusic(keyword)
                    ]);

                    // 1. Chuẩn hóa kết quả Phim
                    const mappedMovies = movieRes.slice(0, 3).map(item => ({
                        id: item.id,
                        name: item.title,
                        type: 'movie',
                        sub: item.release_date ? item.release_date.substring(0, 4) : 'Phim',
                        // Ghép link ảnh TMDB
                        image: item.poster_path ? `${IMAGE_URL}${item.poster_path}` : 'https://via.placeholder.com/50'
                    }));

                    // 2. Chuẩn hóa kết quả Nhạc (Lọc lấy bài có videoId)
                    const mappedSongs = (Array.isArray(songRes) ? songRes : [])
                        .filter(s => s.videoId)
                        .slice(0, 3)
                        .map(item => ({
                            id: item.videoId,
                            name: item.title,
                            type: 'song',
                            sub: item.artists ? item.artists[0].name : 'Nhạc',
                            // Nhạc có sẵn link ảnh
                            image: item.thumbnails ? item.thumbnails[0].url : 'https://via.placeholder.com/50'
                        }));

                    // 3. Gộp lại
                    setSuggestions([...mappedMovies, ...mappedSongs]);
                    setShowSearchDropdown(true);

                } catch (error) {
                    console.error("Lỗi tìm kiếm:", error);
                }
            } else {
                setSuggestions([]);
                setShowSearchDropdown(false);
            }
        }, 500); // Debounce 0.5s

        return () => clearTimeout(timer);
    }, [keyword]);

    // --- 4. LOGIC MENU THỂ LOẠI ---
    const staticGenres = {
        movieGenres: ["Hành động", "Tình cảm", "Hài", "Kinh dị", "Viễn tưởng", "Hoạt hình"],
        songGenres: ["Pop", "Rap", "Ballad", "R&B", "EDM", "Indie"]
    };
    
    const handleGenreMouseEnter = () => {
        if (genreMenuTimeoutRef.current) clearTimeout(genreMenuTimeoutRef.current);
        setShowGenreMenu(true);
    };
    const handleGenreMouseLeave = () => {
        genreMenuTimeoutRef.current = setTimeout(() => {
            setShowGenreMenu(false);
        }, 300);
    };

    // --- 5. CÁC HÀM SỰ KIỆN KHÁC ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e) => setKeyword(e.target.value);

    // Chuyển hướng đúng trang khi bấm vào gợi ý
    const handleSelectSuggestion = (item) => {
        if (item.type === 'movie') {
            navigate(`/movie/${item.id}`);
        } else {
            navigate(`/song/${item.id}`);
        }
        setShowSearchDropdown(false);
        setKeyword(''); 
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (keyword.trim()) {
            navigate(`/search?q=${keyword}`);
            setShowSearchDropdown(false);
        }
    };

    
    const handleGenreClick = (genreName, type) => {
        navigate(`/search?q=${genreName}&type=${type}`);
        setShowGenreMenu(false);
};
    return (
        <nav style={{ 
            position: 'fixed', top: 0, width: '100%', zIndex: 9999,
            padding: '10px 40px', height: '70px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', // Đã có sẵn, rất tốt!
            transition: 'all 0.3s ease',
            background: scrolled ? '#0f0f0f' : 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)',
            backdropFilter: scrolled ? 'blur(10px)' : 'none',
            boxSizing: 'border-box' // Thêm cái này để padding không làm tăng tổng chiều rộng
        }}>
            
            {/* --- KHU VỰC 1: LOGO + MENU --- */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexShrink: 0 }}>
            <Link to="/" style={{ color: '#e50914', textDecoration: 'none', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>
                F&M
            </Link>
                
                <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                    <Link to="/movies" className="nav-link">Phim</Link>
                    <Link to="/songs" className="nav-link">Nhạc</Link>

                    {/* MỤC THỂ LOẠI */}
                    <div 
                        style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={handleGenreMouseEnter}
                        onMouseLeave={handleGenreMouseLeave}
                    >
                        <span className="nav-link" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            Thể loại <small style={{fontSize: '0.6rem'}}>▼</small>
                        </span>

                        {showGenreMenu && (
                            <div style={{
                                    position: 'absolute', top: '40px', left: '-50px',
                                    width: '350px', background: 'rgba(20, 20, 20, 0.95)',
                                    backdropFilter: 'blur(15px)', borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)', padding: '20px',
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)', zIndex: 10000, marginTop: '10px' 
                                }}
                                onMouseEnter={handleGenreMouseEnter}
                                onMouseLeave={handleGenreMouseLeave}
                            >
                                <div style={{ position: 'absolute', top: '-20px', left: 0, width: '100%', height: '20px', background: 'transparent' }}></div>

                                {/* Cột 1: Phim */}
                                <div>
                                    <h4 style={{ color: '#e50914', margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px' }}>🎬 PHIM</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {staticGenres.movieGenres.map((g, idx) => (
                                           <div key={idx} onClick={() => handleGenreClick(g, 'movie')} className="genre-item">
                                                {g}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Cột 2: Nhạc */}
                                <div>
                                    <h4 style={{ color: '#1db954', margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px' }}>🎵 NHẠC</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {staticGenres.songGenres.map((g, idx) => (
                                            <div key={idx} onClick={() => handleGenreClick(g, 'song')} className="genre-item">
                                                {g}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- KHU VỰC 2: SEARCH BAR (GỌI API KÉP) --- */}
            <div ref={searchRef} style={{ flex: 1, maxWidth: '600px', position: 'relative', margin: '0 30px' }}>
                 <form onSubmit={handleSearchSubmit} style={{ width: '100%' }}>
                    <input 
                        type="text" 
                        placeholder="Tìm phim hoặc bài hát..." 
                        value={keyword}
                        onChange={handleInputChange} 
                        onFocus={() => keyword && suggestions.length > 0 && setShowSearchDropdown(true)}
                        style={{ 
                            width: '100%', 
                            padding: '0 20px', // Tăng padding trái/phải lên một chút
                            height: '40px',
                            background: '#222', // Có thể đổi màu nền sáng hơn một chút (ví dụ #222)
                            border: '1px solid #333', 
                            /* XÓA bỏ borderRight: 'none' */
                            color: 'white', 
                            borderRadius: '20px', // ĐỔI TỪ '20px 0 0 20px' THÀNH '20px' (bo tròn đều)
                            outline: 'none', 
                            fontSize: '1rem', 
                            boxSizing: 'border-box'
                        }}
                    />
                </form>

                {/* Dropdown Gợi ý Từ API */}
                {showSearchDropdown && suggestions.length > 0 && (
                    <div style={{
                        position: 'absolute', top: '50px', left: 0, width: '100%',
                        background: '#1e1e1e', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.8)',
                        overflow: 'hidden', border: '1px solid #333'
                    }}>
                        {suggestions.map((item, index) => (
                            <div key={index} onClick={() => handleSelectSuggestion(item)} className="search-item"
                                style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', borderBottom: '1px solid #333' }}>
                                {/* Dùng biến 'image' đã chuẩn hóa */}
                                <img 
                                    src={item.image} 
                                    style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} 
                                    alt="" 
                                />
                                <div>
                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</div>
                                    <div style={{ color: '#aaa', fontSize: '0.75rem' }}>
                                        {/* Hiển thị loại tương ứng */}
                                        {item.type === 'movie' ? '🎬 Phim' : '🎵 Nhạc'} • {item.sub}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
           
           
            {/* Nút login / signup */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0 }}>
                {user ? (
                    <>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>Xin chào, {user.fullName}</span>
                        <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>
                            Đăng xuất
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => navigate('/login')} style={{ marginRight: '10px', padding: '10px 20px', background: '#e50914', color: 'white', border: 'none', borderRadius: '40px', cursor: 'pointer' }}>
                            Đăng Nhập / Đăng Ký 
                        </button>
                    </>
                )
                }
            </div>

        </nav>
    );
}

export default Navigation;