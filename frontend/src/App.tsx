import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import type { User } from './types';
import { clearToken, getToken, getCurrentUser } from './api';

export default function App() {
  const [user, setUser]     = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      getCurrentUser().then(setUser).catch(()=>clearToken()).finally(()=>setLoading(false));
    } else { setLoading(false); }
  }, []);

  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('app-logout', handler);
    return () => window.removeEventListener('app-logout', handler);
  }, []);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#002855' }}>
      <div style={{ width:44, height:44, border:'3px solid rgba(255,255,255,0.1)', borderTop:'3px solid #4db8ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    </div>
  );

  return user
    ? <Dashboard user={user} onLogout={()=>{ clearToken(); setUser(null); }} onUserUpdate={setUser}/>
    : <LandingPage onLogin={setUser}/>;
}
