import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * ProtectedRoute — Guard bảo vệ các route cần authentication.
 *
 * Cách dùng trong App.tsx:
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<DashboardPage />} />
 * </Route>
 *
 * - Nếu chưa đăng nhập → redirect về /login
 * - Nếu đã đăng nhập   → render <Outlet /> (trang con bên trong)
 */
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    // replace=true: không lưu route bị block vào browser history
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
