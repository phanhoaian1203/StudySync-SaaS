import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { boardService } from '../services/boardService';
import { columnService } from '../services/columnService';
import { taskService } from '../services/taskService';
import TaskModal from '../components/board/TaskModal';
import type { BoardResponse, ColumnResponse, TaskResponse } from '../types';

/* ─────────────────────────────────────────────────────────────────
   Design tokens
───────────────────────────────────────────────────────────────── */
const C = {
  bg: '#0c111d',
  colBg: 'rgba(255,255,255,0.03)',
  cardBg: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#4f6ef2',
  text: '#e8ecf4',
  textMuted: 'rgba(148,163,184,0.7)',
};

// Hàm helper để đổ màu cột dựa theo tên
const getColumnColor = (name: string) => {
  const norm = name.toLowerCase();
  if (norm.includes('to do') || norm.includes('todo') || norm.includes('chưa làm')) return '#64748b'; // Xám dịu
  if (norm.includes('progress') || norm.includes('đang làm') || norm.includes('doing')) return '#f59e0b'; // Vàng cam
  if (norm.includes('done') || norm.includes('hoàn thành') || norm.includes('xong')) return '#10b981'; // Xanh lá
  return C.accent; // Mặc định
};

/* ─────────────────────────────────────────────────────────────────
   BoardPage Component
───────────────────────────────────────────────────────────────── */
const BoardPage = () => {
  const { boardId } = useParams<{ workspaceId: string, boardId: string }>();
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [columns, setColumns] = useState<ColumnResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs Project Jira-like
  const [activeTab, setActiveTab] = useState<'summary' | 'backlog' | 'board'>('board');

  // Quick Add UI states
  const [newTaskTitle, setNewTaskTitle] = useState<{ [colId: string]: string }>({});
  const [newColName, setNewColName] = useState('');
  const [addingCol, setAddingCol] = useState(false);

  // Mở Task Modal Detail
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);

  // 1. Khởi tạo Data
  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    Promise.all([
      boardService.getById(boardId),
      columnService.getColumnsByBoardId(boardId)
    ])
    .then(([bData, cData]) => {
      setBoard(bData);
      
      // Đảm bảo mảng task được sort theo OrderIndex
      const sortedCols = cData.map(col => ({
        ...col,
        tasks: col.tasks.sort((a, b) => a.orderIndex - b.orderIndex)
      }));
      setColumns(sortedCols);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [boardId]);

  // 2. Logic Kéo Thả (Drag & Drop)
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Kéo thả ra ngoài cột hợp lệ
    if (!destination) return;
    
    // Không chuyển vị trí
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;
    const dropIndex = destination.index;

    // Tìm Card đang được kéo
    let draggedTask: TaskResponse | undefined;
    const sourceCol = columns.find(c => c.id === sourceColId)!;
    draggedTask = sourceCol.tasks.find(t => t.id === draggableId);
    
    if (!draggedTask) return;

    // BƯỚC 1: Tính toán OrderIndex mới (Thuật toán cân bằng số thập phân)
    let newOrderIndex = 0;
    const destCol = columns.find(c => c.id === destColId)!;
    // Dọn các mảng tạm để tính toán (lọc bỏ chính nó nếu thả cùng cột)
    const cleanDestTasks = destColId === sourceColId 
      ? destCol.tasks.filter(t => t.id !== draggableId) 
      : [...destCol.tasks];

    if (cleanDestTasks.length === 0) {
      newOrderIndex = 1000;
    } else if (dropIndex === 0) {
      newOrderIndex = cleanDestTasks[0].orderIndex / 2;
    } else if (dropIndex === cleanDestTasks.length) {
      newOrderIndex = cleanDestTasks[cleanDestTasks.length - 1].orderIndex + 1000;
    } else {
      const prev = cleanDestTasks[dropIndex - 1].orderIndex;
      const next = cleanDestTasks[dropIndex].orderIndex;
      newOrderIndex = (prev + next) / 2;
    }

    // BƯỚC 2: Cập nhật Optimistic UI (Giao diện tức thì)
    const updatedTask = { ...draggedTask, columnId: destColId, orderIndex: newOrderIndex };
    
    setColumns(prevCols => {
      const newCols = [...prevCols];
      
      // Xóa thẻ ở cột cũ
      const srcIdx = newCols.findIndex(c => c.id === sourceColId);
      newCols[srcIdx] = { 
        ...newCols[srcIdx], 
        tasks: newCols[srcIdx].tasks.filter(t => t.id !== draggableId)
      };

      // Thêm thẻ vào cột mới ở đúng vị trí thả
      const destIdx = newCols.findIndex(c => c.id === destColId);
      const newDestTasks = [...newCols[destIdx].tasks];
      newDestTasks.splice(dropIndex, 0, updatedTask);
      newCols[destIdx] = { ...newCols[destIdx], tasks: newDestTasks };

      return newCols;
    });

    // BƯỚC 3: Gọi API chạy ngầm
    try {
      await taskService.move(draggableId, {
        newColumnId: destColId,
        orderIndex: newOrderIndex
      });
    } catch (e) {
      console.error("Lỗi đồng bộ Kéo thả", e);
      // Optional: Nếu lỗi, fetch lại data để resync giao diện.
    }
  };

  // 3. Logic Tạo / Xóa cơ bản
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
    } catch (e) { console.error(e); }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !boardId) return;

    try {
      const col = await columnService.create({ boardId, name: newColName.trim() });
      setColumns([...columns, col]);
      setNewColName('');
      setAddingCol(false);
    } catch (e) { console.error(e); }
  };

  const handleDeleteTask = async (columnId: string, taskId: string) => {
    try {
      await taskService.delete(taskId);
      setColumns(cols => cols.map(c => {
        if (c.id === columnId) return { ...c, tasks: c.tasks.filter(t => t.id !== taskId) };
        return c;
      }));
    } catch (e) { console.error(e); }
  };

  const handleUpdateTaskFromModal = (updatedTask: TaskResponse) => {
    setColumns(cols => cols.map(c => {
      if (c.id === updatedTask.columnId) {
        return {
          ...c,
          tasks: c.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
        };
      }
      return c;
    }));
    setSelectedTask(prev => prev && prev.id === updatedTask.id ? updatedTask : prev);
  };

  // ── RENDER ──────────────────────────────────────────────────────────
  if (loading) return <div style={{ color: C.text }}>Đang tải Kanban Board...</div>;
  if (!board) return <div style={{ color: '#fca5a5' }}>Không tìm thấy Board.</div>;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Tiêu đề ─── */}
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ color: C.text, fontSize: '24px', fontWeight: 800, margin: '0 0 16px 0' }}>{board.name}</h1>

        {/* ── Thanh Tabs Điều Hướng (Project Tabs) ─── */}
        <div style={{ display: 'flex', gap: '24px', borderBottom: `1px solid ${C.border}`, marginBottom: '24px' }}>
          {[
            { id: 'summary', label: 'Tổng quan' },
            { id: 'backlog', label: 'Backlog' },
            { id: 'board', label: 'Bảng Kanban' },
          ].map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                paddingBottom: '12px',
                color: activeTab === tab.id ? C.accent : C.textMuted,
                fontWeight: activeTab === tab.id ? 600 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? `3px solid ${C.accent}` : '3px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── PLACEHOLDER VIEWS ─── */}
      {activeTab === 'summary' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.colBg, borderRadius: '12px', border: `1px dashed ${C.border}` }}>
          <div style={{ textAlign: 'center', color: C.textMuted }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h2 style={{ color: C.text, fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>Tổng quan dự án</h2>
            <p style={{ margin: 0, fontSize: '14px' }}>Tính năng biểu đồ báo cáo Velocity đang được phát triển...</p>
          </div>
        </div>
      )}

      {activeTab === 'backlog' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.colBg, borderRadius: '12px', border: `1px dashed ${C.border}` }}>
          <div style={{ textAlign: 'center', color: C.textMuted }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h2 style={{ color: C.text, fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>Backlog Manager</h2>
            <p style={{ margin: 0, fontSize: '14px' }}>Nơi lên danh sách tác vụ chờ (Sprint Planning) sẽ có mặt tại đây...</p>
          </div>
        </div>
      )}

      {/* ── Drag Context Khu Vực Kanban ngang ─── */}
      {activeTab === 'board' && (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{ 
          display: 'flex', gap: '20px', overflowX: 'auto', overflowY: 'hidden', 
          flex: 1, paddingBottom: '16px' 
        }}>
          
          {columns.map(col => {
            const colColor = getColumnColor(col.name);
            const isDoneList = colColor === '#10b981'; // Check xem có phải cột Done không

            return (
            <div key={col.id} style={{ 
              width: '320px', minWidth: '320px', maxHeight: '100%', display: 'flex', flexDirection: 'column',
              background: C.colBg, borderRadius: '12px', border: `1px solid ${C.border}`,
              borderTop: `4px solid ${colColor}` // Highlight màu trên đầu cột
            }}>
              
              {/* Column Header */}
              <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: C.text, fontSize: '15px', fontWeight: 600 }}>{col.name}</h3>
                <span style={{ background: `${colColor}22`, padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: colColor, fontWeight: 700 }}>
                  {col.tasks.length}
                </span>
              </div>

              {/* ── VÙNG THẢ (DROPPABLE) ─── */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ 
                      flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px',
                      background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.02)' : 'transparent',
                      transition: 'background 0.2s ease',
                      minHeight: '10px' // Đảm bảo luôn Drop được kể cả rỗng
                    }}
                  >
                    {col.tasks.map((task, index) => (
                      
                      /* ── THẺ KÉO (DRAGGABLE) ─── */
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setSelectedTask(task)} // Click Mở Modal
                            style={{
                              background: snapshot.isDragging ? 'rgba(30,41,59,0.95)' : C.cardBg,
                              borderRadius: '8px', padding: '12px',
                              border: snapshot.isDragging ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                              boxShadow: snapshot.isDragging ? '0 12px 24px rgba(0,0,0,0.5)' : 'none',
                              backdropFilter: snapshot.isDragging ? 'blur(10px)' : 'none',
                              position: 'relative',
                              cursor: 'pointer',
                              ...provided.draggableProps.style // Quan trọng: giữ style inline của dnd
                            }}
                          >
                            <div style={{ 
                              color: isDoneList ? C.textMuted : C.text, 
                              fontSize: '14px', lineHeight: 1.5, paddingRight: '20px',
                              textDecoration: isDoneList && !snapshot.isDragging ? 'line-through' : 'none',
                              opacity: isDoneList && !snapshot.isDragging ? 0.7 : 1,
                              transition: 'all 0.2s ease'
                            }}>
                              {task.title}
                            </div>
                            
                            {/* Nút xóa */}
                            {!snapshot.isDragging && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(col.id, task.id); }}
                                style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: '12px' }}
                              >
                                ✕
                              </button>
                            )}
                            {task.description && (
                              <div style={{ color: C.textMuted, fontSize: '12px', marginTop: '8px' }}>≡ Có mô tả</div>
                            )}
                          </div>
                        )}
                      </Draggable>

                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Add Task Input */}
              <div style={{ padding: '12px', borderTop: `1px solid ${C.border}` }}>
                <input
                  value={newTaskTitle[col.id] || ''}
                  onChange={e => setNewTaskTitle({ ...newTaskTitle, [col.id]: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTask(col.id); }}
                  placeholder="+ Thêm công việc..."
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: '13px' }}
                />
              </div>
            </div>
            );
          })}

          {/* ── Cột [+] Thêm ─── */}
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
                  autoFocus value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="Tên cột..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px', color: C.text, fontSize: '14px', outline: 'none', marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" style={{ flex: 1, padding: '8px', background: C.accent, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Lưu</button>
                  <button type="button" onClick={() => setAddingCol(false)} style={{ flex: 1, padding: '8px', background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Huỷ</button>
                </div>
              </form>
            )}
          </div>

        </div>
      </DragDropContext>
      )}

      {/* ── Task Modal Layer ── */}
      <AnimatePresence>
        {selectedTask && (
          <TaskModal 
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdateTask={handleUpdateTaskFromModal}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default BoardPage;
