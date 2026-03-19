import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export default function ProtectedRoute({ children, role }) {
  const { token, user } = useAuthStore();
  const loc = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }
  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}
