import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, User as UserIcon, ChevronRight } from 'lucide-react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = MOCK_USERS.find(u => u.username === username);
    
    // For demo purposes, any password works if username exists
    if (user) {
      onLogin(user);
    } else {
      setError('Identifiants incorrects');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-y-auto">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/seed/cameroon/1920/1080" 
          alt="Background" 
          className="w-full h-full object-cover opacity-20"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-antic-blue/80 via-slate-900/90 to-slate-900"></div>
      </div>

      {/* Tech Illustration / Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-black/50 border border-white/10 overflow-hidden relative z-10"
      >
        <div className="bg-antic-blue p-8 text-center relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          </div>
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl relative z-10">
            <Shield size={40} className="text-antic-blue" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter relative z-10">SYNC <span className="text-antic-gold">ANTIC</span></h1>
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1 relative z-10">Portail de Collaboration Sécurisé</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 text-red-600 text-xs font-bold p-4 rounded-xl border border-red-100 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <UserIcon size={12} />
                Nom d'utilisateur
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: directeur_cirt"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Lock size={12} />
                Mot de passe
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-antic-blue text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            SE CONNECTER
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="pt-4 text-center">
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Agence Nationale des Technologies de l'Information et de la Communication<br/>
              <span className="text-antic-blue font-bold">ANTIC - Cameroun</span>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
