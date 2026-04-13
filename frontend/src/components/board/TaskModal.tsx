import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import MDEditor from '@uiw/react-md-editor';
import { taskService } from '../../services/taskService';
import type { TaskResponse, WorkspaceMemberResponse } from '../../types';

/* ─────────────────────────────────────────────────────────────────
   Design tokens
───────────────────────────────────────────────────────────────── */
const C = {
  bg: '#111827',
  border: 'rgba(255,255,255,0.1)',
  accent: '#4f6ef2',
  text: '#e8ecf4',
  textMuted: 'rgba(148,163,184,0.7)',
  hover: 'rgba(255,255,255,0.05)',
  inputBg: 'rgba(255,255,255,0.03)',
};

interface TaskModalProps {
  task: TaskResponse;
  members: WorkspaceMemberResponse[];
  onClose: () => void;
  onUpdateTask: (updatedTask: TaskResponse) => void;
}

export default function TaskModal({ task, members, onClose, onUpdateTask }: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showAssignDrop, setShowAssignDrop] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
  }, [task]);

  // Handle auto-save locally to API when changed
  const saveChanges = async (newTitle: string, newDesc: string) => {
    if (!newTitle.trim()) return; // Don't save empty title
    if (newTitle === task.title && newDesc === (task.description || '')) return;

    setIsSaving(true);
    try {
      const updated = await taskService.updateDetails(task.id, {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined
      });
      onUpdateTask(updated);
    } catch (e) {
      console.error("Failed to save task details", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Debounce description typing logic (Save after 1.5s typing pause)
  const handleDescriptionChange = (val?: string) => {
    const newVal = val || '';
    setDescription(newVal);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveChanges(title, newVal);
    }, 1500);
  };

  // Immediate save on Blur (Title)
  const handleTitleBlur = () => {
    saveChanges(title, description);
  };

  const handleToggleAssignee = async (memberId: string) => {
    try {
      const isAssigned = task.assignees?.some(a => a.id === memberId);
      let updatedTask;
      if (isAssigned) {
         updatedTask = await taskService.unassignUser(task.id, memberId);
      } else {
         updatedTask = await taskService.assignUser(task.id, memberId);
      }
      onUpdateTask(updatedTask);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi gán thành viên!");
    }
  };

  return (
    <div 
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      // Bấm lớp mờ ngoài cùng thì đóng Modal
      onClick={() => {
        // Force save before closing if pending
        if (timeoutRef.current) {
           clearTimeout(timeoutRef.current);
           saveChanges(title, description);
        }
        onClose();
      }}
    >
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
      />

      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()} // Chặn sự kiện click ra ngoài
        style={{
          position: 'relative', width: '900px', maxWidth: '90vw', height: '80vh',
          background: C.bg, borderRadius: '16px', border: `1px solid ${C.border}`,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header Ribbon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: C.textMuted, display: 'flex', gap: '8px' }}>
            <span>Thẻ công việc</span>
            {isSaving && <span style={{ color: C.accent }}>Đang lưu...</span>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: '20px' }}>
            &times;
          </button>
        </div>

        {/* Modal Body: Left Content (70%) + Right Sidebar (30%) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* LEFT CONTENT */}
          <div style={{ flex: 7, padding: '24px', overflowY: 'auto', borderRight: `1px solid ${C.border}` }}>
            
            {/* Title Editor */}
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Nhập tiêu đề thẻ..."
              style={{
                width: '100%', fontSize: '24px', fontWeight: 700, color: C.text,
                background: 'transparent', border: 'none', outline: 'none',
                marginBottom: '24px', padding: '4px 8px', marginLeft: '-8px', borderRadius: '6px'
              }}
              onFocus={(e) => (e.target as HTMLInputElement).style.background = C.inputBg}
              onMouseLeave={(e) => { if (document.activeElement !== e.target) (e.target as HTMLInputElement).style.background = 'transparent'; }}
              onMouseEnter={(e) => { if (document.activeElement !== e.target) (e.target as HTMLInputElement).style.background = C.hover; }}
            />

            {/* Description MDEditor */}
            <h3 style={{ fontSize: '15px', color: C.text, fontWeight: 600, marginBottom: '12px' }}>Văn bản mô tả</h3>
            <div data-color-mode="dark">
              <MDEditor
                value={description}
                onChange={handleDescriptionChange}
                height={400}
                previewOptions={{
                  style: { background: 'transparent' }
                }}
              />
            </div>
            
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ flex: 3, padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: C.textMuted, letterSpacing: '0.05em', marginBottom: '16px' }}>
              Người Thực Hiện
            </h4>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
               {task.assignees?.map(assignee => (
                 <div key={assignee.id} title={assignee.fullName} style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: 600 }}>
                   {assignee.fullName.charAt(0).toUpperCase()}
                 </div>
               ))}
               
               {/* Nút cộng Assignees */}
               <div style={{ position: 'relative' }}>
                 <button 
                   onClick={() => setShowAssignDrop(!showAssignDrop)}
                   style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'transparent', border: `1px dashed ${C.textMuted}`, color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                 >
                   +
                 </button>
                 
                 {/* Dropdown members */}
                 {showAssignDrop && (
                   <div style={{ position: 'absolute', top: '40px', left: 0, width: '200px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                      {members.map(m => {
                        const isAssigned = task.assignees?.some(a => a.id === m.userId);
                        return (
                          <div 
                            key={m.userId}
                            onClick={() => handleToggleAssignee(m.userId)}
                            style={{ padding: '8px 12px', fontSize: '13px', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isAssigned ? 'rgba(255,255,255,0.05)' : 'transparent', borderBottom: `1px solid ${C.border}` }}
                            onMouseEnter={e => (e.target as HTMLDivElement).style.background = C.hover}
                            onMouseLeave={e => { if(!isAssigned) (e.target as HTMLDivElement).style.background = 'transparent' }}
                          >
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
                               <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                 {m.fullName.charAt(0)}
                               </div>
                               <span>{m.fullName}</span>
                             </div>
                             {isAssigned && <span style={{ color: C.accent, fontSize: '12px', pointerEvents: 'none' }}>✓</span>}
                          </div>
                        )
                      })}
                      {members.length === 0 && <div style={{ padding: '8px', fontSize: '12px', color: C.textMuted }}>Không có thành viên.</div>}
                   </div>
                 )}
               </div>
            </div>

            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: C.textMuted, letterSpacing: '0.05em', marginBottom: '16px', marginTop: '32px' }}>
              Thông tin khác
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div>
                 <span style={{ fontSize: '13px', color: C.textMuted, display: 'block', marginBottom: '4px' }}>Trạng thái</span>
                 <div style={{ fontSize: '13px', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', display: 'inline-block' }}>
                   ID Bảng: {task.columnId.slice(0, 8)}...
                 </div>
               </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};


