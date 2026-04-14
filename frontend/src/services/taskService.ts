import axiosClient from './axiosClient';
import type { TaskResponse, CreateTaskRequest } from '../types';

export const taskService = {
  /**
   * Lấy thông tin chi tiết Task (kèm Assignees, Comments, Checklists, Activity Logs)
   */
  getById: (taskId: string): Promise<TaskResponse> =>
    axiosClient.get(`/tasks/${taskId}`),

  /**
   * Tạo Task mới trong 1 Column
   */
  create: (data: CreateTaskRequest): Promise<TaskResponse> =>
    axiosClient.post('/tasks', data),

  /**
   * Xóa Task
   */
  delete: (taskId: string): Promise<void> =>
    axiosClient.delete(`/tasks/${taskId}`),

  /**
   * Di chuyển Task (Drag & Drop)
   */
  move: (taskId: string, data: { newColumnId: string, orderIndex: number }): Promise<TaskResponse> =>
    axiosClient.put(`/tasks/${taskId}/move`, data),

  /**
   * Cập nhật chi tiết nội dung (Title, Description)
   */
  updateDetails: (taskId: string, data: { title: string, description?: string, dueDate?: string, labels?: string }): Promise<TaskResponse> =>
    axiosClient.put(`/tasks/${taskId}/details`, data),

  /**
   * Gán người vào task
   */
  assignUser: (taskId: string, userId: string): Promise<TaskResponse> =>
    axiosClient.post(`/tasks/${taskId}/assignees`, { userId }),

  /**
   * Gỡ người khỏi task
   */
  unassignUser: (taskId: string, userIdToUnassign: string): Promise<TaskResponse> =>
    axiosClient.delete(`/tasks/${taskId}/assignees/${userIdToUnassign}`),

  /**
   * Đăng bình luận
   */
  addComment: (taskId: string, content: string): Promise<any> =>
    axiosClient.post(`/tasks/${taskId}/comments`, { content }),

  /**
   * Tải tài liệu đính kèm lên Cloudinary qua Backend
   */
  uploadAttachment: (taskId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Xóa đính kèm
   */
  deleteAttachment: (taskId: string, attachmentId: string): Promise<void> =>
    axiosClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`),

  /**
   * Quản lý Checklist
   */
  addChecklist: (taskId: string, content: string): Promise<any> =>
    axiosClient.post(`/tasks/${taskId}/checklists`, { content }),

  toggleChecklist: (taskId: string, checklistId: string): Promise<any> =>
    axiosClient.patch(`/tasks/${taskId}/checklists/${checklistId}/toggle`),

  updateChecklist: (taskId: string, checklistId: string, content: string): Promise<any> =>
    axiosClient.put(`/tasks/${taskId}/checklists/${checklistId}`, { content }),

  deleteChecklist: (taskId: string, checklistId: string): Promise<void> =>
    axiosClient.delete(`/tasks/${taskId}/checklists/${checklistId}`)
};
