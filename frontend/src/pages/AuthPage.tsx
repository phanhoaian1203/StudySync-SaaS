import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/authService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/* ─────────────────────────────────────────────────────────────────
   Design tokens
───────────────────────────────────────────────────────────────── */
const C = {
  // Accent – muted indigo/blue, not glowing purple
  accent:        '#4f6ef2',
  accentHover:   '#3d5ce0',
  accentMuted:   'rgba(79,110,242,0.18)',
  accentBorder:  'rgba(79,110,242,0.45)',

  // Surfaces
  pageBg:        '#0c111d',
  rightBg:       'rgba(255,255,255,0.025)',
  inputBg:       'rgba(255,255,255,0.055)',
  inputBgFocus:  'rgba(79,110,242,0.09)',
  tabsBg:        'rgba(255,255,255,0.05)',

  // Text
  textPrimary:   '#e8ecf4',
  textSecondary: 'rgba(148,163,184,0.85)',
  textMuted:     'rgba(100,116,139,0.7)',
  textOnAccent:  '#ffffff',

  // Borders
  border:        'rgba(255,255,255,0.08)',
  borderInput:   'rgba(255,255,255,0.12)',
};

/* ─────────────────────────────────────────────────────────────────
   Inline styles
───────────────────────────────────────────────────────────────── */
const S = {
  page: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    overflow: 'hidden',
    background: C.pageBg,
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
    padding: '36px 48px',
    overflow: 'hidden',
  },

  bgImage: {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    // Lighter filter so the photo is actually visible
    filter: 'brightness(0.5) saturate(0.9)',
    zIndex: 0,
  },

  // Clean dark gradient — no colorful tint
  leftOverlay: {
    position: 'absolute' as const,
    inset: 0,
    background: 'linear-gradient(160deg, rgba(12,17,29,0.55) 0%, rgba(12,17,29,0.30) 50%, rgba(12,17,29,0.65) 100%)',
    zIndex: 1,
  },

  leftContent: {
    position: 'relative' as const,
    zIndex: 2,
    maxWidth: '420px',
    width: '100%',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '48px',
  },

  brandIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: C.accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandText: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-0.3px',
  },

  tagline: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(196,210,230,0.75)',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    marginBottom: '16px',
  },

  heroHeading: {
    fontSize: 'clamp(28px, 3vw, 42px)',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.18,
    letterSpacing: '-0.8px',
    marginBottom: '16px',
  },

  heroSub: {
    fontSize: '15px',
    color: 'rgba(210,220,240,0.7)',
    lineHeight: 1.65,
    marginBottom: '36px',
  },

  statRow: {
    display: 'flex',
    gap: '28px',
  },

  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '3px',
  },

  statNum: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#fff',
  },

  statLabel: {
    fontSize: '11px',
    color: 'rgba(180,195,220,0.65)',
    fontWeight: 500,
  },

  // ── RIGHT PANEL (form) ──────────────────────────────
  rightPanel: {
    width: '440px',
    minWidth: '360px',
    maxWidth: '460px',
    flexShrink: 0,
    background: C.rightBg,
    backdropFilter: 'blur(32px)',
    borderLeft: `1px solid ${C.border}`,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: '40px 36px',
    position: 'relative' as const,
    overflow: 'hidden',
  },

  rightGlow: {
    position: 'absolute' as const,
    top: '-80px',
    right: '-80px',
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79,110,242,0.1) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },

  rightGlow2: {
    position: 'absolute' as const,
    bottom: '-80px',
    left: '-80px',
    width: '260px',
    height: '260px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79,110,242,0.07) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },

  // ── TABS ──────────────────────────────
  tabs: {
    display: 'flex',
    gap: '3px',
    background: C.tabsBg,
    borderRadius: '12px',
    padding: '3px',
    marginBottom: '28px',
  },

  tab: (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '9px 0',
    borderRadius: '9px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700,
    transition: 'all 0.22s ease',
    background: active ? C.accent : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.4)',
    boxShadow: active ? '0 2px 12px rgba(79,110,242,0.35)' : 'none',
  }),

  // ── FORM HEADING ──────────────────────────────
  formHeading: {
    fontSize: '22px',
    fontWeight: 800,
    color: C.textPrimary,
    marginBottom: '4px',
    letterSpacing: '-0.4px',
  },

  formSub: {
    fontSize: '13px',
    color: C.textSecondary,
    marginBottom: '24px',
    lineHeight: 1.5,
  },

  // ── INPUT FIELD ──────────────────────────────
  inputWrapper: {
    position: 'relative' as const,
    marginBottom: '14px',
  },

  inputLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: C.textSecondary,
    marginBottom: '6px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },

  inputBox: {
    width: '100%',
    background: C.inputBg,
    border: `1.5px solid ${C.borderInput}`,
    borderRadius: '10px',
    padding: '11px 14px',
    color: C.textPrimary,
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
  },

  inputIcon: {
    position: 'absolute' as const,
    right: '12px',
    bottom: '11px',
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
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '9px',
    padding: '10px 12px',
    color: '#fca5a5',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  // ── FORGOT ──────────────────────────────
  forgotRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '-4px',
    marginBottom: '20px',
  },

  forgotLink: {
    fontSize: '12px',
    fontWeight: 600,
    color: C.accent,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'none',
    opacity: 0.85,
  },

  // ── DIVIDER ──────────────────────────────
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '20px 0',
  },

  dividerLine: {
    flex: 1,
    height: '1px',
    background: C.border,
  },

  dividerText: {
    fontSize: '11px',
    color: C.textMuted,
    fontWeight: 600,
    letterSpacing: '0.08em',
  },

  // ── GOOGLE BTN ──────────────────────────────
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    background: 'rgba(255,255,255,0.05)',
    border: `1.5px solid ${C.border}`,
    borderRadius: '10px',
    padding: '11px 18px',
    color: C.textPrimary,
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    marginBottom: '0',
    boxSizing: 'border-box' as const,
  },

  // ── SUBMIT BTN ──────────────────────────────
  submitBtn: (disabled: boolean): React.CSSProperties => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: disabled ? 'rgba(79,110,242,0.35)' : C.accent,
    border: 'none',
    borderRadius: '10px',
    padding: '12px 18px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.22s ease',
    fontFamily: 'inherit',
    letterSpacing: '-0.1px',
    boxShadow: disabled ? 'none' : '0 4px 20px rgba(79,110,242,0.35)',
    boxSizing: 'border-box' as const,
    opacity: disabled ? 0.6 : 1,
  }),

  // ── FOOTER ──────────────────────────────
  footer: {
    textAlign: 'center' as const,
    marginTop: '22px',
    fontSize: '12px',
    color: C.textMuted,
    lineHeight: 1.6,
  },
};

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
            borderColor: focused ? C.accentBorder : C.borderInput,
            background: focused ? C.inputBgFocus : C.inputBg,
            boxShadow: focused ? `0 0 0 3px ${C.accentMuted}` : 'none',
            paddingRight: endAdornment ? '44px' : '14px',
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const navigate  = useNavigate();
  const location   = useLocation();
  const login      = useAuthStore((state) => state.login);

  // ✅ FIX: Đọc từ URL path để xác định hiện Login hay Register
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');

  const switchTab = (login: boolean) => {
    setIsLogin(login);
    setError('');
    setEmail('');
    setPassword('');
    setFullName('');
    // Sync URL với state khi switch tab
    navigate(login ? '/login' : '/register', { replace: true });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        const res = await authService.login({ email, password });
        // Dùng authStore.login() — cập nhật global state + localStorage
        login(res);
        navigate('/dashboard');
      } else {
        await authService.register({ email, password, fullName });
        // ✅ Sau đăng ký thành công: chuyển sang Login và sync URL
        switchTab(true);
      }
    } catch (err: any) {
      // ApiError.message đã được chuẩn hóa trong axiosClient interceptor
      setError(err.message || 'Đã xảy ra lỗi, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

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
        html, body, #root { height: 100%; margin: 0; padding: 0; }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(100,116,139,0.55); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #111827 inset !important;
          -webkit-text-fill-color: #e8ecf4 !important;
        }
        .google-btn:hover {
          background: rgba(255,255,255,0.09) !important;
          border-color: rgba(255,255,255,0.18) !important;
        }
        .submit-btn:hover:not(:disabled) {
          background: #3d5ce0 !important;
          box-shadow: 0 6px 24px rgba(79,110,242,0.45) !important;
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .forgot-link:hover { opacity: 1 !important; }
        @media (max-width: 768px) {
          .auth-page-wrapper { flex-direction: column !important; height: auto !important; min-height: 100vh !important; }
          .left-panel { min-height: 200px !important; padding: 28px 24px !important; flex: none !important; }
          .right-panel { width: 100% !important; min-width: 0 !important; max-width: 100% !important; padding: 32px 24px !important; flex: 1 !important; }
          .stat-row { display: none !important; }
          .hero-heading { font-size: 24px !important; }
          .hero-sub { display: none !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={S.page} className="auth-page-wrapper">

        {/* ── LEFT PANEL ─────────────────────────────────────────── */}
        <div style={S.leftPanel} className="left-panel">
          <div style={S.bgImage} />
          <div style={S.leftOverlay} />

          <div style={S.leftContent}>
            {/* Brand */}
            <motion.div
              style={S.brand}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <div style={S.brandIcon}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: '#fff', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
              </div>
              <span style={S.brandText}>StudySync</span>
            </motion.div>

            {/* Tagline */}
            <motion.p
              style={S.tagline}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              Smart Study Platform
            </motion.p>

            {/* Hero heading */}
            <motion.h1
              style={S.heroHeading}
              className="hero-heading"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              Master your<br />
              learning journey
            </motion.h1>

            {/* Sub text */}
            <motion.p
              style={S.heroSub}
              className="hero-sub"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
            >
              AI-powered study tools, smart flashcards, and
              collaborative sessions — all in one place.
            </motion.p>

            {/* Stats */}
            <motion.div
              style={S.statRow}
              className="stat-row"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
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
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Subtle glow decorations */}
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
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
                  animate={{ opacity: 1, height: 'auto', marginBottom: '14px' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', flexShrink: 0 }}>
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
              <svg width="16" height="16" viewBox="0 0 24 24">
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
                    transition={{ duration: 0.25 }}
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
                    <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
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
                style={{ ...S.submitBtn(isLoading), marginTop: isLogin ? '0' : '6px' }}
                whileTap={isLoading ? {} : { scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}
                    >
                      progress_activity
                    </span>
                    Processing…
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
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
                    color: C.accent,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 'inherit',
                    padding: 0,
                    fontFamily: 'inherit',
                    opacity: 0.9,
                  }}
                >
                  {isLogin ? 'Sign up free' : 'Log in'}
                </button>
              </p>
              <p style={{ marginTop: '12px' }}>
                By continuing you agree to StudySync's{' '}
                <a href="#" style={{ color: C.accent, textDecoration: 'none', opacity: 0.75 }}>Terms</a>
                {' & '}
                <a href="#" style={{ color: C.accent, textDecoration: 'none', opacity: 0.75 }}>Privacy Policy</a>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AuthPage;