import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute  from './components/auth/ProtectedRoute';
import AppLayout       from './layouts/AppLayout';
import AuthPage        from './pages/AuthPage';
import DashboardPage   from './pages/DashboardPage';
import WorkspacePage   from './pages/WorkspacePage';
import BoardPage       from './pages/BoardPage';

function App() {
  // `authStore` đã tự khởi tạo session đồng bộ từ localStorage ngay khi tạo file
  // nên không cần useEffect() ở đây nữa, tránh flash UI.

  return (
    <BrowserRouter>
      <Routes>

        {/* ── PUBLIC ROUTES ─────────────────────────────────── */}
        <Route path="/login"    element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

        {/* ── PROTECTED ROUTES ──────────────────────────────── */}
        {/* Bọc trong ProtectedRoute: chưa auth → redirect /login */}
        <Route element={<ProtectedRoute />}>

          {/* App Shell — Sidebar + Header layout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard"          element={<DashboardPage />} />
            <Route path="/workspace/:id"      element={<WorkspacePage />} />
            <Route path="/workspace/:workspaceId/board/:boardId" element={<BoardPage />} />
          </Route>

        </Route>

        {/* ── DEFAULT REDIRECTS ─────────────────────────────── */}
        <Route path="/"   element={<Navigate to="/dashboard" replace />} />
        <Route path="*"   element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;