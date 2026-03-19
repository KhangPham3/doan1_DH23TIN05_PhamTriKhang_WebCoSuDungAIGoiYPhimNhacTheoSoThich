import React from 'react';
import { Routes, Route, useLocation, Navigate, BrowserRouter } from 'react-router-dom'; 
import Onboarding from './Page/Onboarding';
import Navigation from './Components/Navigation';
import Footer from './Footer';
import WatchlistPage from './Page/WatchlistPage';
import HomePage from './Page/HomePage';
import LoginPage from './Page/LoginPage';
import ProfilePage from './Page/ProfilePage';
import AdminDashboard from './Page/AdminDashboard';
import MoviePage from './Page/MoviePage'; 
import SongPage from './Page/SongPage'; 
import MovieDetail from './Detail/MovieDetail';
import SongDetail from './Detail/SongDetail';
import RecommendPage from './Page/RecommendPage';
import Searchpage from './Page/SearchPage';
import ForgotPasswordPage from './Page/ForgotPasswordPage';
import HistoryPage from './Page/HistoryPage';
import './App.css';

// ADMIN
const AdminRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    // Nếu chưa đăng nhập hoặc không phải admin -> Đẩy về trang chủ
    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />; 
    }
    return children;
};

// USER
const UserRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.role === 'admin') {
        return <Navigate to="/admin" replace />; 
    }
    return children; 
};

function AppContent() {
  const location = useLocation(); 
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navigation />} 
      
      <Routes>
        {/* TẤT CẢ ROUTE THƯỜNG ĐƯỢC BỌC TRONG <UserRoute> */}
        <Route path="/" element={<UserRoute><HomePage /></UserRoute>} />
        <Route path="/login" element={<UserRoute><LoginPage /></UserRoute>} />
        <Route path="/onboarding" element={<UserRoute><Onboarding /></UserRoute>} />
        <Route path="/forgot-password" element={<UserRoute><ForgotPasswordPage /></UserRoute>} />
        <Route path="/search" element={<UserRoute><Searchpage /></UserRoute>} />
        <Route path="/watchlist" element={<UserRoute><WatchlistPage /></UserRoute>} />
        <Route path="/profile" element={<UserRoute><ProfilePage /></UserRoute>} />
        <Route path="/movies" element={<UserRoute><MoviePage /></UserRoute>} />
        <Route path="/history" element={<UserRoute><HistoryPage /></UserRoute>} />
        <Route path="/songs" element={<UserRoute><SongPage /></UserRoute>} />
        <Route path="/movie/:id" element={<UserRoute><MovieDetail /></UserRoute>} />
        <Route path="/song/:id" element={<UserRoute><SongDetail /></UserRoute>} />
        <Route path="/recommend" element={<UserRoute><RecommendPage /></UserRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return( 
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
  );
}

export default App;