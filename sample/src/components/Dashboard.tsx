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
  Key,
  Archive,
  Filter,
  Calendar,
  MapPin,
  ChevronDown,
  UserPlus,
  Trash2,
  Lock,
  Menu,
  Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, MOCK_DOSSIERS, ANTENNES, MOCK_USERS } from '../constants';
import { CategoryId, Dossier, User, UserRole, Antenne, DossierStatus, Category } from '../types';

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
  user: User;
  onLogout: () => void;
}

type Tab = 'dossiers' | 'archives' | 'users' | 'antennes' | 'categories';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dossiers');
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId>('accueil');
  const [dossiers, setDossiers] = useState<Dossier[]>(MOCK_DOSSIERS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [antennes, setAntennes] = useState<Antenne[]>(ANTENNES);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [filterAntenne, setFilterAntenne] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');

  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAntenneModalOpen, setIsAntenneModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DossierStatus | 'ALL'>('ALL');

  // Permission Helpers
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isCirtAdmin = user.role === 'CIRT_ADMIN';
  const isCirtSecondary = user.role === 'CIRT_SECONDARY';
  const isCirtAffiliated = user.affiliation === 'CIRT';
  const isAntenneDirector = user.role === 'ANTENNE_DIRECTOR';
  const isAntenneSimple = user.role === 'ANTENNE_SIMPLE';
  const isAntenneAffiliated = user.affiliation === 'ANTENNE';

  const canManageUsers = isSuperAdmin || isCirtAdmin || isAntenneDirector;
  const canManageAntennes = isSuperAdmin;
  const canManageCategories = isSuperAdmin || isCirtAdmin;
  const canArchive = isSuperAdmin || isCirtAdmin || isAntenneDirector;
  const canValidate = isSuperAdmin || isCirtAdmin;
  const canCreateDossier = isAntenneAffiliated || isCirtAffiliated;

  // Filtered dossiers based on user role and filters
  const filteredDossiers = useMemo(() => {
    let base = dossiers;

    // 1. Role-based visibility
    if (isAntenneSimple) {
      // Agents only see their own dossiers
      base = base.filter(d => d.createdBy === user.id);
    } else if (isAntenneDirector) {
      // Directors see all dossiers from their antenna
      base = base.filter(d => d.antenneId === user.antenneId);
    }
    
    if (isCirtSecondary && user.allowedCategories) {
      base = base.filter(d => user.allowedCategories?.includes(d.categoryId));
    }

    // 2. View-based filtering (Archives vs Main)
    if (activeTab === 'archives') {
      base = base.filter(d => d.status === 'ARCHIVED');
    } else {
      base = base.filter(d => d.status !== 'ARCHIVED');
    }

    // 3. Category filter
    if (selectedCategoryId !== 'accueil') {
      base = base.filter(d => d.categoryId === selectedCategoryId);
    }

    // 3. Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(d => 
        d.title.toLowerCase().includes(q) || 
        d.description.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      );
    }

    // 4. Advanced filters
    if (filterAntenne !== 'all') {
      base = base.filter(d => d.antenneId === filterAntenne);
    }
    if (filterYear !== 'all') {
      base = base.filter(d => d.year === parseInt(filterYear));
    }
    if (filterMonth !== 'all') {
      base = base.filter(d => d.month === parseInt(filterMonth));
    }
    if (filterDay !== 'all') {
      base = base.filter(d => d.day === parseInt(filterDay));
    }

    return base;
  }, [dossiers, user, selectedCategoryId, searchQuery, filterAntenne, filterYear, filterMonth, filterDay, activeTab]);

  const handleValidate = (id: string) => {
    setDossiers(prev => prev.map(d => 
      d.id === id ? { 
        ...d, 
        status: 'VALIDATED', 
        validatedAt: new Date().toISOString(), 
        validatedBy: user.name 
      } : d
    ));
    setSelectedDossier(null);
  };

  const handleArchive = (id: string) => {
    setDossiers(prev => prev.map(d => 
      d.id === id ? { 
        ...d, 
        status: 'ARCHIVED', 
        archivedAt: new Date().toISOString(), 
        archivedBy: user.name 
      } : d
    ));
    setSelectedDossier(null);
  };

  const handleCreateUser = (newUser: Omit<User, 'id'>) => {
    const u: User = {
      ...newUser,
      id: `u-${Math.random().toString(36).substr(2, 9)}`,
      createdBy: user.id
    };
    setUsers(prev => [...prev, u]);
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-antic-blue text-white shadow-xl z-50 shrink-0">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-antic-blue shadow-lg">
                <Shield size={24} />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-black text-xl leading-tight tracking-tighter">SYNC <span className="text-antic-gold">ANTIC</span></h1>
                <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">Portail de Supervision</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <HeaderTab active={activeTab === 'dossiers'} onClick={() => setActiveTab('dossiers')} icon={<FileText size={16} />} label="Dossiers" />
              <HeaderTab active={activeTab === 'archives'} onClick={() => setActiveTab('archives')} icon={<Archive size={16} />} label="Archives" />
              {canManageUsers && (
                <HeaderTab active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={16} />} label="Utilisateurs" />
              )}
              {canManageAntennes && (
                <HeaderTab active={activeTab === 'antennes'} onClick={() => setActiveTab('antennes')} icon={<MapPin size={16} />} label="Antennes" />
              )}
              {canManageCategories && (
                <HeaderTab active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} icon={<Settings size={16} />} label="Catégories" />
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs font-black uppercase tracking-tight">{user.name}</span>
              <span className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">{user.role.replace('_', ' ')}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-antic-gold flex items-center justify-center text-antic-blue font-black text-sm shadow-lg">
              {user.name.charAt(0)}
            </div>
            <button 
              onClick={onLogout}
              className="p-2.5 bg-white/10 hover:bg-red-500 text-white rounded-xl transition-all group"
              title="Déconnexion"
            >
              <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button className="md:hidden p-2.5 bg-white/10 rounded-xl" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Category Bar */}
        {(activeTab === 'dossiers' || activeTab === 'archives') && (
          <div className="bg-white/5 border-t border-white/10 overflow-x-auto no-scrollbar">
            <div className="max-w-[1800px] mx-auto px-4 sm:px-8 py-2 flex items-center gap-2">
              {categories.map(cat => {
                const Icon = IconMap[cat.icon] || Home;
                const isActive = selectedCategoryId === cat.id;
                const isAllowed = !isCirtSecondary || user.allowedCategories?.includes(cat.id) || cat.id === 'accueil';
                
                if (!isAllowed) return null;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 border-2 ${
                      isActive 
                        ? 'bg-antic-gold border-antic-gold text-antic-blue shadow-lg' 
                        : 'border-transparent text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {(activeTab === 'dossiers' || activeTab === 'archives') && (
          <>
            {/* Filters Bar */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 shrink-0">
              <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Rechercher par titre, description, ID..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <Filter size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtres:</span>
                  </div>

                  {isCirtAffiliated && (
                    <FilterSelect 
                      icon={<MapPin size={14} />} 
                      value={filterAntenne} 
                      onChange={setFilterAntenne}
                      options={[{ id: 'all', name: 'Toutes Antennes' }, ...antennes]}
                    />
                  )}

                  <FilterSelect 
                    icon={<Calendar size={14} />} 
                    value={filterYear} 
                    onChange={setFilterYear}
                    options={[{ id: 'all', name: 'Année' }, { id: '2024', name: '2024' }, { id: '2023', name: '2023' }]}
                  />

                  <FilterSelect 
                    icon={<Calendar size={14} />} 
                    value={filterMonth} 
                    onChange={setFilterMonth}
                    options={[
                      { id: 'all', name: 'Mois' },
                      ...Array.from({ length: 12 }, (_, i) => ({ id: (i + 1).toString(), name: new Date(0, i).toLocaleString('fr', { month: 'long' }) }))
                    ]}
                  />

                  {canCreateDossier && activeTab === 'dossiers' && (
                    <button 
                      onClick={() => setIsUploadModalOpen(true)}
                      className="ml-auto flex items-center gap-2 bg-antic-green text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg hover:bg-green-700 transition-all active:scale-95 shrink-0"
                    >
                      <Plus size={18} />
                      NOUVEAU DOSSIER
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dossiers Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <div className="max-w-[1800px] mx-auto">
                {selectedCategoryId === 'accueil' ? (
                  <div className="space-y-12">
                    <div className="bg-slate-900 rounded-[40px] p-8 sm:p-16 text-white relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-1/2 h-full bg-antic-gold/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4"></div>
                      <div className="relative z-10">
                        <h2 className="text-4xl sm:text-6xl font-black mb-6 tracking-tighter leading-none">
                          Tableau de <span className="text-antic-gold">Bord</span>
                        </h2>
                        <p className="text-slate-400 max-w-2xl text-lg font-medium leading-relaxed">
                          Bienvenue, <span className="text-white font-bold">{user.name}</span>. 
                          Vous avez accès à la supervision des dossiers de cybersécurité nationale.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      {categories.filter(c => c.id !== 'accueil').map(cat => {
                        const Icon = IconMap[cat.icon] || Home;
                        const isAllowed = !isCirtSecondary || user.allowedCategories?.includes(cat.id);
                        if (!isAllowed) return null;

                        const count = dossiers.filter(d => d.categoryId === cat.id && d.status === 'PENDING').length;
                        
                        return (
                          <motion.div 
                            key={cat.id}
                            whileHover={{ y: -8, scale: 1.01 }}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className="bg-white p-10 rounded-[40px] border-2 border-slate-100 hover:border-antic-gold shadow-xl hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
                          >
                            <div className="w-16 h-16 bg-slate-50 text-antic-blue rounded-2xl flex items-center justify-center mb-8 group-hover:bg-antic-blue group-hover:text-white transition-all duration-300 shadow-inner">
                              <Icon size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight uppercase tracking-tighter">{cat.label}</h3>
                            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed opacity-80">{cat.description}</p>
                            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossiers en attente</span>
                              <span className={`text-lg font-black px-4 py-1 rounded-2xl ${count > 0 ? 'bg-antic-gold text-antic-blue' : 'bg-slate-100 text-slate-400'}`}>
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
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-antic-blue text-white rounded-2xl flex items-center justify-center shadow-lg">
                            {React.createElement(IconMap[CATEGORIES.find(c => c.id === selectedCategoryId)?.icon || 'Home'], { size: 24 })}
                          </div>
                          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                            {CATEGORIES.find(c => c.id === selectedCategoryId)?.label}
                          </h2>
                        </div>
                        <p className="text-slate-500 font-medium ml-1">
                          {CATEGORIES.find(c => c.id === selectedCategoryId)?.description}
                        </p>
                      </div>
                    </div>

                    {activeTab === 'dossiers' && (
                      <div className="flex items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'ALL' ? 'bg-antic-blue text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                          >
                            Tous
                          </button>
                          <button 
                            onClick={() => setStatusFilter('PENDING')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'PENDING' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                          >
                            En Attente
                          </button>
                          <button 
                            onClick={() => setStatusFilter('VALIDATED')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'VALIDATED' ? 'bg-antic-green text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                          >
                            Validés
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="max-w-4xl">
                      <DossierColumn 
                        title={activeTab === 'archives' ? 'Archives' : (statusFilter === 'ALL' ? 'Tous les Dossiers' : statusFilter === 'PENDING' ? 'Dossiers en Attente' : 'Dossiers Validés')} 
                        icon={activeTab === 'archives' ? <Archive size={16} /> : (statusFilter === 'PENDING' ? <Clock size={16} /> : statusFilter === 'VALIDATED' ? <CheckCircle size={16} /> : <FileText size={16} />)} 
                        dossiers={activeTab === 'archives' ? filteredDossiers : filteredDossiers.filter(d => statusFilter === 'ALL' ? true : d.status === statusFilter)} 
                        color={activeTab === 'archives' ? 'bg-slate-400' : (statusFilter === 'PENDING' ? 'bg-slate-900' : statusFilter === 'VALIDATED' ? 'bg-antic-green' : 'bg-antic-blue')} 
                        accent="bg-white"
                        onSelect={setSelectedDossier}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-[1200px] mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Gestion des Comptes</h2>
                  <p className="text-slate-500 font-medium">Créez et gérez les accès des utilisateurs sous votre autorité.</p>
                </div>
                <button 
                  onClick={() => setIsUserModalOpen(true)}
                  className="flex items-center gap-2 bg-antic-blue text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg hover:bg-blue-700 transition-all"
                >
                  <UserPlus size={18} />
                  NOUVEL UTILISATEUR
                </button>
              </div>

              <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rôle</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Affiliation</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => {
                      // Visibility logic for user management
                      const canSee = isSuperAdmin || 
                                    (isCirtAdmin && u.role === 'CIRT_SECONDARY') ||
                                    (isAntenneDirector && u.role === 'ANTENNE_SIMPLE' && u.antenneId === user.antenneId);
                      
                      if (!canSee && u.id !== user.id) return null;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{u.name}</p>
                                <p className="text-xs text-slate-400 font-medium">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="px-3 py-1 bg-blue-50 text-antic-blue rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${u.affiliation === 'CIRT' ? 'bg-antic-blue' : 'bg-antic-gold'}`}></span>
                              <span className="text-xs font-bold text-slate-600">
                                {u.affiliation} {u.antenneId ? `(${ANTENNES.find(a => a.id === u.antenneId)?.name})` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            {u.id !== user.id && (
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'antennes' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-[1200px] mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Gestion des Antennes</h2>
                  <p className="text-slate-500 font-medium">Configurez les antennes régionales de l'ANTIC.</p>
                </div>
                {isSuperAdmin && (
                  <button 
                    onClick={() => setIsAntenneModalOpen(true)}
                    className="flex items-center gap-2 bg-antic-blue text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg hover:bg-blue-700 transition-all"
                  >
                    <Plus size={18} />
                    NOUVELLE ANTENNE
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {antennes.map(a => (
                  <div key={a.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-lg flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-antic-blue">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-tight">{a.name}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{a.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-[1200px] mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Catégories de Traitement</h2>
                  <p className="text-slate-500 font-medium">Définissez les types de dossiers gérés par la plateforme.</p>
                </div>
                <button 
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="flex items-center gap-2 bg-antic-blue text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg hover:bg-blue-700 transition-all"
                >
                  <Plus size={18} />
                  NOUVELLE CATÉGORIE
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.filter(c => c.id !== 'accueil').map(c => (
                  <div key={c.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-antic-blue">
                        {React.createElement(IconMap[c.icon] || Home, { size: 20 })}
                      </div>
                      <h3 className="font-black text-slate-900 uppercase tracking-tight">{c.label}</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedDossier && (
          <DossierDetailModal 
            dossier={selectedDossier} 
            user={user}
            onClose={() => setSelectedDossier(null)}
            onValidate={handleValidate}
            onArchive={handleArchive}
          />
        )}
        {isUploadModalOpen && (
          <UploadDossierModal 
            user={user}
            categoryId={selectedCategoryId === 'accueil' ? 'scans-vulnerabilite' : selectedCategoryId}
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={(d) => {
              const dossier: Dossier = {
                ...d,
                id: `D-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                createdAt: new Date().toISOString(),
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
                day: new Date().getDate(),
                status: 'PENDING',
                createdBy: user.id,
                antenneName: ANTENNES.find(a => a.id === d.antenneId)?.name || 'CIRT Central'
              };
              setDossiers(prev => [dossier, ...prev]);
              setIsUploadModalOpen(false);
            }}
          />
        )}
        {isUserModalOpen && (
          <CreateUserModal 
            currentUser={user}
            onClose={() => setIsUserModalOpen(false)}
            onCreate={handleCreateUser}
          />
        )}
        {isAntenneModalOpen && (
          <CreateAntenneModal 
            onClose={() => setIsAntenneModalOpen(false)}
            onCreate={(a) => {
              setAntennes(prev => [...prev, { ...a, id: a.name.toLowerCase().replace(/\s+/g, '-') }]);
              setIsAntenneModalOpen(false);
            }}
          />
        )}
        {isCategoryModalOpen && (
          <CreateCategoryModal 
            onClose={() => setIsCategoryModalOpen(false)}
            onCreate={(c) => {
              setCategories(prev => [...prev, { ...c, id: c.label.toLowerCase().replace(/\s+/g, '-'), createdBy: user.id }]);
              setIsCategoryModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-components ---

const HeaderTab: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
      active ? 'bg-white text-antic-blue shadow-lg' : 'text-blue-100 hover:bg-white/10 hover:text-white'
    }`}
  >
    {icon}
    {label}
  </button>
);

const FilterSelect: React.FC<{ icon: React.ReactNode; value: string; onChange: (v: string) => void; options: { id: string; name: string }[] }> = ({ icon, value, onChange, options }) => (
  <div className="relative group">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-antic-blue transition-colors">
      {icon}
    </div>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue appearance-none cursor-pointer hover:bg-white transition-all"
    >
      {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
    </select>
    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
  </div>
);

const DossierColumn: React.FC<{ title: string; icon: React.ReactNode; dossiers: Dossier[]; color: string; accent: string; onSelect: (d: Dossier) => void }> = ({ title, icon, dossiers, color, accent, onSelect }) => (
  <section className="flex flex-col h-full min-h-[500px]">
    <div className={`flex items-center justify-between p-6 ${color} rounded-t-[32px] text-white shadow-lg`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl ${accent} flex items-center justify-center text-slate-900 shadow-inner`}>
          {icon}
        </div>
        <h3 className="font-black uppercase tracking-tighter text-lg">{title}</h3>
      </div>
      <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest">
        {dossiers.length}
      </span>
    </div>
    <div className="flex-1 bg-white border-x border-b border-slate-200 rounded-b-[32px] p-4 space-y-4 overflow-y-auto no-scrollbar shadow-inner">
      {dossiers.length > 0 ? (
        dossiers.map(d => (
          <motion.div 
            key={d.id}
            layoutId={d.id}
            onClick={() => onSelect(d)}
            className="bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:bg-white hover:shadow-xl hover:border-antic-gold transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{d.id}</span>
              <div className="flex items-center gap-1.5 text-slate-400">
                <File size={12} />
                <span className="text-[10px] font-black">{d.attachments.length}</span>
              </div>
            </div>
            <h4 className="font-black text-slate-900 group-hover:text-antic-blue transition-colors uppercase tracking-tight leading-tight mb-2">{d.title}</h4>
            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mb-4">{d.description}</p>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-antic-gold/20 flex items-center justify-center text-[9px] font-black text-antic-blue">
                  {d.antenneName.split(' ')[1]?.[0] || 'C'}
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{d.antenneName}</span>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {new Date(d.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </motion.div>
        ))
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
          <FileText size={40} className="mb-4 opacity-20" />
          <p className="text-[10px] font-black uppercase tracking-widest">Aucun dossier</p>
        </div>
      )}
    </div>
  </section>
);

const DossierDetailModal: React.FC<{ 
  dossier: Dossier; 
  user: User;
  onClose: () => void; 
  onValidate: (id: string) => void;
  onArchive: (id: string) => void;
}> = ({ dossier, user, onClose, onValidate, onArchive }) => {
  const canValidate = (user.role === 'SUPER_ADMIN' || user.role === 'CIRT_ADMIN') && dossier.status === 'PENDING';
  const canArchive = (user.role === 'SUPER_ADMIN' || user.role === 'CIRT_ADMIN' || user.role === 'ANTENNE_DIRECTOR') && dossier.status === 'VALIDATED';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div layoutId={dossier.id} className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier #{dossier.id}</span>
              <StatusBadge status={dossier.status} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{dossier.title}</h3>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Description</h4>
                <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 text-sm text-slate-600 font-medium leading-relaxed">
                  {dossier.description}
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Étapes de Traitement</h4>
                <div className="space-y-4">
                  {dossier.steps?.map((step, idx) => (
                    <div key={step.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${step.status === 'COMPLETED' ? 'bg-antic-green text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {step.status === 'COMPLETED' ? <Check size={16} /> : idx + 1}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 uppercase tracking-tight">{step.label}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requis de: {step.requiredFrom === 'SUPERVISION' ? 'Équipe Supervision (CIRT)' : 'Équipe Réalisation (Antenne)'}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${step.status === 'COMPLETED' ? 'bg-green-50 text-antic-green' : 'bg-amber-50 text-amber-600'}`}>
                          {step.status === 'COMPLETED' ? 'Terminé' : 'En attente'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">{step.description}</p>
                      
                      {step.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {step.attachments.map(at => (
                            <a key={at.id} href={at.url} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-all">
                              <Paperclip size={12} />
                              {at.name} ({at.size})
                            </a>
                          ))}
                        </div>
                      )}

                      {step.status === 'PENDING' && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                          <button className="text-[10px] font-black text-antic-blue uppercase tracking-widest hover:underline flex items-center gap-1">
                            <Upload size={12} />
                            Fournir un document
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Pièces Jointes Générales ({dossier.attachments.length})</h4>
                <div className="grid grid-cols-1 gap-3">
                  {dossier.attachments.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-antic-blue transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-antic-blue group-hover:text-white transition-colors">
                          <File size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{file.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{file.size} • {file.type.split('/')[1].toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-3 text-slate-400 hover:text-antic-blue hover:bg-blue-50 rounded-xl transition-all"><Eye size={18} /></button>
                        <button className="p-3 text-slate-400 hover:text-antic-blue hover:bg-blue-50 rounded-xl transition-all"><Download size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <InfoCard title="Origine" icon={<MapPin size={14} />}>
                <InfoRow label="Antenne" value={dossier.antenneName} />
                <InfoRow label="Créé par" value={MOCK_USERS.find(u => u.id === dossier.createdBy)?.name || 'Inconnu'} />
                <InfoRow label="Date" value={new Date(dossier.createdAt).toLocaleDateString('fr-FR')} />
              </InfoCard>

              {dossier.status === 'VALIDATED' && (
                <InfoCard title="Validation" icon={<CheckCircle size={14} />} color="bg-green-50" borderColor="border-green-100">
                  <InfoRow label="Validé par" value={dossier.validatedBy || 'CIRT'} />
                  <InfoRow label="Le" value={new Date(dossier.validatedAt!).toLocaleDateString('fr-FR')} />
                </InfoCard>
              )}

              {dossier.status === 'ARCHIVED' && (
                <InfoCard title="Archivage" icon={<Archive size={14} />} color="bg-slate-100" borderColor="border-slate-200">
                  <InfoRow label="Archivé par" value={dossier.archivedBy || 'Supervision'} />
                  <InfoRow label="Le" value={new Date(dossier.archivedAt!).toLocaleDateString('fr-FR')} />
                </InfoCard>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
          <button onClick={onClose} className="px-6 py-3 text-sm font-black text-slate-500 hover:bg-slate-200 rounded-2xl transition-all uppercase tracking-widest">Fermer</button>
          {canArchive && (
            <button onClick={() => onArchive(dossier.id)} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-slate-800 transition-all uppercase tracking-widest">
              <Archive size={18} /> Archiver
            </button>
          )}
          {canValidate && (
            <button onClick={() => onValidate(dossier.id)} className="flex items-center gap-2 bg-antic-blue text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest">
              <Check size={20} /> Valider
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: DossierStatus }> = ({ status }) => {
  const styles = {
    PENDING: 'bg-antic-gold text-antic-blue',
    VALIDATED: 'bg-antic-green text-white',
    ARCHIVED: 'bg-slate-400 text-white'
  };
  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest ${styles[status]}`}>
      {status === 'PENDING' ? 'EN ATTENTE' : status === 'VALIDATED' ? 'VALIDÉ' : 'ARCHIVÉ'}
    </span>
  );
};

const InfoCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; color?: string; borderColor?: string }> = ({ title, icon, children, color = "bg-slate-50", borderColor = "border-slate-100" }) => (
  <section className={`${color} p-6 rounded-[24px] border ${borderColor}`}>
    <div className="flex items-center gap-2 mb-4">
      <div className="text-slate-400">{icon}</div>
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between text-xs">
    <span className="text-slate-500 font-bold uppercase tracking-widest">{label}</span>
    <span className="font-black text-slate-900">{value}</span>
  </div>
);

const UploadDossierModal: React.FC<{ user: User; categoryId: CategoryId; onClose: () => void; onUpload: (d: any) => void }> = ({ user, categoryId, onClose, onUpload }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [antenneId, setAntenneId] = useState(user.antenneId || ANTENNES[0].id);
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    onUpload({ title, description, categoryId, antenneId, attachments: files.map((f, i) => ({ id: `new-${i}`, name: f.name, size: `${(f.size / 1024 / 1024).toFixed(1)} MB`, type: f.type, url: '#' })) });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Nouveau Dossier</h3>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><X size={24} className="text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Titre du dossier</label>
            <input type="text" required placeholder="Ex: Scan vulnérabilité Réseau X" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue transition-all" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
              <div className="px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-sm text-slate-500 font-black uppercase tracking-tight">{CATEGORIES.find(c => c.id === categoryId)?.label}</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Antenne</label>
              <select 
                disabled={!!user.antenneId}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue transition-all" 
                value={antenneId} 
                onChange={(e) => setAntenneId(e.target.value)}
              >
                {ANTENNES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Analyse</label>
            <textarea required rows={4} placeholder="Détails du dossier..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue transition-all resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fichiers joints</label>
            <div className="mt-1 flex justify-center px-6 pt-10 pb-10 border-4 border-slate-200 border-dashed rounded-[32px] hover:border-antic-blue transition-colors bg-slate-50/50">
              <div className="space-y-2 text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-300" />
                <div className="flex text-sm text-slate-600 font-black uppercase tracking-tight">
                  <label className="relative cursor-pointer bg-white rounded-lg px-2 text-antic-blue hover:text-blue-700"><span>Téléverser</span><input type="file" multiple className="sr-only" onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))} /></label>
                  <p className="pl-1">ou glisser-déposer</p>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PDF, PNG, JPG (Max 10MB)</p>
              </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-black text-slate-500 hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest">Annuler</button>
            <button type="submit" className="bg-antic-blue text-white px-10 py-3 rounded-2xl text-sm font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest">Soumettre</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const CreateUserModal: React.FC<{ 
  currentUser: User; 
  onClose: () => void; 
  onCreate: (u: Omit<User, 'id'>) => void 
}> = ({ currentUser, onClose, onCreate }) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('ANTENNE_SIMPLE');
  const [antenneId, setAntenneId] = useState('');
  const [allowedCategories, setAllowedCategories] = useState<CategoryId[]>([]);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isCirtAdmin = currentUser.role === 'CIRT_ADMIN';
  const isAntenneDirector = currentUser.role === 'ANTENNE_DIRECTOR';

  const availableRoles: UserRole[] = [];
  if (isSuperAdmin || isCirtAdmin) {
    availableRoles.push('CIRT_ADMIN', 'CIRT_SECONDARY', 'ANTENNE_DIRECTOR', 'ANTENNE_SIMPLE');
  } else if (isAntenneDirector) {
    availableRoles.push('ANTENNE_SIMPLE');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      username,
      name,
      role,
      affiliation: (role === 'CIRT_ADMIN' || role === 'CIRT_SECONDARY') ? 'CIRT' : 'ANTENNE',
      antenneId: (role === 'ANTENNE_DIRECTOR' || role === 'ANTENNE_SIMPLE') ? (isAntenneDirector ? currentUser.antenneId : antenneId) : undefined,
      allowedCategories: role === 'CIRT_SECONDARY' ? allowedCategories : undefined,
      createdBy: currentUser.id
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden p-8">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">Nouvel Utilisateur</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nom Complet</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue"
              placeholder="ex: Jean Dupont"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nom d'utilisateur</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue"
              placeholder="ex: jdupont"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Rôle</label>
            <select 
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue"
            >
              {availableRoles.map(r => (
                <option key={r} value={r}>{r.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {(role === 'ANTENNE_DIRECTOR' || role === 'ANTENNE_SIMPLE') && !isAntenneDirector && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Antenne</label>
              <select 
                required
                value={antenneId}
                onChange={e => setAntenneId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue"
              >
                <option value="">Sélectionner une antenne</option>
                {ANTENNES.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {role === 'CIRT_SECONDARY' && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Catégories Autorisées</label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                {CATEGORIES.filter(c => c.id !== 'accueil').map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer hover:text-antic-blue">
                    <input 
                      type="checkbox"
                      checked={allowedCategories.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) setAllowedCategories([...allowedCategories, cat.id]);
                        else setAllowedCategories(allowedCategories.filter(id => id !== cat.id));
                      }}
                      className="rounded border-slate-300 text-antic-blue focus:ring-antic-blue"
                    />
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl text-xs font-black text-slate-400 hover:bg-slate-50 transition-all"
            >
              ANNULER
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-3 bg-antic-blue text-white rounded-2xl text-xs font-black shadow-lg hover:bg-blue-700 transition-all"
            >
              CRÉER
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const CreateAntenneModal: React.FC<{ onClose: () => void; onCreate: (a: Omit<Antenne, 'id'>) => void }> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden p-8">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">Nouvelle Antenne</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nom de l'Antenne</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue" placeholder="ex: Antenne Nord" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Localisation (Ville)</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue" placeholder="ex: Garoua" />
          </div>
          <div className="pt-4 flex gap-3">
            <button onClick={onClose} className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl text-xs font-black text-slate-400 hover:bg-slate-50 transition-all">ANNULER</button>
            <button onClick={() => onCreate({ name, location })} className="flex-1 px-6 py-3 bg-antic-blue text-white rounded-2xl text-xs font-black shadow-lg hover:bg-blue-700 transition-all">CRÉER</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const CreateCategoryModal: React.FC<{ onClose: () => void; onCreate: (c: Omit<Category, 'id'>) => void }> = ({ onClose, onCreate }) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('FileText');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden p-8">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">Nouvelle Catégorie</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Libellé</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue" placeholder="ex: Audit de Sécurité" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue h-24 resize-none" placeholder="Description de la catégorie..." />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Icône</label>
            <select value={icon} onChange={e => setIcon(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-antic-blue/20 focus:border-antic-blue">
              <option value="FileText">Document</option>
              <option value="Shield">Bouclier</option>
              <option value="Lock">Cadenas</option>
              <option value="Search">Loupe</option>
              <option value="Activity">Activité</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button onClick={onClose} className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl text-xs font-black text-slate-400 hover:bg-slate-50 transition-all">ANNULER</button>
            <button onClick={() => onCreate({ label, description, icon })} className="flex-1 px-6 py-3 bg-antic-blue text-white rounded-2xl text-xs font-black shadow-lg hover:bg-blue-700 transition-all">CRÉER</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
