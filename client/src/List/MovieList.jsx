import React, { useState, useEffect } from 'react';
import Card from '../Components/UI/Card'; 
import { fetchMovies, IMAGE_URL } from '../API/tmdbAPI';

function MovieList() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // STATE QUẢN LÝ PHÂN TRANG
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [pageInput, setPageInput] = useState('');

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Lấy khoảng 100 phim để demo phân trang cho thoải mái
                const initialMovies = await fetchMovies(5); 
                // Lọc bỏ các phim rác không có ảnh
                setMovies(initialMovies.filter(m => m.poster_path));
            } catch (err) {
                console.error("Lỗi tải phim:", err);
            }
            setLoading(false);
        };
        init();
    }, []);

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
            
            {/* --- HEADER BỘ ĐIỀU KHIỂN (GLASSMORPHISM) --- */}
            <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 5%', marginBottom: '40px', flexWrap: 'wrap', gap: '20px',
                position: 'sticky', top: '70px', zIndex: 90, background: 'rgba(10, 10, 10, 0.7)', backdropFilter: 'blur(15px)', borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: '#e50914', letterSpacing: '-1px' }}>KHO PHIM ĐIỆN ẢNH</h1>
                    <span style={{ color: '#888', fontSize: '0.9rem' }}>Khám phá {movies.length} tác phẩm tuyệt đỉnh</span>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Nhảy đến trang:</span>
                        <input 
                            type="number" placeholder="#" min="1" max={totalPages} value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)} onKeyDown={handlePageInputKeyDown}
                            style={{ width: '60px', padding: '8px', borderRadius: '8px', background: '#111', color: '#e50914', border: '1px solid #444', textAlign: 'center', fontWeight: 'bold', outline: 'none' }}
                        />
                    </div>
                    <div style={{ width: '1px', height: '30px', background: '#444' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Hiển thị:</span>
                        <select 
                            value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            style={{ padding: '8px 15px', borderRadius: '8px', background: '#111', color: 'white', border: '1px solid #444', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="10">10 phim / trang</option>
                            <option value="20">20 phim / trang</option>
                            <option value="40">40 phim / trang</option>
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
                        {currentMovies.map((m, index) => (
                            <div key={m.id} className="animate-fade-up" style={{ animationDelay: `${index * 0.05}s` }}>
                                <Card 
                                    id={m.id} type="movie" title={m.title}
                                    image={m.poster_path ? `${IMAGE_URL}${m.poster_path}` : 'https://via.placeholder.com/300x450'}
                                    subtitle={`Phát hành: ${m.release_date?.substring(0,4)} • ⭐ ${m.vote_average?.toFixed(1)}`}
                                />
                            </div>
                        ))}
                    </div>
                    {renderPagination()}
                </>
            )}

            {/* CSS CHUYÊN DỤNG CHO TRANG PHIM (BAO GỒM BO GÓC POSTER) */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeUp {
                    0% { opacity: 0; transform: translateY(30px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                
                .animate-fade-up { 
                    animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
                    opacity: 0; 
                }
                
                /* 👇 YÊU CẦU CỦA BẠN: BO GÓC POSTER PHIM VÀ THÊM SHADOW HIỆN ĐẠI */
                .animate-fade-up img {
                    border-radius: 15px !important;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.6);
                    transition: all 0.3s ease;
                }
                
                .modern-spinner { width: 60px; height: 60px; border-radius: 50%; border: 4px solid; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                /* Style Nút Phân Trang Kính Mờ */
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

export default MovieList;