import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import BookSessions from './pages/BookSessions.jsx';
import GroupSessions from './pages/GroupSessions.jsx';
import Products from './pages/Products.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import CreatorDashboard from './pages/CreatorDashboard.jsx';
import CreateSession from './pages/CreateSession.jsx';
import CreateGroupSession from './pages/CreateGroupSession.jsx';
import CreateProduct from './pages/CreateProduct.jsx';
import PaymentTest from './pages/PaymentTest.jsx';
import MyBookings from './pages/MyBookings.jsx';

function HydrateAuth() {
  const hydrateToken = useAuthStore((s) => s.hydrateToken);
  useEffect(() => {
    hydrateToken();
  }, [hydrateToken]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <HydrateAuth />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="book" element={<BookSessions />} />
          <Route path="groups" element={<GroupSessions />} />
          <Route path="products" element={<Products />} />
          <Route
            path="bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="payment-test"
            element={
              <ProtectedRoute>
                <PaymentTest />
              </ProtectedRoute>
            }
          />
          <Route path="checkout/:productId" element={<Checkout />} />
          <Route
            path="orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="creator"
            element={
              <ProtectedRoute role="creator">
                <CreatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="creator/session/new"
            element={
              <ProtectedRoute role="creator">
                <CreateSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="creator/group/new"
            element={
              <ProtectedRoute role="creator">
                <CreateGroupSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="creator/product/new"
            element={
              <ProtectedRoute role="creator">
                <CreateProduct />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
