import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, FileText, Clock, CheckCircle, Archive, Plus, LogOut,
  Search, Users, BarChart3, X, Menu, Loader2, AlertCircle,
  ShieldAlert, UserX, Database, Fingerprint, Check, Trash2,
  Building2, UserPlus, Key, RefreshCw, MapPin, Activity,
  TrendingUp, Edit2, Save, Eye, EyeOff, ChevronRight,
  Tag, UserCheck, Settings, Upload, Download, File, ExternalLink,
  Lock, Unlock, Send, ClipboardCheck, Stamp, ScrollText,
  ToggleLeft, ToggleRight, Bell, ShieldCheck, BookOpen,
} from 'lucide-react';
import type {
  User, Dossier, Category, Antenne, ServiceCirt, SousDirection,
  DossierStatus, StatGlobale, StatAntenne, UserRole, PermissionCategory,
  ActivityLog, DossierSyncRequest, SecurityLevel,
} from '../types';
import {
  ROLE_LABELS, SECURITY_LEVEL_LABELS, canCreateUsers, canCreateDossiers,
  canValidate, canArchive, canStampOrSeal, canViewStats, canManageAntennes,
  canManageCategories, canViewLogs, canSetSecurity, canReviewSync,
  CREATABLE_ROLES, isCirtMember, isTopLevel, isAntenneMember,
} from '../types';
import * as api from '../api';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<DossierStatus, { label:string; bg:string; text:string; dot:string; border:string }> = {
  EN_ATTENTE: { label:'En attente',  bg:'#faf5ff', text:'#6b21a8', dot:'#a855f7', border:'#e9d5ff' },
  EN_COURS:   { label:'En cours',    bg:'#fff7ed', text:'#9a3412', dot:'#f97316', border:'#fed7aa' },
  VALIDE:     { label:'Validé',      bg:'#f0fdf4', text:'#14532d', dot:'#22c55e', border:'#bbf7d0' },
  ARCHIVE:    { label:'Archivé',     bg:'#eff6ff', text:'#1e3a8a', dot:'#3b82f6', border:'#bfdbfe' },
};
const SYNC_CFG: Record<string, { label:string; color:string }> = {
  PENDING:  { label:'En attente',  color:'#f59e0b' },
  APPROVED: { label:'Approuvée',   color:'#22c55e' },
  REJECTED: { label:'Rejetée',     color:'#dc2626' },
};
const SEC_COLORS: Record<SecurityLevel, string> = {
  SECRET_PRIVE:'#dc2626', ANTENNE_PRIVE:'#f97316',
  ANTENNE_PUBLIC:'#0891b2', CIRT_ONLY:'#7c3aed', PUBLIC:'#16a34a',
};
const CAT_ICONS: Record<string,React.ElementType> = {
  'Scans de Vulnérabilité':ShieldAlert,'Fermeture de Comptes':UserX,
  'Veille Informationnelle':Search,"Collecte d'Actifs":Database,
  'Base Points Focaux':Users,'Réquisitions':FileText,'Preuves Numériques':Fingerprint,
};
const CAT_COLORS = ['#0057a8','#0070cc','#1b8a4e','#7c3aed','#db2777','#d97706','#0891b2'];

type Tab = 'dashboard'|'dossiers'|'sync'|'stats'|'users'|'antennes'|'organisation'|'categories'|'logs';

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS DE BASE
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge:React.FC<{status:DossierStatus}> = ({status}) => {
  const c = STATUS_CFG[status];
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:99,fontSize:11,fontWeight:600,background:c.bg,color:c.text,border:`1px solid ${c.border}`}}>
    <span style={{width:5,height:5,borderRadius:'50%',background:c.dot,flexShrink:0}}/>{c.label}
  </span>;
};

const RoleBadge:React.FC<{role:UserRole}> = ({role}) => {
  const colors:Record<string,string> = {
    super_admin:'#1a1a2e',directeur:'#7c3aed',admin_cirt:'#0057a8',chef_service:'#0891b2',
    directeur_antenne:'#1b8a4e',agent_cirt:'#0070cc',agent_antenne:'#6b7280',
  };
  return <span style={{display:'inline-flex',padding:'2px 9px',borderRadius:99,fontSize:11,fontWeight:600,background:colors[role]??'#64748b',color:'white'}}>
    {ROLE_LABELS[role]}
  </span>;
};

const SecBadge:React.FC<{level:SecurityLevel}> = ({level}) => (
  <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:700,background:SEC_COLORS[level]+'20',color:SEC_COLORS[level],border:`1px solid ${SEC_COLORS[level]}40`}}>
    <Lock size={9}/>{SECURITY_LEVEL_LABELS[level]}
  </span>
);

const Modal:React.FC<{title:string;subtitle?:string;onClose:()=>void;children:React.ReactNode;width?:number}> = ({title,subtitle,onClose,children,width=520}) => (
  <div style={{position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(0,40,85,0.55)',backdropFilter:'blur(6px)'}}
    onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{background:'white',borderRadius:16,boxShadow:'0 24px 64px rgba(0,40,85,0.2)',width:'100%',maxWidth:width,maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'20px 24px',borderBottom:'1px solid #e8edf5'}}>
        <div>
          <h3 style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:17,color:'#0d1b2a'}}>{title}</h3>
          {subtitle&&<p style={{fontSize:12,color:'#5a6a7e',marginTop:3}}>{subtitle}</p>}
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:4,borderRadius:6,display:'flex'}}><X size={18}/></button>
      </div>
      <div style={{padding:24,overflowY:'auto',flex:1}}>{children}</div>
    </div>
  </div>
);

const Field:React.FC<{label:string;required?:boolean;hint?:string;children:React.ReactNode}> = ({label,required,hint,children}) => (
  <div>
    <label style={{display:'block',fontSize:11,fontWeight:700,color:'#003366',marginBottom:6,letterSpacing:'0.07em',textTransform:'uppercase'}}>
      {label}{required&&<span style={{color:'#dc2626',marginLeft:3}}>*</span>}
    </label>
    {children}
    {hint&&<p style={{fontSize:11,color:'#94a3b8',marginTop:4}}>{hint}</p>}
  </div>
);

const inputS:React.CSSProperties = {width:'100%',padding:'10px 13px',background:'#f8fafd',border:'1.5px solid #dde3ed',borderRadius:8,fontSize:13,color:'#0d1b2a',outline:'none',transition:'border-color 0.2s',fontFamily:'Outfit, sans-serif'};
const focH = {
  onFocus:(e:React.FocusEvent<any>)=>{e.target.style.borderColor='#0057a8';e.target.style.boxShadow='0 0 0 3px rgba(0,87,168,0.1)';},
  onBlur: (e:React.FocusEvent<any>)=>{e.target.style.borderColor='#dde3ed';e.target.style.boxShadow='none';},
};
const Inp=(p:React.InputHTMLAttributes<HTMLInputElement>)=><input {...p} style={{...inputS,...p.style}} {...focH}/>;
const Sel=(p:React.SelectHTMLAttributes<HTMLSelectElement>)=><select {...p} style={{...inputS,cursor:'pointer',...p.style}} {...focH}/>;
const Txa=(p:React.TextareaHTMLAttributes<HTMLTextAreaElement>)=><textarea {...p} style={{...inputS,minHeight:80,resize:'vertical',...p.style}} {...focH}/>;

const Btn:React.FC<{variant?:'primary'|'secondary'|'danger'|'ghost'|'success'|'warning';children:React.ReactNode;onClick?:()=>void;type?:'button'|'submit';disabled?:boolean;small?:boolean;full?:boolean}> = ({variant='primary',children,onClick,type='button',disabled,small,full}) => {
  const s:Record<string,React.CSSProperties> = {
    primary:  {background:disabled?'#93c5fd':'#0057a8',color:'white',border:'none',boxShadow:disabled?'none':'0 2px 10px rgba(0,87,168,0.28)'},
    secondary:{background:'white',color:'#0057a8',border:'1.5px solid #c5d8f0'},
    danger:   {background:'#dc2626',color:'white',border:'none'},
    ghost:    {background:'transparent',color:'#5a6a7e',border:'1.5px solid #e8edf5'},
    success:  {background:'#16a34a',color:'white',border:'none'},
    warning:  {background:'#d97706',color:'white',border:'none'},
  };
  return <button type={type} onClick={onClick} disabled={disabled} style={{...s[variant],cursor:disabled?'not-allowed':'pointer',borderRadius:8,padding:small?'6px 12px':'9px 18px',fontSize:small?12:13,fontWeight:600,display:'inline-flex',alignItems:'center',gap:6,width:full?'100%':undefined,justifyContent:full?'center':undefined,opacity:disabled?.6:1,transition:'opacity 0.15s'}}>
    {children}
  </button>;
};

const Err:React.FC<{msg:string}> = ({msg}) => (
  <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 14px',display:'flex',gap:8,alignItems:'center',color:'#dc2626',fontSize:13}}>
    <AlertCircle size={15}/>{msg}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PROFIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
const ProfileModal:React.FC<{user:User;onClose:()=>void;onUpdate:(u:User)=>void}> = ({user,onClose,onUpdate}) => {
  const [name,setName]=useState(user.name);
  const [email,setEmail]=useState(user.email);
  const [pwd,setPwd]=useState('');const [confirm,setConfirm]=useState('');
  const [showPwd,setShowPwd]=useState(false);const [saving,setSaving]=useState(false);const [err,setErr]=useState('');
  const submit = async()=>{
    setErr('');
    if(pwd&&pwd!==confirm){setErr('Les mots de passe ne correspondent pas');return;}
    if(pwd&&pwd.length<6){setErr('Mot de passe : 6 caractères minimum');return;}
    setSaving(true);
    try{
      const payload:api.UpdateProfilePayload={};
      if(name!==user.name)payload.name=name;
      if(email!==user.email)payload.email=email;
      if(pwd)payload.password=pwd;
      if(Object.keys(payload).length===0){setErr('Aucune modification');setSaving(false);return;}
      const u=await api.updateProfile(payload);
      onUpdate(u);onClose();
    }catch(e:any){setErr(e.message);}finally{setSaving(false);}
  };
  return <Modal title="Mon profil" onClose={onClose}>
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {err&&<Err msg={err}/>}
      <Field label="Nom"><Inp value={name} onChange={e=>setName(e.target.value)}/></Field>
      <Field label="Email"><Inp type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
      <Field label="Nouveau mot de passe" hint="Laisser vide pour ne pas changer">
        <div style={{position:'relative'}}>
          <Inp type={showPwd?'text':'password'} value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="••••••••"/>
          <button onClick={()=>setShowPwd(!showPwd)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8'}}>{showPwd?<EyeOff size={16}/>:<Eye size={16}/>}</button>
        </div>
      </Field>
      {pwd&&<Field label="Confirmer"><Inp type={showPwd?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••"/></Field>}
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:8}}>
        <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
        <Btn onClick={submit} disabled={saving}>{saving?<><Loader2 size={14} className="animate-spin"/>Enregistrement…</>:<><Save size={14}/>Enregistrer</>}</Btn>
      </div>
    </div>
  </Modal>;
};

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const Sidebar:React.FC<{user:User;active:Tab;onChange:(t:Tab)=>void;onLogout:()=>void;onProfile:()=>void}> = ({user,active,onChange,onLogout,onProfile}) => {
  const tabs:{id:Tab;label:string;icon:React.ElementType;show:boolean}[] = [
    {id:'dashboard',   label:'Tableau de bord',  icon:Activity,       show:canViewStats(user.role)},
    {id:'dossiers',    label:'Dossiers',          icon:FileText,       show:true},
    {id:'sync',        label:'Demandes sync',     icon:Send,           show:canReviewSync(user.role)||user.role==='agent_antenne'},
    {id:'stats',       label:'Statistiques',      icon:BarChart3,      show:canViewStats(user.role)},
    {id:'users',       label:'Utilisateurs',      icon:Users,          show:canCreateUsers(user.role)},
    {id:'antennes',    label:'Antennes',           icon:MapPin,         show:canManageAntennes(user.role)||user.role==='directeur_antenne'},
    {id:'organisation',label:'Organisation',      icon:Building2,      show:['super_admin','directeur','admin_cirt'].includes(user.role)},
    {id:'categories',  label:'Catégories',        icon:Tag,            show:canManageCategories(user.role)||['admin_cirt','directeur_antenne','chef_service'].includes(user.role)},
    {id:'logs',        label:'Journal',           icon:ScrollText,     show:canViewLogs(user.role)},
  ];
  return (
    <div style={{width:240,minWidth:240,background:'linear-gradient(180deg,#001a3d 0%,#002855 50%,#003366 100%)',display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0}}>
      <div style={{padding:'24px 20px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#0070cc,#4db8ff)',display:'flex',alignItems:'center',justifyContent:'center'}}><Shield size={18} color="white"/></div>
          <div><p style={{color:'white',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,lineHeight:1.1}}>CIRT-ANTIC</p><p style={{color:'rgba(255,255,255,0.4)',fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase'}}>Plateforme</p></div>
        </div>
      </div>
      <nav style={{flex:1,padding:'0 12px',overflowY:'auto'}}>
        {tabs.filter(t=>t.show).map(t=>{
          const Icon=t.icon; const on=active===t.id;
          return <button key={t.id} onClick={()=>onChange(t.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:8,marginBottom:2,background:on?'rgba(77,184,255,0.15)':'transparent',border:on?'1px solid rgba(77,184,255,0.25)':'1px solid transparent',color:on?'#4db8ff':'rgba(255,255,255,0.65)',cursor:'pointer',fontSize:13,fontWeight:on?600:400,transition:'all 0.15s',textAlign:'left'}}>
            <Icon size={16}/>{t.label}
          </button>;
        })}
      </nav>
      <div style={{padding:'12px 12px 20px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        <button onClick={onProfile} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,0.07)',border:'none',color:'white',cursor:'pointer',marginBottom:6,textAlign:'left'}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#0070cc,#4db8ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{user.name[0]?.toUpperCase()}</div>
          <div style={{minWidth:0}}>
            <p style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</p>
            <p style={{fontSize:10,color:'rgba(255,255,255,0.5)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ROLE_LABELS[user.role]}</p>
          </div>
        </button>
        <button onClick={onLogout} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:8,background:'transparent',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.6)',cursor:'pointer',fontSize:12}}>
          <LogOut size={14}/>Déconnexion
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
const DashboardView:React.FC<{user:User;dossiers:Dossier[];categories:Category[];myPermissions:PermissionCategory[]}> = ({user,dossiers,categories,myPermissions}) => {
  const total=dossiers.length;
  const attente=dossiers.filter(d=>d.status==='EN_ATTENTE').length;
  const enCours=dossiers.filter(d=>d.status==='EN_COURS').length;
  const valide=dossiers.filter(d=>d.status==='VALIDE').length;
  const archive=dossiers.filter(d=>d.status==='ARCHIVE').length;
  const nonSync=dossiers.filter(d=>!d.syncedToCirt&&d.status!=='ARCHIVE').length;
  const cards=[
    {label:'Total dossiers',value:total,color:'#0057a8',icon:FileText},
    {label:'En attente',value:attente,color:'#a855f7',icon:Clock},
    {label:'En cours',value:enCours,color:'#f97316',icon:Activity},
    {label:'Validés',value:valide,color:'#22c55e',icon:CheckCircle},
    {label:'Archivés',value:archive,color:'#3b82f6',icon:Archive},
    {label:'Non synchronisés',value:nonSync,color:'#dc2626',icon:Send},
  ];
  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:14}}>
        {cards.map(c=>{const Icon=c.icon;return(
          <div key={c.label} style={{background:'white',borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,40,85,0.08)',border:`1px solid ${c.color}20`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <p style={{fontSize:11,color:'#5a6a7e',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>{c.label}</p>
              <div style={{width:28,height:28,borderRadius:7,background:`${c.color}15`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={14} color={c.color}/></div>
            </div>
            <p style={{fontSize:28,fontWeight:700,color:c.color,fontFamily:'Syne,sans-serif'}}>{c.value}</p>
          </div>
        );})}
      </div>
      {user.role==='agent_antenne'&&(
        <div style={{background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:12,padding:16}}>
          <p style={{fontWeight:600,color:'#92400e',fontSize:13,marginBottom:6}}>Rappels</p>
          <ul style={{fontSize:12,color:'#78350f',paddingLeft:16,display:'flex',flexDirection:'column',gap:4}}>
            <li>Vos dossiers non synchronisés ne sont pas visibles par le CIRT.</li>
            <li>Les dossiers marqués <strong>Secret Privé</strong> ne peuvent jamais être envoyés au CIRT.</li>
            <li>Demandez la synchronisation via le bouton <strong>Envoyer au CIRT</strong> dans chaque dossier.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DOSSIERS VIEW
// ─────────────────────────────────────────────────────────────────────────────
const DossiersView:React.FC<{user:User;dossiers:Dossier[];categories:Category[];myPermissions:PermissionCategory[];antennes:Antenne[];onRefresh:()=>void}> = ({user,dossiers,categories,myPermissions,antennes,onRefresh}) => {
  const [search,setSearch]=useState('');
  const [filterStatus,setFilterStatus]=useState('');
  const [filterCat,setFilterCat]=useState('');
  const [selected,setSelected]=useState<Dossier|null>(null);
  const [creating,setCreating]=useState(false);
  const [err,setErr]=useState('');

  // Création
  const [newTitle,setNewTitle]=useState('');const [newDesc,setNewDesc]=useState('');
  const [newCat,setNewCat]=useState('');const [newSec,setNewSec]=useState<SecurityLevel>('PUBLIC');
  const [saving,setSaving]=useState(false);

  const myAllowedCats = myPermissions.map(p=>p.category.id);
  const visibleCats = user.role==='agent_antenne'
    ? categories.filter(c=>myAllowedCats.includes(c.id))
    : categories;

  const filtered=dossiers.filter(d=>{
    const ms=!search||(d.title.toLowerCase().includes(search.toLowerCase())||d.category?.name?.toLowerCase().includes(search.toLowerCase()));
    const mst=!filterStatus||d.status===filterStatus;
    const mc=!filterCat||String(d.category?.id)===filterCat;
    return ms&&mst&&mc;
  });

  const submitCreate=async()=>{
    if(!newTitle.trim()||!newCat){setErr('Titre et catégorie requis');return;}
    setSaving(true);setErr('');
    try{
      await api.createDossier({title:newTitle,description:newDesc,categoryId:Number(newCat),securityLevel:newSec});
      setCreating(false);setNewTitle('');setNewDesc('');setNewCat('');setNewSec('PUBLIC');
      onRefresh();
    }catch(e:any){setErr(e.message);}finally{setSaving(false);}
  };

  const doAction=async(action:string,id:number)=>{
    try{
      if(action==='ouvrir')await api.ouvrirDossier(id);
      else if(action==='valider')await api.validateDossier(id);
      else if(action==='tampon')await api.stampDossier(id);
      else if(action==='sceau')await api.sealDossier(id);
      else if(action==='archiver')await api.archiveDossier(id);
      else if(action==='supprimer'){if(!confirm('Supprimer ce dossier ?'))return;await api.deleteDossier(id);}
      else if(action==='sync')await api.requestSync(id);
      onRefresh();
      if(selected?.id===id){const upd=await api.getDossierById(id).catch(()=>null);setSelected(upd);}
    }catch(e:any){alert(e.message);}
  };

  const setSecLevel=async(id:number,level:SecurityLevel)=>{
    try{const upd=await api.setDossierSecurity(id,level);setSelected(upd);onRefresh();}
    catch(e:any){alert(e.message);}
  };

  const canActOnDossier=(d:Dossier)=>{
    if(user.role==='super_admin'||user.role==='directeur')return true;
    if(d.createdBy?.id===user.id)return true;
    if(user.role==='directeur_antenne'&&d.antenne?.id===user.antenne?.id)return true;
    if(isCirtMember(user.role)&&d.syncedToCirt)return true;
    return false;
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Barre outils */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:1,minWidth:200}}>
          <Search size={14} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
          <Inp placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:33}}/>
        </div>
        <Sel value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{width:140}}>
          <option value="">Tous statuts</option>
          {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </Sel>
        <Sel value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{width:160}}>
          <option value="">Toutes catégories</option>
          {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </Sel>
        {canCreateDossiers(user.role)&&<Btn onClick={()=>setCreating(true)}><Plus size={14}/>Nouveau dossier</Btn>}
      </div>

      {/* Table */}
      <div style={{background:'white',borderRadius:12,boxShadow:'0 1px 4px rgba(0,40,85,0.07)',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 150px 130px 120px 90px',padding:'10px 16px',background:'#f8fafd',borderBottom:'1px solid #e8edf5',fontSize:10,fontWeight:700,color:'#5a6a7e',textTransform:'uppercase',letterSpacing:'0.08em'}}>
          <span>Dossier</span><span>Statut</span><span>Sécurité</span><span>Sync CIRT</span><span>Actions</span>
        </div>
        {filtered.length===0&&<div style={{padding:'40px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>Aucun dossier</div>}
        {filtered.map(d=>(
          <div key={d.id} style={{display:'grid',gridTemplateColumns:'1fr 150px 130px 120px 90px',padding:'12px 16px',borderBottom:'1px solid #f0f4f8',alignItems:'center',cursor:'pointer'}}
            onClick={()=>setSelected(d)}>
            <div>
              <p style={{fontWeight:600,fontSize:13,color:'#0d1b2a'}}>{d.title}</p>
              <p style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{d.category?.name} · {d.antenne?.name} · #{d.id}</p>
            </div>
            <StatusBadge status={d.status}/>
            <SecBadge level={d.securityLevel??'PUBLIC'}/>
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              <span style={{fontSize:11,fontWeight:600,color:d.syncedToCirt?'#16a34a':'#dc2626'}}>{d.syncedToCirt?'✓ Synchronisé':'✗ Local'}</span>
              {d.stamped&&<span style={{fontSize:10,color:'#0057a8'}}>🔖 Tamponné</span>}
              {d.sealed&&<span style={{fontSize:10,color:'#7c3aed'}}>🔐 Scellé</span>}
            </div>
            <div onClick={e=>e.stopPropagation()} style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {canActOnDossier(d)&&<button onClick={()=>setSelected(d)} style={{background:'#f0f4f8',border:'none',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:11,color:'#0057a8',fontWeight:600}}>Voir</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal création */}
      {creating&&<Modal title="Nouveau dossier" onClose={()=>{setCreating(false);setErr('');}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {err&&<Err msg={err}/>}
          <Field label="Titre" required><Inp value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Ex: Compromission compte réseau"/></Field>
          <Field label="Description"><Txa value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="Décrivez l'incident…"/></Field>
          <Field label="Catégorie" required>
            <Sel value={newCat} onChange={e=>setNewCat(e.target.value)}>
              <option value="">Sélectionner…</option>
              {visibleCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </Sel>
          </Field>
          <Field label="Niveau de sécurité" hint="PUBLIC par défaut. SECRET_PRIVE = jamais envoyé au CIRT.">
            <Sel value={newSec} onChange={e=>setNewSec(e.target.value as SecurityLevel)}>
              {Object.entries(SECURITY_LEVEL_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </Sel>
          </Field>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:8}}>
            <Btn variant="ghost" onClick={()=>setCreating(false)}>Annuler</Btn>
            <Btn onClick={submitCreate} disabled={saving}>{saving?<><Loader2 size={14}/>Création…</>:<><Plus size={14}/>Créer</>}</Btn>
          </div>
        </div>
      </Modal>}

      {/* Modal détail */}
      {selected&&<DossierDetailModal dossier={selected} user={user} onClose={()=>setSelected(null)} onAction={doAction} onSecLevel={setSecLevel} onRefresh={onRefresh}/>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DOSSIER DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
const DossierDetailModal:React.FC<{dossier:Dossier;user:User;onClose:()=>void;onAction:(a:string,id:number)=>void;onSecLevel:(id:number,l:SecurityLevel)=>void;onRefresh:()=>void}> = ({dossier:d,user,onClose,onAction,onSecLevel,onRefresh}) => {
  const [docs,setDocs]=useState<api.DocFile[]>([]);
  const [scanUrls,setScanUrls]=useState<api.ScanUrl[]>([]);
  const [scanStats,setScanStats]=useState<api.ScanStats|null>(null);
  const [newUrls,setNewUrls]=useState('');
  const [newSec,setNewSec]=useState<SecurityLevel>(d.securityLevel??'PUBLIC');
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    api.getDossierDocuments(d.id).then(setDocs).catch(()=>{});
    api.getScanUrls(d.id).then(setScanUrls).catch(()=>{});
    api.getScanStats(d.id).then(setScanStats).catch(()=>{});
  },[d.id]);

  const uploadFile=async(f:File)=>{
    try{
      let etapeId=0;
      const etapes=await api.createEtapeForDoc(d.id).catch(()=>({id:0}));
      etapeId=etapes.id;
      if(etapeId)await api.uploadToEtape(etapeId,f);
      api.getDossierDocuments(d.id).then(setDocs);
    }catch(e:any){alert(e.message);}
  };

  const addUrls=async()=>{
    if(!newUrls.trim())return;
    try{await api.addScanUrls(d.id,newUrls);setNewUrls('');api.getScanUrls(d.id).then(setScanUrls);}catch(e:any){alert(e.message);}
  };

  const isCreator=d.createdBy?.id===user.id;
  const canSync=isCreator&&!d.syncedToCirt&&d.securityLevel!=='SECRET_PRIVE';
  const canOuvrir=isCirtMember(user.role)&&d.status==='EN_ATTENTE'&&(d.syncedToCirt||isTopLevel(user.role));
  const canValider=canValidate(user.role)&&d.status==='EN_COURS';
  const canTampon=canStampOrSeal(user.role)&&d.status==='VALIDE'&&!d.stamped;
  const canSceau=canStampOrSeal(user.role)&&d.stamped&&!d.sealed;
  const canArchiver=canArchive(user.role)&&d.status==='VALIDE';
  const canDel=(user.role==='super_admin'||user.role==='directeur')||(isCreator&&['EN_ATTENTE','EN_COURS'].includes(d.status));
  const canChangeSecLevel=canSetSecurity(user.role);

  const info=(l:string,v:React.ReactNode)=>(
    <div style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #f0f4f8',fontSize:12}}>
      <span style={{color:'#5a6a7e',fontWeight:600}}>{l}</span><span style={{color:'#0d1b2a',textAlign:'right'}}>{v}</span>
    </div>
  );

  return <Modal title={d.title} subtitle={`#${d.id} · ${d.category?.name??''} · ${d.antenne?.name??''}`} onClose={onClose} width={680}>
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Statut + badges */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <StatusBadge status={d.status}/>
        <SecBadge level={d.securityLevel??'PUBLIC'}/>
        {d.syncedToCirt&&<span style={{fontSize:11,background:'#dcfce7',color:'#16a34a',padding:'2px 8px',borderRadius:99,fontWeight:600}}>✓ Sync CIRT</span>}
        {d.stamped&&<span style={{fontSize:11,background:'#dbeafe',color:'#1d4ed8',padding:'2px 8px',borderRadius:99,fontWeight:600}}>🔖 Tamponné</span>}
        {d.sealed&&<span style={{fontSize:11,background:'#ede9fe',color:'#6d28d9',padding:'2px 8px',borderRadius:99,fontWeight:600}}>🔐 Scellé</span>}
      </div>

      {/* Infos */}
      <div>
        {info('Créé par', d.createdBy?.name??'—')}
        {info('Date création', new Date(d.createdAt).toLocaleString('fr-FR'))}
        {d.validatedAt&&info('Validé le', new Date(d.validatedAt).toLocaleString('fr-FR'))}
        {d.stampedAt&&info('Tamponné le', new Date(d.stampedAt).toLocaleString('fr-FR'))}
        {d.sealedAt&&info('Scellé le', new Date(d.sealedAt).toLocaleString('fr-FR'))}
        {d.description&&<p style={{fontSize:13,color:'#374151',marginTop:10,padding:'10px 12px',background:'#f8fafd',borderRadius:8}}>{d.description}</p>}
      </div>

      {/* Niveau de sécurité */}
      {canChangeSecLevel&&<div style={{background:'#f8fafd',borderRadius:10,padding:14}}>
        <p style={{fontSize:11,fontWeight:700,color:'#003366',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Niveau de sécurité</p>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <Sel value={newSec} onChange={e=>setNewSec(e.target.value as SecurityLevel)} style={{flex:1}}>
            {Object.entries(SECURITY_LEVEL_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </Sel>
          <Btn small onClick={()=>onSecLevel(d.id,newSec)}><Save size={12}/>Appliquer</Btn>
        </div>
        {d.securitySetBy&&<p style={{fontSize:11,color:'#94a3b8',marginTop:6}}>Configuré par {d.securitySetBy.name}</p>}
      </div>}

      {/* Actions */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {canSync&&<Btn variant="secondary" small onClick={()=>onAction('sync',d.id)}><Send size={12}/>Envoyer au CIRT</Btn>}
        {canOuvrir&&<Btn variant="secondary" small onClick={()=>onAction('ouvrir',d.id)}><BookOpen size={12}/>Ouvrir</Btn>}
        {canValider&&<Btn variant="success" small onClick={()=>onAction('valider',d.id)}><CheckCircle size={12}/>Valider</Btn>}
        {canTampon&&<Btn variant="warning" small onClick={()=>onAction('tampon',d.id)}><Stamp size={12}/>Apposer tampon</Btn>}
        {canSceau&&<Btn small onClick={()=>onAction('sceau',d.id)}><ShieldCheck size={12}/>Sceau final</Btn>}
        {canArchiver&&<Btn variant="ghost" small onClick={()=>onAction('archiver',d.id)}><Archive size={12}/>Archiver</Btn>}
        {canDel&&<Btn variant="danger" small onClick={()=>onAction('supprimer',d.id)}><Trash2 size={12}/>Supprimer</Btn>}
      </div>

      {/* Documents */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <p style={{fontSize:11,fontWeight:700,color:'#003366',textTransform:'uppercase',letterSpacing:'0.07em'}}>Documents ({docs.length})</p>
          <input ref={fileRef} type="file" style={{display:'none'}} onChange={async e=>{const f=e.target.files?.[0];if(f)await uploadFile(f);e.target.value='';}}/>
          <Btn variant="ghost" small onClick={()=>fileRef.current?.click()}><Upload size={12}/>Upload</Btn>
        </div>
        {docs.length===0&&<p style={{fontSize:12,color:'#94a3b8'}}>Aucun document</p>}
        {docs.map(doc=>(
          <div key={doc.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 10px',background:'#f8fafd',borderRadius:7,marginBottom:5}}>
            <div style={{display:'flex',alignItems:'center',gap:7}}><File size={13} color="#0057a8"/><span style={{fontSize:12,color:'#0d1b2a'}}>{doc.fileName}</span></div>
            <div style={{display:'flex',gap:6}}>
              <a href={api.fileViewUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:'#0057a8',display:'flex',alignItems:'center',gap:3}}><ExternalLink size={11}/>Voir</a>
              <button onClick={async()=>{if(!confirm('Supprimer ?'))return;await api.deleteDocument(doc.id);setDocs(docs.filter(x=>x.id!==doc.id));}} style={{background:'none',border:'none',cursor:'pointer',color:'#dc2626'}}><Trash2 size={12}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* Scans */}
      {scanStats&&<div style={{background:'#f8fafd',borderRadius:10,padding:14}}>
        <p style={{fontSize:11,fontWeight:700,color:'#003366',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Scans de vulnérabilité</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
          {[['Total',scanStats.total,'#0057a8'],['Analysées',scanStats.analysees,'#16a34a'],['Élevées',scanStats.vulnEleve,'#dc2626']].map(([l,v,c])=>(
            <div key={String(l)} style={{textAlign:'center',background:'white',borderRadius:8,padding:'8px 4px',border:`1px solid ${c}20`}}>
              <p style={{fontSize:18,fontWeight:700,color:c as string,fontFamily:'Syne,sans-serif'}}>{v}</p>
              <p style={{fontSize:10,color:'#5a6a7e'}}>{l}</p>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          <Inp placeholder="URLs à scanner (une par ligne)…" value={newUrls} onChange={e=>setNewUrls(e.target.value)} style={{flex:1}}/>
          <Btn small onClick={addUrls}><Plus size={12}/>Ajouter</Btn>
        </div>
      </div>}
    </div>
  </Modal>;
};

// ─────────────────────────────────────────────────────────────────────────────
// SYNC VIEW — Demandes de synchronisation
// ─────────────────────────────────────────────────────────────────────────────
const SyncView:React.FC<{user:User;onRefresh:()=>void}> = ({user,onRefresh}) => {
  const [requests,setRequests]=useState<DossierSyncRequest[]>([]);
  const [loading,setLoading]=useState(true);
  const [motif,setMotif]=useState('');
  const [reviewing,setReviewing]=useState<number|null>(null);

  const load=useCallback(()=>{
    setLoading(true);
    api.getSyncRequests().then(setRequests).catch(()=>{}).finally(()=>setLoading(false));
  },[]);
  useEffect(()=>{load();},[load]);

  const review=async(id:number,approved:boolean)=>{
    try{await api.reviewSync(id,approved,motif||undefined);setMotif('');setReviewing(null);load();onRefresh();}
    catch(e:any){alert(e.message);}
  };

  if(loading)return <div style={{display:'flex',justifyContent:'center',padding:40}}><Loader2 size={24} className="animate-spin" color="#0057a8"/></div>;
  const pending=requests.filter(r=>r.status==='PENDING');
  const done=requests.filter(r=>r.status!=='PENDING');

  return <div style={{display:'flex',flexDirection:'column',gap:20}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <h2 style={{fontWeight:700,fontSize:16,color:'#003366'}}>Demandes de synchronisation</h2>
      <Btn variant="ghost" small onClick={load}><RefreshCw size={13}/>Actualiser</Btn>
    </div>
    {pending.length>0&&<div>
      <p style={{fontSize:11,fontWeight:700,color:'#f97316',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>En attente ({pending.length})</p>
      {pending.map(r=>(
        <div key={r.id} style={{background:'white',borderRadius:10,padding:16,marginBottom:10,boxShadow:'0 1px 4px rgba(0,40,85,0.07)',border:'1px solid #fed7aa'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <p style={{fontWeight:600,color:'#0d1b2a',fontSize:14}}>{r.dossier.title}</p>
              <p style={{fontSize:11,color:'#5a6a7e',marginTop:3}}>Demandé par <strong>{r.requestedBy.name}</strong> · {new Date(r.requestedAt).toLocaleString('fr-FR')}</p>
              <p style={{fontSize:11,color:'#5a6a7e'}}>Antenne : {r.dossier.antenne?.name??'—'} · Catégorie : {r.dossier.category?.name??'—'}</p>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:SYNC_CFG[r.status].color}}>●&nbsp;{SYNC_CFG[r.status].label}</span>
          </div>
          {canReviewSync(user.role)&&<div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
            {reviewing===r.id&&<Inp placeholder="Motif (optionnel)" value={motif} onChange={e=>setMotif(e.target.value)}/>}
            <div style={{display:'flex',gap:8}}>
              {reviewing!==r.id&&<Btn variant="ghost" small onClick={()=>setReviewing(r.id)}>Ajouter un motif</Btn>}
              <Btn variant="success" small onClick={()=>review(r.id,true)}><Check size={12}/>Approuver</Btn>
              <Btn variant="danger" small onClick={()=>review(r.id,false)}><X size={12}/>Rejeter</Btn>
            </div>
          </div>}
          {!canReviewSync(user.role)&&<p style={{fontSize:11,color:'#94a3b8',marginTop:8}}>En attente de validation par votre directeur d'antenne.</p>}
        </div>
      ))}
    </div>}
    {pending.length===0&&<div style={{textAlign:'center',padding:'30px 0',color:'#94a3b8',fontSize:13}}>Aucune demande en attente</div>}
    {done.length>0&&<div>
      <p style={{fontSize:11,fontWeight:700,color:'#5a6a7e',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Historique ({done.length})</p>
      {done.slice(0,20).map(r=>(
        <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'white',borderRadius:8,marginBottom:6,boxShadow:'0 1px 3px rgba(0,40,85,0.05)'}}>
          <div>
            <p style={{fontWeight:600,fontSize:13,color:'#0d1b2a'}}>{r.dossier.title}</p>
            <p style={{fontSize:11,color:'#94a3b8'}}>{r.requestedBy.name} · {new Date(r.requestedAt).toLocaleDateString('fr-FR')}</p>
          </div>
          <span style={{fontSize:12,fontWeight:700,color:SYNC_CFG[r.status].color}}>●&nbsp;{SYNC_CFG[r.status].label}</span>
        </div>
      ))}
    </div>}
  </div>;
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS VIEW
// ─────────────────────────────────────────────────────────────────────────────
const UsersView:React.FC<{user:User;users:User[];antennes:Antenne[];services:ServiceCirt[];sousDirections:SousDirection[];categories:Category[];onRefresh:()=>void}> = ({user,users,antennes,services,sousDirections,categories,onRefresh}) => {
  const [search,setSearch]=useState('');
  const [showCreate,setShowCreate]=useState(false);
  const [showPerms,setShowPerms]=useState<User|null>(null);
  const [err,setErr]=useState('');
  const [saving,setSaving]=useState(false);

  // Création
  const [cName,setCName]=useState('');const [cEmail,setCEmail]=useState('');
  const [cPwd,setCPwd]=useState('');const [cRole,setCRole]=useState('');
  const [cAntenne,setCantenne]=useState('');const [cService,setCService]=useState('');
  const [cSDId,setCSDId]=useState('');const [cSDName,setCSDName]=useState('');

  const creatableRoles=CREATABLE_ROLES[user.role]??[];

  const filtered=users.filter(u=>!search||(u.name.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase())));

  const submitCreate=async()=>{
    if(!cName||!cEmail||!cPwd||!cRole){setErr('Champs obligatoires manquants');return;}
    setSaving(true);setErr('');
    try{
      const payload:api.CreateUserPayload={name:cName,email:cEmail,password:cPwd,roleName:cRole};
      if(cAntenne)payload.antenneId=Number(cAntenne);
      if(cService)payload.serviceId=Number(cService);
      if(cSDId)payload.sousDirectionId=Number(cSDId);
      if(cSDName)payload.sousDirectionName=cSDName;
      await api.createUser(payload);
      setShowCreate(false);setCName('');setCEmail('');setCPwd('');setCRole('');setCantenne('');setCService('');setCSDId('');setCSDName('');
      onRefresh();
    }catch(e:any){setErr(e.message);}finally{setSaving(false);}
  };

  const toggleActive=async(u:User)=>{
    try{await api.toggleUserActive(u.id,!u.active);onRefresh();}catch(e:any){alert(e.message);}
  };
  const deleteU=async(id:number)=>{
    if(!confirm('Supprimer cet utilisateur ?'))return;
    try{await api.deleteUser(id);onRefresh();}catch(e:any){alert(e.message);}
  };

  const canDelete=(target:User)=>{
    if(target.id===user.id)return false;
    if(user.role==='super_admin')return true;
    if(user.role==='directeur')return target.role!=='super_admin'&&target.role!=='directeur';
    if(user.role==='admin_cirt')return target.role==='chef_service'||target.role==='agent_cirt';
    if(user.role==='directeur_antenne')return target.role==='agent_antenne'&&target.antenne?.id===user.antenne?.id;
    return false;
  };
  const canToggle=(target:User)=>{
    if(target.id===user.id)return false;
    if(user.role==='super_admin')return true;
    if(user.role==='directeur')return target.role!=='super_admin'&&target.role!=='directeur';
    if(user.role==='admin_cirt')return target.role==='chef_service'||target.role==='agent_cirt';
    if(user.role==='directeur_antenne')return target.role==='agent_antenne'&&target.antenne?.id===user.antenne?.id;
    return false;
  };

  const needsAntenne=['directeur_antenne'].includes(cRole);
  const needsService=['chef_service','agent_cirt'].includes(cRole);
  const needsSD=cRole==='admin_cirt';
  const isNewDirecteur=cRole==='directeur';

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <div style={{display:'flex',gap:10,alignItems:'center'}}>
      <div style={{position:'relative',flex:1}}>
        <Search size={14} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
        <Inp placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:33}}/>
      </div>
      {creatableRoles.length>0&&<Btn onClick={()=>setShowCreate(true)}><UserPlus size={14}/>Nouvel utilisateur</Btn>}
    </div>

    <div style={{background:'white',borderRadius:12,boxShadow:'0 1px 4px rgba(0,40,85,0.07)',overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 180px 160px 80px 120px',padding:'10px 20px',background:'#f8fafd',borderBottom:'1px solid #e8edf5',fontSize:10,fontWeight:700,color:'#5a6a7e',textTransform:'uppercase',letterSpacing:'0.08em'}}>
        <span>Utilisateur</span><span>Rôle</span><span>Antenne / Service</span><span>Statut</span><span>Actions</span>
      </div>
      {filtered.length===0&&<div style={{padding:'40px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>Aucun utilisateur</div>}
      {filtered.map(u=>(
        <div key={u.id} style={{display:'grid',gridTemplateColumns:'1fr 180px 160px 80px 120px',padding:'12px 20px',borderBottom:'1px solid #f0f4f8',alignItems:'center'}}>
          <div>
            <p style={{fontWeight:600,fontSize:13,color:'#0d1b2a'}}>{u.name}</p>
            <p style={{fontSize:11,color:'#94a3b8'}}>{u.email}</p>
          </div>
          <RoleBadge role={u.role}/>
          <p style={{fontSize:11,color:'#5a6a7e'}}>{u.antenne?.name??u.service?.name??'—'}</p>
          <span style={{fontSize:11,fontWeight:600,color:u.active?'#16a34a':'#dc2626'}}>{u.active?'Actif':'Inactif'}</span>
          <div style={{display:'flex',gap:6}}>
            {canToggle(u)&&<button onClick={()=>toggleActive(u)} title={u.active?'Désactiver':'Activer'}
              style={{background:'none',border:'1px solid #e8edf5',borderRadius:6,padding:'4px 7px',cursor:'pointer',color:u.active?'#dc2626':'#16a34a'}}>
              {u.active?<ToggleRight size={14}/>:<ToggleLeft size={14}/>}
            </button>}
            {canDelete(u)&&<button onClick={()=>deleteU(u.id)} style={{background:'none',border:'1px solid #fecaca',borderRadius:6,padding:'4px 7px',cursor:'pointer',color:'#dc2626'}}><Trash2 size={13}/></button>}
            {(user.role==='super_admin'||user.role==='directeur'||user.role==='admin_cirt'||user.role==='directeur_antenne')&&
              <button onClick={()=>setShowPerms(u)} style={{background:'none',border:'1px solid #e8edf5',borderRadius:6,padding:'4px 7px',cursor:'pointer',color:'#0057a8'}}><Key size={13}/></button>}
          </div>
        </div>
      ))}
    </div>

    {/* Modal création */}
    {showCreate&&<Modal title="Nouvel utilisateur" onClose={()=>{setShowCreate(false);setErr('');}}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {err&&<Err msg={err}/>}
        {isNewDirecteur&&<div style={{background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:8,padding:12,fontSize:12,color:'#92400e'}}>
          ⚠️ La création d'un nouveau directeur désactivera automatiquement le directeur actuel. Un seul directeur actif à la fois.
        </div>}
        <Field label="Nom" required><Inp value={cName} onChange={e=>setCName(e.target.value)}/></Field>
        <Field label="Email" required><Inp type="email" value={cEmail} onChange={e=>setCEmail(e.target.value)}/></Field>
        <Field label="Mot de passe" required><Inp type="password" value={cPwd} onChange={e=>setCPwd(e.target.value)}/></Field>
        <Field label="Rôle" required>
          <Sel value={cRole} onChange={e=>setCRole(e.target.value)}>
            <option value="">Sélectionner…</option>
            {creatableRoles.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Sel>
        </Field>
        {needsAntenne&&<Field label="Antenne" required>
          <Sel value={cAntenne} onChange={e=>setCantenne(e.target.value)}>
            <option value="">Sélectionner…</option>
            {antennes.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
          </Sel>
        </Field>}
        {needsService&&<Field label="Service CIRT" required>
          <Sel value={cService} onChange={e=>setCService(e.target.value)}>
            <option value="">Sélectionner…</option>
            {services.map(s=><option key={s.id} value={s.id}>{s.name} ({s.sousDirection?.name??'—'})</option>)}
          </Sel>
        </Field>}
        {needsSD&&<>
          <Field label="Sous-direction" hint="Sélectionnez une existante vide OU laissez vide pour en créer une nouvelle">
            <Sel value={cSDId} onChange={e=>setCSDId(e.target.value)}>
              <option value="">— Créer une nouvelle sous-direction —</option>
              {sousDirections.filter(sd=>!sd.directeur||!sd.directeur.active).map(sd=><option key={sd.id} value={sd.id}>{sd.name}</option>)}
            </Sel>
          </Field>
          {!cSDId&&<Field label="Nom de la nouvelle sous-direction">
            <Inp value={cSDName} onChange={e=>setCSDName(e.target.value)} placeholder="Ex: Sous-direction Cybersécurité"/>
          </Field>}
        </>}
        <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:8}}>
          <Btn variant="ghost" onClick={()=>setShowCreate(false)}>Annuler</Btn>
          <Btn onClick={submitCreate} disabled={saving}>{saving?<><Loader2 size={14}/>Création…</>:<><UserPlus size={14}/>Créer</>}</Btn>
        </div>
      </div>
    </Modal>}

    {/* Modal permissions */}
    {showPerms&&<PermissionsModal user={showPerms} categories={categories} currentUser={user} onClose={()=>setShowPerms(null)}/>}
  </div>;
};

// Permissions modal
const PermissionsModal:React.FC<{user:User;categories:Category[];currentUser:User;onClose:()=>void}> = ({user,categories,currentUser,onClose}) => {
  const [perms,setPerms]=useState<PermissionCategory[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    api.getUserPermissions(user.id).then(setPerms).finally(()=>setLoading(false));
  },[user.id]);
  const has=(cid:number)=>perms.some(p=>p.category.id===cid);
  const toggle=async(cat:Category)=>{
    try{
      if(has(cat.id)){await api.revokeCategoryPermission(user.id,cat.id);setPerms(perms.filter(p=>p.category.id!==cat.id));}
      else{const p=await api.grantCategoryPermission(user.id,cat.id);setPerms([...perms,p]);}
    }catch(e:any){alert(e.message);}
  };
  const canEdit=['super_admin','directeur','admin_cirt','directeur_antenne'].includes(currentUser.role);
  return <Modal title={`Catégories — ${user.name}`} subtitle={ROLE_LABELS[user.role]} onClose={onClose}>
    {loading?<div style={{display:'flex',justifyContent:'center',padding:30}}><Loader2 size={20} className="animate-spin" color="#0057a8"/></div>:
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {categories.map(cat=>(
        <div key={cat.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderRadius:8,background:has(cat.id)?'#eff6ff':'#f8fafd',border:`1px solid ${has(cat.id)?'#bfdbfe':'#e8edf5'}`}}>
          <div>
            <p style={{fontWeight:600,fontSize:13,color:'#0d1b2a'}}>{cat.name}</p>
            <SecBadge level={cat.securityLevel??'PUBLIC'}/>
          </div>
          {canEdit&&<button onClick={()=>toggle(cat)} style={{background:has(cat.id)?'#dc2626':'#0057a8',border:'none',borderRadius:6,padding:'6px 12px',cursor:'pointer',color:'white',fontSize:12,fontWeight:600}}>
            {has(cat.id)?'Révoquer':'Accorder'}
          </button>}
        </div>
      ))}
    </div>}
  </Modal>;
};

// ─────────────────────────────────────────────────────────────────────────────
// ANTENNES VIEW
// ─────────────────────────────────────────────────────────────────────────────
const AntennasView:React.FC<{user:User;antennes:Antenne[];categories:Category[];onRefresh:()=>void}> = ({user,antennes,categories,onRefresh}) => {
  const [newName,setNewName]=useState('');const [err,setErr]=useState('');
  const [showCats,setShowCats]=useState<Antenne|null>(null);
  const [antenneCats,setAntenneCats]=useState<Category[]>([]);

  const canCreate=isTopLevel(user.role);
  const canDelete=user.role==='super_admin'||user.role==='directeur';

  const create=async()=>{
    if(!newName.trim()){setErr('Nom requis');return;}
    try{await api.createAntenne(newName);setNewName('');setErr('');onRefresh();}catch(e:any){setErr(e.message);}
  };
  const del=async(id:number)=>{
    if(!confirm('Supprimer cette antenne ?'))return;
    try{await api.deleteAntenne(id);onRefresh();}catch(e:any){alert(e.message);}
  };
  const openCats=async(a:Antenne)=>{
    setShowCats(a);
    api.getAntenneCategories(a.id).then(setAntenneCats);
  };
  const toggleCat=async(cat:Category)=>{
    if(!showCats)return;
    const has=antenneCats.some(c=>c.id===cat.id);
    try{
      if(has){await api.removeAntenneCategory(showCats.id,cat.id);setAntenneCats(antenneCats.filter(c=>c.id!==cat.id));}
      else{await api.addAntenneCategory(showCats.id,cat.id);setAntenneCats([...antenneCats,cat]);}
    }catch(e:any){alert(e.message);}
  };

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    {canCreate&&<div style={{display:'flex',gap:10}}>
      <Inp placeholder="Nom de l'antenne…" value={newName} onChange={e=>setNewName(e.target.value)} style={{flex:1}}/>
      <Btn onClick={create}><Plus size={14}/>Créer</Btn>
    </div>}
    {err&&<Err msg={err}/>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
      {antennes.map(a=>(
        <div key={a.id} style={{background:'white',borderRadius:12,padding:18,boxShadow:'0 1px 4px rgba(0,40,85,0.07)',border:'1px solid #e8edf5'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:32,height:32,borderRadius:8,background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center'}}><MapPin size={15} color="#0057a8"/></div>
              <div>
                <p style={{fontWeight:700,fontSize:14,color:'#0d1b2a'}}>{a.name}</p>
                <p style={{fontSize:11,color:'#94a3b8'}}>ID #{a.id}</p>
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <Btn variant="ghost" small onClick={()=>openCats(a)}><Tag size={11}/>Catégories</Btn>
              {canDelete&&<button onClick={()=>del(a.id)} style={{background:'none',border:'1px solid #fecaca',borderRadius:6,padding:'4px 7px',cursor:'pointer',color:'#dc2626'}}><Trash2 size={13}/></button>}
            </div>
          </div>
        </div>
      ))}
    </div>
    {showCats&&<Modal title={`Catégories — ${showCats.name}`} onClose={()=>setShowCats(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {categories.map(cat=>{const has=antenneCats.some(c=>c.id===cat.id);return(
          <div key={cat.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderRadius:8,background:has?'#eff6ff':'#f8fafd',border:`1px solid ${has?'#bfdbfe':'#e8edf5'}`}}>
            <p style={{fontWeight:600,fontSize:13,color:'#0d1b2a'}}>{cat.name}</p>
            {(isTopLevel(user.role)||user.role==='admin_cirt'||(user.role==='directeur_antenne'&&user.antenne?.id===showCats.id))&&
              <button onClick={()=>toggleCat(cat)} style={{background:has?'#dc2626':'#0057a8',border:'none',borderRadius:6,padding:'5px 12px',cursor:'pointer',color:'white',fontSize:12,fontWeight:600}}>
                {has?'Retirer':'Ajouter'}
              </button>}
          </div>
        );})}
      </div>
    </Modal>}
  </div>;
};

// ─────────────────────────────────────────────────────────────────────────────
// ORGANISATION VIEW
// ─────────────────────────────────────────────────────────────────────────────
const OrganisationView:React.FC<{user:User;sousDirections:SousDirection[];services:ServiceCirt[];onRefresh:()=>void}> = ({user,sousDirections,services,onRefresh}) => {
  const [newSDName,setNewSDName]=useState('');const [newSvcName,setNewSvcName]=useState('');
  const [newSvcDesc,setNewSvcDesc]=useState('');const [newSvcSD,setNewSvcSD]=useState('');
  const [err,setErr]=useState('');

  const canManage=user.role==='super_admin'||user.role==='directeur';

  const createSD=async()=>{
    if(!newSDName.trim())return;
    try{await api.createSousDirection(newSDName);setNewSDName('');onRefresh();}catch(e:any){setErr(e.message);}
  };
  const deleteSD=async(id:number)=>{
    if(!confirm('Supprimer cette sous-direction ?'))return;
    try{await api.deleteSousDirection(id);onRefresh();}catch(e:any){alert(e.message);}
  };
  const createSvc=async()=>{
    if(!newSvcName.trim()||!newSvcSD){setErr('Nom et sous-direction requis');return;}
    try{await api.createService(newSvcName,newSvcDesc,Number(newSvcSD));setNewSvcName('');setNewSvcDesc('');setNewSvcSD('');setErr('');onRefresh();}catch(e:any){setErr(e.message);}
  };
  const deleteSvc=async(id:number)=>{
    if(!confirm('Supprimer ce service ?'))return;
    try{await api.deleteService(id);onRefresh();}catch(e:any){alert(e.message);}
  };

  return <div style={{display:'flex',flexDirection:'column',gap:24}}>
    {err&&<Err msg={err}/>}
    {/* Sous-directions */}
    <div>
      <h3 style={{fontWeight:700,fontSize:14,color:'#003366',marginBottom:12}}>Sous-directions</h3>
      {canManage&&<div style={{display:'flex',gap:10,marginBottom:14}}>
        <Inp placeholder="Nom de la sous-direction…" value={newSDName} onChange={e=>setNewSDName(e.target.value)} style={{flex:1}}/>
        <Btn onClick={createSD}><Plus size={14}/>Créer</Btn>
      </div>}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {sousDirections.map(sd=>(
          <div key={sd.id} style={{background:'white',borderRadius:10,padding:'14px 18px',boxShadow:'0 1px 3px rgba(0,40,85,0.06)',border:'1px solid #e8edf5'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{fontWeight:700,fontSize:14,color:'#0d1b2a'}}>{sd.name}</p>
                {sd.directeur&&<p style={{fontSize:11,color:'#5a6a7e',marginTop:2}}>Directeur : <strong>{sd.directeur.name}</strong> {!sd.directeur.active&&<span style={{color:'#dc2626'}}>(inactif)</span>}</p>}
                {!sd.directeur&&<p style={{fontSize:11,color:'#dc2626',marginTop:2}}>Aucun directeur assigné</p>}
                <p style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{services.filter(s=>s.sousDirection?.id===sd.id).length} service(s)</p>
              </div>
              {canManage&&<button onClick={()=>deleteSD(sd.id)} style={{background:'none',border:'1px solid #fecaca',borderRadius:6,padding:'5px 8px',cursor:'pointer',color:'#dc2626'}}><Trash2 size={13}/></button>}
            </div>
            {/* Services de cette SD */}
            <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #f0f4f8',display:'flex',flexWrap:'wrap',gap:6}}>
              {services.filter(s=>s.sousDirection?.id===sd.id).map(s=>(
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:6,background:'#f0f4f8',borderRadius:6,padding:'4px 10px'}}>
                  <span style={{fontSize:12,color:'#374151'}}>{s.name}</span>
                  {(canManage||user.role==='admin_cirt')&&<button onClick={()=>deleteSvc(s.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',display:'flex'}}><X size={11}/></button>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    {/* Créer un service */}
    {(canManage||user.role==='admin_cirt')&&<div>
      <h3 style={{fontWeight:700,fontSize:14,color:'#003366',marginBottom:12}}>Ajouter un service</h3>
      <div style={{display:'flex',flexDirection:'column',gap:10,background:'white',borderRadius:10,padding:16,boxShadow:'0 1px 3px rgba(0,40,85,0.06)'}}>
        <Field label="Sous-direction" required>
          <Sel value={newSvcSD} onChange={e=>setNewSvcSD(e.target.value)}>
            <option value="">Sélectionner…</option>
            {sousDirections.map(sd=><option key={sd.id} value={sd.id}>{sd.name}</option>)}
          </Sel>
        </Field>
        <Field label="Nom du service" required><Inp value={newSvcName} onChange={e=>setNewSvcName(e.target.value)}/></Field>
        <Field label="Description"><Inp value={newSvcDesc} onChange={e=>setNewSvcDesc(e.target.value)}/></Field>
        <Btn onClick={createSvc}><Plus size={14}/>Créer le service</Btn>
      </div>
    </div>}
  </div>;
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES VIEW
// ─────────────────────────────────────────────────────────────────────────────
const CategoriesView:React.FC<{user:User;categories:Category[];antennes:Antenne[];onRefresh:()=>void}> = ({user,categories,antennes,onRefresh}) => {
  const [newName,setNewName]=useState('');const [err,setErr]=useState('');
  const [showSec,setShowSec]=useState<Category|null>(null);
  const [newSec,setNewSec]=useState<SecurityLevel>('PUBLIC');

  const canCreate=isTopLevel(user.role);
  const canDelete=user.role==='super_admin'||user.role==='directeur';

  const create=async()=>{
    if(!newName.trim()){setErr('Nom requis');return;}
    try{await api.createCategory(newName);setNewName('');setErr('');onRefresh();}catch(e:any){setErr(e.message);}
  };
  const del=async(id:number)=>{
    if(!confirm('Supprimer cette catégorie ?'))return;
    try{await api.deleteCategory(id);onRefresh();}catch(e:any){alert(e.message);}
  };
  const setSec=async()=>{
    if(!showSec)return;
    try{await api.setCategorySecurity(showSec.id,newSec);setShowSec(null);onRefresh();}catch(e:any){alert(e.message);}
  };

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    {canCreate&&<div style={{display:'flex',gap:10}}>
      <Inp placeholder="Nouvelle catégorie…" value={newName} onChange={e=>setNewName(e.target.value)} style={{flex:1}}/>
      <Btn onClick={create}><Plus size={14}/>Créer</Btn>
    </div>}
    {err&&<Err msg={err}/>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
      {categories.map((c,i)=>{const Icon=CAT_ICONS[c.name]??FileText;const color=CAT_COLORS[i%CAT_COLORS.length];return(
        <div key={c.id} style={{background:'white',borderRadius:12,padding:18,boxShadow:'0 1px 4px rgba(0,40,85,0.07)',border:`1px solid ${color}20`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:9,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={17} color={color}/></div>
              <div>
                <p style={{fontWeight:700,fontSize:13,color:'#0d1b2a'}}>{c.name}</p>
                <SecBadge level={c.securityLevel??'PUBLIC'}/>
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              {canSetSecurity(user.role)&&<button onClick={()=>{setShowSec(c);setNewSec(c.securityLevel??'PUBLIC');}} style={{background:'none',border:'1px solid #e8edf5',borderRadius:6,padding:'4px 7px',cursor:'pointer',color:'#0057a8'}}><Lock size={12}/></button>}
              {canDelete&&<button onClick={()=>del(c.id)} style={{background:'none',border:'1px solid #fecaca',borderRadius:6,padding:'4px 7px',cursor:'pointer',color:'#dc2626'}}><Trash2 size={13}/></button>}
            </div>
          </div>
          {c.securitySetBy&&<p style={{fontSize:10,color:'#94a3b8'}}>Sécurité configurée par {c.securitySetBy.name}</p>}
        </div>
      );})}
    </div>
    {showSec&&<Modal title={`Sécurité — ${showSec.name}`} onClose={()=>setShowSec(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <p style={{fontSize:13,color:'#5a6a7e'}}>Configurez le niveau de sécurité par défaut pour les dossiers de cette catégorie.</p>
        <Field label="Niveau de sécurité">
          <Sel value={newSec} onChange={e=>setNewSec(e.target.value as SecurityLevel)}>
            {Object.entries(SECURITY_LEVEL_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </Sel>
        </Field>
        <div style={{background:'#f8fafd',borderRadius:8,padding:12,fontSize:12,color:'#374151'}}>
          <strong>Rappel :</strong> Un supérieur hiérarchique peut toujours modifier ce paramètre. Un subordonné ne peut pas écraser la configuration d'un supérieur.
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
          <Btn variant="ghost" onClick={()=>setShowSec(null)}>Annuler</Btn>
          <Btn onClick={setSec}><Save size={13}/>Appliquer</Btn>
        </div>
      </div>
    </Modal>}
  </div>;
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGS VIEW
// ─────────────────────────────────────────────────────────────────────────────
const ACTION_LABELS: Record<string,string> = {
  LOGIN:'Connexion',USER_CREATED:'Utilisateur créé',USER_DELETED:'Utilisateur supprimé',
  USER_ACTIVATED:'Compte activé',USER_DEACTIVATED:'Compte désactivé',USER_ROLE_CHANGED:'Rôle modifié',
  USER_PROFILE_UPDATED:'Profil modifié',USER_PASSWORD_CHANGED:'Mot de passe changé',
  USER_ANTENNE_CHANGED:'Antenne modifiée',USER_SERVICE_CHANGED:'Service modifié',
  SOUS_DIRECTION_CREATED:'Sous-direction créée',SOUS_DIRECTION_UPDATED:'Sous-direction modifiée',
  SOUS_DIRECTION_DELETED:'Sous-direction supprimée',SERVICE_CREATED:'Service créé',SERVICE_DELETED:'Service supprimé',
  ANTENNE_CREATED:'Antenne créée',ANTENNE_DELETED:'Antenne supprimée',ANTENNE_CATEGORIES_UPDATED:'Catégories antenne modifiées',
  CATEGORY_CREATED:'Catégorie créée',CATEGORY_DELETED:'Catégorie supprimée',
  PERMISSION_GRANTED:'Permission accordée',PERMISSION_REVOKED:'Permission révoquée',SECURITY_LEVEL_CHANGED:'Sécurité modifiée',
  DOSSIER_CREATED:'Dossier créé',DOSSIER_OPENED:'Dossier ouvert',DOSSIER_VALIDATED:'Dossier validé',
  DOSSIER_ARCHIVED:'Dossier archivé',DOSSIER_DELETED:'Dossier supprimé',
  DOSSIER_STAMPED:'Tampon apposé',DOSSIER_SEALED:'Sceau apposé',
  DOSSIER_SYNC_REQUESTED:'Sync demandée',DOSSIER_SYNC_APPROVED:'Sync approuvée',DOSSIER_SYNC_REJECTED:'Sync rejetée',
  DOCUMENT_UPLOADED:'Document uploadé',DOCUMENT_DELETED:'Document supprimé',
};
const ACTION_COLORS:Record<string,string> = {
  LOGIN:'#16a34a',USER_CREATED:'#0057a8',USER_DELETED:'#dc2626',USER_ACTIVATED:'#16a34a',USER_DEACTIVATED:'#f97316',
  USER_ROLE_CHANGED:'#7c3aed',USER_PROFILE_UPDATED:'#0891b2',USER_PASSWORD_CHANGED:'#d97706',
  DOSSIER_CREATED:'#0057a8',DOSSIER_VALIDATED:'#16a34a',DOSSIER_ARCHIVED:'#3b82f6',DOSSIER_DELETED:'#dc2626',
  DOSSIER_STAMPED:'#d97706',DOSSIER_SEALED:'#7c3aed',DOSSIER_SYNC_APPROVED:'#16a34a',DOSSIER_SYNC_REJECTED:'#dc2626',
  PERMISSION_GRANTED:'#16a34a',PERMISSION_REVOKED:'#dc2626',SECURITY_LEVEL_CHANGED:'#dc2626',
};

const LogsView:React.FC<{user:User}> = ({user}) => {
  const [logs,setLogs]=useState<ActivityLog[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');

  useEffect(()=>{
    const fn=canViewLogs(user.role)?api.getLogs:api.getMyLogs;
    fn().then(setLogs).finally(()=>setLoading(false));
  },[user.role]);

  const filtered=!search?logs:logs.filter(l=>
    l.description?.toLowerCase().includes(search.toLowerCase())||
    l.action?.toLowerCase().includes(search.toLowerCase())||
    l.actor?.name?.toLowerCase().includes(search.toLowerCase())||
    l.targetLabel?.toLowerCase().includes(search.toLowerCase())
  );

  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <div style={{display:'flex',gap:10,alignItems:'center'}}>
      <div style={{position:'relative',flex:1}}>
        <Search size={14} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
        <Inp placeholder="Rechercher dans les logs…" value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:33}}/>
      </div>
      <Btn variant="ghost" small onClick={()=>{setLoading(true);const fn=canViewLogs(user.role)?api.getLogs:api.getMyLogs;fn().then(setLogs).finally(()=>setLoading(false));}}><RefreshCw size={13}/>Actualiser</Btn>
    </div>
    {loading?<div style={{display:'flex',justifyContent:'center',padding:40}}><Loader2 size={24} className="animate-spin" color="#0057a8"/></div>:
    <div style={{background:'white',borderRadius:12,boxShadow:'0 1px 4px rgba(0,40,85,0.07)',overflow:'hidden'}}>
      <div style={{padding:'10px 16px',background:'#f8fafd',borderBottom:'1px solid #e8edf5',fontSize:11,color:'#5a6a7e',fontWeight:600}}>
        {filtered.length} entrée(s)
      </div>
      {filtered.length===0&&<div style={{padding:'40px 20px',textAlign:'center',color:'#94a3b8',fontSize:13}}>Aucune activité</div>}
      {filtered.map(l=>{
        const color=ACTION_COLORS[l.action]??'#5a6a7e';
        return <div key={l.id} style={{display:'flex',gap:14,padding:'12px 16px',borderBottom:'1px solid #f0f4f8',alignItems:'flex-start'}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0,marginTop:5}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <span style={{fontSize:12,fontWeight:700,color}}>{ACTION_LABELS[l.action]??l.action}</span>
              {l.actor&&<span style={{fontSize:11,color:'#5a6a7e'}}>par <strong>{l.actor.name}</strong></span>}
              {l.targetLabel&&<span style={{fontSize:11,color:'#94a3b8'}}>· {l.targetLabel}</span>}
            </div>
            {l.description&&<p style={{fontSize:11,color:'#5a6a7e',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.description}</p>}
          </div>
          <span style={{fontSize:10,color:'#94a3b8',flexShrink:0}}>{new Date(l.createdAt).toLocaleString('fr-FR')}</span>
        </div>;
      })}
    </div>}
  </div>;
};

// ─────────────────────────────────────────────────────────────────────────────
// STATS VIEW
// ─────────────────────────────────────────────────────────────────────────────
const StatsView:React.FC<{user:User}> = ({user}) => {
  const [global,setGlobal]=useState<StatGlobale[]>([]);
  const [byAntenne,setByAntenne]=useState<StatAntenne[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    Promise.all([api.getGlobalStats(),api.getStatsByAntenne()]).then(([g,a])=>{setGlobal(g);setByAntenne(a);}).finally(()=>setLoading(false));
  },[]);
  if(loading)return <div style={{display:'flex',justifyContent:'center',padding:40}}><Loader2 size={24} className="animate-spin" color="#0057a8"/></div>;
  return <div style={{display:'flex',flexDirection:'column',gap:24}}>
    <div>
      <h3 style={{fontWeight:700,fontSize:14,color:'#003366',marginBottom:12}}>Par catégorie</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:10}}>
        {global.map((g,i)=>{const c=CAT_COLORS[i%CAT_COLORS.length];const Icon=CAT_ICONS[g.categoryName]??FileText;return(
          <div key={g.categoryId} style={{background:'white',borderRadius:10,padding:'14px 16px',boxShadow:'0 1px 3px rgba(0,40,85,0.06)',border:`1px solid ${c}20`}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <div style={{width:28,height:28,borderRadius:7,background:`${c}15`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={14} color={c}/></div>
              <p style={{fontWeight:700,fontSize:12,color:'#0d1b2a'}}>{g.categoryName}</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4}}>
              {[['Total',g.total,'#0057a8'],['En cours',g.enCours,'#f97316'],['Validés',g.valides,'#22c55e'],['Archivés',g.archives,'#3b82f6']].map(([l,v,col])=>(
                <div key={String(l)} style={{textAlign:'center'}}>
                  <p style={{fontSize:16,fontWeight:700,color:col as string,fontFamily:'Syne,sans-serif'}}>{v}</p>
                  <p style={{fontSize:9,color:'#94a3b8',textTransform:'uppercase'}}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        );})}
      </div>
    </div>
    <div>
      <h3 style={{fontWeight:700,fontSize:14,color:'#003366',marginBottom:12}}>Par antenne</h3>
      <div style={{background:'white',borderRadius:10,boxShadow:'0 1px 3px rgba(0,40,85,0.06)',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 80px 80px 80px 80px',padding:'10px 16px',background:'#f8fafd',fontSize:10,fontWeight:700,color:'#5a6a7e',textTransform:'uppercase',letterSpacing:'0.08em'}}>
          <span>Antenne</span><span>Total</span><span>En cours</span><span>Validés</span><span>Archivés</span>
        </div>
        {byAntenne.map(a=>(
          <div key={a.antenneId} style={{display:'grid',gridTemplateColumns:'1fr 80px 80px 80px 80px',padding:'11px 16px',borderTop:'1px solid #f0f4f8',fontSize:13,alignItems:'center'}}>
            <span style={{fontWeight:600,color:'#0d1b2a'}}>{a.antenneName}</span>
            <span style={{fontWeight:700,color:'#0057a8'}}>{a.total}</span>
            <span style={{color:'#f97316'}}>{a.enCours}</span>
            <span style={{color:'#22c55e'}}>{a.valides}</span>
            <span style={{color:'#3b82f6'}}>{a.archives}</span>
          </div>
        ))}
      </div>
    </div>
  </div>;
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
interface Props { user:User; onLogout:()=>void; onUserUpdate:(u:User)=>void; }

export const Dashboard:React.FC<Props> = ({user,onLogout,onUserUpdate}) => {
  const [activeTab,setActiveTab]=useState<Tab>(canViewStats(user.role)?'dashboard':'dossiers');
  const [dossiers,setDossiers]=useState<Dossier[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [antennes,setAntennes]=useState<Antenne[]>([]);
  const [users,setUsers]=useState<User[]>([]);
  const [services,setServices]=useState<ServiceCirt[]>([]);
  const [sousDirections,setSousDirections]=useState<SousDirection[]>([]);
  const [myPermissions,setMyPermissions]=useState<PermissionCategory[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [showProfile,setShowProfile]=useState(false);

  const TAB_TITLES:Record<Tab,string> = {
    dashboard:'Tableau de bord',dossiers:'Dossiers',sync:'Demandes de synchronisation',
    stats:'Statistiques',users:'Utilisateurs',antennes:'Antennes',
    organisation:'Organisation CIRT',categories:'Catégories',logs:'Journal d\'activité',
  };

  const loadData=useCallback(async()=>{
    try{
      const [dos,cats,ants]=await Promise.all([api.getDossiers(),api.getCategories(),api.getAntennes()]);
      setDossiers(dos);setCategories(cats);setAntennes(ants);
      if(canCreateUsers(user.role)){
        const [usrs,svcs,sds]=await Promise.all([api.getUsers(),api.getServices(),api.getSousDirections()]);
        setUsers(usrs);setServices(svcs);setSousDirections(sds);
      }
      const perms=await api.getUserPermissions(user.id).catch(()=>[]);
      setMyPermissions(perms);
    }catch(e:any){setError(e.message);}finally{setLoading(false);}
  },[user.id,user.role]);

  useEffect(()=>{loadData();},[loadData]);

  if(loading)return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f7fa'}}>
      <div style={{textAlign:'center'}}>
        <Loader2 size={32} color="#0057a8" className="animate-spin"/>
        <p style={{marginTop:12,color:'#5a6a7e',fontSize:14}}>Chargement…</p>
      </div>
    </div>
  );
  if(error)return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f7fa'}}>
      <div style={{textAlign:'center'}}>
        <AlertCircle size={32} color="#dc2626"/>
        <p style={{marginTop:12,color:'#dc2626',fontSize:14}}>{error}</p>
        <Btn onClick={loadData} variant="ghost" style={{marginTop:12}}>Réessayer</Btn>
      </div>
    </div>
  );

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#f5f7fa',fontFamily:'Outfit,sans-serif'}}>
      <Sidebar user={user} active={activeTab} onChange={setActiveTab} onLogout={onLogout} onProfile={()=>setShowProfile(true)}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
        {/* Header */}
        <div style={{padding:'20px 28px 16px',borderBottom:'1px solid #e8edf5',background:'white',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h1 style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:17,color:'#003366'}}>{TAB_TITLES[activeTab]}</h1>
            <p style={{fontSize:11,color:'#94a3b8',marginTop:2}}>
              {user.antenne?.name??user.service?.name??ROLE_LABELS[user.role]}
            </p>
          </div>
          <Btn variant="ghost" small onClick={loadData}><RefreshCw size={13}/>Actualiser</Btn>
        </div>
        {/* Contenu */}
        <div style={{flex:1,padding:'24px 28px',overflowY:'auto'}}>
          {activeTab==='dashboard'&&canViewStats(user.role)&&<DashboardView user={user} dossiers={dossiers} categories={categories} myPermissions={myPermissions}/>}
          {activeTab==='dossiers'&&<DossiersView user={user} dossiers={dossiers} categories={categories} myPermissions={myPermissions} antennes={antennes} onRefresh={loadData}/>}
          {activeTab==='sync'&&<SyncView user={user} onRefresh={loadData}/>}
          {activeTab==='stats'&&canViewStats(user.role)&&<StatsView user={user}/>}
          {activeTab==='users'&&canCreateUsers(user.role)&&<UsersView user={user} users={users} antennes={antennes} services={services} sousDirections={sousDirections} categories={categories} onRefresh={loadData}/>}
          {activeTab==='antennes'&&(canManageAntennes(user.role)||user.role==='directeur_antenne')&&<AntennasView user={user} antennes={antennes} categories={categories} onRefresh={loadData}/>}
          {activeTab==='organisation'&&['super_admin','directeur','admin_cirt'].includes(user.role)&&<OrganisationView user={user} sousDirections={sousDirections} services={services} onRefresh={loadData}/>}
          {activeTab==='categories'&&(canManageCategories(user.role)||['admin_cirt','directeur_antenne','chef_service'].includes(user.role))&&<CategoriesView user={user} categories={categories} antennes={antennes} onRefresh={loadData}/>}
          {activeTab==='logs'&&<LogsView user={user}/>}
        </div>
      </div>
      {showProfile&&<ProfileModal user={user} onClose={()=>setShowProfile(false)} onUpdate={u=>{onUserUpdate(u);setShowProfile(false);}}/>}
    </div>
  );
};
