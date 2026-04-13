import axiosClient from './axiosClient';
import type { ColumnResponse, CreateColumnRequest } from '../types';

export const columnService = {
  /**
   * Lấy danh sách Columns của 1 Board (bao gồm cả các Tasks bên trong)
   */
  getColumnsByBoardId: (boardId: string): Promise<ColumnResponse[]> =>
    axiosClient.get(`/boards/${boardId}/columns`),

  /**
   * Tạo Column mới
   */
  create: (data: CreateColumnRequest): Promise<ColumnResponse> =>
    axiosClient.post('/columns', data),

  /**
   * Xóa Column
   */
  delete: (columnId: string): Promise<void> =>
    axiosClient.delete(`/columns/${columnId}`),
};
