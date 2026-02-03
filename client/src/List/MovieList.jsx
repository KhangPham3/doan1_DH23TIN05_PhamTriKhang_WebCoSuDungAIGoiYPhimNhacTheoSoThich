import { useState, useEffect } from 'react';
import Card from '../Components/UI/Card'; 
import { fetchMovies, IMAGE_URL } from '../API/tmdbAPI';

function MovieList() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 1. Thêm State để quản lý Trang hiện tại
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số phim hiển thị trên mỗi màn hình (tùy chỉnh)

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            // Lấy khoảng 5 trang từ API (~100 bộ phim) để User tha hồ chọn
            const listPhim = await fetchMovies(5); 
            setMovies(listPhim);
            setLoading(false);
        };
        loadData();
    }, []);

    // 2. Logic tính toán Phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMovies = movies.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(movies.length / itemsPerPage);

    // Hàm chuyển trang
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return <p style={{color:'white', textAlign:'center', padding: '50px'}}>⏳ Đang tải kho phim...</p>;

    return (
        <div className="section-container" style={{ paddingBottom: '50px' }}>
            <h2 style={{color: '#e50914', marginBottom: '30px', paddingLeft: '20px', borderLeft: '4px solid #e50914'}}>
                KHÁM PHÁ KHO PHIM ({movies.length} bộ phim)
            </h2>
            
            <div className="media-grid">
                {currentMovies.map((movie) => (
                    <Card 
                        key={movie.id}
                        id={movie.id}
                        title={movie.title}
                        image={movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : 'https://via.placeholder.com/300'}
                        subtitle={`${movie.release_date?.split('-')[0]} • ⭐ ${movie.vote_average?.toFixed(1)}`}
                    />
                ))}
            </div>

            {/* 3. GIAO DIỆN NÚT PHÂN TRANG */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', gap: '10px' }}>
                <button 
                    onClick={() => paginate(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="btn-pagination"
                >
                    ❮ Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                    <button 
                        key={i + 1} 
                        onClick={() => paginate(i + 1)}
                        style={{
                            padding: '8px 15px',
                            backgroundColor: currentPage === i + 1 ? '#e50914' : '#333',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {i + 1}
                    </button>
                ))}

                <button 
                    onClick={() => paginate(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className="btn-pagination"
                >
                    Sau ❯
                </button>
            </div>
        </div>
    );
}

export default MovieList;