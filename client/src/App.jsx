import { Routes, Route } from 'react-router-dom';
import Navigation from './Components/Navigation';
import Footer from './Footer';
import HomePage from './Page/HomePage';
import LoginPage from './Page/LoginPage';
import MoviePage from './Page/MoviePage'; 
import SongPage from './Page/SongPage'; 
import MovieDetail from './Detail/MovieDetail';
import SongDetail from './Detail/SongDetail';
import RecommendPage from './Page/RecommendPage';
import Searchpage from './Page/SearchPage';
import ForgotPasswordPage from './Page/ForgotPasswordPage';

import './App.css';

function App() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/search" element={<Searchpage />} />
        <Route path="/movies" element={<MoviePage />} />
        <Route path="/songs" element={<SongPage />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/song/:id" element={<SongDetail />} />
        <Route path="/recommend" element={<RecommendPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;