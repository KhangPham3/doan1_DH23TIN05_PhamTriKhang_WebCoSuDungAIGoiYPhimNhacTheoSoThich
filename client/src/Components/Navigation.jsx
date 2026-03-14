import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchMovies, discoverMovies, IMAGE_URL } from '../API/tmdbAPI';
import { searchMusic } from '../API/MusicAPI'; 

function Navigation() {
    const [keyword, setKeyword] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const user = JSON.parse(localStorage.getItem('currentUser'));

    const navigate = useNavigate();
    const searchRef = useRef(null);
    const genreMenuTimeoutRef = useRef(null);

    const [suggestions, setSuggestions] = useState([]); 
    const [showSearchDropdown, setShowSearchDropdown] = useState(false); 
    const [showGenreMenu, setShowGenreMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- XỬ LÝ TÌM KIẾM ĐA NĂNG VÀ THÔNG MINH ---
    useEffect(() => {
        const timer = setTimeout(async () => {
            const kw = keyword.trim();
            
            if (kw.length > 1) {
                try {
                    const genreMap = {
                        "hành động": 28, "tình cảm": 10749, "hài": 35,
                        "kinh dị": 27, "viễn tưởng": 878, "hoạt hình": 16
                    };
                    
                    const genreId = genreMap[kw.toLowerCase()];

                    let mRes = [];
                    let sRes = [];

                    if (genreId) {
                        [mRes, sRes] = await Promise.all([
                            discoverMovies({ withGenres: genreId }),
                            searchMusic(kw) 
                        ]);
                    } else {
                        [mRes, sRes] = await Promise.all([
                            searchMovies(kw),
                            searchMusic(kw)
                        ]);
                    }

                    const mappedMovies = (mRes || []).slice(0, 3).map(item => ({
                        id: item.id,
                        name: item.title,
                        type: 'movie',
                        sub: item.release_date ? item.release_date.substring(0, 4) : 'Phim',
                        image: item.poster_path ? `${IMAGE_URL}${item.poster_path}` : 'https://via.placeholder.com/50'
                    }));

                    const mappedSongs = (Array.isArray(sRes) ? sRes : [])
                        .filter(s => s.videoId)
                        .slice(0, 3)
                        .map(item => ({
                            id: item.videoId,
                            name: item.title,
                            type: 'song',
                            sub: item.artists ? item.artists[0].name : 'Nhạc',
                            image: item.thumbnails ? item.thumbnails[0].url : 'https://via.placeholder.com/50'
                        }));

                    setSuggestions([...mappedMovies, ...mappedSongs]);
                    setShowSearchDropdown(true);

                } catch (error) {
                    console.error("Lỗi tìm kiếm:", error);
                }
            } else {
                setSuggestions([]);
                setShowSearchDropdown(false);
            }
        }, 400); 

        return () => clearTimeout(timer);
    }, [keyword]);

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
        <>
            <nav style={{ 
                position: 'fixed', top: 0, width: '100%', zIndex: 9999,
                padding: '10px 40px', height: '70px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.3s ease',
                background: scrolled ? '#0f0f0f' : 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)',
                backdropFilter: scrolled ? 'blur(10px)' : 'none',
                boxSizing: 'border-box' 
            }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexShrink: 0 }}>
                    <Link to="/" style={{ color: '#e50914', textDecoration: 'none', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>
                        F&S
                    </Link>
                    
                    <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                        <Link to="/movies" className="nav-link">Phim</Link>
                        <Link to="/songs" className="nav-link">Nhạc</Link>
                        
                        
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
                                    <Link to="/recommend" className="nav-link" style={{ 
                                    display: 'flex', alignItems: 'center', gap: '8px', 
                                    background: 'linear-gradient(45deg, #00bcd4, #2196f3)', 
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', 
                                    fontWeight: '900', letterSpacing: '1px',
                                    textShadow: '0 0 20px rgba(0, 188, 212, 0.4)',
                                    textAlign: 'center', justifyContent: 'center'
                                    }}>
                                    <span style={{ textShadow: 'none', color: '#00bcd4'}}>✨</span> GỢI Ý VỚI AI
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

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
                                padding: '0 20px',
                                height: '40px',
                                background: '#222', 
                                border: '1px solid #333', 
                                color: 'white', 
                                borderRadius: '20px',
                                outline: 'none', 
                                fontSize: '1rem', 
                                boxSizing: 'border-box'
                            }}
                        />
                    </form>

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
                                        src={item.image} 
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
            
                {/* 🟢 KHU VỰC TÀI KHOẢN ĐÃ ĐƯỢC CẬP NHẬT */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0 }}>
                    {user ? (
                        <Link to="/profile" className="user-profile-btn">
                            <div className="user-avatar">
                                {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="user-name-text">{user.fullName}</span>
                        </Link>
                    ) : (
                        <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', background: '#e50914', color: 'white', border: 'none', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Đăng Nhập
                        </button>
                    )}
                </div>

            </nav>

            {/* 🟢 STYLE CHO KHU VỰC USER PROFILE NẰM TRONG HEADER */}
            <style dangerouslySetInnerHTML={{__html: `
                .user-profile-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-decoration: none;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 5px 15px 5px 5px;
                    border-radius: 30px;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    cursor: pointer;
                }

                .user-profile-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.3);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
                }

                .user-profile-btn:active {
                    transform: scale(0.95);
                }

                .user-avatar {
                    width: 35px;
                    height: 35px;
                    background: linear-gradient(135deg, #e50914, #ff5722);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 900;
                    font-size: 1.1rem;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                    transition: all 0.3s ease;
                }

                .user-profile-btn:hover .user-avatar {
                    box-shadow: 0 0 15px rgba(229, 9, 20, 0.6);
                    transform: rotate(10deg) scale(1.05);
                }

                .user-name-text {
                    color: white;
                    font-weight: bold;
                    font-size: 0.95rem;
                    max-width: 120px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}} />
        </>
    );
}

export default Navigation;