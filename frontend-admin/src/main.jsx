import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Global error catcher – shows alert on any unhandled error
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', error);
  alert(`App error: ${message}\nCheck console for details.`);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)