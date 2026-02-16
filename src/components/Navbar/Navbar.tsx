/**
 * Navbar.tsx
 * 
 * The primary navigation component for the application.
 * Features:
 * - Dynamic routing based on Auth status (Feed/Profile vs Login/Signup).
 * - Real-time unread notification count listener.
 * - Mobile-responsive slide-down menu with Framer Motion.
 * - Single Entry Point for the NotificationPanel sidebar.
 * 
 * Dependencies:
 * - useAuth (Navigation control)
 * - Firebase Firestore (onSnapshot for badge count)
 * - Framer Motion (Mobile menu animations)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  User as UserIcon, 
  LogOut, 
  PlusSquare, 
  LayoutDashboard, 
  Menu, 
  X, 
  Bell,
  MessageSquare,
  Bookmark
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import NotificationPanel from '../Notifications/NotificationPanel';
import ThemeToggle from './ThemeToggle';
// import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  /**
   * Real-time listener for the unread notification badge.
   * Logic: 
   * - Only active for verified, non-anonymous users.
   * - Queries 'notifications' where recipient matches and read is false.
   */
  React.useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      error: (error) => {
        console.error("Navbar badge sync failure:", error);
        // We don't toast here to avoid spamming the user on every page load
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  /** 
   * Clears auth session and redirects to home. 
   */
  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  /** Framer Motion animation configurations for the mobile dropdown. */
  const menuVariants = {
    closed: { opacity: 0, y: -20, pointerEvents: 'none' as const },
    open: { opacity: 1, y: 0, pointerEvents: 'auto' as const }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 flex items-center bg-nav-bg backdrop-blur-xl border-b border-hmo-border z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
        {/* Brand Logo */}
        <Link 
          to={user ? "/feed" : "/"} 
          className="flex items-center gap-2 group" 
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
            <Heart size={20} fill="currentColor" className="text-primary group-hover:text-white" />
          </div>
          <span className="text-xl font-bold hmo-text-primary tracking-tight hidden sm:block">HearMeOut</span>
        </Link>

        {/* Desktop Navigation Links - Pill Styled */}
        {user ? (
          <div className="hidden md:flex items-center hmo-card p-1.5 rounded-2xl">
            <Link 
              to="/feed" 
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${window.location.pathname === '/feed' ? 'bg-primary/20 text-primary dark:text-white' : 'hmo-text-secondary hover:hmo-text-primary hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              <LayoutDashboard size={18} />
              Feed
            </Link>
            <Link 
              to="/create-post" 
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${window.location.pathname === '/create-post' ? 'bg-primary/20 text-primary dark:text-white' : 'hmo-text-secondary hover:hmo-text-primary hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              <PlusSquare size={18} />
              Post
            </Link>
            <Link 
              to="/chats" 
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${window.location.pathname === '/chats' ? 'bg-primary/20 text-primary dark:text-white' : 'hmo-text-secondary hover:hmo-text-primary hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              <MessageSquare size={18} />
              Chats
            </Link>
            <Link 
              to="/bookmarks" 
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${window.location.pathname === '/bookmarks' ? 'bg-primary/20 text-primary dark:text-white' : 'hmo-text-secondary hover:hmo-text-primary hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              <Bookmark size={18} />
              Saved
            </Link>
            <Link 
              to="/profile" 
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${window.location.pathname === '/profile' ? 'bg-primary/20 text-primary dark:text-white' : 'hmo-text-secondary hover:hmo-text-primary hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              <UserIcon size={18} />
              Profile
            </Link>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm font-medium hmo-text-secondary hover:hmo-text-primary transition-colors">About</a>
            <a href="#how-it-works" className="text-sm font-medium hmo-text-secondary hover:hmo-text-primary transition-colors">Safety</a>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {!user ? (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2">
                Log In
              </Link>
              <Link to="/signup" className="bg-gradient-to-br from-primary to-accent text-white px-6 py-2 rounded-full font-semibold text-sm shadow-lg shadow-primary-glow hover:translate-y-[-2px] transition-all">
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notification Trigger */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotifPanelOpen(true)}
                  className="p-2.5 hmo-button-ghost rounded-xl transition-all relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-hmo-dark animate-pulse"></span>
                  )}
                </button>
              </div>

              <button 
                onClick={handleLogout}
                className="p-2.5 hmo-button-ghost rounded-xl transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}

          <ThemeToggle />

          {/* Hamburger Toggle (Mobile Only) */}
          <button 
            className="md:hidden p-2.5 hmo-button-ghost rounded-xl transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed top-20 left-0 right-0 bg-hmo-dark border-b border-hmo-border p-6 flex flex-col gap-6 md:hidden shadow-2xl z-40 transition-colors duration-300"
          >
            {user ? (
              <>
                <Link to="/feed" className="text-lg font-bold text-slate-300 flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                  <LayoutDashboard size={20} /> Feed
                </Link>
                <Link to="/create-post" className="text-lg font-bold text-slate-300 flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                  <PlusSquare size={20} /> Post
                </Link>
                <Link to="/chats" className="text-lg font-bold text-slate-300 flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                  <MessageSquare size={20} /> Chats
                </Link>
                <Link to="/bookmarks" className="text-lg font-bold text-slate-300 flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                  <Bookmark size={20} /> Bookmarks
                </Link>
                <Link to="/profile" className="text-lg font-bold text-slate-300 flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                  <UserIcon size={20} /> Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-lg font-bold text-red-500 flex items-center gap-3 mt-4"
                >
                  <LogOut size={20} /> Logout
                </button>
              </>
            ) : (
              <>
                <a href="#about" className="text-lg font-medium text-slate-300" onClick={() => setIsMenuOpen(false)}>About</a>
                <a href="#how-it-works" className="text-lg font-medium text-slate-300" onClick={() => setIsMenuOpen(false)}>How It Works</a>
                <div className="flex flex-col gap-4 pt-4">
                  <Link to="/login" className="text-center py-4 border border-hmo-border rounded-2xl font-bold text-slate-300" onClick={() => setIsMenuOpen(false)}>
                    Log In
                  </Link>
                  <Link to="/signup" className="text-center py-4 bg-gradient-to-br from-primary to-accent text-white rounded-2xl font-bold shadow-lg" onClick={() => setIsMenuOpen(false)}>
                    Join Now
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-out Panel Overlay */}
      <NotificationPanel 
        isOpen={isNotifPanelOpen} 
        onClose={() => setIsNotifPanelOpen(false)} 
      />
    </nav>
  );
};

export default Navbar;
