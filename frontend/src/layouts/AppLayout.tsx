import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { workspaceService } from '../services/workspaceService';
import { boardService } from '../services/boardService';
import type { WorkspaceResponse, BoardResponse } from '../types';

/* ─────────────────────────────────────────────────────────────────
   Design tokens — consistent with AuthPage
───────────────────────────────────────────────────────────────── */
const C = {
  accent:       '#4f6ef2',
  accentHover:  '#3d5ce0',
  accentMuted:  'rgba(79,110,242,0.15)',
  sidebarBg:    '#0a0f1e',
  headerBg:     'rgba(12,17,29,0.85)',
  contentBg:    '#0c111d',
  border:       'rgba(255,255,255,0.07)',
  borderLight:  'rgba(255,255,255,0.1)',
  textPrimary:  '#e8ecf4',
  textSecondary:'rgba(148,163,184,0.85)',
  textMuted:    'rgba(100,116,139,0.7)',
  hover:        'rgba(255,255,255,0.05)',
  hoverActive:  'rgba(79,110,242,0.12)',
};

/* ─────────────────────────────────────────────────────────────────
   Icons (inline SVG — không cần thư viện icon)
───────────────────────────────────────────────────────────────── */
const Icon = {
  Logo: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={C.accent} />
    </svg>
  ),
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Workspace: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 7l10-5 10 5v10l-10 5L2 17V7z"/>
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  ChevronDown: ({ open }: { open: boolean }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Settings: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Logout: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Bell: () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  BoardInfo: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────────
   CreateWorkspaceModal
───────────────────────────────────────────────────────────────── */
interface CreateWorkspaceModalProps {
  onClose: () => void;
  onCreated: (ws: WorkspaceResponse) => void;
}

const CreateWorkspaceModal = ({ onClose, onCreated }: CreateWorkspaceModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Tên Workspace không được để trống.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const ws = await workspaceService.create({ name: name.trim(), description: description.trim() || undefined });
      onCreated(ws);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
               display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }} transition={{ duration: 0.22 }}
        style={{ background: '#111827', border: `1px solid ${C.borderLight}`, borderRadius: '16px',
                 padding: '28px 32px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 56px rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: C.textPrimary, fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Tạo Workspace mới</h2>
        <p style={{ color: C.textSecondary, fontSize: '13px', marginBottom: '20px' }}>Workspace là nơi tập hợp các Board dự án của bạn.</p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: '8px', padding: '10px 12px', color: '#fca5a5', fontSize: '13px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.textSecondary,
                          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Tên Workspace *
          </label>
          <input
            autoFocus
            value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
            placeholder="VD: Quản lý Đồ án Nhóm"
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${C.borderLight}`,
                     borderRadius: '10px', padding: '10px 14px', color: C.textPrimary, fontSize: '14px',
                     outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '14px' }}
          />
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.textSecondary,
                          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Mô tả (tuỳ chọn)
          </label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={3}
            placeholder="Mô tả ngắn về workspace này..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${C.borderLight}`,
                     borderRadius: '10px', padding: '10px 14px', color: C.textPrimary, fontSize: '14px',
                     outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '20px' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${C.borderLight}`,
                       background: 'transparent', color: C.textSecondary, fontSize: '13px', fontWeight: 600,
                       cursor: 'pointer', fontFamily: 'inherit' }}>
              Huỷ
            </button>
            <button type="submit" disabled={isLoading}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                       background: isLoading ? 'rgba(79,110,242,0.4)' : C.accent,
                       color: '#fff', fontSize: '13px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
                       fontFamily: 'inherit', boxShadow: isLoading ? 'none' : '0 4px 16px rgba(79,110,242,0.35)' }}>
              {isLoading ? 'Đang tạo...' : 'Tạo Workspace'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   NavItem — Sidebar navigation item
───────────────────────────────────────────────────────────────── */
interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '9px 12px', borderRadius: '9px', margin: '1px 8px',
      background: isActive ? C.hoverActive : 'transparent',
      color: isActive ? C.accent : C.textSecondary,
      fontSize: '13px', fontWeight: isActive ? 600 : 500,
      cursor: 'pointer', transition: 'all 0.18s ease',
      borderLeft: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
    }}
      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = C.hover; }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      <span style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}>{icon}</span>
      <span>{label}</span>
    </div>
  </Link>
);

/* ─────────────────────────────────────────────────────────────────
   AppLayout — Main shell
───────────────────────────────────────────────────────────────── */
const AppLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [workspaces,       setWorkspaces]       = useState<WorkspaceResponse[]>([]);
  const [wsExpanded,       setWsExpanded]       = useState(true);
  const [showCreateModal,  setShowCreateModal]  = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loadingWs,        setLoadingWs]        = useState(true);

  // States Jira Nested Dropdown 
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [workspaceBoards, setWorkspaceBoards] = useState<Record<string, BoardResponse[]>>({});
  const [loadingBoards, setLoadingBoards] = useState<Set<string>>(new Set());

  const toggleWorkspace = (wsId: string) => {
    setExpandedWorkspaces(prev => {
      const next = new Set(prev);
      if (next.has(wsId)) {
        next.delete(wsId);
      } else {
        next.add(wsId);
        // Tải Board nếu chưa có
        if (!workspaceBoards[wsId]) {
          setLoadingBoards(l => new Set(l).add(wsId));
          boardService.getBoardsByWorkspaceId(wsId)
            .then(boards => setWorkspaceBoards(b => ({ ...b, [wsId]: boards })))
            .catch(console.error)
            .finally(() => setLoadingBoards(l => { const nl = new Set(l); nl.delete(wsId); return nl; }));
        }
      }
      return next;
    });
  };

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoadingWs(true);
      const data = await workspaceService.getMyWorkspaces();
      setWorkspaces(data);
    } catch {
      // Fail silently — sidebar sẽ trống, user có thể tạo mới
    } finally {
      setLoadingWs(false);
    }
  }, []);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleWorkspaceCreated = (ws: WorkspaceResponse) => {
    setWorkspaces((prev) => [ws, ...prev]);
  };

  const SIDEBAR_WIDTH = sidebarCollapsed ? 64 : 240;
  const isPro = user?.subscriptionPlan === 1;

  return (
    <>
      {/* Global font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        html, body, #root { height: 100%; margin: 0; padding: 0; }
        * { box-sizing: border-box; font-family: 'Inter', 'Segoe UI', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        a { color: inherit; text-decoration: none; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: C.contentBg, overflow: 'hidden' }}>

        {/* ══════════════════════════════════════════════════════
            SIDEBAR
        ══════════════════════════════════════════════════════ */}
        <motion.aside
          animate={{ width: SIDEBAR_WIDTH }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{
            background: C.sidebarBg, borderRight: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
            position: 'relative', zIndex: 10,
          }}
        >
          {/* ── Logo + Collapse Toggle ─── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 14px', height: '60px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Icon.Logo />
                  <span style={{ color: C.textPrimary, fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px' }}>
                    StudySync
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {sidebarCollapsed && <Icon.Logo />}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted,
                       padding: '4px', display: 'flex', borderRadius: '6px', marginLeft: sidebarCollapsed ? 'auto' : 0 }}
            >
              <Icon.Menu />
            </button>
          </div>

          {/* ── Navigation ─── */}
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: '10px' }}>

            {/* Main nav */}
            <div style={{ marginBottom: '6px' }}>
              <NavItem
                to="/dashboard" icon={<Icon.Dashboard />}
                label="Dashboard" isActive={location.pathname === '/dashboard'}
              />
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: C.border, margin: '8px 16px' }} />

            {/* Workspaces section */}
            {!sidebarCollapsed && (
              <div style={{ padding: '0 8px' }}>
                {/* Section header */}
                <div
                  onClick={() => setWsExpanded(!wsExpanded)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                           padding: '6px 8px', cursor: 'pointer', marginBottom: '4px', borderRadius: '6px' }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMuted,
                                 textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Workspaces
                  </span>
                  <Icon.ChevronDown open={wsExpanded} />
                </div>

                {/* Workspace list */}
                <AnimatePresence>
                  {wsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {loadingWs ? (
                        <div style={{ padding: '8px 12px', color: C.textMuted, fontSize: '12px' }}>Đang tải...</div>
                      ) : workspaces.length === 0 ? (
                        <div style={{ padding: '8px 12px', color: C.textMuted, fontSize: '12px' }}>
                          Chưa có workspace nào
                        </div>
                      ) : (
                        workspaces.map((ws) => {
                          const isWsActive = location.pathname.startsWith(`/workspace/${ws.id}`);
                          const isWsExpanded = expandedWorkspaces.has(ws.id);
                          const isBoardLoading = loadingBoards.has(ws.id);
                          const boards = workspaceBoards[ws.id] || [];

                          return (
                            <div key={ws.id} style={{ margin: '2px 0' }}>
                              
                              {/* Workspace Row (Folder) */}
                              <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 10px', borderRadius: '8px',
                                background: isWsActive && !isWsExpanded ? C.hoverActive : 'transparent',
                                cursor: 'pointer', transition: 'background 0.15s',
                              }}
                                onClick={() => toggleWorkspace(ws.id)}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.hover; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = isWsActive && !isWsExpanded ? C.hoverActive : 'transparent'; }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', color: isWsExpanded ? C.accent : 'rgba(148,163,184,0.6)' }}>
                                    <Icon.ChevronDown open={isWsExpanded} />
                                  </div>
                                  <span style={{
                                    color: (isWsActive || isWsExpanded) ? C.textPrimary : C.textSecondary,
                                    fontSize: '13px', fontWeight: (isWsActive || isWsExpanded) ? 600 : 500,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}>
                                    {ws.name}
                                  </span>
                                </div>
                              </div>

                              {/* Nested Boards List */}
                              <AnimatePresence>
                                {isWsExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    style={{ overflow: 'hidden', paddingLeft: '18px', borderLeft: `1px solid ${C.borderLight}`, marginLeft: '17px', marginTop: '2px' }}
                                  >
                                    
                                    {/* Workspace Overview Link */}
                                    <Link to={`/workspace/${ws.id}`} style={{ textDecoration: 'none' }}>
                                      <div style={{
                                          padding: '7px 10px', borderRadius: '6px', fontSize: '12px',
                                          color: location.pathname === `/workspace/${ws.id}` ? C.accent : C.textSecondary,
                                          fontWeight: location.pathname === `/workspace/${ws.id}` ? 600 : 400,
                                          background: location.pathname === `/workspace/${ws.id}` ? 'rgba(79,110,242,0.1)' : 'transparent',
                                          cursor: 'pointer', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px'
                                        }}
                                        onMouseEnter={(e) => { if(location.pathname !== `/workspace/${ws.id}`) (e.currentTarget as HTMLDivElement).style.background = C.hover; }}
                                        onMouseLeave={(e) => { if(location.pathname !== `/workspace/${ws.id}`) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                                      >
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                        Tổng quan (Space)
                                      </div>
                                    </Link>

                                    {/* Danh sách Board */}
                                    {isBoardLoading ? (
                                      <div style={{ padding: '6px 10px', fontSize: '11px', color: C.textMuted }}>Đang tải bảng...</div>
                                    ) : boards.length === 0 ? (
                                      <div style={{ padding: '6px 10px', fontSize: '11px', color: C.textMuted }}>Không có bảng nào.</div>
                                    ) : (
                                      boards.map(board => {
                                        const boardPath = `/workspace/${ws.id}/board/${board.id}`;
                                        const isBoardActive = location.pathname === boardPath;
                                        return (
                                          <Link key={board.id} to={boardPath} style={{ textDecoration: 'none' }}>
                                            <div style={{
                                              padding: '7px 10px', borderRadius: '6px', fontSize: '12px',
                                              display: 'flex', alignItems: 'center', gap: '8px',
                                              background: isBoardActive ? C.hoverActive : 'transparent',
                                              color: isBoardActive ? C.textPrimary : C.textSecondary,
                                              fontWeight: isBoardActive ? 600 : 400,
                                              cursor: 'pointer', margin: '2px 0'
                                            }}
                                              onMouseEnter={(e) => { if(!isBoardActive) (e.currentTarget as HTMLDivElement).style.background = C.hover; }}
                                              onMouseLeave={(e) => { if(!isBoardActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                                            >
                                              <span style={{ color: isBoardActive ? C.accent : 'rgba(148,163,184,0.5)', display: 'flex' }}>
                                                <Icon.BoardInfo />
                                              </span>
                                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {board.name}
                                              </span>
                                            </div>
                                          </Link>
                                        )
                                      })
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              
                            </div>
                          );
                        })
                      )}

                      {/* Create Workspace button */}
                      <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 10px', borderRadius: '8px', border: `1px dashed rgba(79,110,242,0.3)`,
                          background: 'transparent', color: C.accent, fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit', marginTop: '6px', transition: 'all 0.18s',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.accentMuted; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <Icon.Plus />
                        {workspaces.length >= 3 && !isPro ? 'Nâng cấp để thêm' : 'Tạo Workspace'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Collapsed: workspace icon */}
            {sidebarCollapsed && (
              <div style={{ padding: '4px 8px' }}>
                <div style={{ padding: '9px', display: 'flex', justifyContent: 'center', color: C.textMuted, cursor: 'pointer' }}>
                  <Icon.Workspace />
                </div>
              </div>
            )}
          </div>

          {/* ── User section (bottom) ─── */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 8px', flexShrink: 0 }}>

            {!sidebarCollapsed && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '8px 10px', borderRadius: '10px', marginBottom: '4px',
                              background: 'rgba(255,255,255,0.03)' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', background: C.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '13px', fontWeight: 700, flexShrink: 0,
                  }}>
                    {user?.fullName?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ color: C.textPrimary, fontSize: '13px', fontWeight: 600,
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.fullName}
                    </div>
                    <div style={{
                      fontSize: '10px', fontWeight: 700, color: isPro ? '#f59e0b' : C.textMuted,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: isPro ? 'rgba(245,158,11,0.1)' : 'transparent',
                      padding: isPro ? '1px 6px' : '0', borderRadius: '4px', display: 'inline-block',
                    }}>
                      {isPro ? '⚡ Pro' : 'Free'}
                    </div>
                  </div>
                </div>

                {/* Settings + Logout */}
                <div>
                  {[
                    { icon: <Icon.Settings />, label: 'Cài đặt', onClick: () => {} },
                    { icon: <Icon.Logout />,  label: 'Đăng xuất', onClick: handleLogout, danger: true },
                  ].map((item) => (
                    <button
                      key={item.label} onClick={item.onClick}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 10px', borderRadius: '8px', border: 'none', background: 'transparent',
                        color: item.danger ? '#f87171' : C.textSecondary, fontSize: '13px', fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.hover; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Collapsed mode: just avatar */}
            {sidebarCollapsed && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: C.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                }}>
                  {user?.fullName?.charAt(0).toUpperCase() ?? '?'}
                </div>
              </div>
            )}
          </div>
        </motion.aside>

        {/* ══════════════════════════════════════════════════════
            MAIN CONTENT AREA
        ══════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* ── Top Header ─── */}
          <header style={{
            height: '60px', background: C.headerBg, backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
            justifyContent: 'flex-end', padding: '0 24px', gap: '12px', flexShrink: 0,
          }}>
            {/* Notification Bell */}
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary,
              display: 'flex', padding: '6px', borderRadius: '8px', position: 'relative',
              transition: 'color 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.textPrimary; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.textSecondary; }}
            >
              <Icon.Bell />
            </button>

            {/* User Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <span style={{ color: C.textSecondary, fontSize: '13px', fontWeight: 500 }}>
                {user?.fullName}
              </span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', background: C.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '13px', fontWeight: 700,
              }}>
                {user?.fullName?.charAt(0).toUpperCase() ?? '?'}
              </div>
            </div>
          </header>

          {/* ── Page Content ─── */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
            <Outlet />
          </main>
        </div>
      </div>

      {/* ── Create Workspace Modal ─── */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateWorkspaceModal
            onClose={() => setShowCreateModal(false)}
            onCreated={handleWorkspaceCreated}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AppLayout;
