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

const PREDEFINED_LABELS = [
  { id: '1', name: 'Khẩn cấp', color: '#ef4444' },
  { id: '2', name: 'Tính năng', color: '#3b82f6' },
  { id: '3', name: 'Bug', color: '#f59e0b' },
  { id: '4', name: 'Nghiên cứu', color: '#a855f7' }
];

export default function TaskModal({ task, members, onClose, onUpdateTask }: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState<string>(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
  const [labels, setLabels] = useState<any[]>(task.labels ? JSON.parse(task.labels) : []);
  const [comments, setComments] = useState<any[]>(task.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAssignDrop, setShowAssignDrop] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
    setLabels(task.labels ? JSON.parse(task.labels) : []);
    setComments(task.comments || []);
  }, [task]);

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    try {
      const newCmt = await taskService.addComment(task.id, commentText);
      const newCommentsList = [...comments, newCmt];
      setComments(newCommentsList);
      setCommentText('');
      
      // Khắc phục lỗi MẤT DỮ LIỆU BÌNH LUẬN: Đẩy ngược dữ liệu danh sách comment mới lên Component Cha (BoardPage)
      onUpdateTask({ ...task, comments: newCommentsList });
    } catch {
      alert('Lỗi đăng bình luận!');
    }
  };

  // Handle auto-save locally to API when changed
  const saveChanges = async (newTitle: string, newDesc: string, newDate?: string, newLabels?: string) => {
    if (!newTitle.trim()) return; // Don't save empty title

    setIsSaving(true);
    try {
      const updated = await taskService.updateDetails(task.id, {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        dueDate: newDate || undefined,
        labels: newLabels || undefined
      });
      onUpdateTask(updated);
    } catch (e) {
      console.error("Failed to save task details", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Immediate save on Blur (Title)
  const handleTitleBlur = () => {
    saveChanges(title, description, dueDate, labels.length ? JSON.stringify(labels) : undefined);
  };
  
  const handleDescriptionBlur = () => {
    setIsEditingMode(false);
    saveChanges(title, description, dueDate, labels.length ? JSON.stringify(labels) : undefined);
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
           saveChanges(title, description, dueDate, labels.length ? JSON.stringify(labels) : undefined);
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

            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: C.textMuted, display: 'block' }}>Mô tả</span>
                {isEditingMode && (
                   <button onClick={handleDescriptionBlur} style={{ background: C.accent, color: '#fff', border: 'none', padding: '4px 12px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer' }}>
                     Lưu mô tả
                   </button>
                )}
              </div>

              {!isEditingMode ? (
                <div 
                  onClick={() => setIsEditingMode(true)}
                  style={{ 
                    padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: `1px solid transparent`,
                    minHeight: '60px', cursor: 'pointer', transition: 'border 0.2s'
                  }}
                  title="Nhấn để chỉnh sửa mô tả"
                >
                  {description ? (
                     <div data-color-mode="dark">
                       <MDEditor.Markdown source={description} style={{ backgroundColor: 'transparent', fontSize: '14px', color: C.text }} />
                     </div>
                  ) : (
                     <span style={{ color: C.textMuted, fontSize: '14px', fontStyle: 'italic' }}>Thêm mô tả chi tiết...</span>
                  )}
                </div>
              ) : (
                <div data-color-mode="dark">
                  <MDEditor
                    value={description}
                    onChange={val => setDescription(val || '')}
                    preview="edit"
                    height={300}
                    style={{ backgroundColor: C.inputBg }}
                  />
                </div>
              )}
            </div>
            
            {/* COMMENTS ACTIVITY SECTION */}
            <div style={{ marginTop: '32px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: C.text, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Hoạt động</span>
              </h4>

              {/* Nhập Comment */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.accent, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
                  ME
                </div>
                <div style={{ flex: 1 }}>
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Viết bình luận..."
                    style={{ width: '100%', minHeight: '60px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '14px', outline: 'none', resize: 'vertical' }}
                    onKeyDown={e => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handlePostComment();
                       }
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button onClick={handlePostComment} style={{ background: C.accent, color: '#fff', border: 'none', padding: '6px 16px', fontSize: '13px', borderRadius: '4px', cursor: 'pointer', opacity: commentText.trim() ? 1 : 0.5 }} disabled={!commentText.trim()}>
                      Lưu
                    </button>
                  </div>
                </div>
              </div>

              {/* Danh sách Comment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {comments.map(cmt => (
                   <div key={cmt.id} style={{ display: 'flex', gap: '12px' }}>
                     <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#334155', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff' }}>
                        {cmt.user.fullName.charAt(0).toUpperCase()}
                     </div>
                     <div style={{ flex: 1 }}>
                       <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                         <span style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>{cmt.user.fullName}</span>
                         <span style={{ fontSize: '12px', color: C.textMuted }}>
                            {new Date(cmt.createdAt).toLocaleString('vi-VN')}
                         </span>
                       </div>
                       <div style={{ fontSize: '14px', color: C.text, lineHeight: 1.5, background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '0 8px 8px 8px', width: 'fit-content', border: `1px solid ${C.border}` }}>
                         {cmt.content.split('\n').map((line: string, i: number) => <div key={i}>{line}</div>)}
                       </div>
                     </div>
                   </div>
                ))}
                {comments.length === 0 && <span style={{ color: C.textMuted, fontSize: '13px', fontStyle: 'italic' }}>Chưa có bình luận nào.</span>}
              </div>
            </div>
            
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ flex: 3, padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: C.textMuted, letterSpacing: '0.05em', marginBottom: '16px' }}>
              Người Thực Hiện
            </h4>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
               {task.assignees?.map(assignee => (
                 <div 
                    key={assignee.id} 
                    title={assignee.fullName} 
                    style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: 600, cursor: 'default' }}
                    onMouseEnter={e => {
                      const btn = e.currentTarget.querySelector('.remove-btn') as HTMLButtonElement;
                      if(btn) btn.style.display = 'flex';
                    }}
                    onMouseLeave={e => {
                      const btn = e.currentTarget.querySelector('.remove-btn') as HTMLButtonElement;
                      if(btn) btn.style.display = 'none';
                    }}
                 >
                   {assignee.fullName.charAt(0).toUpperCase()}
                   
                   <button 
                     className="remove-btn"
                     onClick={() => handleToggleAssignee(assignee.id)}
                     title="Xóa thành viên này"
                     style={{
                       display: 'none', position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#ef4444', color: '#fff', border: '1px solid #fff', fontSize: '10px', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
                     }}
                   >
                     ✕
                   </button>
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
                 <span style={{ fontSize: '13px', color: C.textMuted, display: 'block', marginBottom: '4px' }}>Hạn chót (Due Date)</span>
                 <input 
                   type="datetime-local" 
                   value={dueDate}
                   onChange={e => {
                     setDueDate(e.target.value);
                     saveChanges(title, description, e.target.value, labels.length ? JSON.stringify(labels) : undefined);
                   }}
                   style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text, padding: '8px', borderRadius: '6px', outline: 'none', fontSize: '13px', colorScheme: 'dark' }}
                 />
               </div>

               <div style={{ marginTop: '16px' }}>
                 <span style={{ fontSize: '13px', color: C.textMuted, display: 'block', marginBottom: '8px' }}>Nhãn màu</span>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                   {PREDEFINED_LABELS.map(lbl => {
                     const isActive = labels.some(l => l.id === lbl.id);
                     return (
                       <button
                         key={lbl.id}
                         onClick={() => {
                           const newLabels = isActive ? labels.filter(l => l.id !== lbl.id) : [...labels, lbl];
                           setLabels(newLabels);
                           saveChanges(title, description, dueDate, newLabels.length ? JSON.stringify(newLabels) : undefined);
                         }}
                         style={{
                           padding: '4px 10px', fontSize: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                           background: isActive ? lbl.color : 'rgba(255,255,255,0.05)',
                           color: isActive ? '#fff' : C.text,
                           borderBottom: isActive ? 'none' : `2px solid ${lbl.color}`,
                           transition: 'all 0.2s'
                         }}
                       >
                         {lbl.name}
                       </button>
                     );
                   })}
                 </div>
               </div>

               <div style={{ marginTop: '16px' }}>
                 <span style={{ fontSize: '13px', color: C.textMuted, display: 'block', marginBottom: '4px' }}>Trạng thái Bảng</span>
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


