import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../Components/UI/Card';
import { searchMovies, discoverMovies, IMAGE_URL } from '../API/tmdbAPI';
import { searchMusic } from '../API/MusicAPI';

const SearchPage = () => {
    // State lưu dữ liệu tổng
    const [movieResults, setMovieResults] = useState([]);
    const [songResults, setSongResults] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // 👇 STATE CHO PHÂN TRANG (MỚI)
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // Mặc định 10 phim/trang như yêu cầu
    const [pageInput, setPageInput] = useState('');

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const keyword = searchParams.get('q');
    const searchType = searchParams.get('type'); 

    // TỪ ĐIỂN MAP TÊN THỂ LOẠI SANG ID
    const genreMap = {
        "Hành động": 28, "Tình cảm": 10749, "Hài": 35, 
        "Kinh dị": 27, "Viễn tưởng": 878, "Hoạt hình": 16
    };

    // Hàm lọc dữ liệu rác từ TMDB
    const filterValidMovies = (movies) => {
        return movies.filter(m => 
            m.poster_path !== null &&   // Phải có ảnh bìa
            m.backdrop_path !== null && // Phải có ảnh nền
            m.overview && m.overview.trim() !== "" // Phải có mô tả
        );
    };

    useEffect(() => {
        if (keyword) {
            const fetchData = async () => {
                setLoading(true);
                setCurrentPage(1); // Reset về trang 1 khi tìm từ khóa mới
                try {
                    let rawMovies = [];
                    let songs = [];
                    const genreId = genreMap[keyword]; 

                    // GỌI API DỰA TRÊN TYPE
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

                    // 👇 ÁP DỤNG BỘ LỌC PHIM RÁC
                    const cleanMovies = filterValidMovies(rawMovies || []);
                    setMovieResults(cleanMovies);

                    const validSongs = Array.isArray(songs) ? songs.filter(s => s.videoId) : [];
                    setSongResults(validSongs);

                } catch (error) {
                    console.error("Lỗi tìm kiếm:", error);
                }
                setLoading(false);
            };

            fetchData();
        }
    }, [keyword, searchType]);


    // ========================================================
    // 👇 LOGIC PHÂN TRANG (Giống hệt MovieList)
    // ========================================================
    
    // Tính toán cắt mảng để hiển thị cho trang hiện tại
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
            } else {
                alert(`Vui lòng nhập số từ 1 đến ${totalPages}`);
            }
        }
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null; // Không có gì để phân trang

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
            <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '30px' }}>
                <button disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)} style={btnPageStyle}> &lt; </button>
                {pages.map((page, index) => (
                    <button 
                        key={index}
                        onClick={() => page !== '...' && paginate(page)}
                        disabled={page === '...'}
                        style={{
                            ...btnPageStyle,
                            background: currentPage === page ? '#e50914' : '#333',
                            color: currentPage === page ? 'white' : '#ccc',
                            border: currentPage === page ? '1px solid #e50914' : '1px solid #444',
                            cursor: page === '...' ? 'default' : 'pointer'
                        }}
                    >
                        {page}
                    </button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)} style={btnPageStyle}> &gt; </button>
            </div>
        );
    };

    return (
        <div style={{ paddingTop: '80px', paddingBottom: '50px', minHeight: '100vh', background: '#121212', color: 'white' }}>
            <div style={{ padding: '0 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0 }}>
                        Kết quả cho: <span style={{ color: '#e50914', fontStyle: 'italic' }}>"{keyword}"</span>
                    </h2>
                    
                    {/* BỘ ĐIỀU KHIỂN SỐ LƯỢNG & TÌM TRANG CHỈ HIỆN KHI CÓ PHIM */}
                    {searchType !== 'song' && movieResults.length > itemsPerPage && (
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', fontSize: '0.9rem' }}>
                            <div>
                                Tới trang: 
                                <input 
                                    type="number" min="1" max={totalPages} value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)} onKeyDown={handlePageInputKeyDown} placeholder="#"
                                    style={{ marginLeft: '5px', padding: '4px', width: '40px', borderRadius: '4px', background: '#333', color: 'white', border: '1px solid #444', textAlign: 'center' }}
                                />
                            </div>
                            <div>
                                Hiển thị: 
                                <select 
                                    value={itemsPerPage} 
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    style={{ marginLeft: '5px', padding: '4px', borderRadius: '4px', background: '#333', color: 'white', border: 'none' }}
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
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>
                        <h3>⏳ Đang quét dữ liệu...</h3>
                    </div>
                ) : (
                    <>
                        {/* --- KHU VỰC PHIM (Đã cắt theo Phân trang) --- */}
                        {searchType !== 'song' && movieResults.length > 0 && (
                            <div style={{ marginBottom: '60px' }}>
                                <h3 style={{ color: '#e50914', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    🎬 PHIM LIÊN QUAN ({movieResults.length} kết quả)
                                </h3>
                                
                                <div className="media-grid">
                                    {currentMovies.map(m => (
                                        <Card 
                                            key={m.id} id={m.id} type="movie" title={m.title}
                                            image={`${IMAGE_URL}${m.poster_path}`}
                                            subtitle={`Năm: ${m.release_date?.substring(0,4) || 'N/A'}`}
                                        />
                                    ))}
                                </div>
                                
                                {/* HIỂN THỊ NÚT PHÂN TRANG */}
                                {renderPagination()}
                            </div>
                        )}

                        {/* --- KHU VỰC NHẠC --- */}
                        {searchType !== 'movie' && songResults.length > 0 && (
                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ color: '#1db954', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>🎵 BÀI HÁT LIÊN QUAN</h3>
                                <div className="media-grid">
                                    {songResults.map((s, index) => (
                                        <Card 
                                            key={s.videoId || index} id={s.videoId} type="song" title={s.title}
                                            image={s.thumbnails ? s.thumbnails[s.thumbnails.length - 1].url : ''}
                                            subtitle={s.artists ? s.artists[0].name : ''}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Không tìm thấy */}
                        {movieResults.length === 0 && songResults.length === 0 && (
                            <div style={{ textAlign: 'center', marginTop: '50px', color: '#555' }}>
                                <h1>🔍</h1>
                                <h3>Không tìm thấy kết quả nào đủ chất lượng.</h3>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Style cho nút phân trang
const btnPageStyle = {
    padding: '8px 14px', background: '#333', color: 'white',
    border: '1px solid #444', borderRadius: '4px', cursor: 'pointer',
    fontWeight: 'bold', transition: 'all 0.3s'
};

export default SearchPage;