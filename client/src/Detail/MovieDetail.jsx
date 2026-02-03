import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_KEY, BASE_URL, IMAGE_URL } from '../API/tmdbAPI';

function MovieDetail() {
    const { id } = useParams(); // Lấy ID phim từ URL
    const [movie, setMovie] = useState(null);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                // Gọi API lấy chi tiết phim theo ID
                const response = await fetch(
                    `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=vi-VN`
                );
                const data = await response.json();
                setMovie(data);
            } catch (error) {
                console.error("Lỗi lấy chi tiết:", error);
            }
        };

        fetchDetail();
    }, [id]);

    if (!movie) return <div style={{color:'white', textAlign:'center', marginTop: 50}}>⏳ Đang tải chi tiết...</div>;

    return (
        <div style={{ color: 'white', paddingBottom: '50px' }}>
            {/* Banner lớn làm nền (Backdrop) */}
            <div style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), #141414), url(${IMAGE_URL}${movie.backdrop_path})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '100px 5%',
                display: 'flex',
                gap: '40px',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                {/* Ảnh Poster bên trái */}
                <img 
                    src={movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : 'https://via.placeholder.com/300'} 
                    alt={movie.title}
                    style={{ width: '300px', borderRadius: '10px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
                />

                {/* Thông tin phim bên phải */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>{movie.title}</h1>
                    <p style={{ fontStyle: 'italic', color: '#ccc', fontSize: '1.2rem' }}>{movie.tagline}</p>
                    
                    <div style={{ display: 'flex', gap: '15px', margin: '20px 0' }}>
                        <span style={{ background: '#e50914', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold' }}>
                            {movie.vote_average?.toFixed(1)} ⭐
                        </span>
                        <span style={{ border: '1px solid white', padding: '5px 10px', borderRadius: '4px' }}>
                            {movie.release_date?.split('-')[0]}
                        </span>
                        <span style={{ border: '1px solid white', padding: '5px 10px', borderRadius: '4px' }}>
                            {movie.runtime} phút
                        </span>
                    </div>

                    <h3 style={{ borderBottom: '2px solid #e50914', display: 'inline-block', marginBottom: '10px' }}>Nội dung</h3>
                    <p style={{ lineHeight: '1.6', fontSize: '1.1rem', color: '#ddd' }}>
                        {movie.overview || "Chưa có mô tả tiếng Việt cho phim này."}
                    </p>
                    
                    {/* Danh sách thể loại */}
                    <div style={{ marginTop: '20px' }}>
                        {movie.genres?.map(g => (
                            <span key={g.id} style={{ marginRight: '10px', color: '#999', background: '#222', padding: '5px 10px', borderRadius: '20px', fontSize: '0.9rem' }}>
                                {g.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MovieDetail;