import axios, { AxiosError } from 'axios';

// ─────────────────────────────────────────────────────────────────
// Custom Error Class — Chuẩn hóa mọi lỗi từ API thành 1 định dạng
// ─────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  public readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ─────────────────────────────────────────────────────────────────
// Helper: Trích xuất message từ nhiều định dạng lỗi khác nhau
// ─────────────────────────────────────────────────────────────────
function extractErrorMessage(error: AxiosError): string {
  // Case 1: Không kết nối được server (CORS, server tắt, network...)
  if (!error.response) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
  }

  const data = error.response.data as Record<string, unknown> | null;

  if (!data) {
    return `Lỗi từ máy chủ (HTTP ${error.response.status}).`;
  }

  // Case 2: Format từ GlobalExceptionHandlerMiddleware của chúng ta
  // { statusCode: 409, message: "Email này đã được sử dụng!", timestamp: "..." }
  if (typeof data.message === 'string' && data.message) {
    return data.message;
  }

  // Case 3: ASP.NET [ApiController] Validation Error format
  // { errors: { "Email": ["Email là bắt buộc"], "Password": ["..."] } }
  if (data.errors && typeof data.errors === 'object') {
    const validationErrors = Object.values(data.errors as Record<string, string[]>)
      .flat()
      .filter(Boolean);

    if (validationErrors.length > 0) {
      return validationErrors.join('; ');
    }
  }

  // Case 4: ASP.NET ProblemDetails format
  // { title: "One or more validation errors occurred.", type: "..." }
  if (typeof data.title === 'string' && data.title) {
    return data.title;
  }

  // Case 5: Fallback cuối cùng với HTTP code
  return `Đã xảy ra lỗi (HTTP ${error.response.status}). Vui lòng thử lại.`;
}

// ─────────────────────────────────────────────────────────────────
// Axios Instance
// ─────────────────────────────────────────────────────────────────
const axiosClient = axios.create({
  baseURL: 'https://localhost:7150/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── REQUEST INTERCEPTOR: Gắn JWT Token vào mọi request ──────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('studySync_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR: Chuẩn hóa cả success và error ─────────
axiosClient.interceptors.response.use(
  // Success: Unwrap data trực tiếp, component không cần .data
  (response) => response.data,

  // Error: Chuyển mọi lỗi thành ApiError với message đã xử lý
  (error: AxiosError) => {
    const message = extractErrorMessage(error);
    const status  = error.response?.status ?? null;
    return Promise.reject(new ApiError(message, status));
  }
);

export default axiosClient;