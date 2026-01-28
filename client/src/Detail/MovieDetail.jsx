import { useEffect, useState } from 'react';
import { useParams, Link, href } from 'react-router-dom';
import { logInteraction } from '../API/trackingService';

function MovieDetail() {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [recommendations, setRecommendations] = useState([]); // <--- Thêm state này

    // Khi ID thay đổi (người dùng bấm vào phim gợi ý), chạy lại effect
    useEffect(() => {
        window.scrollTo(0, 0); // Cuộn lên đầu trang khi chuyển phim

        // 1. Lấy chi tiết phim
        fetch(`http://localhost:5000/api/movies/${id}`)
            .then(res => res.json())
            .then(data => setMovie(data))
            .catch(err => console.error("Lỗi lấy phim:", err));

        // 2. Lấy danh sách gợi ý (AI) <--- Thêm đoạn này
        fetch(`http://localhost:5000/api/movies/${id}/recommend`)
            .then(res => res.json())
            .then(data => setRecommendations(data))
            .catch(err => console.error("Lỗi lấy gợi ý:", err));

        if(id){
            logInteraction(id, 'movie', 'view');
            }
    }, [id]);

    console.log("Dữ liệu phim nhận được:", movie); 
    // ----------------------------------

    if (!movie) return <div style={{color:'white', padding: 20}}>⏳ Đang tải...</div>;
// ...

    if (!movie) return <div style={{color:'white', padding: 20}}>⏳ Đang tải...</div>;
// Hàm giúp chuyển đổi mọi link YouTube sang dạng Embed hợp lệ
const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // Tìm ID video trong đường dẫn
    // Hỗ trợ cả 2 dạng: youtube.com/watch?v=ID và youtu.be/ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    // Nếu tìm thấy ID (có 11 ký tự), trả về link embed chuẩn
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }

    return null; // Trả về null nếu link không hợp lệ
};

    return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: '#141414', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Thanh điều hướng nhanh */}
            <Link to="/" style={{ color: '#aaa', textDecoration: 'none', display:'flex', alignItems:'center', gap: 5, marginBottom: 20 }}>
                <span>⬅</span> Quay lại danh sách
            </Link>
            
            <div className="detail-content" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                
                {/* CỘT TRÁI: POSTER LỚN */}
                <div style={{ flex: '0 0 300px' }}>
                    <img 
                        src={movie.PosterURL || "https://via.placeholder.com/300x450?text=No+Image"} 
                        alt={movie.Title} 
                        style={{ width: '100%', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    />
                     <p><strong>🏷️ Từ khóa:</strong> <span style={{color: '#aaa', fontStyle: 'italic'}}>{movie.Tags}</span></p>
                </div>

                {/* CỘT PHẢI: THÔNG TIN & TRAILER */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h1 style={{ fontSize: '3.5rem', margin: '0 0 10px 0', lineHeight: 1.1 }}>{movie.Title}</h1>
                    <p style={{ lineHeight: '1.6', fontSize: '1.1rem', color: '#ddd', marginBottom: '30px' }}>{movie.Description}</p>

                    {/* --- PHẦN TRAILER (QUAN TRỌNG) --- */}
                    {/* Gọi hàm lấy link chuẩn trước */}
                    {getEmbedUrl(movie.TrailerURL) && (
                        <div style={{ marginBottom: '40px' }}>
                            <h3 style={{ borderLeft: '4px solid #e50914', paddingLeft: '10px', marginBottom: '15px' }}>
                                🎥 Trailer
                            </h3>
                            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', background: '#000' }}>
                                <iframe 
                                    src={getEmbedUrl(movie.TrailerURL)} // <--- Dùng hàm vừa viết để bọc link lại
                                    title="Movie Trailer"
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    )}
                    {/* --------------------------------- */}
                </div>
            </div>

            <div style={{ marginTop: '50px', borderTop: '1px solid #333', paddingTop: '30px' }}>
                <h2 style={{ color: '#ffcc00' }}>🤖 Có thể bạn cũng thích:</h2>
                {recommendations.length === 0 ? <p>Chưa có dữ liệu.</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                        {recommendations.map(rec => (
                            <Link key={rec.MovieID} to={`/movie/${rec.MovieID}`} style={{ textDecoration: 'none', color: 'white' }}>
                                <div style={{ background: '#222', borderRadius: '8px', overflow: 'hidden', transition: '0.3s' }}>
                                    <img src={rec.PosterURL || "https://via.placeholder.com/300x450"} style={{width:'100%', height:'250px', objectFit:'cover'}} />
                                    <div style={{padding:10}}>
                                        <h4 style={{margin:0, fontSize:'1rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{rec.Title}</h4>
                                        <small style={{color:'#aaa'}}>Độ trùng: {rec.score}</small>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MovieDetail;