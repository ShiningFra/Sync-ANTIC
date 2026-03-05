import React, { useState } from 'react';
import { Plus, X, Key, ShieldCheck, Building, RefreshCw, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { AnnexeAccount } from '../types';
import { MOCK_ANNEXE_ACCOUNTS } from '../constants';

interface AdminSettingsProps {
  onClose: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onClose }) => {
  const [annexes, setAnnexes] = useState<AnnexeAccount[]>(MOCK_ANNEXE_ACCOUNTS);
  const [newAnnexeName, setNewAnnexeName] = useState('');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [isChangingAdminPass, setIsChangingAdminPass] = useState(false);

  const generateAnnexeId = (name: string) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${prefix}-${randomNum}-${randomChar}`;
  };

  const handleAddAnnexe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnexeName) return;

    const newAccount: AnnexeAccount = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAnnexeName,
      annexeId: generateAnnexeId(newAnnexeName),
      defaultPassword: `pass-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString()
    };

    setAnnexes([newAccount, ...annexes]);
    setNewAnnexeName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 text-yellow-400 rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Paramètres CIRT</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Administration Centrale</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Admin Password Section */}
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Key size={16} className="text-yellow-500" /> Sécurité Admin
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mot de passe actuel</label>
                  <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-600">
                    ••••••••
                  </div>
                </div>
                {isChangingAdminPass ? (
                  <div className="space-y-3">
                    <input 
                      type="password" 
                      placeholder="Nouveau mot de passe"
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-400/50 outline-none"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsChangingAdminPass(false)}
                        className="flex-1 py-2 text-xs font-bold bg-slate-900 text-yellow-400 rounded-xl"
                      >
                        Enregistrer
                      </button>
                      <button 
                        onClick={() => setIsChangingAdminPass(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-500"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsChangingAdminPass(true)}
                    className="w-full py-2 text-xs font-bold text-yellow-600 hover:text-yellow-700 transition-colors"
                  >
                    Modifier le mot de passe admin
                  </button>
                )}
              </div>
            </section>

            <section className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Plus size={16} className="text-yellow-600" /> Nouvelle Annexe
              </h4>
              <form onSubmit={handleAddAnnexe} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nom de l'annexe</label>
                  <input 
                    type="text" 
                    value={newAnnexeName}
                    onChange={(e) => setNewAnnexeName(e.target.value)}
                    placeholder="Ex: Annexe Maroua"
                    className="w-full px-4 py-2.5 text-sm bg-white border border-yellow-200 rounded-xl focus:ring-2 focus:ring-yellow-400/50 outline-none font-medium"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-yellow-400 py-3 rounded-xl font-bold text-sm shadow-lg shadow-yellow-200/50 hover:bg-slate-800 transition-all"
                >
                  Générer les accès
                </button>
              </form>
            </section>
          </div>

          {/* Annexes List Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building size={16} className="text-yellow-500" /> Comptes Annexes Actifs
              </h4>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase">
                {annexes.length} Annexes
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {annexes.map(acc => (
                <div key={acc.id} className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-yellow-400 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors">
                        <Building size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{acc.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Créé le {new Date(acc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-300 hover:text-slate-600 rounded-lg transition-colors">
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Identifiant</p>
                      <p className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 inline-block">{acc.annexeId}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass par défaut</p>
                      <p className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 inline-block">{acc.defaultPassword}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button 
            onClick={() => {
              onClose();
              // We need to trigger logout from here. 
              // Since onLogout is not passed to AdminSettings, 
              // we can use a custom event or pass it down.
              // Let's assume we'll pass it down.
              window.dispatchEvent(new CustomEvent('app-logout'));
            }}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl font-black text-sm hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut size={18} />
            DÉCONNEXION
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-yellow-400 rounded-2xl font-black text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            TERMINER
          </button>
        </div>
      </motion.div>
    </div>
  );
};
