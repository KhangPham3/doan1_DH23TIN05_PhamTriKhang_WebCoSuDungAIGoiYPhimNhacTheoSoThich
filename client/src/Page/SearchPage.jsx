import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../Components/UI/Card';
import { searchMovies, IMAGE_URL } from '../API/tmdbAPI';
import { searchMusic } from '../API/MusicAPI';

const SearchPage = () => {
    const [movieResults, setMovieResults] = useState([]);
    const [songResults, setSongResults] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const keyword = searchParams.get('q');
    
    // 👇 QUAN TRỌNG: Lấy biến 'type' (movie hoặc song) từ URL
    const searchType = searchParams.get('type'); 

    useEffect(() => {
        if (keyword) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    let movies = [];
                    let songs = [];

                    // CHỈ GỌI NHỮNG GÌ CẦN THIẾT
                    if (searchType === 'movie') {
                        // Người dùng click thể loại Phim -> Chỉ tìm trên TMDB
                        movies = await searchMovies(keyword);
                    } else if (searchType === 'song') {
                        // Người dùng click thể loại Nhạc -> Chỉ tìm trên YouTube
                        songs = await searchMusic(keyword);
                    } else {
                        // Người dùng gõ vào ô search (không có type) -> Tìm cả hai
                        const [m, s] = await Promise.all([
                            searchMovies(keyword),
                            searchMusic(keyword)
                        ]);
                        movies = m;
                        songs = s;
                    }

                    // Cập nhật State
                    setMovieResults(movies || []);
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

    return (
        <div style={{ paddingTop: '80px', paddingBottom: '50px', minHeight: '100vh', background: '#121212', color: 'white' }}>
            <div style={{ padding: '0 40px' }}>
                <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '30px' }}>
                    Kết quả tìm kiếm cho: <span style={{ color: '#e50914', fontStyle: 'italic' }}>"{keyword}"</span>
                </h2>

                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>
                        <h3>⏳ Đang quét dữ liệu...</h3>
                    </div>
                ) : (
                    <>
                        {/* --- KHU VỰC PHIM --- */}
                        {/* Nếu type là 'song', khối này sẽ KHÔNG bao giờ render */}
                        {searchType !== 'song' && movieResults.length > 0 && (
                            <div style={{ marginBottom: '60px' }}>
                                <h3 style={{ color: '#e50914', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>🎬 PHIM LIÊN QUAN</h3>
                                <div className="media-grid">
                                    {movieResults.map(m => (
                                        <Card 
                                            key={m.id} id={m.id} type="movie" title={m.title}
                                            image={m.poster_path ? `${IMAGE_URL}${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}
                                            subtitle={`Năm: ${m.release_date?.substring(0,4) || 'N/A'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- KHU VỰC NHẠC --- */}
                        {/* Nếu type là 'movie', khối này sẽ KHÔNG bao giờ render */}
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

                        {/* Nếu không tìm thấy gì cả */}
                        {movieResults.length === 0 && songResults.length === 0 && (
                            <div style={{ textAlign: 'center', marginTop: '50px', color: '#555' }}>
                                <h1>🔍</h1>
                                <h3>Không tìm thấy kết quả nào phù hợp.</h3>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SearchPage;