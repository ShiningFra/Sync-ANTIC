import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import type { User } from './types';
import { clearToken, getToken, getCurrentUser } from './api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restituer la session depuis le token stocké
  useEffect(() => {
    const token = getToken();
    if (token) {
      getCurrentUser()
        .then(setUser)
        .catch(() => { clearToken(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Gérer le logout automatique (token expiré)
  useEffect(() => {
    const handler = () => { setUser(null); };
    window.addEventListener('app-logout', handler);
    return () => window.removeEventListener('app-logout', handler);
  }, []);

  const handleLogin = (u: User) => setUser(u);
  const handleLogout = () => { clearToken(); setUser(null); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--night-900)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <span className="text-sky-300 text-sm font-medium">Chargement…</span>
        </div>
      </div>
    );
  }

  return user
    ? <Dashboard user={user} onLogout={handleLogout} />
    : <LandingPage onLogin={handleLogin} />;
}
