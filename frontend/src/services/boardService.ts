import axiosClient from './axiosClient';
import type { BoardResponse, CreateBoardRequest } from '../types';

export const boardService = {
  /**
   * Lấy danh sách Boards trong 1 Workspace
   */
  getBoardsByWorkspaceId: (workspaceId: string): Promise<BoardResponse[]> =>
    axiosClient.get(`/workspaces/${workspaceId}/boards`),

  /**
   * Lấy chi tiết 1 Board
   */
  getById: (boardId: string): Promise<BoardResponse> =>
    axiosClient.get(`/boards/${boardId}`),

  /**
   * Tạo Board mới (tự động tạo 3 cột To Do, In Progress, Done ở Backend)
   */
  create: (workspaceId: string, data: Omit<CreateBoardRequest, 'workspaceId'>): Promise<BoardResponse> =>
    axiosClient.post(`/workspaces/${workspaceId}/boards`, { ...data, workspaceId }),

  /**
   * Xóa Board
   */
  delete: (boardId: string): Promise<void> =>
    axiosClient.delete(`/boards/${boardId}`),
};
