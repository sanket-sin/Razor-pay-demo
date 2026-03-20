import { Navigate } from 'react-router-dom';

/** @deprecated Use /browse — kept for old links. */
export default function BookSessions() {
  return <Navigate to="/browse" replace />;
}
