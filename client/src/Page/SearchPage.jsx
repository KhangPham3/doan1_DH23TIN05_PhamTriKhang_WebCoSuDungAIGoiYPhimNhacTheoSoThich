import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Card from '../Components/UI/Card';

// 👇 CHỈ IMPORT API BÊN NGOÀI (Tuyệt đối không import API gọi về SQL Localhost)
import { searchMovies, IMAGE_URL } from '../API/tmdbAPI';
import { searchMusic } from '../API/MusicAPI'; 

const Searchpage = () => {
    const [movieResults, setMovieResults] = useState([]);
    const [songResults, setSongResults] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Lấy từ khóa từ URL (ví dụ: /search?q=Batman)
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const keyword = searchParams.get('q');

    useEffect(() => {
        if (keyword) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    console.log(`Đang tìm kiếm trên Cloud cho: ${keyword}`);
                    
                    // 🔥 GỌI SONG SONG 2 API CLOUD (TMDB & YouTube)
                    // Không gọi về localhost:5000 nên không sợ dính dữ liệu SQL cũ
                    const [movies, songs] = await Promise.all([
                        searchMovies(keyword),
                        searchMusic(keyword)
                    ]);

                    setMovieResults(movies || []);
                    
                    // Lọc nhạc để chỉ lấy bài có ID hợp lệ
                    const validSongs = Array.isArray(songs) ? songs.filter(s => s.videoId) : [];
                    setSongResults(validSongs);

                } catch (error) {
                    console.error("Lỗi tìm kiếm:", error);
                }
                setLoading(false);
            };

            fetchData();
        }
    }, [keyword]); // Chạy lại khi từ khóa trên URL thay đổi

    return (
        <div style={{ paddingTop: '80px', paddingBottom: '50px', minHeight: '100vh', background: '#121212', color: 'white' }}>
            <div style={{ padding: '0 40px' }}>
                <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '30px' }}>
                    Kết quả tìm kiếm cho: <span style={{ color: '#e50914', fontStyle: 'italic' }}>"{keyword}"</span>
                </h2>

                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>
                        <h3>⏳ Đang quét dữ liệu toàn cầu...</h3>
                    </div>
                ) : (
                    <>
                        {/* --- KHỐI 1: KẾT QUẢ PHIM (Từ TMDB) --- */}
                        {movieResults.length > 0 && (
                            <div style={{ marginBottom: '60px' }}>
                                <h3 style={{ color: '#e50914', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    🎬 PHIM LIÊN QUAN
                                </h3>
                                <div className="media-grid">
                                    {movieResults.map(m => (
                                        <Card 
                                            key={m.id}
                                            id={m.id}
                                            type="movie"
                                            title={m.title}
                                            // Chỉ lấy ảnh từ TMDB
                                            image={m.poster_path ? `${IMAGE_URL}${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}
                                            subtitle={`Năm: ${m.release_date?.substring(0,4) || 'N/A'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- KHỐI 2: KẾT QUẢ NHẠC (Từ YouTube Music) --- */}
                        {songResults.length > 0 && (
                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ color: '#1db954', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    🎵 BÀI HÁT LIÊN QUAN
                                </h3>
                                <div className="media-grid">
                                    {songResults.map((s, index) => (
                                        <Card 
                                            key={s.videoId || index}
                                            id={s.videoId}
                                            type="song"
                                            title={s.title}
                                            // Ảnh từ Youtube
                                            image={s.thumbnails ? s.thumbnails[s.thumbnails.length - 1].url : ''}
                                            subtitle={s.artists ? s.artists[0].name : ''}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- KHÔNG CÓ KẾT QUẢ --- */}
                        {movieResults.length === 0 && songResults.length === 0 && (
                            <div style={{ textAlign: 'center', marginTop: '50px', color: '#555' }}>
                                <h1>🔍</h1>
                                <h3>Không tìm thấy kết quả nào.</h3>
                                <p>Hãy thử tìm từ khóa khác (Ví dụ: "Marvel", "Son Tung", "Lofi")</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Searchpage;