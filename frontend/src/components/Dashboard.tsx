import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, FileText, Clock, CheckCircle, Archive, Plus, LogOut,
  Search, Users, BarChart3, ChevronRight, X, Menu, Loader2,
  AlertCircle, ShieldAlert, UserX, Database, Fingerprint, Check,
  Trash2, Building2, UserPlus, Key, RefreshCw, MapPin, Bell,
  TrendingUp, Activity, ChevronDown, MoreVertical, Eye, Filter,
} from 'lucide-react';
import type {
  User, Dossier, Category, Antenne, ServiceCirt,
  DossierStatus, StatGlobale, StatAntenne, UserRole,
} from '../types';
import {
  ROLE_LABELS, canCreateUsers, canCreateDossiers,
  canValidate, canArchive, canViewStats, canManageAntennes, CREATABLE_ROLES,
} from '../types';
import * as api from '../api';

// ── Constantes ──────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<DossierStatus, { label:string; bg:string; text:string; dot:string; border:string }> = {
  EN_COURS: { label:'En cours',  bg:'#fff7ed', text:'#9a3412', dot:'#f97316', border:'#fed7aa' },
  VALIDE:   { label:'Validé',    bg:'#f0fdf4', text:'#14532d', dot:'#22c55e', border:'#bbf7d0' },
  ARCHIVE:  { label:'Archivé',   bg:'#eff6ff', text:'#1e3a8a', dot:'#3b82f6', border:'#bfdbfe' },
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

const CAT_COLORS = [
  '#0057a8','#0070cc','#1b8a4e','#7c3aed','#db2777','#d97706','#0891b2',
];

type Tab = 'dashboard'|'dossiers'|'stats'|'users'|'antennes'|'organisation'|'categories';

// ── Helpers UI ──────────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: DossierStatus }> = ({ status }) => {
  const c = STATUS_CFG[status];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px',
      borderRadius:99, fontSize:11, fontWeight:600,
      background:c.bg, color:c.text, border:`1px solid ${c.border}`,
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot, flexShrink:0 }}/>
      {c.label}
    </span>
  );
};

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const colors: Record<string,string> = {
    super_admin:'#7c3aed', admin_cirt:'#0057a8', chef_service:'#0891b2',
    directeur_antenne:'#1b8a4e', agent_cirt:'#0070cc', agent_antenne:'#6b7280',
  };
  return (
    <span style={{
      display:'inline-flex', padding:'2px 9px', borderRadius:99, fontSize:11,
      fontWeight:600, background:colors[role]??'#64748b', color:'white',
    }}>
      {ROLE_LABELS[role]}
    </span>
  );
};

// ── Modal ───────────────────────────────────────────────────────────────────────
const Modal: React.FC<{ title:string; subtitle?:string; onClose:()=>void; children:React.ReactNode; width?:number }> = ({
  title, subtitle, onClose, children, width = 520
}) => (
  <div style={{
    position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    background:'rgba(0,40,85,0.55)', backdropFilter:'blur(6px)',
  }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{
      background:'white', borderRadius:16, boxShadow:'0 24px 64px rgba(0,40,85,0.2)',
      width:'100%', maxWidth:width, maxHeight:'90vh', overflow:'hidden',
      display:'flex', flexDirection:'column',
    }} className="anim-fadeup">
      <div style={{
        display:'flex', alignItems:'flex-start', justifyContent:'space-between',
        padding:'20px 24px', borderBottom:'1px solid #e8edf5',
      }}>
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

// ── Field ───────────────────────────────────────────────────────────────────────
const Field: React.FC<{ label:string; required?:boolean; children:React.ReactNode }> = ({ label, required, children }) => (
  <div>
    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#003366', marginBottom:6, letterSpacing:'0.07em', textTransform:'uppercase' }}>
      {label}{required && <span style={{ color:'#dc2626', marginLeft:3 }}>*</span>}
    </label>
    {children}
  </div>
);

const inputS: React.CSSProperties = {
  width:'100%', padding:'10px 13px', background:'#f8fafd',
  border:'1.5px solid #dde3ed', borderRadius:8, fontSize:13,
  color:'#0d1b2a', outline:'none', transition:'border-color 0.2s, box-shadow 0.2s',
  fontFamily:'Outfit, sans-serif',
};
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} style={{ ...inputS, ...props.style }}
    onFocus={e => { e.target.style.borderColor='#0057a8'; e.target.style.boxShadow='0 0 0 3px rgba(0,87,168,0.1)'; }}
    onBlur={e => { e.target.style.borderColor='#dde3ed'; e.target.style.boxShadow='none'; }}
  />
);
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} style={{ ...inputS, cursor:'pointer', ...props.style }}
    onFocus={e => { e.target.style.borderColor='#0057a8'; e.target.style.boxShadow='0 0 0 3px rgba(0,87,168,0.1)'; }}
    onBlur={e => { e.target.style.borderColor='#dde3ed'; e.target.style.boxShadow='none'; }}
  />
);
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} style={{ ...inputS, minHeight:80, resize:'vertical', ...props.style }}
    onFocus={e => { e.target.style.borderColor='#0057a8'; e.target.style.boxShadow='0 0 0 3px rgba(0,87,168,0.1)'; }}
    onBlur={e => { e.target.style.borderColor='#dde3ed'; e.target.style.boxShadow='none'; }}
  />
);

const Btn: React.FC<{ variant?:'primary'|'secondary'|'danger'|'ghost'; children:React.ReactNode; onClick?:()=>void; type?:'button'|'submit'; disabled?:boolean; small?:boolean }> = ({
  variant='primary', children, onClick, type='button', disabled, small
}) => {
  const styles: Record<string,React.CSSProperties> = {
    primary:   { background: disabled?'#7aade0':'#0057a8', color:'white', border:'none', boxShadow: disabled?'none':'0 2px 10px rgba(0,87,168,0.3)' },
    secondary: { background:'white', color:'#0057a8', border:'1.5px solid #c5d8f0' },
    danger:    { background:'#dc2626', color:'white', border:'none' },
    ghost:     { background:'transparent', color:'#5a6a7e', border:'1.5px solid #e8edf5' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{
        display:'inline-flex', alignItems:'center', gap:6,
        padding: small ? '6px 12px' : '10px 18px',
        borderRadius:8, fontSize: small?12:13, fontWeight:600,
        cursor: disabled?'not-allowed':'pointer', transition:'all 0.15s',
        fontFamily:'Outfit, sans-serif', whiteSpace:'nowrap',
        ...styles[variant],
      }}
    >{children}</button>
  );
};

// ── Sidebar ─────────────────────────────────────────────────────────────────────
const Sidebar: React.FC<{
  user:User; active:Tab; onChange:(t:Tab)=>void;
  onLogout:()=>void; collapsed:boolean; onToggle:()=>void;
}> = ({ user, active, onChange, onLogout, collapsed, onToggle }) => {
  const tabs: {id:Tab; label:string; icon:React.ElementType; show:boolean}[] = [
    { id:'dashboard',    label:'Tableau de bord', icon:Activity,     show:canViewStats(user.role) },
    { id:'dossiers',     label:'Dossiers',        icon:FileText,     show:true },
    { id:'stats',        label:'Statistiques',    icon:BarChart3,    show:canViewStats(user.role) },
    { id:'users',        label:'Utilisateurs',    icon:Users,        show:canCreateUsers(user.role) },
    { id:'antennes',     label:'Antennes',        icon:MapPin,       show:canManageAntennes(user.role) },
    { id:'organisation', label:'Organisation',    icon:Building2,    show:['super_admin','admin_cirt'].includes(user.role) },
    { id:'categories',   label:'Catégories',      icon:Key,          show:user.role==='super_admin' },
  ];

  const W = collapsed ? 68 : 240;

  return (
    <aside style={{
      width:W, minWidth:W, height:'100vh', display:'flex', flexDirection:'column',
      background:'var(--sidebar-bg)', transition:'width 0.25s cubic-bezier(.4,0,.2,1)',
      flexShrink:0, overflow:'hidden', position:'relative', zIndex:10,
    }}>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding: collapsed ? '18px 16px' : '18px 16px 18px 20px',
        borderBottom:'1px solid var(--sidebar-border)', minHeight:68,
      }}>
        {!collapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:10, overflow:'hidden' }}>
            <div style={{
              width:34, height:34, borderRadius:8, background:'var(--antic-blue)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              <Shield size={18} color="white"/>
            </div>
            <div style={{ overflow:'hidden' }}>
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
        {!collapsed && (
          <button onClick={onToggle} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:4, borderRadius:6, display:'flex', flexShrink:0 }}>
            <Menu size={17}/>
          </button>
        )}
      </div>

      {/* Toggle collapsed */}
      {collapsed && (
        <button onClick={onToggle} style={{
          background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)',
          padding:'10px 0', display:'flex', justifyContent:'center', borderBottom:'1px solid var(--sidebar-border)',
        }}>
          <Menu size={16}/>
        </button>
      )}

      {/* Nav */}
      <nav style={{ flex:1, padding:'8px 8px', overflowY:'auto', overflowX:'hidden' }}>
        {tabs.filter(t=>t.show).map(tab => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)} title={collapsed ? tab.label : undefined}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:10,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius:8, border:'none', cursor:'pointer', marginBottom:2,
                background: isActive ? 'var(--sidebar-active)' : 'transparent',
                color: isActive ? 'white' : 'var(--sidebar-text)',
                borderLeft: isActive ? '3px solid var(--antic-gold)' : '3px solid transparent',
                transition:'all 0.15s', fontFamily:'Outfit, sans-serif',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Icon size={17} style={{ flexShrink:0 }}/>
              {!collapsed && <span style={{ fontSize:13, fontWeight:isActive?600:400, whiteSpace:'nowrap' }}>{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ borderTop:'1px solid var(--sidebar-border)', padding:'12px 8px' }}>
        {!collapsed ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.05)' }}>
            <div style={{
              width:32, height:32, borderRadius:'50%', background:'var(--antic-blue)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:700, color:'white', flexShrink:0,
            }}>{user.name.charAt(0).toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:'white', fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</p>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ROLE_LABELS[user.role]}</p>
            </div>
            <button onClick={onLogout} title="Déconnexion"
              style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:4, borderRadius:6, display:'flex', flexShrink:0 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#f87171'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.35)'}
            >
              <LogOut size={15}/>
            </button>
          </div>
        ) : (
          <button onClick={onLogout} title="Déconnexion"
            style={{ width:'100%', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:'10px 0', display:'flex', justifyContent:'center', borderRadius:8 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#f87171'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.35)'}
          >
            <LogOut size={16}/>
          </button>
        )}
      </div>
    </aside>
  );
};

// ── TopBar ───────────────────────────────────────────────────────────────────────
const TAB_TITLES: Record<Tab,string> = {
  dashboard:'Tableau de bord', dossiers:'Dossiers', stats:'Statistiques',
  users:'Utilisateurs', antennes:'Antennes', organisation:'Organisation CIRT', categories:'Catégories',
};
const TopBar: React.FC<{ title:string; user:User; onRefresh:()=>void; loading:boolean }> = ({ title, user, onRefresh, loading }) => (
  <header style={{
    height:60, background:'white', borderBottom:'1px solid #e8edf5',
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 28px', flexShrink:0, position:'sticky', top:0, zIndex:5,
  }}>
    <div>
      <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'#003366' }}>{title}</h1>
    </div>
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <button onClick={onRefresh} title="Actualiser"
        style={{ background:'none', border:'1.5px solid #e8edf5', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#5a6a7e', display:'flex', alignItems:'center' }}>
        <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
      </button>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background:'#f4f7fb', borderRadius:8, border:'1px solid #e8edf5' }}>
        <div style={{ width:26, height:26, borderRadius:'50%', background:'#0057a8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white' }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize:12, fontWeight:600, color:'#0d1b2a', lineHeight:1.2 }}>{user.name}</p>
          <p style={{ fontSize:10, color:'#5a6a7e', lineHeight:1.2 }}>{ROLE_LABELS[user.role]}</p>
        </div>
      </div>
    </div>
  </header>
);

// ── KPI Card ─────────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{ label:string; value:number|string; icon:React.ElementType; color:string; bg:string; sub?:string; delay?:number }> = ({
  label, value, icon:Icon, color, bg, sub, delay=0
}) => (
  <div className={`anim-fadeup delay-${delay}`} style={{
    background:'white', borderRadius:12, padding:'20px 22px',
    border:'1px solid #e8edf5', display:'flex', alignItems:'flex-start', gap:14,
    boxShadow:'0 1px 4px rgba(0,40,85,0.05)',
  }}>
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

// ── Vue Dashboard (accueil) ───────────────────────────────────────────────────────
const DashboardView: React.FC<{ user:User; dossiers:Dossier[]; categories:Category[]; antennes:Antenne[] }> = ({
  user, dossiers, categories, antennes
}) => {
  const enCours  = dossiers.filter(d=>d.status==='EN_COURS').length;
  const valides  = dossiers.filter(d=>d.status==='VALIDE').length;
  const archives = dossiers.filter(d=>d.status==='ARCHIVE').length;
  const recent   = [...dossiers].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5);

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:24 }}>
      {/* Bienvenue */}
      <div className="anim-fadeup" style={{
        background:'linear-gradient(120deg,#003366,#0057a8)', borderRadius:14, padding:'24px 28px',
        display:'flex', alignItems:'center', justifyContent:'space-between', overflow:'hidden', position:'relative',
      }}>
        <div style={{ position:'absolute', right:0, top:0, width:200, height:'100%', background:'rgba(77,184,255,0.08)', clipPath:'ellipse(100% 80% at 80% 50%)', pointerEvents:'none' }}/>
        <div>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>Bienvenue</p>
          <h2 style={{ fontFamily:'Syne,sans-serif', color:'white', fontWeight:800, fontSize:22, marginBottom:6 }}>{user.name}</h2>
          <span style={{ display:'inline-flex', background:'rgba(255,255,255,0.12)', borderRadius:99, padding:'4px 12px', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.2)' }}>
            {ROLE_LABELS[user.role]}
          </span>
        </div>
        <div style={{ textAlign:'right' }}>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:11 }}>{new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
          <p style={{ color:'white', fontSize:28, fontWeight:800, marginTop:4 }}>{dossiers.length}</p>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:11 }}>dossier{dossiers.length>1?'s':''} visible{dossiers.length>1?'s':''}</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        <KpiCard label="Total" value={dossiers.length} icon={FileText} color="#0057a8" bg="#eff6ff" delay={1}/>
        <KpiCard label="En cours" value={enCours} icon={Clock} color="#d97706" bg="#fffbeb" sub={`${dossiers.length?Math.round(enCours/dossiers.length*100):0}% du total`} delay={2}/>
        <KpiCard label="Validés" value={valides} icon={CheckCircle} color="#16a34a" bg="#f0fdf4" delay={3}/>
        <KpiCard label="Archivés" value={archives} icon={Archive} color="#2563eb" bg="#eff6ff" delay={4}/>
      </div>

      {/* Dossiers récents + Répartition */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>

        {/* Dossiers récents */}
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e8edf5', overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #e8edf5', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Activity size={15} color="#0057a8"/>
              <span style={{ fontWeight:700, fontSize:14, color:'#003366' }}>Activité récente</span>
            </div>
            <span style={{ fontSize:11, color:'#94a3b8' }}>{recent.length} dossier{recent.length>1?'s':''}</span>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>
              <FileText size={32} style={{ margin:'0 auto 10px', opacity:0.3 }}/>
              <p style={{ fontSize:13 }}>Aucun dossier</p>
            </div>
          ) : (
            <div>
              {recent.map((d, i) => {
                const Icon = d.category ? (CAT_ICONS[d.category.name] ?? FileText) : FileText;
                const catColor = d.category ? CAT_COLORS[categories.findIndex(c=>c.id===d.category!.id) % CAT_COLORS.length] : '#64748b';
                return (
                  <div key={d.id} className={`anim-slidein delay-${Math.min(i+1,5)}`} style={{
                    display:'flex', alignItems:'center', gap:14, padding:'12px 20px',
                    borderBottom: i < recent.length-1 ? '1px solid #f1f5f9' : 'none',
                    transition:'background 0.15s',
                  }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f8fafd'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
                  >
                    <div style={{ width:36, height:36, borderRadius:8, background:`${catColor}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={16} color={catColor}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:600, fontSize:13, color:'#0d1b2a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.title}</p>
                      <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
                        {d.category?.name ?? '—'} · {d.antenne?.name ?? '—'} · {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <StatusBadge status={d.status}/>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Répartition par catégorie */}
        <div style={{ background:'white', borderRadius:12, border:'1px solid #e8edf5', overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #e8edf5' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <TrendingUp size={15} color="#0057a8"/>
              <span style={{ fontWeight:700, fontSize:14, color:'#003366' }}>Par catégorie</span>
            </div>
          </div>
          <div style={{ padding:'8px 0' }}>
            {categories.map((cat, i) => {
              const count = dossiers.filter(d=>d.category?.id===cat.id).length;
              const pct   = dossiers.length ? (count/dossiers.length)*100 : 0;
              const color = CAT_COLORS[i % CAT_COLORS.length];
              return (
                <div key={cat.id} style={{ padding:'8px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:'#0d1b2a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'75%' }}>{cat.name}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:color, flexShrink:0 }}>{count}</span>
                  </div>
                  <div style={{ height:4, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99, transition:'width 0.6s ease' }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Vue Dossiers ─────────────────────────────────────────────────────────────────
const DossiersView: React.FC<{ user:User; dossiers:Dossier[]; categories:Category[]; onRefresh:()=>void }> = ({
  user, dossiers, categories, onRefresh
}) => {
  const [search, setSearch]         = useState('');
  const [filterStatus, setFS]       = useState<DossierStatus|'ALL'>('ALL');
  const [filterCat, setFC]          = useState('ALL');
  const [selected, setSelected]     = useState<Dossier|null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState({ title:'', description:'', categoryId:'' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const filtered = dossiers.filter(d => {
    const s = d.title.toLowerCase().includes(search.toLowerCase()) ||
              (d.category?.name ?? '').toLowerCase().includes(search.toLowerCase());
    const st = filterStatus==='ALL' || d.status===filterStatus;
    const ct = filterCat==='ALL' || String(d.category?.id)===filterCat;
    return s && st && ct;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      await api.createDossier({ title:form.title, description:form.description, categoryId:Number(form.categoryId) });
      setShowCreate(false); setForm({ title:'', description:'', categoryId:'' }); onRefresh();
    } catch(err:any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const act = async (fn:()=>Promise<any>) => {
    try { await fn(); onRefresh(); setSelected(null); }
    catch(err:any) { alert(err.message); }
  };

  const statusCounts = {
    ALL:     dossiers.length,
    EN_COURS:dossiers.filter(d=>d.status==='EN_COURS').length,
    VALIDE:  dossiers.filter(d=>d.status==='VALIDE').length,
    ARCHIVE: dossiers.filter(d=>d.status==='ARCHIVE').length,
  };

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#003366' }}>Dossiers</h2>
          <p style={{ fontSize:12, color:'#5a6a7e', marginTop:2 }}>{filtered.length} / {dossiers.length} dossier{dossiers.length>1?'s':''}</p>
        </div>
        {canCreateDossiers(user.role) && (
          <Btn onClick={()=>setShowCreate(true)}>
            <Plus size={14}/> Nouveau dossier
          </Btn>
        )}
      </div>

      {/* Filtres statut rapides */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        {(['ALL','EN_COURS','VALIDE','ARCHIVE'] as const).map(s => (
          <button key={s} onClick={()=>setFS(s as any)}
            style={{
              padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:600,
              border: filterStatus===s ? '1.5px solid #0057a8' : '1.5px solid #e8edf5',
              background: filterStatus===s ? '#0057a8' : 'white',
              color: filterStatus===s ? 'white' : '#5a6a7e',
              cursor:'pointer', transition:'all 0.15s',
            }}>
            {s==='ALL'?'Tous':STATUS_CFG[s as DossierStatus].label}
            <span style={{ marginLeft:6, background: filterStatus===s?'rgba(255,255,255,0.2)':'#f1f5f9', borderRadius:99, padding:'1px 7px', fontSize:10 }}>
              {statusCounts[s]}
            </span>
          </button>
        ))}
        <div style={{ flex:1 }}/>
        {/* Recherche */}
        <div style={{ position:'relative' }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
            style={{ ...inputS, paddingLeft:32, width:200, height:34, padding:'0 0 0 32px', paddingRight:12 }}
            onFocus={e=>{e.target.style.borderColor='#0057a8';e.target.style.boxShadow='0 0 0 3px rgba(0,87,168,0.1)';}}
            onBlur={e=>{e.target.style.borderColor='#dde3ed';e.target.style.boxShadow='none';}}
          />
        </div>
        {/* Filtre catégorie */}
        <Select value={filterCat} onChange={e=>setFC(e.target.value)} style={{ width:180, height:34, padding:'0 12px', fontSize:12 }}>
          <option value="ALL">Toutes catégories</option>
          {categories.map(c=><option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </Select>
      </div>

      {/* Table des dossiers */}
      <div style={{ background:'white', borderRadius:12, border:'1px solid #e8edf5', overflow:'hidden' }}>
        {/* En-tête table */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 160px 160px 110px 80px',
          padding:'10px 16px', background:'#f8fafd', borderBottom:'1px solid #e8edf5',
          fontSize:10, fontWeight:700, color:'#5a6a7e', textTransform:'uppercase', letterSpacing:'0.08em',
        }}>
          <span>Titre</span><span>Catégorie</span><span>Antenne</span><span>Statut</span><span>Date</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding:48, textAlign:'center', color:'#94a3b8' }}>
            <FileText size={36} style={{ margin:'0 auto 10px', opacity:0.25 }}/>
            <p style={{ fontSize:13, fontWeight:600 }}>Aucun dossier trouvé</p>
            {canCreateDossiers(user.role) && (
              <button onClick={()=>setShowCreate(true)} style={{ marginTop:12, fontSize:12, color:'#0057a8', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
                Créer le premier dossier
              </button>
            )}
          </div>
        ) : filtered.map((d, i) => {
          const Icon = d.category?(CAT_ICONS[d.category.name]??FileText):FileText;
          const catColor = d.category?CAT_COLORS[categories.findIndex(c=>c.id===d.category!.id)%CAT_COLORS.length]:'#64748b';
          return (
            <div key={d.id} onClick={()=>setSelected(d)}
              style={{
                display:'grid', gridTemplateColumns:'1fr 160px 160px 110px 80px',
                padding:'11px 16px', borderBottom: i<filtered.length-1?'1px solid #f1f5f9':'none',
                cursor:'pointer', transition:'background 0.12s', alignItems:'center',
              }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f8fafd'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:`${catColor}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={14} color={catColor}/>
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
        <Modal title="Nouveau dossier" subtitle="Créer un dossier dans votre antenne" onClose={()=>setShowCreate(false)}>
          <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {error && (
              <div style={{ display:'flex', gap:8, padding:'10px 14px', background:'#fef2f2', borderRadius:8, border:'1px solid #fecaca' }}>
                <AlertCircle size={14} color="#dc2626" style={{ flexShrink:0, marginTop:1 }}/>
                <span style={{ fontSize:12, color:'#991b1b' }}>{error}</span>
              </div>
            )}
            <Field label="Titre" required>
              <Input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Intitulé du dossier" required/>
            </Field>
            <Field label="Catégorie" required>
              <Select value={form.categoryId} onChange={e=>setForm(f=>({...f,categoryId:e.target.value}))} required>
                <option value="">— Sélectionner —</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Contexte et détails…"/>
            </Field>
            <div style={{ display:'flex', gap:10, paddingTop:4 }}>
              <Btn variant="ghost" onClick={()=>setShowCreate(false)}>Annuler</Btn>
              <Btn type="submit" disabled={submitting}>{submitting?'Création…':'Créer le dossier'}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal détail */}
      {selected && (
        <Modal title={selected.title} subtitle={`Dossier #${selected.id} · ${selected.category?.name??''}`} onClose={()=>setSelected(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <StatusBadge status={selected.status}/>
              {selected.category && (
                <span style={{ fontSize:11, background:'#f1f5f9', color:'#5a6a7e', padding:'3px 10px', borderRadius:99, fontWeight:600 }}>
                  {selected.category.name}
                </span>
              )}
            </div>
            {selected.description && (
              <p style={{ fontSize:13, color:'#5a6a7e', background:'#f8fafd', padding:'12px 14px', borderRadius:8, lineHeight:1.6 }}>{selected.description}</p>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                ['Antenne', selected.antenne?.name],
                ['Créé par', selected.createdBy?.name],
                ['Date création', new Date(selected.createdAt).toLocaleDateString('fr-FR')],
                ['Validé le', selected.validatedAt ? new Date(selected.validatedAt).toLocaleDateString('fr-FR') : null],
                ['Archivé le', selected.archivedAt ? new Date(selected.archivedAt).toLocaleDateString('fr-FR') : null],
                ['Service', selected.service?.name],
              ].filter(([,v])=>v).map(([l,v])=>(
                <div key={String(l)} style={{ background:'#f8fafd', borderRadius:8, padding:'10px 12px' }}>
                  <p style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{l}</p>
                  <p style={{ fontSize:13, fontWeight:600, color:'#0d1b2a' }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', paddingTop:4, borderTop:'1px solid #f1f5f9' }}>
              {canValidate(user.role) && selected.status==='EN_COURS' && (
                <Btn onClick={()=>act(()=>api.validateDossier(selected.id))}>
                  <Check size={13}/> Valider
                </Btn>
              )}
              {canArchive(user.role) && selected.status==='VALIDE' && (
                <Btn variant="secondary" onClick={()=>act(()=>api.archiveDossier(selected.id))}>
                  <Archive size={13}/> Archiver
                </Btn>
              )}
              {(user.role==='super_admin' || (user.role==='agent_antenne' && selected.status==='EN_COURS')) && (
                <Btn variant="danger" onClick={()=>{ if(confirm('Supprimer ce dossier ?')) act(()=>api.deleteDossier(selected.id)); }}>
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

// ── Vue Stats ─────────────────────────────────────────────────────────────────────
const StatsView: React.FC<{ user:User }> = ({ user }) => {
  const [global, setGlobal]     = useState<StatGlobale[]>([]);
  const [antenne, setAntenne]   = useState<StatAntenne[]>([]);
  const [loading, setLoading]   = useState(true);
  const [annee, setAnnee]       = useState('');
  const [mois, setMois]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g,a] = await Promise.all([
        api.getGlobalStats(annee||undefined, mois||undefined),
        api.getStatsByAntenne(undefined, annee||undefined, mois||undefined),
      ]);
      setGlobal(g); setAntenne(a);
    } catch {} finally { setLoading(false); }
  }, [annee, mois]);

  useEffect(()=>{ load(); },[load]);

  const total    = global.reduce((s,c)=>s+c.total,0);
  const enCours  = global.reduce((s,c)=>s+c.enCours,0);
  const valides  = global.reduce((s,c)=>s+c.valides,0);
  const archives = global.reduce((s,c)=>s+c.archives,0);

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
      {/* Filtres */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#003366' }}>Statistiques</h2>
          <p style={{ fontSize:12, color:'#5a6a7e', marginTop:2 }}>Indicateurs analytiques de la plateforme</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Select value={annee} onChange={e=>setAnnee(e.target.value)} style={{ width:130, height:34, padding:'0 10px', fontSize:12 }}>
            <option value="">Toutes années</option>
            {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
          </Select>
          <Select value={mois} onChange={e=>setMois(e.target.value)} style={{ width:130, height:34, padding:'0 10px', fontSize:12 }}>
            <option value="">Tous mois</option>
            {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
              .map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </Select>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:64 }}>
          <Loader2 size={32} color="#0057a8" style={{ animation:'spin 1s linear infinite' }}/>
        </div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            <KpiCard label="Total" value={total} icon={FileText} color="#0057a8" bg="#eff6ff" delay={1}/>
            <KpiCard label="En cours" value={enCours} icon={Clock} color="#d97706" bg="#fffbeb" delay={2}/>
            <KpiCard label="Validés" value={valides} icon={CheckCircle} color="#16a34a" bg="#f0fdf4" delay={3}/>
            <KpiCard label="Archivés" value={archives} icon={Archive} color="#2563eb" bg="#eff6ff" delay={4}/>
          </div>

          {/* Par catégorie */}
          <div style={{ background:'white', borderRadius:12, border:'1px solid #e8edf5', overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #e8edf5' }}>
              <span style={{ fontWeight:700, fontSize:14, color:'#003366' }}>Répartition par catégorie</span>
            </div>
            <div style={{ padding:16, display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
              {global.map((s,i)=>{
                const Icon = CAT_ICONS[s.categoryName]??FileText;
                const color = CAT_COLORS[i%CAT_COLORS.length];
                const pct = s.total>0?Math.round(s.valides/s.total*100):0;
                return (
                  <div key={s.categoryId} style={{ background:'#f8fafd', borderRadius:10, padding:'14px 16px', border:'1px solid #e8edf5' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Icon size={16} color={color}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontWeight:700, fontSize:12, color:'#0d1b2a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.categoryName}</p>
                        <p style={{ fontSize:10, color:'#94a3b8' }}>{s.total} dossier{s.total>1?'s':''} · {pct}% validés</p>
                      </div>
                      <span style={{ fontWeight:800, fontSize:18, color:color }}>{s.total}</span>
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

          {/* Par antenne */}
          {antenne.length>0 && (
            <div style={{ background:'white', borderRadius:12, border:'1px solid #e8edf5', overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid #e8edf5' }}>
                <span style={{ fontWeight:700, fontSize:14, color:'#003366' }}>Répartition par antenne</span>
              </div>
              <div style={{ padding:16, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {antenne.map(a=>(
                  <div key={a.antenneId} style={{ background:'#f8fafd', borderRadius:10, padding:'14px 16px', border:'1px solid #e8edf5' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <MapPin size={14} color="#0057a8"/>
                      <span style={{ fontWeight:700, fontSize:12, color:'#003366' }}>{a.antenneName}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                      <span style={{ color:'#5a6a7e' }}>Total: <strong style={{ color:'#0d1b2a' }}>{a.total}</strong></span>
                      <span style={{ color:'#f97316' }}>En cours: <strong>{a.enCours}</strong></span>
                      <span style={{ color:'#22c55e' }}>Validés: <strong>{a.valides}</strong></span>
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

// ── Vue Utilisateurs ──────────────────────────────────────────────────────────────
const UsersView: React.FC<{ user:User; users:User[]; antennes:Antenne[]; services:ServiceCirt[]; onRefresh:()=>void }> = ({
  user, users, antennes, services, onRefresh
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', roleName:'', antenneId:'', serviceId:'' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const creatableRoles = (CREATABLE_ROLES[user.role] ?? []) as UserRole[];

  const handleCreate = async (e:React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      await api.createUser({
        name:form.name, email:form.email, password:form.password, roleName:form.roleName,
        antenneId:form.antenneId?Number(form.antenneId):undefined,
        serviceId:form.serviceId?Number(form.serviceId):undefined,
      });
      setShowCreate(false); setForm({ name:'', email:'', password:'', roleName:'', antenneId:'', serviceId:'' }); onRefresh();
    } catch(err:any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const needsAntenne = ['directeur_antenne','agent_antenne'].includes(form.roleName);
  const needsService = ['chef_service','agent_cirt'].includes(form.roleName);

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#003366' }}>Utilisateurs</h2>
          <p style={{ fontSize:12, color:'#5a6a7e', marginTop:2 }}>{users.length} compte{users.length>1?'s':''}</p>
        </div>
        {creatableRoles.length>0 && (
          <Btn onClick={()=>setShowCreate(true)}><UserPlus size={14}/> Créer un compte</Btn>
        )}
      </div>

      <div style={{ background:'white', borderRadius:12, border:'1px solid #e8edf5', overflow:'hidden' }}>
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 180px 160px 120px 48px',
          padding:'10px 20px', background:'#f8fafd', borderBottom:'1px solid #e8edf5',
          fontSize:10, fontWeight:700, color:'#5a6a7e', textTransform:'uppercase', letterSpacing:'0.08em',
        }}>
          <span>Nom</span><span>Rôle</span><span>Affectation</span><span>Email</span><span/>
        </div>
        {users.map((u,i)=>(
          <div key={u.id} style={{
            display:'grid', gridTemplateColumns:'1fr 180px 160px 120px 48px',
            padding:'11px 20px', borderBottom:i<users.length-1?'1px solid #f1f5f9':'none', alignItems:'center',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#0057a8', flexShrink:0 }}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight:600, fontSize:13, color:'#0d1b2a' }}>{u.name}</span>
            </div>
            <span><RoleBadge role={u.role}/></span>
            <span style={{ fontSize:12, color:'#5a6a7e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {u.antenne?.name ?? u.service?.name ?? '—'}
            </span>
            <span style={{ fontSize:11, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</span>
            <span>
              {u.id!==user.id && (
                <button onClick={()=>{ if(confirm(`Supprimer ${u.name} ?`)) api.deleteUser(u.id).then(onRefresh).catch(e=>alert(e.message)); }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#fca5a5', borderRadius:6, padding:6, display:'flex' }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='#dc2626'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='#fca5a5'}
                >
                  <Trash2 size={14}/>
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      {showCreate && (
        <Modal title="Créer un utilisateur" subtitle="Le compte sera immédiatement activé" onClose={()=>setShowCreate(false)}>
          <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {error && (
              <div style={{ display:'flex', gap:8, padding:'10px 14px', background:'#fef2f2', borderRadius:8, border:'1px solid #fecaca' }}>
                <AlertCircle size={14} color="#dc2626" style={{ flexShrink:0, marginTop:1 }}/>
                <span style={{ fontSize:12, color:'#991b1b' }}>{error}</span>
              </div>
            )}
            <Field label="Nom complet" required>
              <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Prénom NOM" required/>
            </Field>
            <Field label="Adresse e-mail" required>
              <Input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@antic.cm" required/>
            </Field>
            <Field label="Mot de passe provisoire" required>
              <Input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••" required/>
            </Field>
            <Field label="Rôle" required>
              <Select value={form.roleName} onChange={e=>setForm(f=>({...f,roleName:e.target.value,antenneId:'',serviceId:''}))} required>
                <option value="">— Sélectionner —</option>
                {creatableRoles.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </Select>
            </Field>
            {needsAntenne && (
              <Field label="Antenne" required>
                <Select value={form.antenneId} onChange={e=>setForm(f=>({...f,antenneId:e.target.value}))} required>
                  <option value="">— Sélectionner —</option>
                  {antennes.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
              </Field>
            )}
            {needsService && (
              <Field label="Service CIRT" required>
                <Select value={form.serviceId} onChange={e=>setForm(f=>({...f,serviceId:e.target.value}))} required>
                  <option value="">— Sélectionner —</option>
                  {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
            )}
            <div style={{ display:'flex', gap:10, paddingTop:4 }}>
              <Btn variant="ghost" onClick={()=>setShowCreate(false)}>Annuler</Btn>
              <Btn type="submit" disabled={submitting}>{submitting?'Création…':'Créer le compte'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ── Vue Antennes ──────────────────────────────────────────────────────────────────
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
          <div key={a.id} className={`anim-fadeup delay-${Math.min(i+1,5)}`} style={{
            background:'white', borderRadius:12, padding:'20px 22px', border:'1px solid #e8edf5',
            display:'flex', alignItems:'center', gap:14, boxShadow:'0 1px 4px rgba(0,40,85,0.05)',
          }}>
            <div style={{ width:44, height:44, borderRadius:10, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <MapPin size={20} color="#0057a8"/>
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
          <form onSubmit={async e=>{
            e.preventDefault();
            try { await api.createAntenne(name); setShowCreate(false); setName(''); onRefresh(); }
            catch(err:any) { alert(err.message); }
          }} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Nom de l'antenne" required>
              <Input value={name} onChange={e=>setName(e.target.value)} placeholder="ex: Antenne Kribi" required/>
            </Field>
            <div style={{ display:'flex', gap:10 }}>
              <Btn variant="ghost" onClick={()=>setShowCreate(false)}>Annuler</Btn>
              <Btn type="submit">Créer</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ── Dashboard principal ───────────────────────────────────────────────────────────
export const Dashboard: React.FC<{ user:User; onLogout:()=>void }> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab]     = useState<Tab>(canViewStats(user.role)?'dashboard':'dossiers');
  const [collapsed, setCollapsed]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [dossiers, setDossiers]       = useState<Dossier[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [antennes, setAntennes]       = useState<Antenne[]>([]);
  const [users, setUsers]             = useState<User[]>([]);
  const [services, setServices]       = useState<ServiceCirt[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [d,c,a] = await Promise.all([api.getDossiers(), api.getCategories(), api.getAntennes()]);
      setDossiers(d); setCategories(c); setAntennes(a);
      if (canCreateUsers(user.role)) {
        const [u,s] = await Promise.all([api.getUsers(), api.getServices()]);
        setUsers(u); setServices(s);
      }
    } catch(err:any) { setError(err.message??'Erreur de chargement'); }
    finally { setLoading(false); }
  }, [user.role]);

  useEffect(()=>{ loadData(); },[loadData]);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f7fb' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'3px solid #e8edf5', borderTop:'3px solid #0057a8', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
        <p style={{ color:'#5a6a7e', fontSize:14 }}>Chargement de la plateforme…</p>
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
      <Sidebar user={user} active={activeTab} onChange={setActiveTab} onLogout={onLogout} collapsed={collapsed} onToggle={()=>setCollapsed(c=>!c)}/>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <TopBar title={TAB_TITLES[activeTab]} user={user} onRefresh={loadData} loading={loading}/>
        <main style={{ flex:1, overflowY:'auto' }}>
          {activeTab==='dashboard' && canViewStats(user.role) && <DashboardView user={user} dossiers={dossiers} categories={categories} antennes={antennes}/>}
          {activeTab==='dossiers' && <DossiersView user={user} dossiers={dossiers} categories={categories} onRefresh={loadData}/>}
          {activeTab==='stats' && canViewStats(user.role) && <StatsView user={user}/>}
          {activeTab==='users' && canCreateUsers(user.role) && <UsersView user={user} users={users} antennes={antennes} services={services} onRefresh={loadData}/>}
          {activeTab==='antennes' && canManageAntennes(user.role) && <AntennesView user={user} antennes={antennes} onRefresh={loadData}/>}
          {activeTab==='organisation' && (['super_admin','admin_cirt'] as UserRole[]).includes(user.role) && (
            <div style={{ padding:28 }}>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#003366', marginBottom:20 }}>Organisation CIRT</h2>
              <div style={{ display:'grid', gap:14 }}>
                {services.map(s=>(
                  <div key={s.id} style={{ background:'white', borderRadius:12, padding:'16px 20px', border:'1px solid #e8edf5', display:'flex', alignItems:'center', gap:14 }}>
                    <Building2 size={18} color="#0057a8"/>
                    <div>
                      <p style={{ fontWeight:700, fontSize:13, color:'#003366' }}>{s.name}</p>
                      {s.sousDirection && <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{s.sousDirection.name}</p>}
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
                {categories.map((c,i)=>{
                  const Icon = CAT_ICONS[c.name]??FileText;
                  const color = CAT_COLORS[i%CAT_COLORS.length];
                  return (
                    <div key={c.id} style={{ background:'white', borderRadius:12, padding:'16px 20px', border:'1px solid #e8edf5', display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:40, height:40, borderRadius:9, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Icon size={18} color={color}/>
                      </div>
                      <p style={{ fontWeight:700, fontSize:14, color:'#003366' }}>{c.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
