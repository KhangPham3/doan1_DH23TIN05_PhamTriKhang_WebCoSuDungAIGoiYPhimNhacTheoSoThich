import React, { useState, useEffect } from 'react';
import Card from '../Components/UI/Card';
import { API_KEY, BASE_URL, IMAGE_URL } from '../API/tmdbAPI';
import { fetchSongDetailAI, fetchMusicCharts } from '../API/MusicAPI';

const RecommendPage = () => {
    const [aiMovies, setAiMovies] = useState([]);
    const [aiSongs, setAiSongs] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [trendingSongs, setTrendingSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const user = JSON.parse(localStorage.getItem('currentUser'));

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                // 1. LẤY DỮ LIỆU TRENDING TOP 10 (LUÔN CHẠY DÙ CÓ ĐĂNG NHẬP HAY KHÔNG)
                const trendMovieRes = await fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&language=vi-VN`);
                const trendMovieData = await trendMovieRes.json();
                if (trendMovieData.results) {
                    setTrendingMovies(trendMovieData.results.slice(0, 10));
                }

                const trendSongData = await fetchMusicCharts();
                if (Array.isArray(trendSongData)) {
                    const formattedTrendSongs = trendSongData.slice(0, 10).map(s => ({
                        id: s.videoId,
                        title: s.title,
                        artist: s.artists && s.artists.length > 0 ? s.artists[0].name : 'Unknown',
                        image: s.thumbnails && s.thumbnails.length > 0 ? s.thumbnails[s.thumbnails.length - 1].url : ''
                    }));
                    setTrendingSongs(formattedTrendSongs);
                }

                // 2. GỌI API PYTHON ĐỂ LẤY GỢI Ý AI (CHỈ CHẠY KHI ĐÃ ĐĂNG NHẬP)
                if (user && user.id) {
                    const [movieIdsRes, songIdsRes] = await Promise.all([
                        fetch(`http://localhost:8000/api/recommend/movies?userId=${user.id}`),
                        fetch(`http://localhost:8000/api/recommend/songs?userId=${user.id}`)
                    ]);
                    
                    const movieIds = await movieIdsRes.json();
                    const songIds = await songIdsRes.json();

                    if (Array.isArray(movieIds) && movieIds.length > 0) {
                        const moviePromises = movieIds.map(id => fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=vi-VN`).then(r => r.json()));
                        const movieDetails = await Promise.all(moviePromises);
                        setAiMovies(movieDetails.filter(m => m && !m.success===false && m.id)); 
                    }

                    if (Array.isArray(songIds) && songIds.length > 0) {
                        const songPromises = songIds.map(id => fetchSongDetailAI(id));
                        const songDetailsRaw = await Promise.all(songPromises);
                        setAiSongs(songDetailsRaw.filter(s => s && s.info).map(s => ({
                            id: s.info.videoDetails.videoId,
                            title: s.info.videoDetails.title,
                            artist: s.info.videoDetails.author,
                            image: `https://img.youtube.com/vi/${s.info.videoDetails.videoId}/hqdefault.jpg`
                        })));
                    }
                }
            } catch (error) {
                console.error("Lỗi tải dữ liệu Dashboard:", error);
            }
            setLoading(false);
        };

        loadDashboardData();
    }, []); // 👈 Chỉ để mảng rỗng để không bị lặp vô hạn

    return (
        <div style={{ paddingTop: '30px', paddingBottom: '50px', paddingLeft: '40px', paddingRight: '40px', background: 'transparent' }}>
            
            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#aaa' }}>
                    <h3>⏳ Hệ thống đang tổng hợp dữ liệu toàn cầu...</h3>
                </div>
            ) : (
                <>
                    {/* ================= HÀNG 1: TOP 10 TRENDING (AI CŨNG THẤY) ================= */}
                    <div style={{ marginTop: '10px' }}>
                        <h2 style={{ color: '#ffc107', textAlign: 'left', marginBottom: '30px' }}>🔥 BẢNG XẾP HẠNG TOP 10 HÔM NAY</h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                            {/* Cột Phim */}
                            <div>
                                <h3 style={{ color: '#e50914', borderBottom: '2px solid #e50914', paddingBottom: '10px', display: 'inline-block' }}>Top 10 Phim</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                                    {trendingMovies.map((m, index) => (
                                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', background: '#1f1f1f', padding: '10px', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', left: '-15px', fontSize: '4rem', fontWeight: '900', color: 'rgba(255,255,255,0.05)', fontStyle: 'italic' }}>{index + 1}</div>
                                            <h2 style={{ width: '40px', color: index < 3 ? '#ffc107' : '#888', margin: 0, textAlign: 'center', zIndex: 2 }}>#{index + 1}</h2>
                                            <img src={`${IMAGE_URL}${m.poster_path}`} alt="" style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px', margin: '0 15px', zIndex: 2 }} />
                                            <div style={{ zIndex: 2 }}>
                                                <div style={{ color: 'white', fontWeight: 'bold' }}>{m.title}</div>
                                                <div style={{ color: '#aaa', fontSize: '0.8rem' }}>⭐ {m.vote_average?.toFixed(1)} • {m.release_date?.substring(0,4)}</div>
                                            </div>
                                            <a href={`/movie/${m.id}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}></a>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cột Nhạc */}
                            <div>
                                <h3 style={{ color: '#1db954', borderBottom: '2px solid #1db954', paddingBottom: '10px', display: 'inline-block' }}>Top 10 Bài Hát</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                                    {trendingSongs.map((s, index) => (
                                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', background: '#1f1f1f', padding: '10px', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', left: '-15px', fontSize: '4rem', fontWeight: '900', color: 'rgba(255,255,255,0.05)', fontStyle: 'italic' }}>{index + 1}</div>
                                            <h2 style={{ width: '40px', color: index < 3 ? '#ffc107' : '#888', margin: 0, textAlign: 'center', zIndex: 2 }}>#{index + 1}</h2>
                                            <img src={s.image} alt="" style={{ width: '75px', height: '50px', objectFit: 'cover', borderRadius: '4px', margin: '0 15px', zIndex: 2 }} />
                                            <div style={{ zIndex: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                                                <div style={{ color: 'white', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                                                <div style={{ color: '#aaa', fontSize: '0.8rem' }}>{s.artist}</div>
                                            </div>
                                            <a href={`/song/${s.id}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}></a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ================= KHU VỰC CÁ NHÂN HÓA ================= */}
                    {user ? (
                        <>
                            <h1 style={{ color: 'white', borderBottom: '1px solid #333', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '15px', marginTop: '80px' }}>
                                <img src="https://media.giphy.com/media/26n6WvwCRGChtXonm/giphy.gif" alt="AI" style={{ width: '40px', borderRadius: '50%' }} />
                                DÀNH RIÊNG CHO <span style={{color: '#e50914'}}>{user.fullName.toUpperCase()}</span>
                            </h1>

                            {/* GỢI Ý PHIM AI */}
                            <div style={{ marginTop: '40px' }}>
                                <h2 style={{ color: '#e50914', marginBottom: '5px' }}>🎬 Phim Đề Xuất Dựa Trên Hành Vi Của Bạn</h2>
                                <p style={{ color: '#888', marginBottom: '20px', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                    Hệ thống AI phân tích dựa trên thể loại, đạo diễn và các bộ phim bạn đã xem gần đây.
                                </p>
                                
                                {aiMovies.length > 0 ? (
                                    <div className="media-grid">
                                        {aiMovies.map(m => (
                                            <Card key={m.id} id={m.id} type="movie" title={m.title} image={m.poster_path ? `${IMAGE_URL}${m.poster_path}` : 'https://via.placeholder.com/300x450'} subtitle={`⭐ ${m.vote_average?.toFixed(1)}`} />
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '20px', background: '#222', borderRadius: '10px', color: '#aaa', border: '1px dashed #444' }}>
                                        🕵️ Bạn chưa xem đủ phim. Hãy khám phá thêm một vài tác phẩm để AI hiểu rõ sở thích của bạn hơn!
                                    </div>
                                )}
                            </div>

                            {/* GỢI Ý NHẠC AI */}
                            <div style={{ marginTop: '60px' }}>
                                <h2 style={{ color: '#1db954', marginBottom: '5px' }}>🎵 Nhạc Bắt Đúng Gu Của Bạn</h2>
                                <p style={{ color: '#888', marginBottom: '20px', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                    Được AI tuyển chọn dựa trên giai điệu, ca sĩ và các bài hát bạn đã từng thích.
                                </p>

                                {aiSongs.length > 0 ? (
                                    <div className="media-grid">
                                        {aiSongs.map(s => (
                                            <Card key={s.id} id={s.id} type="song" title={s.title} image={s.image} subtitle={s.artist} />
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '20px', background: '#222', borderRadius: '10px', color: '#aaa', border: '1px dashed #444' }}>
                                        🎧 Hãy nghe thử vài bài hát để hệ thống tự động định hình gu âm nhạc của bạn!
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', background: '#1a1a1a', borderRadius: '10px', marginTop: '60px', border: '1px dashed #333' }}>
                            <h2 style={{ color: 'white' }}>🤖 Kích Hoạt Tính Năng Trí Tuệ Nhân Tạo</h2>
                            <p style={{ color: '#aaa', marginBottom: '20px' }}>Đăng nhập để AI có thể phân tích sở thích và tạo ra danh sách phim/nhạc dành riêng cho bạn.</p>
                            <a href="/login" style={{ padding: '10px 30px', background: '#e50914', color: 'white', textDecoration: 'none', borderRadius: '30px', fontWeight: 'bold' }}>Đăng Nhập Ngay</a>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RecommendPage;