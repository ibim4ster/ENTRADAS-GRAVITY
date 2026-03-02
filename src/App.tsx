import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { EventDetails } from './pages/EventDetails';
import { TicketView } from './pages/TicketView';
import { Wallet } from './pages/Wallet';
import { Scanner } from './pages/Scanner';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/ticket/:id" element={<TicketView />} />
            
            <Route path="/wallet" element={
              <ProtectedRoute roles={['client', 'admin']}>
                <Wallet />
              </ProtectedRoute>
            } />
            
            <Route path="/scanner" element={
              <ProtectedRoute roles={['staff', 'admin']}>
                <Scanner />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
