import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { workspaceService } from '../services/workspaceService';
import type { WorkspaceResponse } from '../types';

/* ─────────────────────────────────────────────────────────────────
   Design tokens
───────────────────────────────────────────────────────────────── */
const C = {
  accent:      '#4f6ef2',
  accentMuted: 'rgba(79,110,242,0.12)',
  cardBg:      'rgba(255,255,255,0.03)',
  cardBorder:  'rgba(255,255,255,0.08)',
  textPrimary: '#e8ecf4',
  textSec:     'rgba(148,163,184,0.85)',
  textMuted:   'rgba(100,116,139,0.7)',
  success:     '#34d399',
  warning:     '#f59e0b',
};

/* ─────────────────────────────────────────────────────────────────
   StatCard
───────────────────────────────────────────────────────────────── */
interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}

const StatCard = ({ icon, label, value, color = C.accent }: StatCardProps) => (
  <motion.div
    whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
    transition={{ duration: 0.18 }}
    style={{
      background: C.cardBg, border: `1px solid ${C.cardBorder}`,
      borderRadius: '14px', padding: '20px 22px',
      display: 'flex', alignItems: 'center', gap: '16px', cursor: 'default',
    }}
  >
    <div style={{
      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
      background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '22px',
    }}>
      {icon}
    </div>
    <div>
      <div style={{ color: C.textMuted, fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>{label}</div>
      <div style={{ color: C.textPrimary, fontSize: '22px', fontWeight: 800 }}>{value}</div>
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────────────
   WorkspaceCard
───────────────────────────────────────────────────────────────── */
interface WorkspaceCardProps {
  workspace: WorkspaceResponse;
  onClick: () => void;
}

const WorkspaceCard = ({ workspace, onClick }: WorkspaceCardProps) => (
  <motion.div
    whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.25)' }}
    transition={{ duration: 0.18 }}
    onClick={onClick}
    style={{
      background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: '14px',
      padding: '22px', cursor: 'pointer', transition: 'border-color 0.2s',
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(79,110,242,0.35)'; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.cardBorder; }}
  >
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', background: C.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '17px', fontWeight: 800, flexShrink: 0,
      }}>
        {workspace.name.charAt(0).toUpperCase()}
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{ color: C.textPrimary, fontSize: '15px', fontWeight: 700,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {workspace.name}
        </div>
        {workspace.description && (
          <div style={{ color: C.textMuted, fontSize: '12px', marginTop: '2px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {workspace.description}
          </div>
        )}
      </div>
    </div>

    {/* Stats row */}
    <div style={{ display: 'flex', gap: '16px' }}>
      {[
        { icon: '📋', val: workspace.boardCount, label: 'Boards' },
        { icon: '👥', val: workspace.memberCount, label: 'Thành viên' },
      ].map((s) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '13px' }}>{s.icon}</span>
          <span style={{ color: C.textSec, fontSize: '12px', fontWeight: 500 }}>
            <strong style={{ color: C.textPrimary }}>{s.val}</strong> {s.label}
          </span>
        </div>
      ))}
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────────────
   DashboardPage
───────────────────────────────────────────────────────────────── */
const DashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);

  const isPro    = user?.subscriptionPlan === 1;
  const wsLimit  = isPro ? '∞' : '3';
  const wsUsed   = workspaces.length;
  const totalBoards   = workspaces.reduce((sum, ws) => sum + ws.boardCount, 0);
  const totalMembers  = workspaces.reduce((sum, ws) => sum + ws.memberCount, 0);

  useEffect(() => {
    workspaceService.getMyWorkspaces()
      .then(setWorkspaces)
      .catch(() => {}) // Sidebar đã có error state
      .finally(() => setIsLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div style={{ maxWidth: '1100px', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Welcome Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ marginBottom: '32px' }}
      >
        <h1 style={{
          color: C.textPrimary, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800,
          letterSpacing: '-0.5px', marginBottom: '6px',
        }}>
          {greeting()}, {user?.fullName?.split(' ').pop()} 👋
        </h1>
        <p style={{ color: C.textSec, fontSize: '14px', lineHeight: 1.6 }}>
          Đây là tổng quan dự án của bạn.&nbsp;
          {!isPro && (
            <span style={{ color: C.accent, fontWeight: 600, cursor: 'pointer' }}>
              Nâng cấp Pro
            </span>
          )}
          {!isPro && ' để mở khóa toàn bộ tính năng.'}
        </p>
      </motion.div>

      {/* ── Stats Row ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                 gap: '14px', marginBottom: '36px' }}
      >
        <StatCard icon="🗂️" label="Workspaces"  value={`${wsUsed} / ${wsLimit}`} color={C.accent} />
        <StatCard icon="📋" label="Tổng Boards"  value={totalBoards}              color="#8b5cf6" />
        <StatCard icon="👥" label="Cộng tác viên" value={totalMembers}            color={C.success} />
        <StatCard icon={isPro ? '⚡' : '🎯'} label="Gói hiện tại" value={isPro ? 'Pro' : 'Free'} color={isPro ? C.warning : C.textMuted} />
      </motion.div>

      {/* ── Workspaces Grid / Empty State ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ color: C.textPrimary, fontSize: '17px', fontWeight: 700 }}>
            Workspaces của bạn
          </h2>
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: '120px', borderRadius: '14px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)',
                backgroundSize: '200% 100%', border: `1px solid ${C.cardBorder}`,
                animation: 'shimmer 1.5s infinite',
              }} />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          /* Empty State */
          <div style={{
            textAlign: 'center', padding: '60px 20px', borderRadius: '16px',
            border: `2px dashed rgba(79,110,242,0.2)`, background: C.accentMuted,
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
            <h3 style={{ color: C.textPrimary, fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              Tạo Workspace đầu tiên!
            </h3>
            <p style={{ color: C.textSec, fontSize: '13px', lineHeight: 1.7, marginBottom: '24px', maxWidth: '380px', margin: '0 auto 24px' }}>
              Workspace là không gian làm việc chứa các Board Kanban. Hãy tạo workspace đầu tiên để bắt đầu quản lý dự án và cộng tác cùng nhóm.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '11px 28px', background: C.accent, border: 'none', borderRadius: '10px',
                color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(79,110,242,0.4)',
              }}
            >
              + Tạo Workspace (từ Sidebar)
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {workspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id} workspace={ws}
                onClick={() => navigate(`/workspace/${ws.id}`)}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
