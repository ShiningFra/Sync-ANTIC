import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AdminSettings } from './components/AdminSettings';
import { Role, View } from './types';

export default function App() {
  const [view, setView] = useState<View>('LANDING');
  const [user, setUser] = useState<{ role: Role; annexeId?: string } | null>(null);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);

  const handleLogin = (role: Role, annexeId?: string) => {
    setUser({ role, annexeId });
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setUser(null);
    setView('LANDING');
    setIsAdminSettingsOpen(false);
  };

  useEffect(() => {
    const handleCustomLogout = () => handleLogout();
    window.addEventListener('app-logout', handleCustomLogout);
    return () => window.removeEventListener('app-logout', handleCustomLogout);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 selection:bg-yellow-400 selection:text-slate-900">
      <AnimatePresence mode="wait">
        {view === 'LANDING' && (
          <LandingPage key="landing" onLogin={handleLogin} />
        )}
        {view === 'DASHBOARD' && user && (
          <Dashboard 
            key="dashboard"
            role={user.role} 
            annexeId={user.annexeId}
            onLogout={handleLogout}
            onOpenAdminSettings={() => setIsAdminSettingsOpen(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminSettingsOpen && (
          <AdminSettings 
            key="admin-settings"
            onClose={() => setIsAdminSettingsOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
