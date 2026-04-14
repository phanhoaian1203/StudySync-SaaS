import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { boardService } from '../services/boardService';
import { columnService } from '../services/columnService';
import { taskService } from '../services/taskService';
import { workspaceService } from '../services/workspaceService';
import TaskModal from '../components/board/TaskModal';
import type { BoardResponse, ColumnResponse, TaskResponse, WorkspaceMemberResponse } from '../types';

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
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberResponse[]>([]);
  const [error, setError] = useState('');

  // 1. Khởi tạo Data
  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    boardService.getById(boardId)
      .then(res => {
         setBoard(res);
         // Gọi list member đính kèm
         workspaceService.getMembers(res.workspaceId).then(m => setMembers(m)).catch(e => console.error(e));
      })
      .catch(e => { console.error(e); setError('Không thể tải Board'); })
      .finally(() => setLoading(false));

    columnService.getColumnsByBoardId(boardId)
      .then(cData => {
        // Đảm bảo mảng task được sort theo OrderIndex
        const sortedCols = cData.map(col => ({
          ...col,
          tasks: col.tasks.sort((a, b) => a.orderIndex - b.orderIndex)
        })).sort((a, b) => a.orderIndex - b.orderIndex);
        setColumns(sortedCols);
      })
      .catch(e => console.error(e));
  }, [boardId]);

  // 2. Logic Kéo Thả (Drag & Drop)
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // A. Nếu đang kéo thả CỘT (COLUMN)
    if (type === 'column') {
      const newCols = Array.from(columns);
      const [movedCol] = newCols.splice(source.index, 1);
      newCols.splice(destination.index, 0, movedCol);

      // Tính toán lại orderIndex
      const prevOrder = destination.index > 0 ? newCols[destination.index - 1].orderIndex : 0;
      const nextOrder = destination.index < newCols.length - 1 ? newCols[destination.index + 1].orderIndex : prevOrder + 2000;
      const newOrderIndex = (prevOrder + nextOrder) / 2;

      movedCol.orderIndex = newOrderIndex;
      setColumns(newCols);

      try {
        await columnService.moveColumn(draggableId, { orderIndex: newOrderIndex });
      } catch (e) {
        console.error("Move column failed", e);
        // Fallback reload cols if failed
        if (boardId) columnService.getColumnsByBoardId(boardId).then(setColumns);
      }
      return;
    }

    // B. Nếu đang kéo thả THẺ (TASK)
    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;
    const dropIndex = destination.index;

    // Tìm Card đang được kéo
    const sourceCol = columns.find(c => c.id === sourceColId)!;
    const draggedTask = sourceCol.tasks.find(t => t.id === draggableId);
    
    if (!draggedTask) return;

    // BƯỚC 1: Tính toán OrderIndex mới
    let newOrderIndex = 0;
    const destCol = columns.find(c => c.id === destColId)!;
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

    // BƯỚC 2: Cập nhật Optimistic UI
    const updatedTask = { ...draggedTask, columnId: destColId, orderIndex: newOrderIndex };
    
    setColumns(prevCols => {
      const newCols = [...prevCols];
      const srcIdx = newCols.findIndex(c => c.id === sourceColId);
      newCols[srcIdx] = { 
        ...newCols[srcIdx], 
        tasks: newCols[srcIdx].tasks.filter(t => t.id !== draggableId)
      };

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

  const handleAddCol = async () => {
    if (!newColName.trim() || !boardId) return;
    try {
      const col = await columnService.create({ boardId, name: newColName.trim() });
      setColumns([...columns, { ...col, tasks: [] }]);
      setNewColName('');
      setAddingCol(false);
    } catch (e) { console.error(e); }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Xóa cột này?")) return;
    try {
      await columnService.delete(columnId);
      setColumns(cols => cols.filter(c => c.id !== columnId));
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
  if (!board) return <div style={{ color: '#fca5a5' }}>{error || 'Không tìm thấy Board.'}</div>;

  const tabs = [
    { id: 'summary', label: 'Tổng quan' },
    { id: 'backlog', label: 'Backlog' },
    { id: 'board', label: 'Bảng Kanban' },
  ] as const;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Tiêu đề ─── */}
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ color: C.text, fontSize: '24px', fontWeight: 800, margin: '0 0 16px 0' }}>{board.name}</h1>

        {/* ── Thanh Tabs Điều Hướng (Project Tabs) ─── */}
        <div style={{ display: 'flex', gap: '32px', borderBottom: `1px solid ${C.border}`, marginBottom: '24px' }}>
          {tabs.map(t => (
            <div 
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{ paddingBottom: '16px', position: 'relative', cursor: 'pointer', color: activeTab === t.id ? '#fff' : C.textMuted, fontWeight: activeTab === t.id ? 600 : 400, transition: 'all 0.2s' }}
            >
              {t.label}
              {activeTab === t.id && <motion.div layoutId="tab-indicator" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: C.accent, borderRadius: '3px 3px 0 0' }} />}
            </div>
          ))}
          
          <button
             onClick={() => {
               const email = prompt("Nhập Email của thành viên bạn muốn thêm vào Workspace này:");
               if(email && email.trim()) {
                 workspaceService.addMember(board?.workspaceId || '', email.trim())
                   .then(res => {
                      setMembers(prev => [...prev, res]);
                      alert("Đã thêm thành viên thành công!");
                   }).catch(() => alert("Thêm thất bại. User không tồn tại hoặc đã trong phòng."));
               }
             }}
             style={{ marginLeft: 'auto', background: C.accent, color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            Mời Thành Viên
          </button>
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

      {/* ── Bảng Kanban Khu Vực Kéo Thả ── */}
      {activeTab === 'board' && (
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ display: 'flex', gap: '24px', flex: 1, overflowX: 'auto', paddingBottom: '16px' }}
            >
              
              {columns.map((col, index) => {
                const colColor = getColumnColor(col.name);
                const isDoneCol = colColor === '#10b981';

                return (
                  <Draggable key={col.id} draggableId={col.id} index={index}>
                  {(providedCol, snapshotCol) => (
                    <div 
                      ref={providedCol.innerRef}
                      {...providedCol.draggableProps}
                      style={{ 
                        flex: 1, minWidth: '220px', maxWidth: '100%', display: 'flex', flexDirection: 'column', 
                        background: 'rgba(255,255,255,0.02)', borderRadius: '12px', 
                        border: snapshotCol.isDragging ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                        overflow: 'hidden', height: '100%',
                        boxShadow: snapshotCol.isDragging ? '0 12px 24px rgba(0,0,0,0.4)' : 'none',
                        ...providedCol.draggableProps.style
                      }}
                    >
                      {/* Header Cột -> Dùng làm tay nắm Drag Handle */}
                      <div 
                        {...providedCol.dragHandleProps}
                        style={{ padding: '16px', borderBottom: `1px solid ${colColor}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `linear-gradient(180deg, ${colColor}15 0%, transparent 100%)` }}
                      >
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colColor }}></div>
                          {col.name}
                          <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', color: C.textMuted, marginLeft: '4px' }}>
                            {col.tasks.length}
                          </span>
                        </h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleDeleteColumn(col.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '16px', opacity: 0.7 }} title="Xóa Cột">×</button>
                        </div>
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
                              minHeight: '10px'
                            }}
                          >
                            {col.tasks.map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => setSelectedTask(task)}
                                    style={{
                                      background: snapshot.isDragging ? 'rgba(30,41,59,0.95)' : C.cardBg,
                                      borderRadius: '8px', padding: '12px',
                                      border: snapshot.isDragging ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                                      boxShadow: snapshot.isDragging ? '0 12px 24px rgba(0,0,0,0.5)' : 'none',
                                      position: 'relative',
                                      cursor: 'pointer',
                                      ...provided.draggableProps.style
                                    }}
                                  >
                                    {(() => {
                                      const parsedLabels = task.labels ? JSON.parse(task.labels) : [];
                                      const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < new Date().getTime() && !isDoneCol;
                                      return (
                                        <>
                                          {parsedLabels.length > 0 && (
                                            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                              {parsedLabels.map((l: any) => (
                                                <div key={l.id} style={{ height: '8px', width: '32px', borderRadius: '4px', background: l.color }} title={l.name} />
                                              ))}
                                            </div>
                                          )}
                                          
                                          <div style={{ paddingRight: '20px' }}>
                                            <span style={{ fontSize: '14px', color: isDoneCol ? C.textMuted : C.text, textDecoration: isDoneCol ? 'line-through' : 'none', lineHeight: 1.4 }}>
                                              {task.title}
                                            </span>
                                          </div>
                                          
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                            {task.dueDate ? (
                                              <div style={{ fontSize: '11px', fontWeight: 600, color: isOverdue ? '#ef4444' : C.textMuted, background: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', padding: '4px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                ⏱ {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                                              </div>
                                            ) : <div/>}

                                            {task.assignees && task.assignees.length > 0 && (
                                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                {task.assignees.map(a => (
                                                    <div key={a.id} title={a.fullName} style={{ width: '24px', height: '24px', borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', marginLeft: '-6px', border: `2px solid ${C.cardBg}` }}>
                                                      {a.fullName.charAt(0).toUpperCase()}
                                                    </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      );
                                    })()}
                                    {!snapshot.isDragging && (
                                      <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id); }}
                                          style={{ background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '4px', ...({ ':hover': { background: 'rgba(255,255,255,0.1)' } } as any) }}
                                        >
                                          <span style={{ position: 'relative', top: '-4px' }}>...</span>
                                        </button>
                                        
                                        {activeMenuTaskId === task.id && (
                                          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: C.colBg || '#1e293b', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '4px', zIndex: 50, width: '140px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                             <button 
                                               onClick={(e) => { e.stopPropagation(); handleDeleteTask(col.id, task.id); }}
                                               style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', ...({ ':hover': { background: 'rgba(239, 68, 68, 0.1)' } } as any) }}
                                             >
                                                🗑 Xóa thẻ này
                                             </button>
                                          </div>
                                        )}
                                      </div>
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
                  )}
                  </Draggable>
                );
              })}
              
              {/* Nút Tạo Cột Mới Nhỏ Gọn */}
              <div style={{ flex: '0 0 auto' }}>
                {addingCol ? (
                  <div style={{ width: '240px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px', border: `1px dashed ${C.border}` }}>
                    <input autoFocus value={newColName} onChange={e => setNewColName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCol()} placeholder="Nhập tên cột..." style={{ width: '100%', marginBottom: '8px', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.2)', color: C.text, outline: 'none', fontSize: '13px' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleAddCol} style={{ flex: 1, padding: '6px', background: C.accent, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Lưu</button>
                      <button onClick={() => { setAddingCol(false); setNewColName(''); }} style={{ flex: 1, padding: '6px', background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Hủy</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setAddingCol(true)} 
                    title="Tạo cột mới"
                    style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: `1px dashed ${C.border}`, color: C.textMuted, cursor: 'pointer', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', marginTop: '4px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = C.accent; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderColor = C.border; }}
                  >
                    +
                  </button>
                )}
              </div>

            </div>
          )}
        </Droppable>
      </DragDropContext>
      )}

      {/* ── Task Modal Layer ── */}
      <AnimatePresence>
        {selectedTask && (
          <TaskModal 
            task={selectedTask}
            members={members}
            onClose={() => setSelectedTask(null)}
            onUpdateTask={handleUpdateTaskFromModal}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default BoardPage;
