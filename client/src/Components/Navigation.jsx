import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// 👇 Import hàm tìm kiếm và link ảnh từ API
import { searchMovies, IMAGE_URL } from '../API/tmdbAPI';

function Navigation() {
    const [keyword, setKeyword] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const user = JSON.parse(localStorage.getItem('currentUser'));

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/login');
        window.location.reload();
    };
        // State cho tìm kiếm
    const [suggestions, setSuggestions] = useState([]); 
    const [showSearchDropdown, setShowSearchDropdown] = useState(false); 
    
    // State cho menu Thể Loại
    const [showGenreMenu, setShowGenreMenu] = useState(false);
    const genreMenuTimeoutRef = useRef(null);
    const navigate = useNavigate();
    const searchRef = useRef(null);

    // --- 1. XỬ LÝ SCROLL (Giữ nguyên) ---
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- 2. XỬ LÝ TÌM KIẾM API (Thay thế phần cũ) ---
    useEffect(() => {
        // Hàm này sẽ chạy mỗi khi "keyword" thay đổi
        const timer = setTimeout(async () => {
            if (keyword.trim().length > 1) {
                // Gọi API TMDB
                const results = await searchMovies(keyword);
                
                // Chuẩn hóa dữ liệu API để khớp với giao diện cũ
                const mappedResults = results.slice(0, 6).map(item => ({
                    id: item.id,
                    name: item.title,      // API trả về 'title' -> đổi thành 'name'
                    type: 'movie',         // Mặc định là movie
                    sub: item.release_date ? item.release_date.substring(0, 4) : 'N/A', // Lấy năm phát hành
                    PosterURL: item.poster_path ? `${IMAGE_URL}${item.poster_path}` : null // Ghép link ảnh
                }));

                setSuggestions(mappedResults);
                setShowSearchDropdown(true);
            } else {
                setSuggestions([]);
                setShowSearchDropdown(false);
            }
        }, 200); // Debounce: Đợi 0.5s sau khi ngừng gõ mới tìm

        return () => clearTimeout(timer); // Xóa timer cũ nếu người dùng gõ tiếp
    }, [keyword]);

    // --- 3. LOGIC MENU THỂ LOẠI (Dùng danh sách tĩnh vì không còn load allData) ---
    // Vì ta không load toàn bộ phim nữa nên không thể tự lọc thể loại. 
    // Ta dùng danh sách cứng các thể loại phổ biến.
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

    // --- 4. CÁC HÀM XỬ LÝ SỰ KIỆN KHÁC ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        setKeyword(e.target.value);
        // Lưu ý: Logic gọi API đã chuyển vào useEffect phía trên
    };

    const handleSelectSuggestion = (item) => {
        // Chuyển hướng đến trang chi tiết
        navigate(`/movie/${item.id}`);
        setShowSearchDropdown(false);
        setKeyword(''); 
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (keyword.trim()) {
            navigate(`/search?q=${keyword}`); // Chuyển sang trang SearchPage
            setShowSearchDropdown(false);
        }
    };

    const handleGenreClick = (genreName) => {
        navigate(`/search?q=${genreName}`);
        setShowGenreMenu(false);
    };

    return (
        <nav style={{ 
            position: 'fixed', top: 0, width: '100%', zIndex: 9999,
            padding: '10px 40px', height: '70px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all 0.3s ease',
            background: scrolled ? '#0f0f0f' : 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)',
            backdropFilter: scrolled ? 'blur(10px)' : 'none'
        }}>
            
            {/* --- KHU VỰC 1: LOGO + MENU --- */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', minWidth: '300px' }}>
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
                                            <div key={idx} onClick={() => handleGenreClick(g)} className="genre-item">
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
                                            <div key={idx} onClick={() => handleGenreClick(g)} className="genre-item">
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

            {/* --- KHU VỰC 2: SEARCH BAR (GỌI API) --- */}
            <div ref={searchRef} style={{ flex: 1, maxWidth: '500px', position: 'relative', marginTop: '10px' }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', alignItems: 'stretch' }}>
                    <input 
                        type="text" placeholder="Tìm phim trên TMDB..." value={keyword}
                        onChange={handleInputChange} 
                        onFocus={() => keyword && suggestions.length > 0 && setShowSearchDropdown(true)}
                        style={{ 
                            width: '100%', padding: '0 15px', height: '40px',
                            background: '#121212', border: '1px solid #333', borderRight: 'none',
                            color: 'white', borderRadius: '20px 0 0 20px', outline: 'none', fontSize: '1rem', boxSizing: 'border-box'
                        }}
                    />
                    <button type="submit" style={{ 
                        width: '60px', height: '40px', background: '#222', 
                        border: '1px solid #333', borderRadius: '0 20px 20px 0', 
                        color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', padding: 0, boxSizing: 'border-box'
                    }}>🔍</button>
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
                                <img 
                                    src={item.PosterURL || 'https://via.placeholder.com/40'} 
                                    style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} 
                                    alt="" 
                                />
                                <div>
                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</div>
                                    <div style={{ color: '#aaa', fontSize: '0.75rem' }}>
                                        {item.type === 'movie' ? '🎬 Phim' : '🎵 Nhạc'} • {item.sub}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div style={{ minWidth: '300px' }}></div>
           
            {/* Nút login / signup */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
                Đăng Nhập 
            </button>
              </>
    )}
</div>

        </nav>
    );
}

export default Navigation;