import axiosClient from './axiosClient';
import type { WorkspaceResponse, CreateWorkspaceRequest, WorkspaceMemberResponse } from '../types';

export const workspaceService = {
  /**
   * Lấy danh sách Workspace của user hiện tại.
   * GET /api/workspaces
   */
  getMyWorkspaces: (): Promise<WorkspaceResponse[]> =>
    axiosClient.get('/workspaces'),

  /**
   * Lấy chi tiết 1 Workspace.
   * GET /api/workspaces/:id
   */
  getById: (id: string): Promise<WorkspaceResponse> =>
    axiosClient.get(`/workspaces/${id}`),

  /**
   * Tạo Workspace mới. Backend kiểm tra quota Free tier (tối đa 3).
   * POST /api/workspaces
   */
  create: (data: CreateWorkspaceRequest): Promise<WorkspaceResponse> =>
    axiosClient.post('/workspaces', data),

  /** Xóa Workspace */
  delete: (id: string): Promise<void> => 
    axiosClient.delete(`/workspaces/${id}`),

  /** Lấy danh sách thành viên */
  getMembers: (id: string): Promise<WorkspaceMemberResponse[]> =>
    axiosClient.get(`/workspaces/${id}/members`),

  /** Mời thành viên bằng Email */
  addMember: (id: string, email: string): Promise<WorkspaceMemberResponse> =>
    axiosClient.post(`/workspaces/${id}/members`, { email })
};
