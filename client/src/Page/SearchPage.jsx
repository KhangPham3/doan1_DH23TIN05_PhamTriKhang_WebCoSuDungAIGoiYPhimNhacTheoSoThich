import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../Components/UI/Card';
import { searchMovies, discoverMovies, IMAGE_URL } from '../API/tmdbAPI';
import { searchMusic } from '../API/MusicAPI';

const SearchPage = () => {
    const [movieResults, setMovieResults] = useState([]);
    const [songResults, setSongResults] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // STATE QUẢN LÝ PHÂN TRANG (CHO PHIM)
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); 
    const [pageInput, setPageInput] = useState('');

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const keyword = searchParams.get('q');
    const searchType = searchParams.get('type'); 

    // TỪ ĐIỂN MAP THỂ LOẠI -> ID TMDB
    const genreMap = {
        "Hành động": 28, "Tình cảm": 10749, "Hài": 35, 
        "Kinh dị": 27, "Viễn tưởng": 878, "Hoạt hình": 16
    };

    const filterValidMovies = (movies) => {
        return movies.filter(m => m.poster_path !== null && m.backdrop_path !== null && m.overview && m.overview.trim() !== "");
    };

    useEffect(() => {
        if (keyword) {
            const fetchData = async () => {
                setLoading(true);
                setCurrentPage(1); 
                try {
                    let rawMovies = [];
                    let songs = [];
                    const genreId = genreMap[keyword]; 

                    if (searchType === 'movie') {
                        if (genreId) rawMovies = await discoverMovies({ withGenres: genreId });
                        else rawMovies = await searchMovies(keyword);
                    } else if (searchType === 'song') {
                        songs = await searchMusic(keyword);
                    } else {
                        const [m, s] = await Promise.all([
                            genreId ? discoverMovies({ withGenres: genreId }) : searchMovies(keyword),
                            searchMusic(keyword)
                        ]);
                        rawMovies = m;
                        songs = s;
                    }

                    setMovieResults(filterValidMovies(rawMovies || []));
                    const validSongs = Array.isArray(songs) ? songs.filter(s => s.videoId) : [];
                    
                    // Chống trùng lặp nhạc an toàn
                    const uniqueSongs = [];
                    const seenIds = new Set();
                    validSongs.forEach(song => {
                        if (!seenIds.has(song.videoId)) {
                            seenIds.add(song.videoId);
                            uniqueSongs.push(song);
                        }
                    });
                    setSongResults(uniqueSongs);
                    // Ghi log từ khóa tìm kiếm cho AI học (Nếu user đã đăng nhập)
                    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                    if (currentUser && keyword) {
                        fetch('http://localhost:5000/api/log-interaction', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                userId: currentUser.id, 
                                itemId: keyword.toLowerCase(), // Lưu từ khóa vào cột ItemID
                                itemType: searchType || 'mixed', 
                                actionType: 'SEARCH' 
                            })
                        }).catch(err => console.log("Lỗi log search"));
                    }

                } catch (error) {
                    console.error("Lỗi tìm kiếm:", error);
                }
                setLoading(false);
                
            };
            fetchData();
        }
    }, [keyword, searchType]);

    // LOGIC PHÂN TRANG (Áp dụng cho Phim)
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMovies = movieResults.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(movieResults.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };

    const handlePageInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            const pageNumber = Number(pageInput);
            if (pageNumber >= 1 && pageNumber <= totalPages) {
                paginate(pageNumber);
                setPageInput('');
            } else { alert(`Trang không hợp lệ! Nhập từ 1 đến ${totalPages}`); }
        }
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;
        let pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 4) pages.push('...');
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);
            if (currentPage <= 4) { end = 4; start = 2; }
            if (currentPage >= totalPages - 3) { start = totalPages - 3; end = totalPages - 1; }
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 3) pages.push('...');
            pages.push(totalPages);
        }

        return (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '60px', flexWrap: 'wrap' }}>
                <button disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)} className="btn-page"> Trở lại </button>
                {pages.map((page, index) => (
                    <button 
                        key={index} onClick={() => page !== '...' && paginate(page)} disabled={page === '...'}
                        className={`btn-page ${currentPage === page ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                    >
                        {page}
                    </button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)} className="btn-page"> Kế tiếp </button>
            </div>
        );
    };

    return (
        <div style={{ paddingTop: '100px', paddingBottom: '80px', minHeight: '100vh', background: '#0a0a0a', color: 'white' }}>
            
            {/* --- HEADER BỘ ĐIỀU KHIỂN --- */}
            <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 5%', marginBottom: '40px', flexWrap: 'wrap', gap: '20px',
                position: 'sticky', top: '70px', zIndex: 90, background: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(15px)', borderBottom: '1px solid rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>
                        Kết quả cho: <span style={{ color: 'transparent', WebkitTextStroke: '1px #e50914', backgroundImage: 'linear-gradient(to right, #e50914, #1db954)', WebkitBackgroundClip: 'text' }}>"{keyword}"</span>
                    </h2>
                </div>

                {searchType !== 'song' && movieResults.length > itemsPerPage && (
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Đến trang:</span>
                            <input 
                                type="number" placeholder="#" min="1" max={totalPages} value={pageInput}
                                onChange={(e) => setPageInput(e.target.value)} onKeyDown={handlePageInputKeyDown}
                                style={{ width: '50px', padding: '8px', borderRadius: '8px', background: '#111', color: 'white', border: '1px solid #444', textAlign: 'center', outline: 'none' }}
                            />
                        </div>
                        <div style={{ width: '1px', height: '30px', background: '#444' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Hiển thị:</span>
                            <select 
                                value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                style={{ padding: '8px 15px', borderRadius: '8px', background: '#111', color: 'white', border: 'none', outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="40">40</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
                    <div className="modern-spinner" style={{ borderColor: '#e50914 transparent #1db954 transparent' }}></div>
                    <p style={{ color: '#ccc', marginTop: '20px', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px' }}>ĐANG TÌM KIẾM...</p>
                </div>
            ) : (
                <div style={{ padding: '0 5%' }}>
                    {/* --- KHU VỰC PHIM --- */}
                    {searchType !== 'song' && movieResults.length > 0 && (
                        <div style={{ marginBottom: '80px' }}>
                            <h3 style={{ color: '#e50914', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem' }}>🎬 PHIM LIÊN QUAN ({movieResults.length})</h3>
                            <div className="media-grid">
                                {currentMovies.map((m, index) => (
                                    <div key={m.id} className="animate-fade-up" style={{ animationDelay: `${index * 0.05}s` }}>
                                        <Card 
                                            id={m.id} type="movie" title={m.title}
                                            image={`${IMAGE_URL}${m.poster_path}`}
                                            subtitle={`Phát hành: ${m.release_date?.substring(0,4) || 'N/A'} • ⭐ ${m.vote_average?.toFixed(1) || 0}`}
                                        />
                                    </div>
                                ))}
                            </div>
                            {renderPagination()}
                        </div>
                    )}

                    {/* --- KHU VỰC NHẠC --- */}
                    {searchType !== 'movie' && songResults.length > 0 && (
                        <div style={{ marginBottom: '40px' }}>
                            <h3 style={{ color: '#1db954', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem' }}>🎵 BÀI HÁT LIÊN QUAN ({songResults.length})</h3>
                            <div className="media-grid">
                                {songResults.map((s, index) => {
                                    let artistName = s.artists && s.artists.length > 0 ? s.artists.map(a => a.name).join(', ') : (s.author?.name || s.author || 'Unknown');
                                    let thumbUrl = s.thumbnails && s.thumbnails.length > 0 ? s.thumbnails[s.thumbnails.length - 1].url : 'https://via.placeholder.com/300';
                                    
                                    return (
                                        <div key={s.videoId || index} className="animate-fade-up" style={{ animationDelay: `${index * 0.05}s` }}>
                                            <Card id={s.videoId} type="song" title={s.title || "Unknown"} subtitle={artistName} image={thumbUrl} />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* KHÔNG CÓ KẾT QUẢ */}
                    {movieResults.length === 0 && songResults.length === 0 && (
                        <div style={{ textAlign: 'center', marginTop: '60px', color: '#555' }}>
                            <h1 style={{ fontSize: '4rem', margin: '0 0 10px 0' }}>🔍</h1>
                            <h2>Không tìm thấy kết quả nào.</h2>
                            <p>Thử tìm kiếm với một từ khóa khác xem sao!</p>
                        </div>
                    )}
                </div>
            )}

            {/* CSS TÍCH HỢP */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeUp {
                    0% { opacity: 0; transform: translateY(30px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                
                .animate-fade-up { 
                    animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
                    opacity: 0; 
                }
                
                .animate-fade-up img {
                    border-radius: 15px !important;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.6);
                    transition: all 0.3s ease;
                }
                
                .modern-spinner { width: 60px; height: 60px; border-radius: 50%; border: 4px solid; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                .btn-page {
                    padding: 10px 18px; background: rgba(255,255,255,0.05); color: #aaa;
                    border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; cursor: pointer;
                    font-weight: bold; font-size: 1rem; transition: all 0.3s ease;
                }
                .btn-page:hover:not(:disabled):not(.dots) { background: rgba(255, 255, 255, 0.1); color: white; transform: translateY(-3px); }
                .btn-page.active { background: linear-gradient(45deg, #e50914, #b20710); color: white; border: none; box-shadow: 0 5px 15px rgba(229, 9, 20, 0.5); transform: translateY(-3px) scale(1.1); }
                .btn-page:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-page.dots { background: transparent; border: none; color: #555; pointer-events: none; }
            `}} />
        </div>
    );
};

export default SearchPage;