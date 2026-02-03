import { useState, useEffect } from 'react';
import Card from '../Components/UI/Card'; 
import { fetchMovies, discoverMovies, fetchGenres, IMAGE_URL } from '../API/tmdbAPI';

function MoviePage() {
    const [movies, setMovies] = useState([]);
    const [genres, setGenres] = useState([]);
    
    // State cho bộ lọc
    const [filters, setFilters] = useState({
        sortBy: 'popularity.desc',
        withGenres: '',
        releaseYear: '',
        region: ''
    });

    // Load dữ liệu ban đầu
    useEffect(() => {
        const init = async () => {
            const genreList = await fetchGenres();
            setGenres(genreList);
            const initialMovies = await fetchMovies(2); // Lấy 2 trang mặc định
            setMovies(initialMovies);
        };
        init();
    }, []);

    // Xử lý khi thay đổi bộ lọc
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    // Nút áp dụng lọc
    const applyFilter = async () => {
        const results = await discoverMovies(filters);
        setMovies(results);
    };

    return (
        <div style={{ paddingTop: '80px', paddingBottom: '50px' }}>
            <h2 style={{ color: '#e50914', paddingLeft: '40px', borderLeft: '5px solid #e50914', marginLeft: '20px' }}>
                KHO PHIM (MOVIE PAGE)
            </h2>

            {/* --- THANH CÔNG CỤ LỌC --- */}
            <div style={{ 
                display: 'flex', gap: '15px', padding: '20px 40px', flexWrap: 'wrap', 
                background: '#1a1a1a', margin: '20px 0', alignItems: 'center' 
            }}>
                {/* Lọc Thể loại */}
                <select name="withGenres" onChange={handleFilterChange} style={filterStyle}>
                    <option value="">-- Tất cả thể loại --</option>
                    {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>

                {/* Lọc Năm */}
                <select name="releaseYear" onChange={handleFilterChange} style={filterStyle}>
                    <option value="">-- Năm phát hành --</option>
                    {Array.from({length: 20}, (_, i) => 2024 - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>

                {/* Sắp xếp */}
                <select name="sortBy" onChange={handleFilterChange} style={filterStyle}>
                    <option value="popularity.desc">Phổ biến nhất</option>
                    <option value="vote_average.desc">Đánh giá cao nhất</option>
                    <option value="primary_release_date.desc">Mới nhất</option>
                </select>

                <button onClick={applyFilter} style={{ 
                    padding: '10px 25px', background: '#e50914', color: 'white', 
                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
                }}>
                    LỌC PHIM
                </button>
            </div>

            {/* --- DANH SÁCH PHIM --- */}
            <div className="media-grid">
                {movies.map(m => (
                    <Card 
                        key={m.id} id={m.id} type="movie" title={m.title}
                        image={m.poster_path ? `${IMAGE_URL}${m.poster_path}` : ''}
                        subtitle={`Năm: ${m.release_date?.substring(0,4)} • ⭐ ${m.vote_average}`}
                    />
                ))}
            </div>
        </div>
    );
}

const filterStyle = { padding: '10px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' };

export default MoviePage;