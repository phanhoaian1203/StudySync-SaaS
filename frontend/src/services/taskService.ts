import axiosClient from './axiosClient';
import type { TaskResponse, CreateTaskRequest } from '../types';

export const taskService = {
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
    axiosClient.delete(`/tasks/${taskId}/assignees/${userIdToUnassign}`)
};
