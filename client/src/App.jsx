import { Routes, Route } from 'react-router-dom';
import Navigation from './Components/Navigation';
import Footer from './Footer';
import HomePage from './Page/HomePage';
import LoginPage from './Page/LoginPage';
import MoviePage from './List/MovieList';
import SongPage from './Page/SongPage'; // 👈 Import trang mới (đổi từ SongList thành SongPage)
import MovieDetail from './Detail/MovieDetail';
import SongDetail from './Detail/SongDetail';
import Searchpage from './Detail/Searchpage';
import RecommendPage from './Page/RecommendPage';

import './App.css';

function App() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Route Movies giữ nguyên */}
        <Route path="/movies" element={<MoviePage />} />
        
        {/* 👇 Sửa Route Songs trỏ vào SongPage */}
        <Route path="/songs" element={<SongPage />} />
        
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/song/:id" element={<SongDetail />} />
        <Route path="/search" element={<Searchpage />} />
        <Route path="/recommend" element={<RecommendPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;