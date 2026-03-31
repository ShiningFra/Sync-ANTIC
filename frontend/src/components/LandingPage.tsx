import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import type { User } from '../types';
import { login } from '../api';

interface Props { onLogin: (user: User) => void; }

export const LandingPage: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err?.message ?? 'Identifiants incorrects');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* ── Panneau gauche ── */}
      <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden"
           style={{ background: 'linear-gradient(160deg, #001a3d 0%, #003366 45%, #0057a8 100%)' }}>

        {/* Motif circuit */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 40 30 M 40 30 L 60 30 M 60 30 L 60 60 M 40 30 L 20 30 M 20 30 L 20 60 M 0 40 L 30 40 M 30 40 L 30 20 M 50 40 L 80 40" fill="none" stroke="white" strokeWidth="1"/>
              <circle cx="40" cy="30" r="3" fill="white"/>
              <circle cx="20" cy="30" r="2" fill="white"/>
              <circle cx="60" cy="30" r="2" fill="white"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)"/>
        </svg>

        {/* Orbe lumineux */}
        <div className="absolute" style={{
          top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(77,184,255,0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}/>
        <div className="absolute" style={{
          bottom: '10%', right: '5%', width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240,165,0,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}/>

        {/* Contenu gauche */}
        <div className="relative z-10 flex flex-col h-full p-14">

          {/* Logo ANTIC */}
          <div className="flex items-center gap-4 mb-auto">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
              <Shield size={28} color="white" />
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em' }}>SYNC ANTIC</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Plateforme Collaborative</p>
            </div>
          </div>

          {/* Titre principal */}
          <div className="my-auto space-y-6">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(240,165,0,0.15)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 99, padding: '4px 14px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f0a500', display: 'inline-block' }}/>
              <span style={{ color: '#f0a500', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>CIRT — ANTIC Cameroun</span>
            </div>

            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 48, fontWeight: 800, color: 'white', lineHeight: 1.1 }}>
              Cybersécurité<br/>
              <span style={{ color: '#4db8ff' }}>Collaborative</span><br/>
              & Supervisée
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 1.7, maxWidth: 380 }}>
              
            </p>

            {/* Features */}
            <div className="space-y-3 pt-2">
              {[
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={16} color="#4db8ff" className="flex-shrink-0" />
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer gauche */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              Agence Nationale des Technologies de l'Information et de la Communication<br/>
              <strong style={{ color: 'rgba(255,255,255,0.6)' }}>République du Cameroun · Paix – Travail – Patrie</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex flex-col" style={{ background: '#f4f7fb' }}>

        {/* Barre top mobile */}
        <div className="lg:hidden flex items-center gap-3 px-6 py-4" style={{ background: '#003366' }}>
          <Shield size={20} color="white" />
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>SYNC ANTIC</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md anim-fadeup">

            {/* En-tête formulaire */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-5">
                <div style={{ width: 36, height: 4, background: 'var(--antic-gold)', borderRadius: 2 }}/>
                <span style={{ color: 'var(--antic-muted)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Accès sécurisé</span>
              </div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--antic-navy)', marginBottom: 8 }}>
                Connexion
              </h2>
              <p style={{ color: 'var(--antic-muted)', fontSize: 15 }}>
                Accédez à votre espace de travail CIRT-ANTIC.
              </p>
            </div>

            {/* Alerte erreur */}
            {error && (
              <div className="flex items-start gap-3 mb-6 p-4 rounded-xl anim-fadein"
                   style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }}/>
                <span style={{ color: '#991b1b', fontSize: 13, fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--antic-navy)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Adresse e-mail
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}/>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="utilisateur@antic.cm" required autoComplete="email"
                    style={{
                      width: '100%', paddingLeft: 40, paddingRight: 14, paddingTop: 12, paddingBottom: 12,
                      background: 'white', border: '1.5px solid #dde3ed', borderRadius: 10,
                      fontSize: 14, color: 'var(--antic-text)', outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--antic-blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,87,168,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#dde3ed'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--antic-navy)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}/>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required autoComplete="current-password"
                    style={{
                      width: '100%', paddingLeft: 40, paddingRight: 14, paddingTop: 12, paddingBottom: 12,
                      background: 'white', border: '1.5px solid #dde3ed', borderRadius: 10,
                      fontSize: 14, color: 'var(--antic-text)', outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--antic-blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,87,168,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#dde3ed'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
                  background: loading ? '#7aade0' : 'var(--antic-blue)',
                  color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(0,87,168,0.35)',
                  transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s',
                  letterSpacing: '0.03em',
                }}
                onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#004a9a'; }}
                onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = 'var(--antic-blue)'; }}
              >
                {loading
                  ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }}/> Connexion en cours…</>
                  : <><span>Se connecter</span><ArrowRight size={17}/></>
                }
              </button>
            </form>

            {/* Séparateur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}/>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--antic-gold)' }}/>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}/>
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
              Accès réservé au personnel autorisé de l'ANTIC.<br/>
              En cas de problème, contactez votre administrateur système.
            </p>
          </div>
        </div>

        {/* Footer droit */}
        <div style={{ padding: '16px 32px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>© 2026 ANTIC Cameroun</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>v2.0 — CIRT Platform</span>
        </div>
      </div>
    </div>
  );
};
