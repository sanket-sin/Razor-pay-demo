import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-ink-800 bg-ink-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="font-display text-lg font-semibold tracking-tight text-white">
            Creator<span className="text-accent">Platform</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link to="/book" className="btn-ghost text-sm hidden sm:inline-flex">
              Book session
            </Link>
            <Link to="/groups" className="btn-ghost text-sm hidden sm:inline-flex">
              Groups
            </Link>
            <Link to="/products" className="btn-ghost text-sm">
              Shop
            </Link>
            {user?.role === 'creator' && (
              <Link to="/creator" className="btn-ghost text-sm">
                Dashboard
              </Link>
            )}
            {user && (
              <Link to="/orders" className="btn-ghost text-sm">
                Orders
              </Link>
            )}
            {user ? (
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Log out
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-ink-800 py-6 text-center text-xs text-slate-500">
        Creator Platform · React + Vite
      </footer>
    </div>
  );
}
