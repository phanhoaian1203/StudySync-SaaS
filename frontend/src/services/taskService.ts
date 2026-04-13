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
};
