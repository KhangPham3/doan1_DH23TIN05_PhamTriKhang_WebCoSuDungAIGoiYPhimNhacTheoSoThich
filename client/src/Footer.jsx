import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer style={{
      backgroundColor: '#0a0a0a', // Softer black for a modern feel
      color: '#b3b3b3',
      padding: '30px 5% 15px', // Reduced padding to make it more compact
      marginTop: 'auto', 
      borderTop: '1px solid rgba(255, 255, 255, 0.05)', // Very subtle border
      fontSize: '0.85rem' // Slightly smaller base font
    }}>
      
      {/* --- PHẦN TRÊN: 3 CỘT THÔNG TIN --- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px', // Reduced gap between columns
        marginBottom: '25px' // Reduced bottom margin
      }}>
        
        {/* Cột 1: Thông tin Admin / Web */}
        <div>
          <h3 style={{ color: '#fff', textTransform: 'uppercase', marginBottom: '15px', fontSize: '1rem', letterSpacing: '1px' }}>
            ABOUT US
          </h3>
          <p style={{ lineHeight: '1.6', color: '#888' }}>
            Đồ án cơ sở 1 chuyên ngành CNTT, mang đến trải nghiệm giải trí đỉnh cao với kho phim và nhạc tuyển chọn.
          </p>
          <div style={{ marginTop: '15px', display: 'flex', gap: '12px' }}>
             {/* Icon Mạng xã hội giả lập */}
             <span className="footer-icon" onClick={() => window.open("https://www.facebook.com/MarVin0311/", "_blank")}>FB</span>
             <span className="footer-icon" onClick={() => window.open("https://www.instagram.com/khangpham_vnrg/", "_blank")}>IG</span>
             <span className="footer-icon" onClick={() => window.open("https://www.youtube.com/", "_blank")}>YT</span>
          </div>
        </div>

        {/* Cột 2: Liên kết nhanh */}
        <div>
          <h3 style={{ color: '#fff', textTransform: 'uppercase', marginBottom: '15px', fontSize: '1rem', letterSpacing: '1px' }}>
            Khám Phá
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
            <li><Link to="/" className="footer-link">Trang Chủ</Link></li>
            <li><Link to="/movies" className="footer-link">Phim Mới Cập Nhật</Link></li>
            <li><Link to="/songs" className="footer-link">Bảng Xếp Hạng Nhạc</Link></li>
            <li><Link to="/search" className="footer-link">Tìm Kiếm</Link></li>
          </ul>
        </div>

        {/* Cột 3: Thông tin liên hệ */}
        <div>
          <h3 style={{ color: '#fff', textTransform: 'uppercase', marginBottom: '15px', fontSize: '1rem', letterSpacing: '1px' }}>
            Liên Hệ Admin
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8', color: '#888' }}>
            <li>👤 <strong style={{color: '#aaa'}}>Admin:</strong> Khang Phạm</li>
            <li>📧 <strong style={{color: '#aaa'}}>Email:</strong> s235187@nctu.edu.vn</li>
            <li>📞 <strong style={{color: '#aaa'}}>Hotline:</strong> 0905.XXX.XXX</li>
            <li>🏢 <strong style={{color: '#aaa'}}>Địa chỉ:</strong> Đại Học Nam Cần Thơ</li>
          </ul>
        </div>
      </div>

      {/* --- PHẦN DƯỚI: BẢN QUYỀN --- */}
      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        paddingTop: '15px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#666' // Dimmed copyright text
      }}>
        <p style={{ margin: '0 0 5px 0' }}>© 2026 ON-TUBE. Đồ án cơ sở ngành Công nghệ thông tin.</p>
        <p style={{ margin: 0 }}>Designed by Phạm Trí Khang.</p>
      </div>

      {/* --- CSS IN JS CHO HIỆU ỨNG HOVER --- */}
      <style dangerouslySetInnerHTML={{__html: `
        .footer-link {
          color: #888;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-block;
        }
        .footer-link:hover {
          color: #e50914; /* Netflix Red */
          transform: translateX(5px); /* Slide slightly to the right */
        }
        
        .footer-icon {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.05);
          color: #aaa;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: bold;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .footer-icon:hover {
          background: #e50914;
          color: white;
          transform: translateY(-4px); /* Pop up effect */
          box-shadow: 0 5px 12px rgba(229, 9, 20, 0.4); /* Glowing shadow */
          border-color: #e50914;
        }
      `}} />
    </footer>
  );
}

export default Footer;