import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { User, View } from './types';
import { getToken, getCurrentUser, clearToken } from './api';

export default function App() {
  const [view, setView] = useState<View>('LANDING');
  const [user, setUser] = useState<User | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  // Restore session from localStorage token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      getCurrentUser()
        .then((u) => {
          setUser(u);
          setView('DASHBOARD');
        })
        .catch(() => {
          clearToken();
        })
        .finally(() => setBootstrapping(false));
    } else {
      setBootstrapping(false);
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setView('LANDING');
  };

  useEffect(() => {
    const cb = () => handleLogout();
    window.addEventListener('app-logout', cb);
    return () => window.removeEventListener('app-logout', cb);
  }, []);

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-antic-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 selection:bg-antic-gold selection:text-slate-900">
      <AnimatePresence mode="wait">
        {view === 'LANDING' && <LandingPage key="landing" onLogin={handleLogin} />}
        {view === 'DASHBOARD' && user && (
          <Dashboard key="dashboard" user={user} onLogout={handleLogout} />
        )}
      </AnimatePresence>
    </div>
  );
}
