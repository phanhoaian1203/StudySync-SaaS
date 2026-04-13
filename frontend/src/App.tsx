import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute  from './components/auth/ProtectedRoute';
import AppLayout       from './layouts/AppLayout';
import AuthPage        from './pages/AuthPage';
import DashboardPage   from './pages/DashboardPage';
import WorkspacePage   from './pages/WorkspacePage';
import BoardPage       from './pages/BoardPage';

function App() {
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  // Khôi phục session từ localStorage TRƯỚC KHI render routes
  // → Tránh flash: user đã login nhưng bị redirect về /login 1 frame
  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

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