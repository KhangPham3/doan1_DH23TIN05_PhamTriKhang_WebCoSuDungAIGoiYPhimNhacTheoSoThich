import { useState, useEffect } from 'react';
import Card from '../Components/UI/Card'; 
import { fetchMusicCharts } from '../API/MusicAPI';

function SongList() {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchMusicCharts();
                if (Array.isArray(data)) {
                    setSongs(data);
                }
            } catch (error) {
                console.error("Lỗi tải nhạc:", error);
            }
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) return <div style={{color:'white', textAlign:'center', padding: 50}}>⏳ Đang tải 100 bài hát...</div>;

    return (
        <div style={{ paddingBottom: '50px' }}>
            <h2 style={{ color: '#1db954', paddingLeft: '20px', borderLeft: '4px solid #1db954', margin: '30px 0 20px 40px' }}>
                TOP 100 BÀI HÁT THỊNH HÀNH
            </h2>

            <div className="media-grid">
                {songs.map((s, index) => (
                    <Card 
                        // 👇 QUAN TRỌNG: Phải dùng s.videoId làm ID
                        key={s.videoId || index}
                        id={s.videoId} 
                        type="song"
                        
                        title={s.title}
                        subtitle={s.artists ? s.artists.map(a => a.name).join(', ') : 'N/A'}
                        
                        // Lấy ảnh chất lượng cao nhất
                        image={s.thumbnails && s.thumbnails.length > 0 ? s.thumbnails[s.thumbnails.length - 1].url : ''} 
                    />
                ))}
            </div>
        </div>
    );
}

export default SongList;