import React, { useState, useEffect } from 'react';
import HeroSection from '../Components/HeroSection';
import Card from '../Components/UI/Card';
import { API_KEY, BASE_URL, IMAGE_URL } from '../API/tmdbAPI';
import { fetchSongDetailAI, fetchMusicCharts } from '../API/MusicAPI';

const HomePage = () => {
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
                // 1. LẤY DỮ LIỆU TRENDING TOP 10
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

                // 2. GỢI Ý AI CƠ BẢN CHO TRANG CHỦ
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
    }, []);

    return (
        <div style={{ background: '#121212', minHeight: '100vh', paddingBottom: '50px' }}>
            <HeroSection />

            <div style={{ marginTop: '-30px', position: 'relative', zIndex: 10, paddingLeft: '40px', paddingRight: '40px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#aaa' }}>
                        <h3>⏳ Hệ thống đang tổng hợp dữ liệu...</h3>
                    </div>
                ) : (
                    <>
                        {/* ================= HÀNG 1: TOP 10 TRENDING ================= */}
                    <div style={{ marginTop: '10px' }}>
                        <h2 style={{ color: '#ffc107', textAlign: 'left', marginBottom: '30px', textShadow: '0 2px 10px rgba(255,193,7,0.3)', fontSize: '2rem' }}>
                            🔥 BẢNG XẾP HẠNG TOP 10 HÔM NAY
                        </h2>
                        
                        {/* Container chia đôi màn hình 50/50 */}
                        <div className="trending-grid">
                            
                            {/* ================= CỘT PHIM (TRÁI) ================= */}
                            <div className="trending-column">
                                <h3 className="trending-header movie-header">Top 10 Phim</h3>
                                <div className="trending-list">
                                    {trendingMovies.map((m, index) => (
                                        <div key={m.id} className="trending-card movie-card animate-fade-right" style={{ animationDelay: `${index * 0.05}s` }}>
                                            {/* Số thứ tự mờ chìm phía sau */}
                                            <div className="bg-number">{index + 1}</div>
                                            
                                            <h2 className="rank-number" style={{ color: index < 3 ? '#ffc107' : '#888' }}>#{index + 1}</h2>
                                            <img src={`${IMAGE_URL}${m.poster_path}`} alt={m.title} className="trending-img" />
                                            
                                            <div className="trending-info">
                                                <div className="trending-title">{m.title}</div>
                                                <div className="trending-meta">⭐ {m.vote_average?.toFixed(1)} • {m.release_date?.substring(0,4) || 'N/A'}</div>
                                            </div>
                                            
                                            {/* Lớp phủ click toàn phần */}
                                            <a href={`/movie/${m.id}`} className="full-link"></a>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ================= CỘT NHẠC (PHẢI) ================= */}
                            <div className="trending-column">
                                <h3 className="trending-header song-header">Top 10 Bài Hát</h3>
                                <div className="trending-list">
                                    {trendingSongs.map((s, index) => {
                                        // Fake điểm và năm cho đồng bộ giao diện
                                        const fakeRating = (5.0 - (index * 0.1)).toFixed(1); 
                                        const fakeYear = new Date().getFullYear();

                                        return (
                                        <div key={s.id} className="trending-card song-card animate-fade-left" style={{ animationDelay: `${index * 0.05}s` }}>
                                            <div className="bg-number">{index + 1}</div>
                                            
                                            <h2 className="rank-number" style={{ color: index < 3 ? '#ffc107' : '#888' }}>#{index + 1}</h2>
                                            <img src={s.image} alt={s.title} className="trending-img song-img" />
                                            
                                            <div className="trending-info">
                                                <div className="trending-title">{s.title}</div>
                                                <div className="trending-artist">{s.artist}</div>
                                                <div className="trending-meta">⭐ {fakeRating} • {fakeYear}</div>
                                            </div>
                                            
                                            <a href={`/song/${s.id}`} className="full-link"></a>
                                        </div>
                                    )})}
                                </div>
                            </div>
                            
                        </div>
                    </div>
            {/* --- CSS CHO TOÀN BỘ HIỆU ỨNG VÀ BỐ CỤC CHIA ĐÔI --- */}
            <style dangerouslySetInnerHTML={{__html: `
                /* BỐ CỤC CHIA ĐÔI 50/50 */
                .trending-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                }
                
                @media (max-width: 1000px) {
                    .trending-grid { grid-template-columns: 1fr; }
                }

                .trending-column {
                    display: flex;
                    flex-direction: column;
                }

                /* TIÊU ĐỀ CỘT */
                .trending-header {
                    padding-bottom: 10px;
                    display: inline-block;
                    margin-bottom: 25px;
                    font-size: 1.6rem;
                    font-weight: 800;
                    letter-spacing: 1px;
                }
                .movie-header { color: #e50914; border-bottom: 3px solid #e50914; }
                .song-header { color: #1db954; border-bottom: 3px solid #1db954; }

                .trending-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                /* THẺ CARD CHÍNH */
                .trending-card {
                    display: flex;
                    align-items: center;
                    background: rgba(255,255,255,0.03);
                    padding: 10px;
                    border-radius: 15px;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.05);
                    height: 100px;
                    box-sizing: border-box;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    cursor: pointer;
                }

                /* HIỆU ỨNG HOVER */
                .trending-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    background: rgba(255,255,255,0.08);
                    z-index: 10;
                }
                
                /* Đổ bóng màu đỏ cho Phim */
                .movie-card:hover { 
                    border-color: #e50914; 
                    box-shadow: 0 15px 30px rgba(229, 9, 20, 0.25); 
                }
                
                /* Đổ bóng màu xanh cho Nhạc */
                .song-card:hover { 
                    border-color: #1db954; 
                    box-shadow: 0 15px 30px rgba(29, 185, 84, 0.25); 
                }
                
                /* Hiệu ứng Click lún xuống */
                .trending-card:active {
                    transform: scale(0.96);
                    transition: all 0.1s;
                }

                /* HÌNH ẢNH TRONG CARD */
                .trending-img {
                    width: 55px; height: 80px;
                    object-fit: cover; border-radius: 8px;
                    margin: 0 15px; z-index: 2;
                    transition: all 0.4s ease;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                }
                .song-img { width: 80px; height: 80px; } 
                
                .trending-card:hover .trending-img { 
                    transform: scale(1.1) rotate(3deg); 
                }

                /* THÔNG TIN CHỮ */
                .trending-info { z-index: 2; flex: 1; overflow: hidden; }
                .trending-title {
                    color: white; font-weight: bold; font-size: 1.1rem;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    transition: color 0.3s;
                }
                .movie-card:hover .trending-title { color: #ff4d4d; }
                .song-card:hover .trending-title { color: #1db954; }

                .trending-artist { color: #bbb; font-size: 0.9rem; margin-top: 2px; }
                .trending-meta { color: #777; font-size: 0.8rem; margin-top: 5px; font-weight: bold; }

                /* SỐ THỨ TỰ & SỐ NỀN */
                .rank-number { width: 45px; margin: 0; text-align: center; z-index: 2; font-size: 1.8rem; font-style: italic; }
                
                .bg-number {
                    position: absolute; left: -10px; top: 50%; transform: translateY(-50%);
                    font-size: 7rem; font-weight: 900; font-style: italic;
                    color: rgba(255,255,255,0.015); transition: all 0.5s ease;
                    pointer-events: none;
                }
                .trending-card:hover .bg-number { 
                    color: rgba(255,255,255,0.04); 
                    transform: translateY(-50%) translateX(20px); 
                }

                .full-link { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; }

                /* ANIMATION KHI LOAD TRANG */
                @keyframes fadeRight { 0% { opacity: 0; transform: translateX(-50px); } 100% { opacity: 1; transform: translateX(0); } }
                @keyframes fadeLeft { 0% { opacity: 0; transform: translateX(50px); } 100% { opacity: 1; transform: translateX(0); } }
                
                .animate-fade-right { animation: fadeRight 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
                .animate-fade-left { animation: fadeLeft 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
            `}} />
                        
                    </>
                )}
            </div>
        </div>
        
    );
};

export default HomePage;