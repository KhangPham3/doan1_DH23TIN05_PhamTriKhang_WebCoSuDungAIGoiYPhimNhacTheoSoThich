import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'; // 🟢 Thêm Navigate

import Navigation from './Components/Navigation';
import Footer from './Footer';
import HomePage from './Page/HomePage';
import LoginPage from './Page/LoginPage';
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

// ==========================================
// 1. BẢO VỆ KHU VỰC ADMIN (Chỉ Admin mới được vào)
// ==========================================
const AdminRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    // Nếu chưa đăng nhập hoặc không phải admin -> Đẩy về trang chủ
    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />; 
    }
    return children;
};

// ==========================================
// 2. BẢO VỆ KHU VỰC USER (Admin không được vào)
// ==========================================
const UserRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    // Nếu tài khoản đang là admin mà cố vào trang thường -> Ép quay lại Admin
    if (user && user.role === 'admin') {
        return <Navigate to="/admin" replace />; 
    }
    return children; // Khách vãng lai (user = null) hoặc user thường thì vẫn xem bình thường
};

function AppContent() {
  const location = useLocation(); 
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {/* Chỉ hiển thị Navigation nếu không phải trang Admin */}
      {!isAdminRoute && <Navigation />} 
      
      <Routes>
        {/* 🟢 TẤT CẢ ROUTE THƯỜNG ĐƯỢC BỌC TRONG <UserRoute> */}
        <Route path="/" element={<UserRoute><HomePage /></UserRoute>} />
        <Route path="/login" element={<UserRoute><LoginPage /></UserRoute>} />
        <Route path="/forgot-password" element={<UserRoute><ForgotPasswordPage /></UserRoute>} />
        <Route path="/search" element={<UserRoute><Searchpage /></UserRoute>} />
        <Route path="/movies" element={<UserRoute><MoviePage /></UserRoute>} />
        <Route path="/history" element={<UserRoute><HistoryPage /></UserRoute>} />
        <Route path="/songs" element={<UserRoute><SongPage /></UserRoute>} />
        <Route path="/movie/:id" element={<UserRoute><MovieDetail /></UserRoute>} />
        <Route path="/song/:id" element={<UserRoute><SongDetail /></UserRoute>} />
        <Route path="/recommend" element={<UserRoute><RecommendPage /></UserRoute>} />
        
        {/* 🔴 ROUTE ADMIN ĐƯỢC BỌC TRONG <AdminRoute> */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
      
      {/* Chỉ hiển thị Footer nếu không phải trang Admin */}
      {!isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;