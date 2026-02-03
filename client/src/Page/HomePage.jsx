import React from 'react';
import HeroSection from '../Components/HeroSection';
import MovieList from '../List/MovieList';
import SongList from '../List/SongList'; // Import SongList

const HomePage = () => {
    return (
        <div>
            <HeroSection />

            {/* Mục Phim */}
            <div style={{ marginTop: '-50px', position: 'relative', zIndex: 10 }}>
                <MovieList /> 
            </div>

            {/* Mục Nhạc - Tách biệt rõ ràng */}
            <div style={{ marginTop: '80px', paddingTop: '40px', background: 'linear-gradient(to bottom, #000, #111)' }}>
                <SongList />
            </div>
        </div>
    );
};

export default HomePage;