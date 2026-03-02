import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, ScanLine, LayoutDashboard, LogOut, LogIn, Globe } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Events', path: '/', icon: Globe, show: true },
    { name: 'Wallet', path: '/wallet', icon: Ticket, show: user?.role === 'client' || !user },
    { name: 'Scanner', path: '/scanner', icon: ScanLine, show: user?.role === 'staff' || user?.role === 'admin' },
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, show: user?.role === 'admin' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 15 }}
                className="relative w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              >
                <Globe className="w-6 h-6 text-white z-10" />
                {/* Animated Rings */}
                <motion.div 
                  className="absolute inset-[-20%] border-[3px] border-indigo-300/40 rounded-full"
                  style={{ transform: 'rotateX(70deg)' }}
                  animate={{ rotateZ: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div 
                  className="absolute inset-[-40%] border-[1px] border-indigo-400/20 rounded-full"
                  style={{ transform: 'rotateX(60deg) rotateY(20deg)' }}
                  animate={{ rotateZ: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
              <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">Gravity</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navItems.filter(item => item.show).map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-white",
                    location.pathname === item.path ? "text-white" : "text-zinc-400"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-zinc-500 capitalize">{user.role}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 bg-zinc-950/90 backdrop-blur-lg pb-safe">
        <div className="flex items-center justify-around p-3">
          {navItems.filter(item => item.show).map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors",
                location.pathname === item.path ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
