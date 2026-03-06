import React from 'react';

// Nhận thêm prop `icon` và `type` (mặc định là primary)
const Button = ({ children, onClick, type = 'primary', icon, style }) => {
  return (
    <button 
      className={`btn-ui btn-${type}`} 
      onClick={onClick}
      style={style}
    >
      {/* Nếu có truyền icon thì sẽ hiển thị icon ở đây */}
      {icon && <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.2rem' }}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;