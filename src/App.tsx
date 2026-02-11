/**
 * App.tsx
 * 
 * The root container of the application.
 * Orchestrates:
 * - Application-wide routing (React Router v6).
 * - Provider injection (AuthContext).
 * - Layout assembly (Navbar, Toaster, NotificationSystem).
 * - Route-level access control (Protected, Admin, and Public-only routes).
 * 
 * Dependencies:
 * - react-router-dom (Routing)
 * - react-hot-toast (Global alerts)
 * - useAuth (Authentication guard logic)
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Landing from './pages/Landing';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreatePost from './pages/CreatePost';
import AdminDashboard from './pages/AdminDashboard';
import NotificationSystem from './components/Notifications/NotificationSystem';
import { Toaster } from 'react-hot-toast';

/**
 * Higher-Order Component to restrict access to authenticated users only.
 * Redirects unauthenticated traffic to /login.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-hmo-dark flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

/**
 * Higher-Order Component to restrict access to Admin-level users only.
 * Redirects unauthorized traffic to the general /feed.
 */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-hmo-dark flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!user || !isAdmin) return <Navigate to="/feed" replace />;
  
  return <>{children}</>;
};

/**
 * Higher-Order Component for routes that should ONLY be visible while logged out
 * (e.g. Login, Signup, Landing). 
 * Redirects authenticated users to /feed.
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (user) return <Navigate to="/feed" replace />;
  
  return <>{children}</>;
};

/**
 * Main application layout and routing table.
 */
const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-hmo-dark min-h-screen text-slate-200 selection:bg-primary/30">
      {/* Global UI Overlays */}
      <Toaster position="bottom-right" />
      <Navbar />
      <NotificationSystem />

      <Routes>
        {/* --- Unauthenticated Routes --- */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* --- Authenticated Routes --- */}
        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        
        {/* Public profile view using username handle */}
        <Route path="/profile/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        
        {/* Current user's private dashboard */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        
        {/* --- Administrative Routes --- */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* Fallback Catch-all: Redirects to context-appropriate home */}
        <Route path="*" element={<Navigate to={user ? "/feed" : "/"} replace />} />
      </Routes>
    </div>
  );
};

/**
 * Root Component.
 * Wraps the entire tree in the Router and AuthProvider.
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
