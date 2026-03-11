import './index.css';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import store from './store';
import AppRoutes from './routes';
import { Toaster } from 'react-hot-toast';







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
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--bg-surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                },
                success: { iconTheme: { primary: '#3fb950', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#f85149', secondary: '#fff' } },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </Provider>
  );
}
