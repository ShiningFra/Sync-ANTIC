import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  Clock, 
  Plus, 
  LogOut, 
  Search,
  Download,
  Eye,
  Check,
  X,
  ShieldAlert,
  UserX,
  Database,
  Users,
  Fingerprint,
  Upload,
  File,
  Home,
  Settings,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, MOCK_DOSSIERS, ANNEXES } from '../constants';
import { CategoryId, Dossier, Role, DossierStatus } from '../types';

const IconMap: Record<string, React.ElementType> = {
  Home,
  ShieldAlert,
  UserX,
  Search,
  Database,
  Users,
  FileText,
  Fingerprint,
};

interface DashboardProps {
  role: Role;
  annexeId?: string;
  onLogout: () => void;
  onOpenAdminSettings?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ role, annexeId, onLogout, onOpenAdminSettings }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId>('accueil');
  const [dossiers, setDossiers] = useState<Dossier[]>(MOCK_DOSSIERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Filtered dossiers
  const filteredDossiers = useMemo(() => {
    let base = dossiers;
    if (role === 'ANNEXE' && annexeId) {
      // In a real app we'd filter by the actual annexe account
      // For demo, we'll just show all or filter by a specific mock annexe
    }
    
    if (selectedCategoryId !== 'accueil') {
      base = base.filter(d => d.categoryId === selectedCategoryId);
    }

    return base.filter(d => 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.annexeName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dossiers, selectedCategoryId, searchQuery, role, annexeId]);

  const pendingDossiers = filteredDossiers.filter(d => d.status === 'PENDING');
  const validatedDossiers = filteredDossiers.filter(d => d.status === 'VALIDATED');

  const handleValidate = (id: string) => {
    setDossiers(prev => prev.map(d => 
      d.id === id ? { 
        ...d, 
        status: 'VALIDATED', 
        validatedAt: new Date().toISOString(), 
        validatedBy: 'CIRT Admin' 
      } : d
    ));
    setSelectedDossier(null);
  };

  const handleUpload = (newDossier: Omit<Dossier, 'id' | 'createdAt' | 'status' | 'annexeName'>) => {
    const dossier: Dossier = {
      ...newDossier,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      annexeName: ANNEXES.find(a => a.id === newDossier.annexeId)?.name || 'Annexe Inconnue'
    };
    setDossiers(prev => [dossier, ...prev]);
    setIsUploadModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Top Navigation */}
      <header className="bg-slate-900 text-white shadow-2xl z-40 shrink-0">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-yellow-400/20">
                <Shield size={24} />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-black text-xl leading-tight tracking-tighter">SYNC <span className="text-yellow-400">ANTIC</span></h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Plateforme Collaborative</p>
              </div>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
            {CATEGORIES.map(cat => {
              const Icon = IconMap[cat.icon];
              const isActive = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                    isActive 
                      ? 'bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-400/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  <span className="whitespace-nowrap">{cat.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 font-black text-xs shrink-0">
                {role === 'CIRT' ? 'CT' : 'AX'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-black uppercase tracking-tight truncate max-w-[120px]">{role === 'CIRT' ? 'CIRT Supervision' : `Annexe ${annexeId}`}</p>
                <div className="flex gap-2">
                  {role === 'CIRT' && (
                    <button onClick={onOpenAdminSettings} className="text-[9px] text-yellow-400 font-black hover:underline uppercase tracking-widest">Paramètres</button>
                  )}
                  <button onClick={() => setIsChangingPass(true)} className="text-[9px] text-slate-400 font-black hover:underline uppercase tracking-widest">Mot de passe</button>
                </div>
              </div>
              <button 
                onClick={onLogout} 
                className="ml-2 p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center gap-2 px-3 py-2 group shrink-0"
              >
                <LogOut size={16} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Quitter</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Sub-header with Search and Actions */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher un dossier, une annexe, un mot clé..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {role === 'ANNEXE' && (
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 bg-slate-900 text-yellow-400 px-6 py-3 rounded-2xl text-sm font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                >
                  <Plus size={18} />
                  NOUVEAU DOSSIER
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto space-y-10">
            {selectedCategoryId === 'accueil' ? (
              <div className="space-y-10">
                <div className="bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-yellow-400/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4"></div>
                  <div className="relative z-10">
                    <h2 className="text-4xl font-black mb-4 tracking-tighter">Bienvenue sur <span className="text-yellow-400">Sync ANTIC</span></h2>
                    <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
                      Interface centrale de coordination pour l'Agence Nationale des TIC. 
                      Gérez vos dossiers de cybersécurité et collaborez en temps réel.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {CATEGORIES.filter(c => c.id !== 'accueil').map(cat => {
                    const Icon = IconMap[cat.icon];
                    const count = dossiers.filter(d => d.categoryId === cat.id && d.status === 'PENDING').length;
                    return (
                      <motion.div 
                        key={cat.id}
                        whileHover={{ y: -10, scale: 1.02 }}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="bg-white p-10 rounded-[40px] border-4 border-transparent hover:border-yellow-400 shadow-xl hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-16 h-16 bg-slate-900 text-yellow-400 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-yellow-400 group-hover:text-slate-900 transition-all duration-300 shadow-lg">
                          <Icon size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight uppercase tracking-tighter">{cat.label}</h3>
                        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed opacity-80">{cat.description}</p>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossiers actifs</span>
                          <span className={`text-lg font-black px-4 py-1 rounded-2xl ${count > 0 ? 'bg-yellow-400 text-slate-900' : 'bg-slate-100 text-slate-400'}`}>
                            {count}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-yellow-400 text-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
                        {React.createElement(IconMap[CATEGORIES.find(c => c.id === selectedCategoryId)?.icon || 'Home'], { size: 20 })}
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                        {CATEGORIES.find(c => c.id === selectedCategoryId)?.label}
                      </h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-13">
                      {CATEGORIES.find(c => c.id === selectedCategoryId)?.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Pending Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-yellow-400 flex items-center justify-center shadow-lg">
                        <Clock size={16} />
                      </div>
                      <h3 className="font-black text-slate-800 uppercase tracking-tight">Dossiers en attente</h3>
                      <span className="bg-yellow-100 text-yellow-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                        {pendingDossiers.length}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {pendingDossiers.length > 0 ? (
                        pendingDossiers.map(dossier => (
                          <DossierCard key={dossier.id} dossier={dossier} onClick={() => setSelectedDossier(dossier)} />
                        ))
                      ) : (
                        <EmptyState message="Aucun dossier en attente pour cette catégorie" />
                      )}
                    </div>
                  </section>

                  {/* Validated Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                      <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-900 flex items-center justify-center shadow-lg">
                        <CheckCircle size={16} />
                      </div>
                      <h3 className="font-black text-slate-800 uppercase tracking-tight">Dossiers validés</h3>
                      <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                        {validatedDossiers.length}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {validatedDossiers.length > 0 ? (
                        validatedDossiers.map(dossier => (
                          <DossierCard key={dossier.id} dossier={dossier} onClick={() => setSelectedDossier(dossier)} />
                        ))
                      ) : (
                        <EmptyState message="Historique vide pour cette catégorie" />
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedDossier && (
          <DossierDetailModal 
            dossier={selectedDossier} 
            role={role}
            onClose={() => setSelectedDossier(null)}
            onValidate={handleValidate}
          />
        )}
        {isUploadModalOpen && (
          <UploadDossierModal 
            categoryId={selectedCategoryId === 'accueil' ? 'scans-vulnerabilite' : selectedCategoryId}
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={handleUpload}
          />
        )}
        {isChangingPass && (
          <ChangePasswordModal 
            role={role}
            onClose={() => setIsChangingPass(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-components
const DossierCard: React.FC<{ dossier: Dossier; onClick: () => void }> = ({ dossier, onClick }) => {
  return (
    <motion.div 
      layoutId={dossier.id}
      onClick={onClick}
      className="bg-white border border-slate-200 p-6 rounded-[24px] hover:shadow-xl hover:border-yellow-400 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{dossier.id}</span>
          <h4 className="font-black text-slate-800 group-hover:text-yellow-600 transition-colors uppercase tracking-tight">{dossier.title}</h4>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest ${
          dossier.status === 'VALIDATED' ? 'bg-slate-100 text-slate-500' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {dossier.status === 'VALIDATED' ? 'VALIDÉ' : 'ATTENTE'}
        </div>
      </div>
      
      <p className="text-xs text-slate-500 line-clamp-2 mb-6 leading-relaxed font-medium">
        {dossier.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
            {dossier.annexeName.split(' ')[1]?.[0] || 'A'}
          </div>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{dossier.annexeName}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5">
            <File size={14} />
            <span className="text-[11px] font-black">{dossier.attachments.length}</span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest">{new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="h-40 border-4 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
    <FileText size={32} className="mb-3 opacity-20" />
    <p className="text-xs font-black uppercase tracking-widest text-center px-6">{message}</p>
  </div>
);

const DossierDetailModal: React.FC<{ dossier: Dossier; role: Role; onClose: () => void; onValidate: (id: string) => void }> = ({ dossier, role, onClose, onValidate }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
    <motion.div layoutId={dossier.id} className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier #{dossier.id}</span>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest ${
              dossier.status === 'VALIDATED' ? 'bg-slate-200 text-slate-600' : 'bg-yellow-400 text-slate-900'
            }`}>
              {dossier.status === 'VALIDATED' ? 'VALIDÉ' : 'EN ATTENTE'}
            </span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{dossier.title}</h3>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors">
          <X size={24} className="text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <section>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Description du dossier</h4>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[24px] border border-slate-100 font-medium">
            {dossier.description}
          </p>
        </section>

        <div className="grid grid-cols-2 gap-8">
          <section>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Origine</h4>
            <div className="space-y-3 bg-slate-50 p-5 rounded-[24px] border border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-widest">Annexe</span>
                <span className="font-black text-slate-900">{dossier.annexeName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-widest">Création</span>
                <span className="font-black text-slate-900">{new Date(dossier.createdAt).toLocaleString('fr-FR')}</span>
              </div>
            </div>
          </section>
          {dossier.status === 'VALIDATED' && (
            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Validation CIRT</h4>
              <div className="space-y-3 bg-yellow-50 p-5 rounded-[24px] border border-yellow-100">
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-600 font-bold uppercase tracking-widest">Date</span>
                  <span className="font-black text-slate-900">{new Date(dossier.validatedAt!).toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-600 font-bold uppercase tracking-widest">Agent</span>
                  <span className="font-black text-slate-900">{dossier.validatedBy}</span>
                </div>
              </div>
            </section>
          )}
        </div>

        <section>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Pièces Jointes ({dossier.attachments.length})</h4>
          <div className="grid grid-cols-1 gap-3">
            {dossier.attachments.map(file => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-[20px] hover:border-yellow-400 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors">
                    <File size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{file.size} • {file.type.split('/')[1].toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-3 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all"><Eye size={18} /></button>
                  <button className="p-3 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all"><Download size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
        <button onClick={onClose} className="px-6 py-3 text-sm font-black text-slate-500 hover:bg-slate-200 rounded-[20px] transition-all uppercase tracking-widest">Fermer</button>
        {role === 'CIRT' && dossier.status === 'PENDING' && (
          <button onClick={() => onValidate(dossier.id)} className="flex items-center gap-2 bg-slate-900 text-yellow-400 px-8 py-3 rounded-[20px] text-sm font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest">
            <Check size={20} /> Valider le dossier
          </button>
        )}
      </div>
    </motion.div>
  </div>
);

const UploadDossierModal: React.FC<{ categoryId: CategoryId; onClose: () => void; onUpload: (d: any) => void }> = ({ categoryId, onClose, onUpload }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [annexeId, setAnnexeId] = useState(ANNEXES[0].id);
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    onUpload({ title, description, categoryId, annexeId, attachments: files.map((f, i) => ({ id: `new-${i}`, name: f.name, size: `${(f.size / 1024 / 1024).toFixed(1)} MB`, type: f.type, url: '#' })) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Nouveau Dossier</h3>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><X size={24} className="text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Titre du dossier</label>
            <input type="text" required placeholder="Ex: Scan vulnérabilité Réseau X" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-[20px] text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-bold" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Catégorie</label>
              <div className="px-5 py-3 bg-slate-100 border border-slate-200 rounded-[20px] text-sm text-slate-500 font-black uppercase tracking-tight">{CATEGORIES.find(c => c.id === categoryId)?.label}</div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Annexe émettrice</label>
              <select className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-[20px] text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-bold" value={annexeId} onChange={(e) => setAnnexeId(e.target.value)}>
                {ANNEXES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description / Analyse préliminaire</label>
            <textarea required rows={4} placeholder="Décrivez brièvement le contenu du dossier..." className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-[20px] text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all resize-none font-medium" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fichiers joints</label>
            <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-4 border-slate-200 border-dashed rounded-[32px] hover:border-yellow-400 transition-colors bg-slate-50/50">
              <div className="space-y-2 text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-300" />
                <div className="flex text-sm text-slate-600 font-black uppercase tracking-tight">
                  <label className="relative cursor-pointer bg-white rounded-lg px-2 text-yellow-600 hover:text-yellow-500"><span>Téléverser</span><input type="file" multiple className="sr-only" onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))} /></label>
                  <p className="pl-1">ou glisser-déposer</p>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PDF, PNG, JPG, XLSX (Max 10MB)</p>
              </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-black text-slate-500 hover:bg-slate-100 rounded-[20px] transition-all uppercase tracking-widest">Annuler</button>
            <button type="submit" className="bg-slate-900 text-yellow-400 px-10 py-3 rounded-[20px] text-sm font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest">Soumettre</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ChangePasswordModal: React.FC<{ role: Role; onClose: () => void }> = ({ role, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-yellow-400 text-slate-900 rounded-2xl flex items-center justify-center shadow-lg"><Key size={24} /></div>
          <div><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Mot de passe</h3><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Sécurisez votre accès</p></div>
        </div>
        <div className="space-y-6">
          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ancien mot de passe</label><input type="password" placeholder="••••••••" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-[20px] text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 outline-none font-bold" /></div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nouveau mot de passe</label><input type="password" placeholder="••••••••" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-[20px] text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 outline-none font-bold" /></div>
          <button onClick={onClose} className="w-full bg-slate-900 text-yellow-400 py-4 rounded-[20px] font-black text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all uppercase tracking-widest">Enregistrer</button>
          
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <button 
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('app-logout'));
              }}
              className="w-full py-3 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={14} />
              Se déconnecter de la session
            </button>
            <button onClick={onClose} className="w-full text-slate-400 py-2 font-black text-[10px] uppercase tracking-widest">Annuler</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
