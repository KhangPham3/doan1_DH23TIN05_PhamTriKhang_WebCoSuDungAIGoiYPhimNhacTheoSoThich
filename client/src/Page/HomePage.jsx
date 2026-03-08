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
                        <h3>⏳ Hệ thống đang tổng hợp dữ liệu toàn cầu...</h3>
                    </div>
                ) : (
                    <>
                        {/* ================= HÀNG 1: TOP 10 TRENDING ================= */}
                        <div style={{ marginTop: '10px' }}>
                            <h2 style={{ color: '#ffc107', textAlign: 'left', marginBottom: '30px', textShadow: '0 2px 10px rgba(255,193,7,0.3)' }}>🔥 BẢNG XẾP HẠNG TOP 10 HÔM NAY</h2>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                                {/* Cột Phim */}
                                <div>
                                    <h3 style={{ color: '#e50914', borderBottom: '2px solid #e50914', paddingBottom: '10px', display: 'inline-block' }}>Top 10 Phim</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                                        {trendingMovies.map((m, index) => (
                                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ position: 'absolute', left: '-15px', fontSize: '4rem', fontWeight: '900', color: 'rgba(255,255,255,0.03)', fontStyle: 'italic' }}>{index + 1}</div>
                                                <h2 style={{ width: '40px', color: index < 3 ? '#ffc107' : '#888', margin: 0, textAlign: 'center', zIndex: 2 }}>#{index + 1}</h2>
                                                <img src={`${IMAGE_URL}${m.poster_path}`} alt="" style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '8px', margin: '0 15px', zIndex: 2 }} />
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
                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ position: 'absolute', left: '-15px', fontSize: '4rem', fontWeight: '900', color: 'rgba(255,255,255,0.03)', fontStyle: 'italic' }}>{index + 1}</div>
                                                <h2 style={{ width: '40px', color: index < 3 ? '#ffc107' : '#888', margin: 0, textAlign: 'center', zIndex: 2 }}>#{index + 1}</h2>
                                                <img src={s.image} alt="" style={{ width: '75px', height: '50px', objectFit: 'cover', borderRadius: '8px', margin: '0 15px', zIndex: 2 }} />
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

                        
                    </>
                )}
            </div>
        </div>
    );
};

export default HomePage;