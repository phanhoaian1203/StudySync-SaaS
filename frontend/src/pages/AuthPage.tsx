import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────
   Inline styles — no Tailwind dependency for the critical outer
   layout so nothing can be purged or misconfigured.
───────────────────────────────────────────────────────────────── */

const S = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    overflow: 'hidden',
    background: '#0a0f1e',
  } as React.CSSProperties,

  // ── LEFT PANEL ──────────────────────────────
  leftPanel: {
    flex: '1 1 0',
    minWidth: 0,
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 56px',
    overflow: 'hidden',
  },

  bgImage: {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(0.35) saturate(1.3)',
    zIndex: 0,
  },

  leftOverlay: {
    position: 'absolute' as const,
    inset: 0,
    background: 'linear-gradient(135deg, rgba(99,102,241,0.55) 0%, rgba(168,85,247,0.40) 50%, rgba(59,130,246,0.35) 100%)',
    zIndex: 1,
  },

  leftContent: {
    position: 'relative' as const,
    zIndex: 2,
    maxWidth: '440px',
    width: '100%',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '64px',
  },

  brandIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandText: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.5px',
  },

  tagline: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'rgba(199,210,254,0.8)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    marginBottom: '20px',
  },

  heroHeading: {
    fontSize: 'clamp(32px, 3.5vw, 48px)',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.15,
    letterSpacing: '-1px',
    marginBottom: '20px',
  },

  heroSub: {
    fontSize: '16px',
    color: 'rgba(224,231,255,0.75)',
    lineHeight: 1.7,
    marginBottom: '48px',
  },

  statRow: {
    display: 'flex',
    gap: '32px',
  },

  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },

  statNum: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#fff',
  },

  statLabel: {
    fontSize: '12px',
    color: 'rgba(199,210,254,0.7)',
    fontWeight: 500,
  },

  // ── RIGHT PANEL (form) ──────────────────────────────
  rightPanel: {
    width: '480px',
    minWidth: '380px',
    maxWidth: '520px',
    flexShrink: 0,
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(40px)',
    borderLeft: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: '48px 44px',
    position: 'relative' as const,
    overflow: 'hidden',
  },

  rightGlow: {
    position: 'absolute' as const,
    top: '-120px',
    right: '-120px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },

  rightGlow2: {
    position: 'absolute' as const,
    bottom: '-100px',
    left: '-100px',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },

  // ── TABS ──────────────────────────────
  tabs: {
    display: 'flex',
    gap: '4px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '14px',
    padding: '4px',
    marginBottom: '36px',
  },

  tab: (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 0',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 700,
    transition: 'all 0.25s ease',
    background: active
      ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
      : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
    boxShadow: active ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
  }),

  // ── FORM HEADING ──────────────────────────────
  formHeading: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#f1f5f9',
    marginBottom: '6px',
    letterSpacing: '-0.5px',
  },

  formSub: {
    fontSize: '14px',
    color: 'rgba(148,163,184,0.9)',
    marginBottom: '32px',
    lineHeight: 1.5,
  },

  // ── INPUT FIELD ──────────────────────────────
  inputWrapper: {
    position: 'relative' as const,
    marginBottom: '18px',
  },

  inputLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(148,163,184,0.9)',
    marginBottom: '8px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },

  inputBox: {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1.5px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '14px 16px',
    color: '#f1f5f9',
    fontSize: '15px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
  },

  inputIcon: {
    position: 'absolute' as const,
    right: '14px',
    bottom: '14px',
    color: 'rgba(148,163,184,0.6)',
    cursor: 'pointer',
    display: 'flex',
    background: 'none',
    border: 'none',
    padding: 0,
    lineHeight: 1,
  },

  // ── ERROR ──────────────────────────────
  errorBox: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#fca5a5',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  // ── FORGOT ──────────────────────────────
  forgotRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '-8px',
    marginBottom: '28px',
  },

  forgotLink: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'rgba(129,140,248,0.9)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'none',
  },

  // ── DIVIDER ──────────────────────────────
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '28px 0',
  },

  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
  },

  dividerText: {
    fontSize: '12px',
    color: 'rgba(148,163,184,0.6)',
    fontWeight: 600,
    letterSpacing: '0.08em',
  },

  // ── GOOGLE BTN ──────────────────────────────
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '13px 20px',
    color: '#e2e8f0',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    marginBottom: '16px',
    boxSizing: 'border-box' as const,
  },

  // ── SUBMIT BTN ──────────────────────────────
  submitBtn: (disabled: boolean): React.CSSProperties => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: disabled
      ? 'rgba(99,102,241,0.4)'
      : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '15px 20px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.25s ease',
    fontFamily: 'inherit',
    letterSpacing: '-0.2px',
    boxShadow: disabled ? 'none' : '0 8px 32px rgba(99,102,241,0.45)',
    boxSizing: 'border-box' as const,
    opacity: disabled ? 0.6 : 1,
  }),

  // ── FOOTER ──────────────────────────────
  footer: {
    textAlign: 'center' as const,
    marginTop: '32px',
    fontSize: '12px',
    color: 'rgba(100,116,139,0.7)',
    lineHeight: 1.6,
  },
};

/* ─────────────────────────────────────────────────────────────────
   Floating particle component (decorative)
───────────────────────────────────────────────────────────────── */
const Particle = ({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) => (
  <motion.div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'rgba(129,140,248,0.25)',
      pointerEvents: 'none',
      zIndex: 1,
    }}
    animate={{ y: ['0%', '-30px', '0%'], opacity: [0.3, 0.8, 0.3] }}
    transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

/* ─────────────────────────────────────────────────────────────────
   Input field with focus state
───────────────────────────────────────────────────────────────── */
interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  endAdornment?: React.ReactNode;
}

const InputField = ({ label, type, placeholder, value, onChange, required, endAdornment }: InputFieldProps) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={S.inputWrapper}>
      <label style={S.inputLabel}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...S.inputBox,
            borderColor: focused ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.1)',
            background: focused ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.07)',
            boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
            paddingRight: endAdornment ? '46px' : '16px',
          }}
        />
        {endAdornment && (
          <span style={S.inputIcon}>{endAdornment}</span>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────── */
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const navigate = useNavigate();

  const switchTab = (login: boolean) => {
    setIsLogin(login);
    setError('');
    setEmail('');
    setPassword('');
    setFullName('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        const res = await authService.login({ email, password });
        localStorage.setItem('studySync_token', res.token);
        localStorage.setItem('studySync_user', JSON.stringify(res));
        navigate('/dashboard');
      } else {
        await authService.register({ email, password, fullName });
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── mobile: stack vertically if viewport < 768px ──
  const mobileStyles = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      {/* Material Symbols */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        rel="stylesheet"
      />

      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(100,116,139,0.6); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #1e1b4b inset !important;
          -webkit-text-fill-color: #f1f5f9 !important;
        }
        .google-btn:hover {
          background: rgba(255,255,255,0.1) !important;
          border-color: rgba(255,255,255,0.2) !important;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 40px rgba(99,102,241,0.55) !important;
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .forgot-link:hover { color: #a5b4fc !important; }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-gradient {
          background: linear-gradient(270deg, #6366f1, #a855f7, #3b82f6, #6366f1);
          background-size: 300% 300%;
          animation: gradientShift 8s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @media (max-width: 768px) {
          .auth-page-wrapper {
            flex-direction: column !important;
          }
          .left-panel {
            min-height: 220px !important;
            padding: 32px 24px !important;
            flex: none !important;
          }
          .right-panel {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            padding: 36px 24px !important;
            flex: 1 !important;
          }
          .stat-row { display: none !important; }
          .hero-heading { font-size: 26px !important; }
          .hero-sub { display: none !important; }
        }
      `}</style>

      <div style={S.page} className="auth-page-wrapper">

        {/* ── LEFT PANEL ─────────────────────────────────────────── */}
        <div style={S.leftPanel} className="left-panel">
          <div style={S.bgImage} />
          <div style={S.leftOverlay} />

          {/* Decorative floating particles */}
          <Particle delay={0}   x="15%" y="20%" size={8} />
          <Particle delay={1.2} x="70%" y="15%" size={5} />
          <Particle delay={2.4} x="85%" y="60%" size={7} />
          <Particle delay={0.8} x="25%" y="75%" size={6} />
          <Particle delay={1.8} x="60%" y="80%" size={4} />

          <div style={S.leftContent}>
            {/* Brand */}
            <motion.div
              style={S.brand}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div style={S.brandIcon}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: '#fff', fontSize: '22px', fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
              </div>
              <span style={S.brandText}>StudySync</span>
            </motion.div>

            {/* Tagline */}
            <motion.p
              style={S.tagline}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              ✦ The smart study platform
            </motion.p>

            {/* Hero heading */}
            <motion.h1
              style={S.heroHeading}
              className="hero-heading animated-gradient"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              Master your<br />
              learning journey
            </motion.h1>

            {/* Sub text */}
            <motion.p
              style={S.heroSub}
              className="hero-sub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
            >
              AI-powered study tools, smart flashcards, and
              collaborative sessions — all in one place.
            </motion.p>

            {/* Stats */}
            <motion.div
              style={S.statRow}
              className="stat-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
            >
              {[
                { num: '50K+', label: 'Active learners' },
                { num: '200+', label: 'Study courses' },
                { num: '4.9★', label: 'User rating' },
              ].map((s) => (
                <div key={s.label} style={S.statItem}>
                  <span style={S.statNum}>{s.num}</span>
                  <span style={S.statLabel}>{s.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT PANEL (Form) ──────────────────────────────────── */}
        <motion.div
          style={S.rightPanel}
          className="right-panel"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          {/* Glow decorations */}
          <div style={S.rightGlow} />
          <div style={S.rightGlow2} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Tabs */}
            <div style={S.tabs}>
              <button
                type="button"
                style={S.tab(isLogin)}
                onClick={() => switchTab(true)}
              >
                Log In
              </button>
              <button
                type="button"
                style={S.tab(!isLogin)}
                onClick={() => switchTab(false)}
              >
                Sign Up
              </button>
            </div>

            {/* Heading */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login-head' : 'signup-head'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <h2 style={S.formHeading}>
                  {isLogin ? 'Welcome back 👋' : 'Create your account'}
                </h2>
                <p style={S.formSub}>
                  {isLogin
                    ? 'Sign in to continue your learning journey.'
                    : 'Join 50,000+ learners. Free to get started.'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  style={S.errorBox}
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: '20px' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>
                    error
                  </span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google button */}
            <button
              type="button"
              className="google-btn"
              style={S.googleBtn}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={S.divider}>
              <div style={S.dividerLine} />
              <span style={S.dividerText}>or</span>
              <div style={S.dividerLine} />
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} noValidate>
              {/* Full name – only on signup */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    key="fullname-field"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <InputField
                      label="Full Name"
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={setFullName}
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <InputField
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                required
              />

              <InputField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isLogin ? 'Your password' : 'Min. 8 characters'}
                value={password}
                onChange={setPassword}
                required
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(148,163,184,0.7)', display: 'flex' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                }
              />

              {/* Forgot password */}
              {isLogin && (
                <div style={S.forgotRow}>
                  <a href="#" style={S.forgotLink} className="forgot-link">
                    Forgot password?
                  </a>
                </div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="submit-btn"
                style={{ ...S.submitBtn(isLoading), marginTop: isLogin ? '0' : '8px' }}
                whileTap={isLoading ? {} : { scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}
                    >
                      progress_activity
                    </span>
                    Processing…
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      arrow_forward
                    </span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div style={S.footer}>
              <p>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => switchTab(!isLogin)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(129,140,248,0.9)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 'inherit',
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  {isLogin ? 'Sign up free' : 'Log in'}
                </button>
              </p>
              <p style={{ marginTop: '16px' }}>
                By continuing you agree to StudySync's{' '}
                <a href="#" style={{ color: 'rgba(129,140,248,0.7)', textDecoration: 'none' }}>Terms</a>
                {' & '}
                <a href="#" style={{ color: 'rgba(129,140,248,0.7)', textDecoration: 'none' }}>Privacy Policy</a>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default AuthPage;