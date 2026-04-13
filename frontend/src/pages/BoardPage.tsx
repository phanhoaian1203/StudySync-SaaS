import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { boardService } from '../services/boardService';
import { columnService } from '../services/columnService';
import { taskService } from '../services/taskService';
import type { BoardResponse, ColumnResponse, TaskResponse } from '../types';

const C = {
  bg: '#0c111d',
  colBg: 'rgba(255,255,255,0.03)',
  cardBg: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#4f6ef2',
  text: '#e8ecf4',
  textMuted: 'rgba(148,163,184,0.7)',
};

const BoardPage = () => {
  const { workspaceId, boardId } = useParams<{ workspaceId: string, boardId: string }>();
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [columns, setColumns] = useState<ColumnResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // States for Quick Add Forms
  const [newTaskTitle, setNewTaskTitle] = useState<{ [colId: string]: string }>({});
  const [newColName, setNewColName] = useState('');
  const [addingCol, setAddingCol] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    Promise.all([
      boardService.getById(boardId),
      columnService.getColumnsByBoardId(boardId) // Lấy luôn cả tasks bên trong
    ])
    .then(([bData, cData]) => {
      setBoard(bData);
      setColumns(cData);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [boardId]);

  const handleAddTask = async (columnId: string) => {
    const title = newTaskTitle[columnId];
    if (!title?.trim()) return;

    try {
      const task = await taskService.create({ columnId, title: title.trim() });
      setColumns(cols => cols.map(c => {
        if (c.id === columnId) return { ...c, tasks: [...c.tasks, task] };
        return c;
      }));
      setNewTaskTitle(prev => ({ ...prev, [columnId]: '' }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !boardId) return;

    try {
      const col = await columnService.create({ boardId, name: newColName.trim() });
      setColumns([...columns, col]);
      setNewColName('');
      setAddingCol(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (columnId: string, taskId: string) => {
    try {
      await taskService.delete(taskId);
      setColumns(cols => cols.map(c => {
        if (c.id === columnId) return { ...c, tasks: c.tasks.filter(t => t.id !== taskId) };
        return c;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ color: C.text }}>Đang tải Kanban Board...</div>;
  if (!board) return <div style={{ color: '#fca5a5' }}>Không tìm thấy Board.</div>;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ─── */}
      <div style={{ marginBottom: '24px', flexShrink: 0 }}>
        <h1 style={{ color: C.text, fontSize: '24px', fontWeight: 800, margin: 0 }}>{board.name}</h1>
      </div>

      {/* ── Kanban Area (Horizontal Scroll) ─── */}
      <div style={{ 
        display: 'flex', gap: '20px', overflowX: 'auto', overflowY: 'hidden', 
        flex: 1, paddingBottom: '16px' 
      }}>
        
        {/* Columns List */}
        {columns.map(col => (
          <div key={col.id} style={{ 
            width: '320px', minWidth: '320px', maxHeight: '100%', display: 'flex', flexDirection: 'column',
            background: C.colBg, borderRadius: '12px', border: `1px solid ${C.border}`
          }}>
            {/* Column Header */}
            <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: C.text, fontSize: '15px', fontWeight: 600 }}>{col.name}</h3>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: C.textMuted }}>
                {col.tasks.length}
              </span>
            </div>

            {/* Task List (Vertical Scroll) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <AnimatePresence>
                {col.tasks.map(task => (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    style={{ background: C.cardBg, borderRadius: '8px', padding: '12px', border: `1px solid ${C.border}`, position: 'relative', group: 'card' }}
                  >
                    <div style={{ color: C.text, fontSize: '14px', lineHeight: 1.5 }}>{task.title}</div>
                    
                    {/* Tiny delete button (hover effect simplified for inline) */}
                    <button 
                      onClick={() => handleDeleteTask(col.id, task.id)}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                    {task.description && (
                      <div style={{ color: C.textMuted, fontSize: '12px', marginTop: '8px' }}>≡ Có mô tả</div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add Task Input */}
            <div style={{ padding: '12px', borderTop: `1px solid ${C.border}` }}>
              <input
                value={newTaskTitle[col.id] || ''}
                onChange={e => setNewTaskTitle({ ...newTaskTitle, [col.id]: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') handleAddTask(col.id); }}
                placeholder="+ Thêm nhanh công việc..."
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: '13px' }}
              />
            </div>
          </div>
        ))}

        {/* Add Column Button */}
        <div style={{ width: '320px', minWidth: '320px' }}>
          {!addingCol ? (
            <button 
              onClick={() => setAddingCol(true)}
              style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: `1px dashed ${C.border}`, borderRadius: '12px', color: C.text, fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
            >
              + Thêm Cột Mới
            </button>
          ) : (
            <form onSubmit={handleAddColumn} style={{ background: C.colBg, padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
              <input 
                autoFocus
                value={newColName} onChange={e => setNewColName(e.target.value)}
                placeholder="Tên cột..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px', color: C.text, fontSize: '14px', outline: 'none', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ flex: 1, padding: '8px', background: C.accent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Thêm</button>
                <button type="button" onClick={() => setAddingCol(false)} style={{ flex: 1, padding: '8px', background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Huỷ</button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default BoardPage;
