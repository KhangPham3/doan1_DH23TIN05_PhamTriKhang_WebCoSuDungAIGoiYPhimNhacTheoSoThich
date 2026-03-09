import React, { useState, useEffect } from 'react';
import Card from '../Components/UI/Card';
import { API_KEY, BASE_URL, IMAGE_URL } from '../API/tmdbAPI';
import { fetchSongDetailAI } from '../API/MusicAPI';

const RecommendPage = () => {
    const [activeTab, setActiveTab] = useState('movie'); // 'movie' hoặc 'song'
    const [loading, setLoading] = useState(true);

    const [movieData, setMovieData] = useState({ history: [], popular: [], age: [], content_based: [], personalized: [] });
    const [songData, setSongData] = useState({ history: [], popular: [], age: [], content_based: [], personalized: [] });

    const user = JSON.parse(localStorage.getItem('currentUser'));

    useEffect(() => {
        if (!user || !user.id) return;

        const loadAIData = async () => {
            setLoading(true);
            try {
                // Gọi API Phân tích sâu (Tuổi, Giới tính, Lịch sử...)
                const [mRes, sRes] = await Promise.all([
                    fetch(`http://localhost:8000/api/recommend/dashboard?userId=${user.id}&type=movie`),
                    fetch(`http://localhost:8000/api/recommend/dashboard?userId=${user.id}&type=song`)
                ]);
                const mIds = await mRes.json();
                const sIds = await sRes.json();

                const fetchMovies = async (ids) => {
                    if (!ids || ids.length === 0) return [];
                    const p = ids.map(id => fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=vi-VN`).then(r => r.json()));
                    const res = await Promise.all(p);
                    return res.filter(m => m && m.id);
                };

                const fetchSongs = async (ids) => {
                    if (!ids || ids.length === 0) return [];
                    const p = ids.map(id => fetchSongDetailAI(id));
                    const res = await Promise.all(p);
                    return res.filter(s => s && s.info).map(s => ({
                        id: s.info.videoDetails.videoId,
                        title: s.info.videoDetails.title,
                        artist: s.info.videoDetails.author,
                        image: `https://img.youtube.com/vi/${s.info.videoDetails.videoId}/hqdefault.jpg`
                    }));
                };

                setMovieData({
                    history: await fetchMovies(mIds.history),
                    popular: await fetchMovies(mIds.popular),
                    age: await fetchMovies(mIds.age),
                    content_based: await fetchMovies(mIds.content_based), 
                    personalized: await fetchMovies(mIds.personalized)
                });

                setSongData({
                    history: await fetchSongs(sIds.history),
                    popular: await fetchSongs(sIds.popular),
                    age: await fetchSongs(sIds.age),
                    content_based: await fetchSongs(sIds.content_based), 
                    personalized: await fetchSongs(sIds.personalized)
                });

            } catch (error) {
                console.error("Lỗi tải AI:", error);
            }
            setLoading(false);
        };

        loadAIData();
    }, [user?.id]);

    const renderSection = (title, desc, items, type, icon) => {
        if (!items || items.length === 0) return null; 
        return (
            <div style={{ marginTop: '60px' }}>
                <h2 style={{ color: type === 'movie' ? '#e50914' : '#1db954', marginBottom: '5px', fontSize: '2rem' }}>{icon} {title}</h2>
                <p style={{ color: '#888', marginBottom: '30px', fontStyle: 'italic', fontSize: '1rem' }}>{desc}</p>
                <div className="media-grid">
                    {items.map((i, idx) => (
                        <div key={i.id || idx} className="animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <Card 
                                id={i.id} type={type} title={i.title}
                                image={type === 'movie' ? (i.poster_path ? `${IMAGE_URL}${i.poster_path}` : 'https://via.placeholder.com/300x450') : i.image}
                                subtitle={type === 'movie' ? `⭐ ${i.vote_average?.toFixed(1)}` : i.artist}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (!user) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#0a0a0a' }}>
            <h1 style={{ fontSize: '3rem', color: '#00bcd4', marginBottom: '10px' }}>🔐 Yêu cầu đăng nhập</h1>
            <p style={{ color: '#aaa' }}>Hệ thống AI cần biết bạn là ai để có thể phục vụ tốt nhất.</p>
        </div>
    );

    return (
        <div style={{ paddingTop: '100px', paddingBottom: '100px', paddingLeft: '5%', paddingRight: '5%', background: '#0a0a0a', minHeight: '100vh' }}>
            <h1 style={{ color: 'white', borderBottom: '1px solid #333', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '15px', marginTop: 0 }}>
                <span style={{ fontSize: '3rem', textShadow: '0 0 20px rgba(0, 188, 212, 0.8)' }}>✨</span>
                TỔNG HỢP GỢI Ý CHO RIÊNG BẠN
            </h1>

            {/* TAB CHUYỂN ĐỔI */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '40px', justifyContent: 'center' }}>
                <button 
                    onClick={() => setActiveTab('movie')}
                    style={{ padding: '12px 40px', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '30px', cursor: 'pointer', transition: 'all 0.3s', border: activeTab === 'movie' ? 'none' : '1px solid #333', background: activeTab === 'movie' ? 'linear-gradient(45deg, #e50914, #b20710)' : 'rgba(255,255,255,0.05)', color: 'white', boxShadow: activeTab === 'movie' ? '0 5px 20px rgba(229, 9, 20, 0.5)' : 'none' }}
                >🎬 ĐIỆN ẢNH</button>
                <button 
                    onClick={() => setActiveTab('song')}
                    style={{ padding: '12px 40px', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '30px', cursor: 'pointer', transition: 'all 0.3s', border: activeTab === 'song' ? 'none' : '1px solid #333', background: activeTab === 'song' ? 'linear-gradient(45deg, #1db954, #128c3c)' : 'rgba(255,255,255,0.05)', color: 'white', boxShadow: activeTab === 'song' ? '0 5px 20px rgba(29, 185, 84, 0.5)' : 'none' }}
                >🎵 ÂM NHẠC</button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '100px', color: '#00bcd4' }}>
                    <div className="modern-spinner" style={{ borderColor: '#00bcd4 transparent #00bcd4 transparent', margin: '0 auto' }}></div>
                    <h3 style={{ marginTop: '20px', letterSpacing: '2px' }}>ĐANG TẢI DỮ LIỆU...</h3>
                </div>
            ) : (
                <div style={{ marginTop: '20px' }}>
                    {activeTab === 'movie' ? (
                        <>
                            {renderSection("Yêu Thích Gần Đây", "Những bộ phim bạn đã 'Thích' hoặc đánh giá trên 3 sao.", movieData.history, 'movie', '❤️')}
                            {renderSection("Dành Cho Độ Tuổi Của Bạn", "Xu hướng điện ảnh được thế hệ của bạn quan tâm nhất.", movieData.age, 'movie', '🎓')}
                            {renderSection("Thịnh Hành Cùng Giới Tính", "Những bộ phim đang làm mưa làm gió trong cộng đồng cùng giới tính với bạn.", movieData.gender, 'movie', '👫')}
                            {renderSection("Có Thể Bạn Sẽ Thích", "Phân tích AI chuyên sâu (Collaborative Filtering) dựa trên những người dùng có chung gu với bạn.", movieData.personalized, 'movie', '🧠')}
                            {renderSection("Dành Riêng Theo Sở Thích Mở Rộng", "Gợi ý thông minh dựa vào Thể loại, Tác giả và những từ khóa bạn từng tìm kiếm.", movieData.content_based, 'movie', '🎯')}
                        </>
                    ) : (
                        <>
                            {renderSection("Playlist Yêu Thích", "Những bài hát bạn nghe đi nghe lại hoặc đánh giá cao.", songData.history, 'song', '❤️')}
                            {renderSection("Giai Điệu Thế Hệ", "Những bản nhạc mang đậm dấu ấn tuổi trẻ của thế hệ bạn.", songData.age, 'song', '🎧')}
                            {renderSection("Giai Điệu Cùng Giới Tính", "Âm nhạc đang được phái của bạn ưu ái nhất.", songData.gender, 'song', '👫')}
                            {renderSection("Khám Phá Gu Âm Nhạc Mới", "AI tự động học từ lượt view/like để tìm ra những bài hát hoàn hảo cho bạn.", songData.personalized, 'song', '🧠')}
                            {renderSection("Dành Riêng Theo Sở Thích Mở Rộng", "Gợi ý thông minh dựa vào Thể loại, Tác giả và những từ khóa bạn từng tìm kiếm.", songData.content_based, 'song', '🎯')}
                        </>
                    )}
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .animate-fade-up img { border-radius: 15px !important; box-shadow: 0 8px 25px rgba(0,0,0,0.6); }
                .modern-spinner { width: 60px; height: 60px; border-radius: 50%; border: 4px solid; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}} />
        </div>
    );
};

export default RecommendPage;