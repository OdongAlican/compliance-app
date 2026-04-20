import './index.css';
import React, { useEffect } from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import store from './store';
import AppRoutes from './routes';
import { Toaster } from 'react-hot-toast';

/**
 * ForbiddenListener
 * Listens for the 'app:forbidden' event dispatched by the axios interceptor
 * on any 403 response, then navigates to /access-denied.
 * Must be rendered inside <Router> to have access to useNavigate.
 */
function ForbiddenListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = () => navigate('/access-denied', { replace: true });
    window.addEventListener('app:forbidden', handler);
    return () => window.removeEventListener('app:forbidden', handler);
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <Provider store={store}>
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ForbiddenListener />
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


