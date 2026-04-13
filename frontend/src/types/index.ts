// ─────────────────────────────────────────────────────────────────
// Global TypeScript type definitions — dùng chung toàn bộ frontend
// ─────────────────────────────────────────────────────────────────

// ── AUTH ──────────────────────────────────────────────────────────
export type SubscriptionPlan = 0 | 1; // 0=Free, 1=Pro

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  subscriptionPlan: number;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  fullName: string;
  subscriptionPlan: SubscriptionPlan;
}

// ── WORKSPACE ─────────────────────────────────────────────────────
export interface WorkspaceResponse {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberCount: number;
  boardCount: number;
  createdAt: string;
}

export interface WorkspaceMemberResponse {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

// ── BOARD ─────────────────────────────────────────────────────────
export interface CreateBoardRequest {
  name: string;
}

export interface BoardResponse {
  id: string;
  workspaceId: string;
  name: string;
  isFavorite: boolean;
  createdAt: string;
}

// ── COLUMN & TASK ──────────────────────────────────────────────────
export interface CreateColumnRequest {
  boardId: string;
  name: string;
}

export interface CreateTaskRequest {
  columnId: string;
  title: string;
  description?: string;
}

export interface MoveTaskRequest {
  newColumnId: string;
  orderIndex: number;
}

export interface UpdateTaskDetailsRequest {
  title: string;
  description?: string;
}

export interface TaskResponse {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  dueDate?: string;
  orderIndex: number;
  createdAt: string;
  assignees?: UserDto[];
}

export interface ColumnResponse {
  id: string;
  boardId: string;
  name: string;
  orderIndex: number;
  tasks: TaskResponse[];
}

// ── API PAGINATION ────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
