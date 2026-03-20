import { Navigate } from 'react-router-dom';

/** @deprecated Use /browse — kept for old links. */
export default function Products() {
  return <Navigate to="/browse#products" replace />;
}
