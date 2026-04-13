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
  updateDetails: (taskId: string, data: { title: string, description?: string }): Promise<TaskResponse> =>
    axiosClient.put(`/tasks/${taskId}/details`, data)
};
