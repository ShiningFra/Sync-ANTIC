import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { User, View } from './types';

export default function App() {
  const [view, setView] = useState<View>('LANDING');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setUser(user);
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setUser(null);
    setView('LANDING');
  };

  useEffect(() => {
    const handleCustomLogout = () => handleLogout();
    window.addEventListener('app-logout', handleCustomLogout);
    return () => window.removeEventListener('app-logout', handleCustomLogout);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 selection:bg-antic-gold selection:text-slate-900">
      <AnimatePresence mode="wait">
        {view === 'LANDING' && (
          <LandingPage key="landing" onLogin={handleLogin} />
        )}
        {view === 'DASHBOARD' && user && (
          <Dashboard 
            key="dashboard"
            user={user}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
