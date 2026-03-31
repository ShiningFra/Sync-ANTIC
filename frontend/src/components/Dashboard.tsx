import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, FileText, Clock, CheckCircle, Archive, Plus, LogOut,
  Search, Users, BarChart3, X, Menu, Loader2, AlertCircle,
  ShieldAlert, UserX, Database, Fingerprint, Check, Trash2,
  Building2, UserPlus, Key, RefreshCw, MapPin, Activity,
  TrendingUp, Edit2, Save, Eye, EyeOff, ChevronRight,
  Tag, UserCheck, Settings,
} from 'lucide-react';
import type {
  User, Dossier, Category, Antenne, ServiceCirt,
  DossierStatus, StatGlobale, StatAntenne, UserRole, PermissionCategory,
} from '../types';
import {
  ROLE_LABELS, canCreateUsers, canCreateDossiers,
  canValidate, canArchive, canViewStats, canManageAntennes, CREATABLE_ROLES,
} from '../types';
import * as api from '../api';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<DossierStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
  EN_COURS: { label: 'En cours', bg: '#fff7ed', text: '#9a3412', dot: '#f97316', border: '#fed7aa' },
  VALIDE:   { label: 'Validé',   bg: '#f0fdf4', text: '#14532d', dot: '#22c55e', border: '#bbf7d0' },
  ARCHIVE:  { label: 'Archivé',  bg: '#eff6ff', text: '#1e3a8a', dot: '#3b82f6', border: '#bfdbfe' },
};

const CAT_ICONS: Record<string, React.ElementType> = {
  'Scans de Vulnérabilité':  ShieldAlert,
  'Fermeture de Comptes':    UserX,
  'Veille Informationnelle': Search,
  "Collecte d'Actifs":       Database,
  'Base Points Focaux':      Users,
  'Réquisitions':            FileText,
  'Preuves Numériques':      Fingerprint,
};
const CAT_COLORS = ['#0057a8','#0070cc','#1b8a4e','#7c3aed','#db2777','#d97706','#0891b2'];

type Tab = 'dashboard' | 'dossiers' | 'stats' | 'users' | 'antennes' | 'organisation' | 'categories';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS : calcul des catégories visibles pour un utilisateur
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne les catégories auxquelles un utilisateur a accès.
 * - super_admin / admin_cirt : toutes
 * - chef_service / directeur_antenne : toutes (supervision)
 * - agent_cirt / agent_antenne : seulement celles assignées via PermissionCategory
 */
function getVisibleCategories(
  user: User,
  allCategories: Category[],
  myPermissions: PermissionCategory[]
): Category[] {
  if (['super_admin', 'admin_cirt', 'chef_service', 'directeur_antenne'].includes(user.role)) {
    return allCategories;
  }
  // agent_cirt ou agent_antenne : filtré par permissions
  const allowed = new Set(myPermissions.map(p => p.category.id));
  return allCategories.filter(c => allowed.has(c.id));
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS DE BASE
// ─────────────────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: DossierStatus }> = ({ status }) => {
  const c = STATUS_CFG[status];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:c.bg, color:c.text, border:`1px solid ${c.border}` }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot, flexShrink:0 }}/>
      {c.label}
    </span>
  );
};

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const colors: Record<string, string> = {
    super_admin:'#7c3aed', admin_cirt:'#0057a8', chef_service:'#0891b2',
    directeur_antenne:'#1b8a4e', agent_cirt:'#0070cc', agent_antenne:'#6b7280',
  };
  return (
    <span style={{ display:'inline-flex', padding:'2px 9px', borderRadius:99, fontSize:11, fontWeight:600, background:colors[role]??'#64748b', color:'white' }}>
      {ROLE_LABELS[role]}
    </span>
  );
};

const Modal: React.FC<{ title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; width?: number }> = ({
  title, subtitle, onClose, children, width = 520
}) => (
  <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(0,40,85,0.55)', backdropFilter:'blur(6px)' }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{ background:'white', borderRadius:16, boxShadow:'0 24px 64px rgba(0,40,85,0.2)', width:'100%', maxWidth:width, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}
         className="anim-fadeup">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #e8edf5' }}>
        <div>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:17, color:'#0d1b2a' }}>{title}</h3>
          {subtitle && <p style={{ fontSize:12, color:'#5a6a7e', marginTop:3 }}>{subtitle}</p>}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4, borderRadius:6, display:'flex' }}>
          <X size={18}/>
        </button>
      </div>
      <div style={{ padding:24, overflowY:'auto', flex:1 }}>{children}</div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({ label, required, hint, children }) => (
  <div>
    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#003366', marginBottom:6, letterSpacing:'0.07em', textTransform:'uppercase' }}>
      {label}{required && <span style={{ color:'#dc2626', marginLeft:3 }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{hint}</p>}
  </div>
);

const inputS: React.CSSProperties = {
  width:'100%', padding:'10px 13px', background:'#f8fafd',
  border:'1.5px solid #dde3ed', borderRadius:8, fontSize:13,
  color:'#0d1b2a', outline:'none', transition:'border-color 0.2s, box-shadow 0.2s',
  fontFamily:'Outfit, sans-serif',
};
const focusHandlers = {
  onFocus: (e: React.FocusEvent<any>) => { e.target.style.borderColor='#0057a8'; e.target.style.boxShadow='0 0 0 3px rgba(0,87,168,0.1)'; },
  onBlur:  (e: React.FocusEvent<any>) => { e.target.style.borderColor='#dde3ed'; e.target.style.boxShadow='none'; },
};
const Inp = (props: React.InputHTMLAttributes<HTMLInputElement>) =>
  <input {...props} style={{ ...inputS, ...props.style }} {...focusHandlers}/>;
const Sel = (props: React.SelectHTMLAttributes<HTMLSelectElement>) =>
  <select {...props} style={{ ...inputS, cursor:'pointer', ...props.style }} {...focusHandlers}/>;
const Txa = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) =>
  <textarea {...props} style={{ ...inputS, minHeight:80, resize:'vertical', ...props.style }} {...focusHandlers}/>;

const Btn: React.FC<{
  variant?: 'primary'|'secondary'|'danger'|'ghost'|'success';
  children: React.ReactNode; onClick?: () => void;
  type?: 'button'|'submit'; disabled?: boolean; small?: boolean; full?: boolean;
}> = ({ variant='primary', children, onClick, type='button', disabled, small, full }) => {
  const s: Record<string, React.CSSProperties> = {
    primary:   { background:disabled?'#93c5fd':'#0057a8', color:'white', border:'none', boxShadow:disabled?'none':'0 2px 10px rgba(0,87,168,0.28)' },
    secondary: { background:'white', color:'#0057a8', border:'1.5px solid #c5d8f0' },
    danger:    { background:'#dc2626', color:'white', border:'none' },
    ghost:     { background:'transparent', color:'#5a6a7e', border:'1.5px solid #e8edf5' },
    success:   { background:'#16a34a', color:'white', border:'none' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:small?'6px 12px':'10px 18px', borderRadius:8, border:'none', fontSize:small?12:13, fontWeight:600, cursor:disabled?'not-allowed':'pointer', transition:'all 0.15s', fontFamily:'Outfit,sans-serif', whiteSpace:'nowrap', width:full?'100%':'auto', justifyContent:'center', ...s[variant] }}
    >{children}</button>
  );
};

const ErrBox: React.FC<{ msg: string }> = ({ msg }) => (
  <div style={{ display:'flex', gap:8, padding:'10px 14px', background:'#fef2f2', borderRadius:8, border:'1px solid #fecaca' }}>
    <AlertCircle size={14} color="#dc2626" style={{ flexShrink:0, marginTop:1 }}/>
    <span style={{ fontSize:12, color:'#991b1b' }}>{msg}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MODAL : GESTION DES CATÉGORIES D'UN UTILISATEUR
// ─────────────────────────────────────────────────────────────────────────────
const ModalCategories: React.FC<{
  targetUser: User;
  allCategories: Category[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ targetUser, allCategories, onClose, onSaved }) => {
  const [perms, setPerms]   = useState<PermissionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<number | null>(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.getUserPermissions(targetUser.id)
      .then(setPerms)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [targetUser.id]);

  const isGranted = (catId: number) => perms.some(p => p.category.id === catId);

  const toggle = async (cat: Category) => {
    setSaving(cat.id); setError('');
    try {
      if (isGranted(cat.id)) {
        await api.revokeCategoryPermission(targetUser.id, cat.id);
        setPerms(prev => prev.filter(p => p.category.id !== cat.id));
      } else {
        const newPerm = await api.grantCategoryPermission(targetUser.id, cat.id);
        setPerms(prev => [...prev, newPerm]);
      }
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(null); }
  };

  return (
    <Modal title="Catégories autorisées" subtitle={`${targetUser.name} · ${ROLE_LABELS[targetUser.role]}`} onClose={onClose} width={480}>
      {error && <div style={{ marginBottom:16 }}><ErrBox msg={error}/></div>}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:32 }}>
          <Loader2 size={24} color="#0057a8" style={{ animation:'spin 1s linear infinite' }}/>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <p style={{ fontSize:12, color:'#5a6a7e', marginBottom:8, lineHeight:1.5 }}>
            Activez les catégories auxquelles cet utilisateur peut accéder.
            Les dossiers et menus seront filtrés en conséquence.
          </p>
          {allCategories.map(cat => {
            const Icon    = CAT_ICONS[cat.name] ?? FileText;
            const granted = isGranted(cat.id);
            const busy    = saving === cat.id;
            const idx     = allCategories.indexOf(cat);
            const color   = CAT_COLORS[idx % CAT_COLORS.length];
            return (
              <div key={cat.id}
                onClick={() => !busy && toggle(cat)}
                style={{
                  display:'flex', alignItems:'center', gap:14, padding:'12px 14px',
                  borderRadius:10, border:`1.5px solid ${granted ? color : '#e8edf5'}`,
                  background: granted ? `${color}0d` : '#f8fafd',
                  cursor: busy ? 'wait' : 'pointer', transition:'all 0.15s',
                }}>
                <div style={{ width:36, height:36, borderRadius:8, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={16} color={color}/>
                </div>
                <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#0d1b2a' }}>{cat.name}</span>
                {busy ? (
                  <Loader2 size={16} color={color} style={{ animation:'spin 1s linear infinite' }}/>
                ) : granted ? (
                  <div style={{ width:22, height:22, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Check size={13} color="white"/>
                  </div>
                ) : (
                  <div style={{ width:22, height:22, borderRadius:'50%', border:'2px solid #dde3ed' }}/>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL : MODIFIER SON PROFIL
// ─────────────────────────────────────────────────────────────────────────────
const ModalProfile: React.FC<{ user: User; onClose: () => void; onSaved: (u: User) => void }> = ({
  user, onClose, onSaved
}) => {
  const [name, setName]         = useState(user.name);
  const [email, setEmail]       = useState(user.email);
  const [pwd, setPwd]           = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (pwd && pwd !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setSaving(true);
    try {
      const payload: api.UpdateProfilePayload = {};
      if (name  !== user.name)  payload.name  = name;
      if (email !== user.email) payload.email = email;
      if (pwd)                  payload.password = pwd;
      if (Object.keys(payload).length === 0) { setError('Aucune modification détectée'); setSaving(false); return; }
      const updated = await api.updateProfile(payload);
      setSuccess('Profil mis à jour avec succès !');
      onSaved(updated);
      setPwd(''); setConfirm('');
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Mon profil" subtitle="Modifier vos informations personnelles" onClose={onClose} width={460}>
      <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {error   && <ErrBox msg={error}/>}
        {success && (
          <div style={{ display:'flex', gap:8, padding:'10px 14px', background:'#f0fdf4', borderRadius:8, border:'1px solid #bbf7d0' }}>
            <Check size={14} color="#16a34a" style={{ flexShrink:0, marginTop:1 }}/>
            <span style={{ fontSize:12, color:'#14532d', fontWeight:600 }}>{success}</span>
          </div>
        )}

        <Field label="Nom complet" required>
          <Inp value={name} onChange={e => setName(e.target.value)} required/>
        </Field>

        <Field label="Adresse e-mail" required hint="Si vous changez votre email, vous devrez vous reconnecter.">
          <Inp type="email" value={email} onChange={e => setEmail(e.target.value)} required/>
        </Field>

        <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:14, marginTop:4 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#5a6a7e', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>
            Changer le mot de passe (optionnel)
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Field label="Nouveau mot de passe">
              <div style={{ position:'relative' }}>
                <Inp type={showPwd?'text':'password'} value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Laisser vide pour ne pas changer" style={{ paddingRight:40 }}/>
                <button type="button" onClick={()=>setShowPwd(v=>!v)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}>
                  {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </Field>
            {pwd && (
              <Field label="Confirmer le mot de passe">
                <Inp type={showPwd?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Répéter le mot de passe"/>
              </Field>
            )}
          </div>
        </div>

        <div style={{ display:'flex', gap:10, paddingTop:4 }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn type="submit" disabled={saving} full>{saving ? 'Enregistrement…' : <><Save size={13}/> Enregistrer</>}</Btn>
        </div>
      </form>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const Sidebar: React.FC<{
  user: User; active: Tab; onChange: (t: Tab) => void;
  onLogout: () => void; onEditProfile: () => void;
  collapsed: boolean; onToggle: () => void;
}> = ({ user, active, onChange, onLogout, onEditProfile, collapsed, onToggle }) => {
  const tabs: { id: Tab; label: string; icon: React.ElementType; show: boolean }[] = [
    { id:'dashboard',   label:'Tableau de bord', icon:Activity,   show:canViewStats(user.role) },
    { id:'dossiers',    label:'Dossiers',        icon:FileText,   show:true },
    { id:'stats',       label:'Statistiques',   icon:BarChart3,  show:canViewStats(user.role) },
    { id:'users',       label:'Utilisateurs',   icon:Users,      show:canCreateUsers(user.role) },
    { id:'antennes',    label:'Antennes',        icon:MapPin,     show:canManageAntennes(user.role) },
    { id:'organisation',label:'Organisation',   icon:Building2,  show:['super_admin','admin_cirt'].includes(user.role) },
    { id:'categories',  label:'Catégories',     icon:Key,        show:user.role==='super_admin' },
  ];
  const W = collapsed ? 68 : 240;
  return (
    <aside style={{ width:W, minWidth:W, height:'100vh', display:'flex', flexDirection:'column', background:'var(--sidebar-bg)', transition:'width 0.25s cubic-bezier(.4,0,.2,1)', flexShrink:0, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:collapsed?'18px 16px':'18px 16px 18px 20px', borderBottom:'1px solid var(--sidebar-border)', minHeight:68 }}>
        {!collapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:10, overflow:'hidden' }}>
            <div style={{ width:34, height:34, borderRadius:8, background:'var(--antic-blue)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Shield size={18} color="white"/>
            </div>
            <div>
              <p style={{ color:'white', fontWeight:800, fontSize:14, whiteSpace:'nowrap', letterSpacing:'0.05em' }}>SYNC ANTIC</p>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:9, letterSpacing:'0.15em', textTransform:'uppercase' }}>CIRT Platform</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ width:34, height:34, borderRadius:8, background:'var(--antic-blue)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
            <Shield size={18} color="white"/>
          </div>
        )}
        <button onClick={onToggle} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:4, borderRadius:6, display:'flex', flexShrink:0, marginLeft:collapsed?0:'auto' }}>
          <Menu size={17}/>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'8px', overflowY:'auto' }}>
        {tabs.filter(t => t.show).map(tab => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)} title={collapsed?tab.label:undefined}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:collapsed?'10px 0':'10px 12px', justifyContent:collapsed?'center':'flex-start', borderRadius:8, border:'none', cursor:'pointer', marginBottom:2, background:isActive?'var(--sidebar-active)':'transparent', color:isActive?'white':'var(--sidebar-text)', borderLeft:isActive?'3px solid var(--antic-gold)':'3px solid transparent', transition:'all 0.15s', fontFamily:'Outfit,sans-serif' }}
              onMouseEnter={e => { if(!isActive)(e.currentTarget as HTMLElement).style.background='var(--sidebar-hover)'; }}
              onMouseLeave={e => { if(!isActive)(e.currentTarget as HTMLElement).style.background='transparent'; }}
            >
              <Icon size={17} style={{ flexShrink:0 }}/>
              {!collapsed && <span style={{ fontSize:13, fontWeight:isActive?600:400, whiteSpace:'nowrap' }}>{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      <div style={{ borderTop:'1px solid var(--sidebar-border)', padding:'12px 8px' }}>
        {!collapsed ? (
          <div style={{ borderRadius:8, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--antic-blue)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white', flexShrink:0 }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color:'white', fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</p>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
            <div style={{ display:'flex', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={onEditProfile}
                style={{ flex:1, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.45)', padding:'7px 0', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontFamily:'Outfit,sans-serif', transition:'color 0.15s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='white'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.45)'}
                title="Modifier le profil">
                <Edit2 size={12}/> Profil
              </button>
              <div style={{ width:1, background:'rgba(255,255,255,0.06)' }}/>
              <button onClick={onLogout}
                style={{ flex:1, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.45)', padding:'7px 0', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontFamily:'Outfit,sans-serif', transition:'color 0.15s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='#f87171'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.45)'}
                title="Déconnexion">
                <LogOut size={12}/> Quitter
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <button onClick={onEditProfile} title="Modifier le profil"
              style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:'8px 0', display:'flex', justifyContent:'center', borderRadius:6 }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='white'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.35)'}>
              <Edit2 size={15}/>
            </button>
            <button onClick={onLogout} title="Déconnexion"
              style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:'8px 0', display:'flex', justifyContent:'center', borderRadius:6 }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='#f87171'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.35)'}>
              <LogOut size={15}/>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────────────────────
const TAB_TITLES: Record<Tab, string> = {
  dashboard:'Tableau de bord', dossiers:'Dossiers', stats:'Statistiques',
  users:'Utilisateurs', antennes:'Antennes', organisation:'Organisation CIRT', categories:'Catégories',
};
const KpiCard: React.FC<{ label:string; value:number|string; icon:React.ElementType; color:string; bg:string; sub?:string; delay?:number }> = ({ label, value, icon:Icon, color, bg, sub, delay=0 }) => (
  <div className={`anim-fadeup delay-${delay}`} style={{ background:'white', borderRadius:12, padding:'20px 22px', border:'1px solid #e8edf5', display:'flex', alignItems:'flex-start', gap:14, boxShadow:'0 1px 4px rgba(0,40,85,0.05)' }}>
    <div style={{ width:44, height:44, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <Icon size={20} color={color}/>
    </div>
    <div>
      <p style={{ fontSize:11, color:'#5a6a7e', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:26, fontWeight:800, color:'#0d1b2a', lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{sub}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// VUE : TABLEAU DE BORD
// ─────────────────────────────────────────────────────────────────────────────
const DashboardView: React.FC<{ user:User; dossiers:Dossier[]; categories:Category[]; myPermissions:PermissionCategory[] }> = ({
  user, dossiers, categories, myPermissions
}) => {
  const visibleCats = getVisibleCategories(user, categories, myPermissions);
  const enCours  = dossiers.filter(d => d.status==='EN_COURS').length;
  const valides  = dossiers.filter(d => d.status==='VALIDE').length;
  const archives = dossiers.filter(d => d.status==='ARCHIVE').length;
  const recent   = [...dossiers].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,6);
  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:24 }}>
      {/* Bannière */}
      <div className="anim-fadeup" style={{ background:'linear-gradient(120deg,#003366,#0057a8)', borderRadius:14, padding:'24px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:0, top:0, width:200, height:'100%', background:'rgba(77,184,255,0.08)', clipPath:'ellipse(100% 80% at 80% 50%)', pointerEvents:'none' }}/>
        <div>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>Bienvenue</p>
          <h2 style={{ fontFamily:'Syne,sans-serif', color:'white', fontWeight:800, fontSize:22, marginBottom:6 }}>{user.name}</h2>
          <span style={{ display:'inline-flex', background:'rgba(255,255,255,0.12)', borderRadius:99, padding:'4px 12px', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.85)', border:'1px solid rgba(255,255,255,0.2)' }}>
            {ROLE_LABELS[user.role]}
            {user.antenne && ` · ${user.antenne.name}`}
            {user.service && ` · ${user.service.name}`}
          </span>
        </div>
        <div style={{ textAlign:'right' }}>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11 }}>{new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
          <p style={{ color:'white', fontSize:28, fontWeight:800, marginTop:4 }}>{dossiers.length}</p>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:11 }}>dossier{dossiers.length>1?'s':''} visible{dossiers.length>1?'s':''}</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        <KpiCard label="Total" value={dossiers.length} icon={FileText} color="#0057a8" bg="#eff6ff" delay={1}/>
        <KpiCard label="En cours" value={enCours} icon={Clock} color="#d97706" bg="#fffbeb" sub={`${dossiers.length?Math.round(enCours/dossiers.length*100):0}%`} delay={2}/>
        <KpiCard label="Validés" value={valides} icon={CheckCircle} color="#16a34a" bg="#f0fdf4" delay={3}/>
        <KpiCard label="Archivés" value={archives} icon={Archive} color="#2563eb" bg="#eff6ff" delay={4}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        {/* Activité récente */}
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e8edf5', overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #e8edf5', display:'flex', alignItems:'center', gap:8 }}>
            <Activity size={14} color="#0057a8"/>
            <span style={{ fontWeight:700, fontSize:14, color:'#003366' }}>Activité récente</span>
          </div>
          {recent.length===0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>
              <FileText size={32} style={{ margin:'0 auto 10px', opacity:0.25 }}/>
              <p style={{ fontSize:13 }}>Aucun dossier</p>
            </div>
          ) : recent.map((d,i)=>{
            const Icon = d.category?(CAT_ICONS[d.category.name]??FileText):FileText;
            const color = d.category?CAT_COLORS[visibleCats.findIndex(c=>c.id===d.category!.id)%CAT_COLORS.length]:'#64748b';
            return (
              <div key={d.id} className={`anim-slidein delay-${Math.min(i+1,5)}`}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'11px 20px', borderBottom:i<recent.length-1?'1px solid #f1f5f9':'none', transition:'background 0.12s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f8fafd'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                <div style={{ width:34, height:34, borderRadius:8, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={15} color={color}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:600, fontSize:13, color:'#0d1b2a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.title}</p>
                  <p style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{d.category?.name??'—'} · {new Date(d.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <StatusBadge status={d.status}/>
              </div>
            );
          })}
        </div>

        {/* Catégories accessibles */}
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e8edf5', overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #e8edf5', display:'flex', alignItems:'center', gap:8 }}>
            <Tag size={14} color="#0057a8"/>
            <span style={{ fontWeight:700, fontSize:14, color:'#003366' }}>Mes catégories</span>
            <span style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8', background:'#f1f5f9', borderRadius:99, padding:'2px 8px' }}>{visibleCats.length}</span>
          </div>
          <div style={{ padding:'8px 0' }}>
            {visibleCats.map((cat,i)=>{
              const count = dossiers.filter(d=>d.category?.id===cat.id).length;
              const color = CAT_COLORS[i%CAT_COLORS.length];
              const Icon  = CAT_ICONS[cat.name]??FileText;
              return (
                <div key={cat.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 18px' }}>
                  <div style={{ width:28, height:28, borderRadius:6, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={13} color={color}/>
                  </div>
                  <span style={{ flex:1, fontSize:12, fontWeight:600, color:'#0d1b2a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cat.name}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:color }}>{count}</span>
                </div>
              );
            })}
            {visibleCats.length===0 && (
              <p style={{ fontSize:12, color:'#94a3b8', padding:'16px 18px', textAlign:'center' }}>Aucune catégorie assignée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VUE : DOSSIERS
// ─────────────────────────────────────────────────────────────────────────────
const DossiersView: React.FC<{
  user: User; dossiers: Dossier[];
  categories: Category[]; myPermissions: PermissionCategory[];
  onRefresh: () => void;
}> = ({ user, dossiers, categories, myPermissions, onRefresh }) => {
  const [search, setSearch]         = useState('');
  const [filterStatus, setFS]       = useState<DossierStatus|'ALL'>('ALL');
  const [filterCat, setFC]          = useState('ALL');
  const [selected, setSelected]     = useState<Dossier|null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState({ title:'', description:'', categoryId:'' });
  const [urlsText, setUrlsText]     = useState('');   // pour les scans
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // Scans : URLs du dossier sélectionné + stats
  const [scanUrls, setScanUrls]     = useState<api.ScanUrl[]>([]);
  const [scanStats, setScanStats]   = useState<api.ScanStats|null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [addingUrls, setAddingUrls] = useState(false);
  const [newUrls, setNewUrls]       = useState('');

  const SCAN_CAT_NAME = 'Scans de Vulnérabilité';
  const isScanCat = (catId: string | number) =>
    categories.find(c => String(c.id) === String(catId))?.name === SCAN_CAT_NAME;

  // ⚠️ FILTRAGE : les agents ne voient que leurs catégories autorisées
  const visibleCats = getVisibleCategories(user, categories, myPermissions);
  const allowedCatIds = new Set(visibleCats.map(c => c.id));

  const filtered = dossiers.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) || (d.category?.name??'').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus==='ALL' || d.status===filterStatus;
    const matchCat    = filterCat==='ALL' || String(d.category?.id)===filterCat;
    return matchSearch && matchStatus && matchCat;
  });

  const counts = {
    ALL:     dossiers.length,
    EN_COURS:dossiers.filter(d=>d.status==='EN_COURS').length,
    VALIDE:  dossiers.filter(d=>d.status==='VALIDE').length,
    ARCHIVE: dossiers.filter(d=>d.status==='ARCHIVE').length,
  };

  const act = async (fn: () => Promise<any>) => {
    try { await fn(); onRefresh(); setSelected(null); }
    catch (e: any) { alert(e.message); }
  };

  // Charger les URLs quand on ouvre un dossier de scan
  const openDossier = async (d: Dossier) => {
    setSelected(d);
    if (d.category?.name === SCAN_CAT_NAME) {
      setScanLoading(true);
      try {
        const [urls, stats] = await Promise.all([
          api.getScanUrls(d.id),
          api.getScanStats(d.id),
        ]);
        setScanUrls(urls); setScanStats(stats);
      } catch {} finally { setScanLoading(false); }
    }
  };

  const handleAddUrls = async () => {
    if (!selected || !newUrls.trim()) return;
    try {
      await api.addScanUrls(selected.id, newUrls);
      const [urls, stats] = await Promise.all([api.getScanUrls(selected.id), api.getScanStats(selected.id)]);
      setScanUrls(urls); setScanStats(stats);
      setNewUrls(''); setAddingUrls(false);
    } catch (e: any) { alert(e.message); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const dossier = await api.createDossier({ title:form.title, description:form.description, categoryId:Number(form.categoryId) });
      // Si catégorie scans et URLs fournies, les soumettre immédiatement
      if (isScanCat(form.categoryId) && urlsText.trim()) {
        await api.addScanUrls(dossier.id, urlsText);
      }
      setShowCreate(false); setForm({ title:'', description:'', categoryId:'' }); setUrlsText(''); onRefresh();
    } catch(e:any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#003366' }}>Dossiers</h2>
          <p style={{ fontSize:12, color:'#5a6a7e', marginTop:2 }}>{filtered.length} / {dossiers.length}</p>
        </div>
        {canCreateDossiers(user.role) && visibleCats.length>0 && (
          <Btn onClick={()=>setShowCreate(true)}><Plus size={14}/> Nouveau dossier</Btn>
        )}
        {canCreateDossiers(user.role) && visibleCats.length===0 && (
          <div style={{ padding:'8px 14px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, fontSize:12, color:'#92400e' }}>
            ⚠ Aucune catégorie assignée — contactez votre directeur
          </div>
        )}
      </div>

      {/* Filtres statut */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
        {(['ALL','EN_COURS','VALIDE','ARCHIVE'] as const).map(s=>(
          <button key={s} onClick={()=>setFS(s as any)}
            style={{ padding:'5px 13px', borderRadius:99, fontSize:12, fontWeight:600, border:filterStatus===s?'1.5px solid #0057a8':'1.5px solid #e8edf5', background:filterStatus===s?'#0057a8':'white', color:filterStatus===s?'white':'#5a6a7e', cursor:'pointer', transition:'all 0.15s' }}>
            {s==='ALL'?'Tous':STATUS_CFG[s as DossierStatus].label}
            <span style={{ marginLeft:6, background:filterStatus===s?'rgba(255,255,255,0.2)':'#f1f5f9', borderRadius:99, padding:'1px 6px', fontSize:10 }}>
              {counts[s]}
            </span>
          </button>
        ))}
        <div style={{ flex:1 }}/>
        <div style={{ position:'relative' }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
            style={{ ...inputS, paddingLeft:32, width:200, height:34 }} {...focusHandlers}/>
        </div>
        {/* Filtre catégorie : uniquement les catégories visibles */}
        <Sel value={filterCat} onChange={e=>setFC(e.target.value)} style={{ width:190, height:34, padding:'0 10px', fontSize:12 }}>
          <option value="ALL">Toutes catégories</option>
          {visibleCats.map(c=><option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </Sel>
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:12, border:'1px solid #e8edf5', overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 160px 160px 110px 80px', padding:'10px 16px', background:'#f8fafd', borderBottom:'1px solid #e8edf5', fontSize:10, fontWeight:700, color:'#5a6a7e', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          <span>Titre</span><span>Catégorie</span><span>Antenne</span><span>Statut</span><span>Date</span>
        </div>
        {filtered.length===0 ? (
          <div style={{ padding:48, textAlign:'center', color:'#94a3b8' }}>
            <FileText size={32} style={{ margin:'0 auto 10px', opacity:0.25 }}/>
            <p style={{ fontSize:13, fontWeight:600 }}>Aucun dossier trouvé</p>
          </div>
        ) : filtered.map((d,i)=>{
          const Icon = d.category?(CAT_ICONS[d.category.name]??FileText):FileText;
          const idx  = visibleCats.findIndex(c=>c.id===d.category?.id);
          const color = idx>=0 ? CAT_COLORS[idx%CAT_COLORS.length] : '#64748b';
          return (
            <div key={d.id} onClick={()=>openDossier(d)}
              style={{ display:'grid', gridTemplateColumns:'1fr 160px 160px 110px 80px', padding:'11px 16px', borderBottom:i<filtered.length-1?'1px solid #f1f5f9':'none', cursor:'pointer', transition:'background 0.12s', alignItems:'center' }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f8fafd'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
              <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={14} color={color}/>
                </div>
                <span style={{ fontWeight:600, fontSize:13, color:'#0d1b2a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.title}</span>
              </div>
              <span style={{ fontSize:12, color:'#5a6a7e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.category?.name??'—'}</span>
              <span style={{ fontSize:12, color:'#5a6a7e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.antenne?.name??'—'}</span>
              <StatusBadge status={d.status}/>
              <span style={{ fontSize:11, color:'#94a3b8' }}>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          );
        })}
      </div>

      {/* Modal création */}
      {showCreate && (
        <Modal title="Nouveau dossier" onClose={()=>setShowCreate(false)}>
          <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {error && <ErrBox msg={error}/>}
            <Field label="Titre" required><Inp value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Intitulé du dossier" required/></Field>
            <Field label="Catégorie" required hint="Seules vos catégories autorisées sont proposées.">
              <Sel value={form.categoryId} onChange={e=>setForm(f=>({...f,categoryId:e.target.value}))} required>
                <option value="">— Sélectionner —</option>
                {/* ⚠️ Uniquement les catégories auxquelles l'agent a accès */}
                {visibleCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </Sel>
            </Field>
            <Field label="Description"><Txa value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Contexte et détails…"/></Field>
            {/* Champ spécial scans de vulnérabilité */}
            {isScanCat(form.categoryId) && (
              <Field label="URLs à analyser" hint="Une URL par ligne. Chaque URL est enregistrée individuellement selon le CDC §15.">
                <Txa
                  value={urlsText}
                  onChange={e=>setUrlsText(e.target.value)}
                  placeholder={"https://exemple.gouv.cm\nhttps://portail.antic.cm\nhttps://..."}
                  rows={6}
                  style={{ fontFamily:'monospace', fontSize:12 }}
                />
                {urlsText.trim() && (
                  <p style={{ fontSize:11, color:'#0070cc', marginTop:4 }}>
                    {urlsText.split('\n').filter(l=>l.trim()).length} URL(s) détectée(s)
                  </p>
                )}
              </Field>
            )}
            <div style={{ display:'flex', gap:10, paddingTop:4 }}>
              <Btn variant="ghost" onClick={()=>setShowCreate(false)}>Annuler</Btn>
              <Btn type="submit" disabled={submitting}>{submitting?'Création…':'Créer le dossier'}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal détail */}
      {selected && (
        <Modal title={selected.title} subtitle={`#${selected.id} · ${selected.category?.name??''}`} onClose={()=>{ setSelected(null); setScanUrls([]); setScanStats(null); }}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <StatusBadge status={selected.status}/>
              {selected.category && <span style={{ fontSize:11, background:'#f1f5f9', color:'#5a6a7e', padding:'3px 10px', borderRadius:99, fontWeight:600 }}>{selected.category.name}</span>}
            </div>
            {selected.description && <p style={{ fontSize:13, color:'#5a6a7e', background:'#f8fafd', padding:'12px 14px', borderRadius:8, lineHeight:1.6 }}>{selected.description}</p>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['Antenne',selected.antenne?.name],['Créé par',selected.createdBy?.name],['Date',new Date(selected.createdAt).toLocaleDateString('fr-FR')],['Validé le',selected.validatedAt?new Date(selected.validatedAt).toLocaleDateString('fr-FR'):null],['Service',selected.service?.name]].filter(([,v])=>v).map(([l,v])=>(
                <div key={String(l)} style={{ background:'#f8fafd', borderRadius:8, padding:'10px 12px' }}>
                  <p style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{l}</p>
                  <p style={{ fontSize:13, fontWeight:600, color:'#0d1b2a' }}>{v}</p>
                </div>
              ))}
            </div>

            {/* ── PANEL SCANS DE VULNÉRABILITÉ ── */}
            {selected.category?.name === SCAN_CAT_NAME && (
              <div style={{ borderTop:'1px solid #e8f0f8', paddingTop:14, display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#003366' }}>URLs à analyser</p>
                  <Btn onClick={()=>setAddingUrls(v=>!v)} variant="secondary" style={{ fontSize:11, padding:'4px 10px' }}>
                    {addingUrls ? 'Annuler' : '+ Ajouter des URLs'}
                  </Btn>
                </div>

                {/* Stats rapides */}
                {scanStats && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {[
                      { label:'Total', val:scanStats.total, color:'#0057a8' },
                      { label:'En attente', val:scanStats.enAttente, color:'#d97706' },
                      { label:'Analysées', val:scanStats.analysees, color:'#059669' },
                    ].map(s=>(
                      <div key={s.label} style={{ background:'#f8fafd', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                        <p style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.val}</p>
                        <p style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ajout URLs */}
                {addingUrls && (
                  <div style={{ background:'#f8fafd', borderRadius:8, padding:12 }}>
                    <p style={{ fontSize:11, color:'#5a6a7e', marginBottom:6 }}>Une URL par ligne</p>
                    <Txa value={newUrls} onChange={e=>setNewUrls(e.target.value)}
                      placeholder={"https://exemple.gouv.cm\nhttps://portail.antic.cm"}
                      rows={4} style={{ fontFamily:'monospace', fontSize:12, marginBottom:8 }}/>
                    <Btn onClick={handleAddUrls} disabled={!newUrls.trim()}>Soumettre les URLs</Btn>
                  </div>
                )}

                {/* Liste URLs */}
                {scanLoading ? (
                  <p style={{ fontSize:12, color:'#94a3b8' }}>Chargement…</p>
                ) : scanUrls.length > 0 ? (
                  <div style={{ maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
                    {scanUrls.map(u=>(
                      <div key={u.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                        background:'#f8fafd', borderRadius:6, padding:'6px 10px' }}>
                        <span style={{ fontSize:11, fontFamily:'monospace', color:'#003366',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>{u.url}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
                          background: u.status==='ANALYSEE'?'#d1fae5':u.status==='ECHOUEE'?'#fee2e2':'#fef3c7',
                          color: u.status==='ANALYSEE'?'#065f46':u.status==='ECHOUEE'?'#991b1b':'#92400e',
                          flexShrink:0 }}>
                          {u.status==='ANALYSEE'?'Analysée':u.status==='ECHOUEE'?'Échouée':'En attente'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>Aucune URL soumise pour ce dossier.</p>
                )}
              </div>
            )}

            <div style={{ display:'flex', gap:8, flexWrap:'wrap', paddingTop:4, borderTop:'1px solid #f1f5f9' }}>
              {canValidate(user.role) && selected.status==='EN_COURS' && <Btn onClick={()=>act(()=>api.validateDossier(selected.id))}><Check size={13}/> Valider</Btn>}
              {canArchive(user.role) && selected.status==='VALIDE' && <Btn variant="secondary" onClick={()=>act(()=>api.archiveDossier(selected.id))}><Archive size={13}/> Archiver</Btn>}
              {(user.role==='super_admin'||(user.role==='agent_antenne'&&selected.status==='EN_COURS')) && (
                <Btn variant="danger" onClick={()=>{if(confirm('Supprimer ce dossier ?'))act(()=>api.deleteDossier(selected.id));}}>
                  <Trash2 size={13}/> Supprimer
                </Btn>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VUE : STATISTIQUES
// ─────────────────────────────────────────────────────────────────────────────
const StatsView: React.FC<{ user: User }> = ({ user }) => {
  const [global, setGlobal]   = useState<StatGlobale[]>([]);
  const [antenne, setAntenne] = useState<StatAntenne[]>([]);
  const [loading, setLoading] = useState(true);
  const [annee, setAnnee]     = useState('');
  const [mois, setMois]       = useState('');

  const load = useCallback(async ()=>{
    setLoading(true);
    try {
      const [g,a] = await Promise.all([
        api.getGlobalStats(annee||undefined, mois||undefined),
        api.getStatsByAntenne(undefined, annee||undefined, mois||undefined),
      ]);
      setGlobal(g); setAntenne(a);
    } catch{} finally { setLoading(false); }
  },[annee,mois]);

  useEffect(()=>{load();},[load]);
  const total=global.reduce((s,c)=>s+c.total,0), enCours=global.reduce((s,c)=>s+c.enCours,0), valides=global.reduce((s,c)=>s+c.valides,0);

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#003366' }}>Statistiques</h2>
          <p style={{ fontSize:12, color:'#5a6a7e', marginTop:2 }}>Indicateurs analytiques de la plateforme</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Sel value={annee} onChange={e=>setAnnee(e.target.value)} style={{ width:130, height:34, padding:'0 10px', fontSize:12 }}>
            <option value="">Toutes années</option>
            {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
          </Sel>
          <Sel value={mois} onChange={e=>setMois(e.target.value)} style={{ width:130, height:34, padding:'0 10px', fontSize:12 }}>
            <option value="">Tous mois</option>
            {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </Sel>
        </div>
      </div>
      {loading?<div style={{display:'flex',justifyContent:'center',padding:64}}><Loader2 size={32} color="#0057a8" style={{animation:'spin 1s linear infinite'}}/></div>:(
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            <KpiCard label="Total" value={total} icon={FileText} color="#0057a8" bg="#eff6ff" delay={1}/>
            <KpiCard label="En cours" value={enCours} icon={Clock} color="#d97706" bg="#fffbeb" delay={2}/>
            <KpiCard label="Validés" value={valides} icon={CheckCircle} color="#16a34a" bg="#f0fdf4" delay={3}/>
            <KpiCard label="Archivés" value={global.reduce((s,c)=>s+c.archives,0)} icon={Archive} color="#2563eb" bg="#eff6ff" delay={4}/>
          </div>
          <div style={{ background:'white', borderRadius:12, border:'1px solid #e8edf5', overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #e8edf5' }}>
              <span style={{ fontWeight:700, fontSize:14, color:'#003366' }}>Par catégorie</span>
            </div>
            <div style={{ padding:16, display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
              {global.map((s,i)=>{
                const Icon=CAT_ICONS[s.categoryName]??FileText; const color=CAT_COLORS[i%CAT_COLORS.length]; const pct=s.total>0?Math.round(s.valides/s.total*100):0;
                return (
                  <div key={s.categoryId} style={{ background:'#f8fafd', borderRadius:10, padding:'14px 16px', border:'1px solid #e8edf5' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <div style={{ width:34, height:34, borderRadius:8, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon size={15} color={color}/></div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontWeight:700, fontSize:12, color:'#0d1b2a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.categoryName}</p>
                        <p style={{ fontSize:10, color:'#94a3b8' }}>{s.total} dossiers · {pct}% validés</p>
                      </div>
                      <span style={{ fontWeight:800, fontSize:18, color }}>{s.total}</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                      {[{l:'En cours',v:s.enCours,c:'#f97316'},{l:'Validés',v:s.valides,c:'#22c55e'},{l:'Archivés',v:s.archives,c:'#3b82f6'}].map(item=>(
                        <div key={item.l} style={{ textAlign:'center', background:'white', borderRadius:6, padding:'6px 4px', border:'1px solid #e8edf5' }}>
                          <p style={{ fontWeight:800, fontSize:15, color:item.c }}>{item.v}</p>
                          <p style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>{item.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {antenne.length>0&&(
            <div style={{ background:'white', borderRadius:12, border:'1px solid #e8edf5', overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid #e8edf5' }}><span style={{ fontWeight:700, fontSize:14, color:'#003366' }}>Par antenne</span></div>
              <div style={{ padding:16, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {antenne.map(a=>(
                  <div key={a.antenneId} style={{ background:'#f8fafd', borderRadius:10, padding:'14px 16px', border:'1px solid #e8edf5' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <MapPin size={13} color="#0057a8"/>
                      <span style={{ fontWeight:700, fontSize:12, color:'#003366' }}>{a.antenneName}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:4, fontSize:11 }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#5a6a7e' }}>Total</span><strong style={{ color:'#0d1b2a' }}>{a.total}</strong></div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#f97316' }}>En cours</span><strong>{a.enCours}</strong></div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#22c55e' }}>Validés</span><strong>{a.valides}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VUE : UTILISATEURS  (avec bouton "Catégories" par utilisateur)
// ─────────────────────────────────────────────────────────────────────────────
const UsersView: React.FC<{
  user: User; users: User[]; antennes: Antenne[]; services: ServiceCirt[];
  categories: Category[]; onRefresh: () => void;
}> = ({ user, users, antennes, services, categories, onRefresh }) => {
  const [showCreate, setShowCreate]   = useState(false);
  const [catTarget, setCatTarget]     = useState<User|null>(null); // utilisateur dont on édite les catégories
  const [form, setForm] = useState({ name:'', email:'', password:'', roleName:'', antenneId:'', serviceId:'' });
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');

  const creatableRoles = (CREATABLE_ROLES[user.role] ?? []) as UserRole[];

  // Rôles pour lesquels on peut éditer les catégories (agents)
  const canEditCatOf = (target: User) => {
    // super_admin / admin_cirt : peuvent gérer les catégories de agent_cirt et agent_antenne
    if ((user.role === 'super_admin' || user.role === 'admin_cirt') &&
        ['agent_cirt', 'agent_antenne'].includes(target.role?.name)) return true;
    // directeur_antenne : peut gérer les catégories de ses agent_antenne
    if (user.role === 'directeur_antenne' && target.role?.name === 'agent_antenne' &&
        user.antenne?.id === target.antenne?.id) return true;
    /*console.log(user.role.toString());
    console.log(target.role?.name.toString());*/
    return false;
  };

  const needsAntenne = ['directeur_antenne','agent_antenne'].includes(form.roleName);
  const needsService = ['chef_service','agent_cirt'].includes(form.roleName);

  // directeur_antenne : son antenne est forcée, pas de sélection
  const isDirecteur = user.role==='directeur_antenne';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      await api.createUser({
        name:form.name, email:form.email, password:form.password, roleName:form.roleName,
        antenneId: needsAntenne ? (isDirecteur ? user.antenne?.id : Number(form.antenneId)) : undefined,
        serviceId: needsService ? Number(form.serviceId) : undefined,
      });
      setShowCreate(false); setForm({ name:'', email:'', password:'', roleName:'', antenneId:'', serviceId:'' }); onRefresh();
    } catch(e:any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#003366' }}>Utilisateurs</h2>
          <p style={{ fontSize:12, color:'#5a6a7e', marginTop:2 }}>{users.length} compte{users.length>1?'s':''}</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
              style={{ ...inputS, paddingLeft:32, width:200, height:34 }} {...focusHandlers}/>
          </div>
          {creatableRoles.length>0 && (
            <Btn onClick={()=>setShowCreate(true)}><UserPlus size={14}/> Créer un compte</Btn>
          )}
        </div>
      </div>

      <div style={{ background:'white', borderRadius:12, border:'1px solid #e8edf5', overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 180px 160px 1fr 100px', padding:'10px 20px', background:'#f8fafd', borderBottom:'1px solid #e8edf5', fontSize:10, fontWeight:700, color:'#5a6a7e', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          <span>Nom</span><span>Rôle</span><span>Affectation</span><span>Email</span><span style={{ textAlign:'right' }}>Actions</span>
        </div>
        {filteredUsers.length===0 && (
          <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>
            <Users size={32} style={{ margin:'0 auto 10px', opacity:0.25 }}/>
            <p style={{ fontSize:13 }}>Aucun utilisateur</p>
          </div>
        )}
        {filteredUsers.map((u,i)=>(
          <div key={u.id} style={{ display:'grid', gridTemplateColumns:'1fr 180px 160px 1fr 100px', padding:'11px 20px', borderBottom:i<filteredUsers.length-1?'1px solid #f1f5f9':'none', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#0057a8', flexShrink:0 }}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span style={{ fontWeight:600, fontSize:13, color:'#0d1b2a' }}>{u.name}</span>
                {u.id===user.id && <span style={{ marginLeft:8, fontSize:10, background:'#eff6ff', color:'#0057a8', padding:'1px 6px', borderRadius:99, fontWeight:700 }}>Vous</span>}
              </div>
            </div>
            <span><RoleBadge role={u.role}/></span>
            <span style={{ fontSize:12, color:'#5a6a7e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {u.antenne?.name ?? u.service?.name ?? '—'}
            </span>
            <span style={{ fontSize:11, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</span>
            <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
              {/* Bouton éditer catégories */}
              {canEditCatOf(u) && (
                <button onClick={()=>setCatTarget(u)} title="Gérer les catégories autorisées"
                  style={{ background:'#eff6ff', border:'none', borderRadius:6, padding:'5px 8px', cursor:'pointer', color:'#0057a8', display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600 }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#dbeafe'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#eff6ff'}>
                  <Tag size={12}/> Catégories
                </button>
              )}
              {u.id!==user.id && (
                <button onClick={()=>{if(confirm(`Supprimer ${u.name} ?`)) api.deleteUser(u.id).then(onRefresh).catch(e=>alert(e.message));}} title="Supprimer"
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#fca5a5', borderRadius:6, padding:'5px 7px', display:'flex' }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='#dc2626'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='#fca5a5'}>
                  <Trash2 size={14}/>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal création */}
      {showCreate && (
        <Modal title="Créer un utilisateur" onClose={()=>setShowCreate(false)}>
          <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {error && <ErrBox msg={error}/>}
            <Field label="Nom complet" required><Inp value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required placeholder="Prénom NOM"/></Field>
            <Field label="E-mail" required><Inp type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required placeholder="email@antic.cm"/></Field>
            <Field label="Mot de passe provisoire" required><Inp type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required placeholder="••••••••"/></Field>
            <Field label="Rôle" required>
              <Sel value={form.roleName} onChange={e=>setForm(f=>({...f,roleName:e.target.value,antenneId:'',serviceId:''}))} required>
                <option value="">— Sélectionner —</option>
                {creatableRoles.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </Sel>
            </Field>
            {/* Antenne : si directeur_antenne, afficher l'antenne forcée (readonly) */}
            {needsAntenne && isDirecteur && (
              <Field label="Antenne" hint="L'agent sera automatiquement rattaché à votre antenne.">
                <div style={{ ...inputS, background:'#f1f5f9', color:'#5a6a7e', cursor:'not-allowed', display:'flex', alignItems:'center', gap:8 }}>
                  <MapPin size={13}/> {user.antenne?.name ?? 'Votre antenne'}
                </div>
              </Field>
            )}
            {/* Antenne : si admin_cirt crée un directeur_antenne, choisir l'antenne */}
            {needsAntenne && !isDirecteur && (
              <Field label="Antenne" required>
                <Sel value={form.antenneId} onChange={e=>setForm(f=>({...f,antenneId:e.target.value}))} required>
                  <option value="">— Sélectionner —</option>
                  {antennes.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </Sel>
              </Field>
            )}
            {needsService && (
              <Field label="Service CIRT" required>
                <Sel value={form.serviceId} onChange={e=>setForm(f=>({...f,serviceId:e.target.value}))} required>
                  <option value="">— Sélectionner —</option>
                  {services.map(s=><option key={s.id} value={s.id}>{s.name}{s.sousDirection?` (${s.sousDirection.name})`:''}</option>)}
                </Sel>
              </Field>
            )}
            {/* Note : les catégories se gèrent APRÈS la création via le bouton "Catégories" */}
            {(['agent_cirt','agent_antenne'].includes(form.roleName)) && (
              <div style={{ padding:'10px 14px', background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:8, fontSize:12, color:'#0369a1' }}>
                <strong>💡 Astuce :</strong> Après la création, utilisez le bouton <Tag size={11} style={{ display:'inline', verticalAlign:'middle' }}/> <strong>Catégories</strong> pour assigner les accès de cet agent.
              </div>
            )}
            <div style={{ display:'flex', gap:10, paddingTop:4 }}>
              <Btn variant="ghost" onClick={()=>setShowCreate(false)}>Annuler</Btn>
              <Btn type="submit" disabled={submitting}>{submitting?'Création…':'Créer le compte'}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal catégories */}
      {catTarget && (
        <ModalCategories targetUser={catTarget} allCategories={categories} onClose={()=>setCatTarget(null)} onSaved={onRefresh}/>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VUE : ANTENNES
// ─────────────────────────────────────────────────────────────────────────────
const AntennesView: React.FC<{ user:User; antennes:Antenne[]; onRefresh:()=>void }> = ({ user, antennes, onRefresh }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#003366' }}>Antennes</h2>
          <p style={{ fontSize:12, color:'#5a6a7e', marginTop:2 }}>{antennes.length} antenne{antennes.length>1?'s':''} régionale{antennes.length>1?'s':''}</p>
        </div>
        <Btn onClick={()=>setShowCreate(true)}><Plus size={14}/> Nouvelle antenne</Btn>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {antennes.map((a,i)=>(
          <div key={a.id} className={`anim-fadeup delay-${Math.min(i+1,5)}`} style={{ background:'white', borderRadius:12, padding:'18px 20px', border:'1px solid #e8edf5', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:42, height:42, borderRadius:10, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <MapPin size={19} color="#0057a8"/>
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:14, color:'#003366' }}>{a.name}</p>
              <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>Antenne régionale</p>
            </div>
          </div>
        ))}
      </div>
      {showCreate && (
        <Modal title="Nouvelle antenne" onClose={()=>setShowCreate(false)} width={400}>
          <form onSubmit={async e=>{ e.preventDefault(); try{ await api.createAntenne(name); setShowCreate(false); setName(''); onRefresh(); }catch(e:any){alert(e.message);} }} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Nom" required><Inp value={name} onChange={e=>setName(e.target.value)} placeholder="ex: Antenne Kribi" required/></Field>
            <div style={{ display:'flex', gap:10 }}><Btn variant="ghost" onClick={()=>setShowCreate(false)}>Annuler</Btn><Btn type="submit">Créer</Btn></div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export const Dashboard: React.FC<{ user: User; onLogout: () => void; onUserUpdate: (u: User) => void }> = ({
  user, onLogout, onUserUpdate
}) => {
  const [activeTab, setActiveTab]   = useState<Tab>(canViewStats(user.role)?'dashboard':'dossiers');
  const [collapsed, setCollapsed]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showProfile, setShowProfile] = useState(false);

  const [dossiers, setDossiers]       = useState<Dossier[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [antennes, setAntennes]       = useState<Antenne[]>([]);
  const [users, setUsers]             = useState<User[]>([]);
  const [services, setServices]       = useState<ServiceCirt[]>([]);
  const [myPermissions, setMyPerms]   = useState<PermissionCategory[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [d,c,a] = await Promise.all([api.getDossiers(), api.getCategories(), api.getAntennes()]);
      setDossiers(d); setCategories(c); setAntennes(a);

      // Charger ses propres permissions si agent
      if (['agent_cirt','agent_antenne'].includes(user.role)) {
        const perms = await api.getUserPermissions(user.id);
        setMyPerms(perms);
      }

      if (canCreateUsers(user.role)) {
        const [u,s] = await Promise.all([api.getUsers(), api.getServices()]);
        setUsers(u); setServices(s);
      }
    } catch(e:any) { setError(e.message??'Erreur de chargement'); }
    finally { setLoading(false); }
  }, [user.role, user.id]);

  useEffect(()=>{ loadData(); },[loadData]);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f7fb' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'3px solid #e8edf5', borderTop:'3px solid #0057a8', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
        <p style={{ color:'#5a6a7e', fontSize:14 }}>Chargement…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f7fb' }}>
      <div style={{ textAlign:'center', maxWidth:360 }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin:'0 auto 12px' }}/>
        <p style={{ fontWeight:700, color:'#0d1b2a', marginBottom:6 }}>Erreur de connexion</p>
        <p style={{ fontSize:13, color:'#5a6a7e', marginBottom:16 }}>{error}</p>
        <Btn onClick={loadData}><RefreshCw size={13}/> Réessayer</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f4f7fb' }}>
      <Sidebar user={user} active={activeTab} onChange={setActiveTab} onLogout={onLogout}
        onEditProfile={()=>setShowProfile(true)} collapsed={collapsed} onToggle={()=>setCollapsed(c=>!c)}/>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* TopBar */}
        <header style={{ height:58, background:'white', borderBottom:'1px solid #e8edf5', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', flexShrink:0 }}>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:17, color:'#003366' }}>{TAB_TITLES[activeTab]}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={loadData} title="Actualiser"
              style={{ background:'none', border:'1.5px solid #e8edf5', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#5a6a7e', display:'flex', alignItems:'center' }}>
              <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }}/>
            </button>
            <button onClick={()=>setShowProfile(true)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 12px', background:'#f4f7fb', borderRadius:8, border:'1px solid #e8edf5', cursor:'pointer' }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:'#0057a8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'#0d1b2a', lineHeight:1.2 }}>{user.name}</p>
                <p style={{ fontSize:10, color:'#5a6a7e', lineHeight:1.2 }}>{ROLE_LABELS[user.role]}</p>
              </div>
              <Edit2 size={11} color="#94a3b8"/>
            </button>
          </div>
        </header>

        <main style={{ flex:1, overflowY:'auto' }}>
          {activeTab==='dashboard' && canViewStats(user.role) && <DashboardView user={user} dossiers={dossiers} categories={categories} myPermissions={myPermissions}/>}
          {activeTab==='dossiers' && <DossiersView user={user} dossiers={dossiers} categories={categories} myPermissions={myPermissions} onRefresh={loadData}/>}
          {activeTab==='stats' && canViewStats(user.role) && <StatsView user={user}/>}
          {activeTab==='users' && canCreateUsers(user.role) && <UsersView user={user} users={users} antennes={antennes} services={services} categories={categories} onRefresh={loadData}/>}
          {activeTab==='antennes' && canManageAntennes(user.role) && <AntennesView user={user} antennes={antennes} onRefresh={loadData}/>}
          {activeTab==='organisation' && (['super_admin','admin_cirt'] as UserRole[]).includes(user.role) && (
            <div style={{ padding:28 }}>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#003366', marginBottom:20 }}>Organisation CIRT</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {services.map(s=>(
                  <div key={s.id} style={{ background:'white', borderRadius:10, padding:'14px 18px', border:'1px solid #e8edf5', display:'flex', alignItems:'center', gap:12 }}>
                    <Building2 size={16} color="#0057a8"/>
                    <div>
                      <p style={{ fontWeight:700, fontSize:13, color:'#003366' }}>{s.name}</p>
                      {s.sousDirection && <p style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{s.sousDirection.name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab==='categories' && user.role==='super_admin' && (
            <div style={{ padding:28 }}>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#003366', marginBottom:20 }}>Catégories</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                {categories.map((c,i)=>{ const Icon=CAT_ICONS[c.name]??FileText; const color=CAT_COLORS[i%CAT_COLORS.length]; return (
                  <div key={c.id} style={{ background:'white', borderRadius:12, padding:'16px 20px', border:'1px solid #e8edf5', display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:40, height:40, borderRadius:9, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={18} color={color}/>
                    </div>
                    <p style={{ fontWeight:700, fontSize:14, color:'#003366' }}>{c.name}</p>
                  </div>
                );})}
              </div>
            </div>
          )}
        </main>
      </div>

      {showProfile && (
        <ModalProfile user={user} onClose={()=>setShowProfile(false)} onSaved={u=>{ onUserUpdate(u); setShowProfile(false); }}/>
      )}
    </div>
  );
};
