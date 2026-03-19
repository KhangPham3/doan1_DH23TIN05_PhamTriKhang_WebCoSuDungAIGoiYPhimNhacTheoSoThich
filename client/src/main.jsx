import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'; // Thêm dòng này

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="46571126728-lvr6i6jtia5d9tfki46d8g576k795tn3.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>,
)