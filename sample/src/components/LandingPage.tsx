import React, { useState } from 'react';
import { Shield, Building2, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Role } from '../types';

interface LandingPageProps {
  onLogin: (role: Role, annexeId?: string, password?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [loginMode, setLoginMode] = useState<Role | null>(null);
  const [password, setPassword] = useState('');
  const [annexeId, setAnnexeId] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMode === 'CIRT') {
      if (password === 'admin') { // Demo password
        onLogin('CIRT');
      } else {
        setError('Mot de passe incorrect');
      }
    } else if (loginMode === 'ANNEXE') {
      if (annexeId && password) {
        onLogin('ANNEXE', annexeId, password);
      } else {
        setError('Veuillez remplir tous les champs');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
          SYNC <span className="text-yellow-500">ANTIC</span>
        </h1>
        <p className="text-slate-500 font-medium italic">Plateforme de Supervision et Collaboration Cyber</p>
      </motion.div>

      {!loginMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* CIRT Card */}
          <motion.div 
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLoginMode('CIRT')}
            className="group cursor-pointer bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-transparent hover:border-yellow-400 transition-all duration-300"
          >
            <div className="h-48 bg-slate-800 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/cyber/800/400')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
              <Shield size={80} className="text-yellow-400 relative z-10" />
            </div>
            <div className="p-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">CIRT</h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Interface de supervision nationale. Validation des dossiers, veille stratégique et gestion des annexes.
              </p>
              <div className="flex items-center gap-2 text-yellow-600 font-bold">
                Accéder à la supervision <ArrowRight size={20} />
              </div>
            </div>
          </motion.div>

          {/* Annexe Card */}
          <motion.div 
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLoginMode('ANNEXE')}
            className="group cursor-pointer bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-transparent hover:border-yellow-400 transition-all duration-300"
          >
            <div className="h-48 bg-yellow-400 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/office/800/400')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
              <Building2 size={80} className="text-slate-800 relative z-10" />
            </div>
            <div className="p-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Annexes</h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Interface opérationnelle régionale. Soumission de dossiers, collecte d'actifs et authentification de preuves.
              </p>
              <div className="flex items-center gap-2 text-yellow-600 font-bold">
                Se connecter à mon annexe <ArrowRight size={20} />
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 border border-slate-200"
        >
          <button 
            onClick={() => { setLoginMode(null); setError(''); }}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold mb-6 flex items-center gap-1"
          >
            ← Retour au choix
          </button>
          
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${loginMode === 'CIRT' ? 'bg-slate-800 text-yellow-400' : 'bg-yellow-400 text-slate-800'}`}>
              {loginMode === 'CIRT' ? <Shield size={24} /> : <Building2 size={24} />}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Connexion {loginMode}</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Veuillez vous identifier</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {loginMode === 'ANNEXE' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Identifiant Annexe</label>
                <input 
                  type="text" 
                  value={annexeId}
                  onChange={(e) => setAnnexeId(e.target.value)}
                  placeholder="Ex: YDE-782-X"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-medium"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-medium"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-slate-900 text-yellow-400 py-4 rounded-xl font-black text-lg shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              SE CONNECTER
            </button>
          </form>
          
          <p className="mt-8 text-center text-xs text-slate-400 leading-relaxed font-medium">
            En cas de perte de vos identifiants, veuillez contacter l'administrateur central du CIRT.
          </p>
        </motion.div>
      )}
    </div>
  );
};
