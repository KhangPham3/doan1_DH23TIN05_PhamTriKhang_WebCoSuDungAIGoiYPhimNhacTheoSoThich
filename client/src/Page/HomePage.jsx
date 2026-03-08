import React from 'react';
import HeroSection from '../Components/HeroSection';
import RecommendPage from './RecommendPage'; 

const HomePage = () => {
    return (
        <div style={{ background: '#121212', minHeight: '100vh' }}>
            <HeroSection />

            {/* Hiển thị AI & Trending ngay dưới Banner */}
            <div style={{ marginTop: '-30px', position: 'relative', zIndex: 10 }}>
                <RecommendPage />
            </div>               
        </div>
    );
};

export default HomePage;