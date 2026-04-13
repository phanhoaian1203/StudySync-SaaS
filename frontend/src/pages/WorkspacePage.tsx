import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { workspaceService } from '../services/workspaceService';
import { boardService } from '../services/boardService';
import type { WorkspaceResponse, BoardResponse } from '../types';

/* ─────────────────────────────────────────────────────────────────
   Design tokens
───────────────────────────────────────────────────────────────── */
const C = {
  accent:      '#4f6ef2',
  accentHover: '#3d5ce0',
  cardBg:      'rgba(255,255,255,0.03)',
  cardBorder:  'rgba(255,255,255,0.08)',
  textPrimary: '#e8ecf4',
  textSec:     'rgba(148,163,184,0.85)',
  textMuted:   'rgba(100,116,139,0.7)',
};

/* ─────────────────────────────────────────────────────────────────
   CreateBoardModal
───────────────────────────────────────────────────────────────── */
interface CreateBoardModalProps {
  workspaceId: string;
  onClose: () => void;
  onCreated: (board: BoardResponse) => void;
}

const CreateBoardModal = ({ workspaceId, onClose, onCreated }: CreateBoardModalProps) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Tên Bảng không được để trống.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const board = await boardService.create(workspaceId, { name: name.trim() });
      onCreated(board);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo bảng.');
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
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
        style={{ background: '#111827', border: `1px solid ${C.cardBorder}`, borderRadius: '16px',
                 padding: '28px 32px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 56px rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: C.textPrimary, fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Tạo Board mới</h2>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: '8px', padding: '10px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.textSec,
                          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Tên Bảng (Board)
          </label>
          <input
            autoFocus
            value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
            placeholder="VD: Kế hoạch Marketing Q3"
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${C.cardBorder}`,
                     borderRadius: '10px', padding: '10px 14px', color: C.textPrimary, fontSize: '14px',
                     outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '24px' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${C.cardBorder}`,
                       background: 'transparent', color: C.textSec, fontSize: '13px', fontWeight: 600,
                       cursor: 'pointer', fontFamily: 'inherit' }}>
              Huỷ
            </button>
            <button type="submit" disabled={isLoading}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                       background: isLoading ? 'rgba(79,110,242,0.4)' : C.accent,
                       color: '#fff', fontSize: '13px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
                       fontFamily: 'inherit' }}>
              {isLoading ? 'Đang tạo...' : 'Tạo Board'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   WorkspacePage
───────────────────────────────────────────────────────────────── */
const WorkspacePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [boards, setBoards] = useState<BoardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    
    Promise.all([
      workspaceService.getById(id),
      boardService.getBoardsByWorkspaceId(id)
    ])
    .then(([wsData, boardsData]) => {
      setWorkspace(wsData);
      setBoards(boardsData);
    })
    .catch((err) => setError(err.message || 'Không thể tải thông tin Workspace'))
    .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <div style={{ color: C.textMuted }}>Đang tải Workspace...</div>;
  if (error) return <div style={{ color: '#fca5a5' }}>{error}</div>;
  if (!workspace) return null;

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* ── Header ─── */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: C.textPrimary, fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
          {workspace.name}
        </h1>
        {workspace.description && (
          <p style={{ color: C.textSec, fontSize: '14px', lineHeight: 1.6 }}>{workspace.description}</p>
        )}
      </div>

      {/* ── Boards Grid ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: C.textPrimary, fontSize: '18px', fontWeight: 700 }}>Danh sách Boards</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ padding: '8px 16px', background: C.accent, color: '#fff', border: 'none', 
                   borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          + Tạo Board mới
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {boards.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', border: `1px dashed ${C.cardBorder}`, borderRadius: '12px' }}>
             <p style={{ color: C.textMuted, fontSize: '14px' }}>Chưa có Board nào. Hãy tạo một Board để bắt đầu quản lý công việc!</p>
          </div>
        ) : (
          boards.map(board => (
            <motion.div
              key={board.id}
              whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.2)' }}
              onClick={() => navigate(`/workspace/${workspace.id}/board/${board.id}`)}
              style={{
                background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: '12px',
                padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px'
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(79,110,242,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                📋
              </div>
              <h3 style={{ margin: 0, color: C.textPrimary, fontSize: '16px', fontWeight: 600 }}>{board.name}</h3>
              <p style={{ margin: 0, color: C.textMuted, fontSize: '12px' }}>
                Tạo ngày: {new Date(board.createdAt).toLocaleDateString()}
              </p>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateBoardModal 
            workspaceId={workspace.id} 
            onClose={() => setShowCreateModal(false)} 
            onCreated={(newBoard) => setBoards([newBoard, ...boards])} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspacePage;
