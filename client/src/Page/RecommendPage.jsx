import React from 'react';

const RecommendPage = () => {
    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white' }}>
            <h1 style={{ fontSize: '3rem', color: '#e50914' }}>✨ Gợi Ý Dành Riêng Cho Bạn</h1>
            <p style={{ fontSize: '1.2rem', color: '#aaa' }}>Tính năng AI đang được phát triển...</p>
            <img src="https://media.giphy.com/media/LMd33K57u5V7eX6t6L/giphy.gif" alt="AI Loading" style={{ width: '200px', marginTop: '20px' }} />
        </div>
    );
};

export default RecommendPage;