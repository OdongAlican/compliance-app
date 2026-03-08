import './index.css';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import store from './store';
import AppRoutes from './routes';







export default function App() {
  return (
    <Provider store={store}>
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div
            className="min-h-screen"
            style={{ background: 'var(--bg)', color: 'var(--text)', transition: 'background .3s, color .3s' }}
          >
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </Provider>
  );
}
