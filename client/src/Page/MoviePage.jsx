import React, { useState, useEffect } from 'react';
import Card from '../Components/UI/Card'; 
import { fetchMovies, discoverMovies, fetchGenres, IMAGE_URL } from '../API/tmdbAPI';

function MoviePage() {
    const [movies, setMovies] = useState([]);
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // STATE CHO BỘ LỌC
    const [filters, setFilters] = useState({
        sortBy: 'popularity.desc',
        withGenres: '',
        releaseYear: '',
        region: ''
    });

    // STATE QUẢN LÝ PHÂN TRANG
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [pageInput, setPageInput] = useState('');

    // Load dữ liệu ban đầu
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const genreList = await fetchGenres();
            setGenres(genreList);
            // Lấy khoảng 5 trang (100 phim) để demo phân trang
            const initialMovies = await fetchMovies(5); 
            setMovies(initialMovies.filter(m => m.poster_path));
            setLoading(false);
        };
        init();
    }, []);

    // Xử lý khi thay đổi bộ lọc
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    // Nút áp dụng lọc
    const applyFilter = async () => {
        setLoading(true);
        const results = await discoverMovies(filters);
        setMovies(results.filter(m => m.poster_path));
        setCurrentPage(1); // Reset về trang 1 khi lọc
        setLoading(false);
    };

    // LOGIC PHÂN TRANG
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMovies = movies.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(movies.length / itemsPerPage);

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
                alert(`Trang không hợp lệ! Vui lòng nhập từ 1 đến ${totalPages}`); 
            }
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
            
            {/* --- HEADER TIÊU ĐỀ --- */}
            <div style={{ textAlign: 'center', marginBottom: '30px', padding: '0 20px' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'transparent', WebkitTextStroke: '1px #e50914', backgroundImage: 'linear-gradient(to right, #e50914, #b20710)', WebkitBackgroundClip: 'text', margin: 0 }}>
                    KHO PHIM ĐIỆN ẢNH
                </h1>
                <p style={{ color: '#888', marginTop: '10px', fontSize: '1.1rem' }}>Tìm kiếm và khám phá hàng ngàn tác phẩm yêu thích</p>
            </div>

           {/* --- BỘ ĐIỀU KHIỂN: LỌC & PHÂN TRANG (SIÊU CẤP HIỆN ĐẠI) --- */}
            <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 5%', marginBottom: '40px', flexWrap: 'wrap', gap: '20px',
                position: 'sticky', top: '70px', zIndex: 90, 
                background: 'rgba(15, 15, 15, 0.85)', backdropFilter: 'blur(20px)', 
                borderBottom: '1px solid rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                
                {/* Khu vực Lọc (Filters) */}
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select name="withGenres" onChange={handleFilterChange} className="modern-select animated-input">
                        <option value="">🔮 Tất cả thể loại</option>
                        {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>

                    <select name="releaseYear" onChange={handleFilterChange} className="modern-select animated-input">
                        <option value="">📅 Năm phát hành</option>
                        {Array.from({length: 20}, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <select name="sortBy" onChange={handleFilterChange} className="modern-select animated-input">
                        <option value="popularity.desc">🔥 Phổ biến nhất</option>
                        <option value="vote_average.desc">⭐ Đánh giá cao nhất</option>
                        <option value="primary_release_date.desc">⚡ Mới nhất (Đến hôm nay)</option>
                    </select>

                    <button onClick={applyFilter} className="btn-filter shine-effect">
                        <span style={{ position: 'relative', zIndex: 2 }}>🚀 LỌC PHIM NÂNG CAO</span>
                    </button>
                </div>

                {/* Khu vực Phân trang Nhanh */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>Trang:</span>
                        <input 
                            type="number" placeholder="#" min="1" max={totalPages} value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)} onKeyDown={handlePageInputKeyDown}
                            className="animated-input"
                            style={{ width: '60px', padding: '8px', borderRadius: '8px', background: '#111', color: '#e50914', border: '1px solid #444', textAlign: 'center', fontWeight: 'bold', outline: 'none' }}
                        />
                    </div>
                    <div style={{ width: '1px', height: '30px', background: '#444' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>Hiển thị:</span>
                        <select 
                            value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="modern-select animated-input" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
                        >
                            <option value="10">10 phim</option>
                            <option value="20">20 phim</option>
                            <option value="40">40 phim</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- HIỂN THỊ DANH SÁCH --- */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
                    <div className="modern-spinner" style={{ borderColor: '#e50914 transparent #e50914 transparent' }}></div>
                    <p style={{ color: '#e50914', marginTop: '20px', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px' }}>ĐANG TẢI KHO PHIM...</p>
                </div>
            ) : (
                <>
                    <div className="media-grid" style={{ padding: '0 5%' }}>
                        {currentMovies.length > 0 ? currentMovies.map((m, index) => (
                            <div key={m.id} className="animate-fade-up" style={{ animationDelay: `${index * 0.05}s` }}>
                                <Card 
                                    id={m.id} type="movie" title={m.title}
                                    image={m.poster_path ? `${IMAGE_URL}${m.poster_path}` : 'https://via.placeholder.com/300x450'}
                                    subtitle={`Phát hành: ${m.release_date?.substring(0,4) || 'N/A'} • ⭐ ${m.vote_average?.toFixed(1) || 0}`}
                                />
                            </div>
                        )) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '40px', color: '#555' }}>
                                <h1 style={{ fontSize: '4rem', margin: '0 0 10px 0' }}>🎬</h1>
                                <h2>Không tìm thấy phim phù hợp!</h2>
                                <p>Hãy thử thay đổi điều kiện lọc ở phía trên nhé.</p>
                            </div>
                        )}
                    </div>
                    {renderPagination()}
                </>
            )}

            {/* CSS CHUYÊN DỤNG CHO TRANG PHIM */}
            <style dangerouslySetInnerHTML={{__html: `
            /* HIỆU ỨNG CHO SELECT BOX (BAY LÊN, ĐỔI MÀU, SHADOW) */
                .animated-input {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    transform-origin: center;
                }
                .animated-input:focus, .animated-input:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 8px 20px rgba(229, 9, 20, 0.2);
                    border-color: #e50914 !important;
                    background: rgba(20, 20, 20, 0.9) !important;
                }

                /* NÚT BẤM LỌC PHIM CHUYÊN NGHIỆP */
                .btn-filter {
                    padding: 12px 30px; 
                    background: linear-gradient(45deg, #e50914, #b20710); 
                    color: white; 
                    border: none; 
                    border-radius: 10px; 
                    cursor: pointer; 
                    font-weight: 900; 
                    font-size: 1rem;
                    box-shadow: 0 5px 20px rgba(229, 9, 20, 0.4); 
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    letter-spacing: 1px;
                }

                .btn-filter:hover {
                    transform: translateY(-4px) scale(1.05);
                    box-shadow: 0 10px 30px rgba(229, 9, 20, 0.7);
                }

                .btn-filter:active {
                    transform: translateY(0) scale(0.95);
                }

                /* HIỆU ỨNG TIA SÁNG QUÉT QUA NÚT (SHINE EFFECT) */
                .shine-effect::before {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%;
                    width: 50%; height: 100%;
                    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
                    transform: skewX(-25deg);
                    transition: all 0.7s ease;
                    z-index: 1;
                }

                .btn-filter:hover::before {
                    left: 200%;
                    transition: all 0.7s ease;
                }
                    
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

                .modern-select {
                    padding: 10px 15px; border-radius: 8px; background: rgba(255,255,255,0.05); color: white;
                    border: 1px solid rgba(255,255,255,0.1); outline: none; cursor: pointer; transition: border 0.3s;
                }
                .modern-select:hover, .modern-select:focus { border-color: #e50914; }
                .modern-select option { background: #111; color: white; }

                .btn-page {
                    padding: 10px 18px; background: rgba(255,255,255,0.05); color: #aaa;
                    border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; cursor: pointer;
                    font-weight: bold; font-size: 1rem; transition: all 0.3s ease;
                }
                .btn-page:hover:not(:disabled):not(.dots) {
                    background: rgba(229, 9, 20, 0.2); color: #e50914; border-color: #e50914; transform: translateY(-3px);
                }
                .btn-page.active {
                    background: linear-gradient(45deg, #e50914, #b20710); color: white; border: none;
                    box-shadow: 0 5px 15px rgba(229, 9, 20, 0.5); transform: translateY(-3px) scale(1.1);
                }
                .btn-page:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-page.dots { background: transparent; border: none; color: #555; pointer-events: none; }
            `}} />
        </div>
    );
}

export default MoviePage;