import './index.css';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes';







export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <div
          className="min-h-screen"
          style={{ background: 'var(--bg)', color: 'var(--text)', transition: 'background .3s, color .3s' }}
        >
          <AppRoutes />
        </div>
      </Router>
    </ThemeProvider>
  );
}
