import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  FileText, 
  CheckCircle, 
  Clock, 
  Plus, 
  LogOut, 
  Search,
  Filter,
  ChevronRight,
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
  File
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, MOCK_DOSSIERS, ANNEXES } from './constants';
import { CategoryId, Dossier, Role, DossierStatus } from './types';

// Icon mapping helper
const IconMap: Record<string, React.ElementType> = {
  ShieldAlert,
  UserX,
  Search,
  Database,
  Users,
  FileText,
  Fingerprint,
};

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>('CIRT');
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId>(CATEGORIES[0].id);
  const [dossiers, setDossiers] = useState<Dossier[]>(MOCK_DOSSIERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Filtered dossiers based on category and search
  const filteredDossiers = useMemo(() => {
    return dossiers.filter(d => 
      d.categoryId === selectedCategoryId && 
      (d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       d.annexeName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [dossiers, selectedCategoryId, searchQuery]);

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
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Sync ANTIC</h1>
            <p className="text-xs text-slate-500 font-medium">Plateforme Collaborative</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Catégories de traitement
          </div>
          {CATEGORIES.map((cat) => {
            const Icon = IconMap[cat.icon];
            const isActive = selectedCategoryId === cat.id;
            const count = dossiers.filter(d => d.categoryId === cat.id && d.status === 'PENDING').length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'} />
                <span className="text-sm font-medium flex-1 text-left truncate">{cat.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
              {currentRole === 'CIRT' ? 'CT' : 'AX'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{currentRole === 'CIRT' ? 'CIRT Supervision' : 'Annexe User'}</p>
              <button 
                onClick={() => setCurrentRole(currentRole === 'CIRT' ? 'ANNEXE' : 'CIRT')}
                className="text-[10px] text-emerald-600 font-bold hover:underline"
              >
                Changer de rôle (Demo)
              </button>
            </div>
            <LogOut size={14} className="text-slate-400 cursor-pointer hover:text-red-500" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un dossier, une annexe..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentRole === 'ANNEXE' && (
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
              >
                <Plus size={18} />
                Nouveau Dossier
              </button>
            )}
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs font-medium">Dernière synchro: 12:45</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {CATEGORIES.find(c => c.id === selectedCategoryId)?.label}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Gestion et suivi des dossiers de cette catégorie.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                <button className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-800 rounded-md">Liste</button>
                <button className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800">Tableau</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <h3 className="font-bold text-slate-700">En attente de validation</h3>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pendingDossiers.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {pendingDossiers.length > 0 ? (
                  pendingDossiers.map(dossier => (
                    <DossierCard 
                      key={dossier.id} 
                      dossier={dossier} 
                      onClick={() => setSelectedDossier(dossier)}
                    />
                  ))
                ) : (
                  <EmptyState message="Aucun dossier en attente" />
                )}
              </div>
            </section>

            {/* Validated Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle size={16} />
                  </div>
                  <h3 className="font-bold text-slate-700">Validés par le CIRT</h3>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {validatedDossiers.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {validatedDossiers.length > 0 ? (
                  validatedDossiers.map(dossier => (
                    <DossierCard 
                      key={dossier.id} 
                      dossier={dossier} 
                      onClick={() => setSelectedDossier(dossier)}
                    />
                  ))
                ) : (
                  <EmptyState message="Aucun dossier validé" />
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedDossier && (
          <DossierDetailModal 
            dossier={selectedDossier} 
            role={currentRole}
            onClose={() => setSelectedDossier(null)}
            onValidate={handleValidate}
          />
        )}
        {isUploadModalOpen && (
          <UploadDossierModal 
            categoryId={selectedCategoryId}
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={handleUpload}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface DossierCardProps {
  dossier: Dossier;
  onClick: () => void;
}

const DossierCard: React.FC<DossierCardProps> = ({ dossier, onClick }) => {
  return (
    <motion.div 
      layoutId={dossier.id}
      onClick={onClick}
      className="bg-white border border-slate-200 p-4 rounded-xl hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">#{dossier.id}</span>
          <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{dossier.title}</h4>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          dossier.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {dossier.status === 'VALIDATED' ? 'VALIDÉ' : 'EN ATTENTE'}
        </div>
      </div>
      
      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
        {dossier.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
            {dossier.annexeName.split(' ')[1]?.[0] || 'A'}
          </div>
          <span className="text-[11px] font-medium text-slate-600">{dossier.annexeName}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1">
            <File size={12} />
            <span className="text-[11px] font-medium">{dossier.attachments.length}</span>
          </div>
          <span className="text-[11px] font-medium">{new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>
    </motion.div>
  );
}

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
      <FileText size={24} className="mb-2 opacity-20" />
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
}

interface DossierDetailModalProps {
  dossier: Dossier;
  role: Role;
  onClose: () => void;
  onValidate: (id: string) => void;
}

const DossierDetailModal: React.FC<DossierDetailModalProps> = ({ 
  dossier, 
  role, 
  onClose, 
  onValidate 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        layoutId={dossier.id}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dossier #{dossier.id}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                dossier.status === 'VALIDATED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {dossier.status === 'VALIDATED' ? 'VALIDÉ' : 'EN ATTENTE'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-800">{dossier.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {dossier.description}
            </p>
          </section>

          <div className="grid grid-cols-2 gap-6">
            <section>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informations</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Annexe émettrice</span>
                  <span className="font-bold text-slate-700">{dossier.annexeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date de création</span>
                  <span className="font-bold text-slate-700">{new Date(dossier.createdAt).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            </section>
            {dossier.status === 'VALIDATED' && (
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Validation</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Validé le</span>
                    <span className="font-bold text-emerald-700">{new Date(dossier.validatedAt!).toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Par</span>
                    <span className="font-bold text-emerald-700">{dossier.validatedBy}</span>
                  </div>
                </div>
              </section>
            )}
          </div>

          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Fichiers joints ({dossier.attachments.length})</h4>
            <div className="grid grid-cols-1 gap-2">
              {dossier.attachments.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                      <File size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{file.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{file.size} • {file.type.split('/')[1].toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
          >
            Fermer
          </button>
          {role === 'CIRT' && dossier.status === 'PENDING' && (
            <button 
              onClick={() => onValidate(dossier.id)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <Check size={18} />
              Valider le dossier
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface UploadDossierModalProps {
  categoryId: CategoryId;
  onClose: () => void;
  onUpload: (d: any) => void;
}

const UploadDossierModal: React.FC<UploadDossierModalProps> = ({ 
  categoryId, 
  onClose, 
  onUpload 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [annexeId, setAnnexeId] = useState(ANNEXES[0].id);
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    onUpload({
      title,
      description,
      categoryId,
      annexeId,
      attachments: files.map((f, i) => ({
        id: `new-${i}`,
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        type: f.type,
        url: '#'
      }))
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Nouveau Dossier</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Titre du dossier</label>
            <input 
              type="text" 
              required
              placeholder="Ex: Scan vulnérabilité Réseau X"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Catégorie</label>
              <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium">
                {CATEGORIES.find(c => c.id === categoryId)?.label}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Annexe</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                value={annexeId}
                onChange={(e) => setAnnexeId(e.target.value)}
              >
                {ANNEXES.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description / Analyse préliminaire</label>
            <textarea 
              required
              rows={4}
              placeholder="Décrivez brièvement le contenu du dossier et les actions entreprises..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fichiers joints</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl hover:border-emerald-400 transition-colors bg-slate-50/50">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-10 w-10 text-slate-300" />
                <div className="flex text-sm text-slate-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-bold text-emerald-600 hover:text-emerald-500 focus-within:outline-none">
                    <span>Téléverser des fichiers</span>
                    <input 
                      type="file" 
                      multiple 
                      className="sr-only" 
                      onChange={(e) => {
                        if (e.target.files) {
                          setFiles(Array.from(e.target.files));
                        }
                      }}
                    />
                  </label>
                  <p className="pl-1">ou glisser-déposer</p>
                </div>
                <p className="text-xs text-slate-400">PDF, PNG, JPG, XLSX jusqu'à 10MB</p>
              </div>
            </div>
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <File size={14} className="text-emerald-600" />
                      <span className="font-medium text-emerald-800">{f.name}</span>
                    </div>
                    <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                      <X size={14} className="text-emerald-400 hover:text-emerald-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="bg-emerald-600 text-white px-8 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
            >
              Soumettre le dossier
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
