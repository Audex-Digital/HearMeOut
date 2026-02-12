/**
 * AdminDashboard.tsx
 * 
 * Internal administrative tool for community oversight.
 * Features:
 * - User list retrieval and management.
 * - Simple "Dummy Account" detection algorithm.
 * - Single-click Firestore document removal for spam accounts.
 * - Real-time statistics for the entire user database.
 * 
 * Dependencies:
 * - useAuth (Context for checking current admin status)
 * - Firebase Firestore (query, getDocs, deleteDoc)
 * - Lucide React (Icons)
 */

import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  Trash2, 
  Clock, 
  Check,
  MessageSquare,
  Headphones,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase/config';
import { collection, query, getDocs, doc, deleteDoc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { alertService } from '../utils/sweetalert';

/** Structure of the user document as stored in Firestore. */
interface UserData {
  uid: string;
  username: string;
  usernameLowercase?: string;
  email: string;
  role: string;
  createdAt: any;
  bio?: string;
  listenerStatus?: string;
  listenerActive?: boolean;
}

const AdminDashboard: React.FC = () => {
  const { approveListener, rejectListener } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'dummy' | 'applications'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  /** Fetches all user profiles from the 'users' collection. */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers: UserData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ uid: doc.id, ...doc.data() } as UserData);
      });
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Admin fetch error:", error);
      toast.error("Access Denied or Database Error.");
    } finally {
      setLoading(false);
    }
  };

  /** 
   * Migration utility to backfill usernameLowercase and reserve handles in 'usernames' collection.
   * Required for transition from UID-based to Handle-based uniqueness.
   */
  const handleMigration = async () => {
    const confirmed = await alertService.confirm(
      "Identity Sync", 
      "CRITICAL: Backfill global usernames collection? This is a core identity sync."
    );
    if (!confirmed) return;
    setIsMigrating(true);
    let success = 0;
    
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      
      for (const userDoc of snapshot.docs) {
        const data = userDoc.data() as UserData;
        if (!data.username) continue;
        
        const lower = data.username.toLowerCase();
        const uid = userDoc.id;
        
        try {
          const nameRef = doc(db, 'usernames', lower);
          const nameSnap = await getDoc(nameRef);
          
          const batch = writeBatch(db);
          
          // 1. Reserve handle if not already locked
          if (!nameSnap.exists()) {
            batch.set(nameRef, { uid, createdAt: serverTimestamp() });
          }
          
          // 2. Add lowercase helper if missing
          if (!data.usernameLowercase) {
            batch.update(userDoc.ref, { usernameLowercase: lower });
          }
          
          await batch.commit();
          success++;
        } catch (e) {
          console.warn(`Record skip for ${data.username}:`, e);
        }
      }
      toast.success(`Identity sync finished: ${success} profiles verified.`);
      fetchUsers();
    } catch (err) {
      console.error("Migration failed:", err);
      toast.error("System-wide migration failed.");
    } finally {
      setIsMigrating(false);
    }
  };

  /** Approves a listener application. */
  const handleApprove = async (uid: string) => {
    setActionLoading(uid);
    try {
      await approveListener(uid);
      await fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  /** Rejects a listener application. */
  const handleReject = async (uid: string) => {
    setActionLoading(uid);
    try {
      await rejectListener(uid);
      await fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  /** Initial load of community data. */
  useEffect(() => {
    fetchUsers();
  }, []);

  /** 
   * Simple heuristic to identify potentially inactive or spam accounts.
   */
  const isDummy = (u: UserData) => {
    if (!u.username) return true;
    const dummyPatterns = ['test', 'dummy', 'spam', 'asdf', '123'];
    if (dummyPatterns.some(p => u.username.toLowerCase().includes(p))) return true;
    
    if (u.createdAt) {
      const createdDate = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      const daysOld = (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
      if (daysOld > 30 && !u.bio) return true;
    }
    
    return false;
  };

  /** Computed list of users based on the active tab filter. */
  const filteredUsers = filter === 'dummy' 
    ? users.filter(isDummy) 
    : filter === 'applications'
    ? users.filter(u => u.listenerStatus === 'pending')
    : users;

  /** 
   * Removes a specific user's Firestore profile. 
   */
  const handleDeleteUser = async (uid: string) => {
    const confirmed = await alertService.delete('this user profile');
    if (!confirmed) return;
    
    setActionLoading(uid);
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(users.filter(u => u.uid !== uid));
      toast.success("Profile record purged.");
    } catch (error) {
      console.error("Cleanup error:", error);
      toast.error("Failed to purge record.");
    } finally {
      setActionLoading(null);
    }
  };

  const stats = [
    { label: 'Total Users', value: users.length.toString(), icon: <Users size={20} />, color: 'text-blue-500' },
    { label: 'Pending Apps', value: users.filter(u => u.listenerStatus === 'pending').length.toString(), icon: <Clock size={20} />, color: 'text-yellow-500' },
    { label: 'Active Listeners', value: users.filter(u => u.role === 'listener' && u.listenerActive).length.toString(), icon: <Shield size={20} />, color: 'text-indigo-500' },
  ];

  return (
    <div className="pt-28 pb-10 min-h-screen bg-hmo-dark">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">Admin Dashboard</h1>
              <p className="text-slate-500 text-sm font-medium">Internal tools for community safety.</p>
            </div>
          </div>
          {/* Tab Filter */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-hmo-border">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
            >
              All Users
            </button>
            <button 
              onClick={() => setFilter('applications')}
              className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'applications' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              Applications
              {users.filter(u => u.listenerStatus === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
              )}
            </button>
            <button 
              onClick={() => setFilter('dummy')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'dummy' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              Cleanup Needed
            </button>
          </div>
          <button 
            onClick={handleMigration}
            disabled={isMigrating}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 border border-accent/20 rounded-xl text-xs font-bold text-accent hover:bg-accent/20 transition-all disabled:opacity-50"
          >
            {isMigrating ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <Check size={14} />}
            Sync Global Usernames
          </button>
        </div>

        {/* Top-level Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-hmo-card border border-hmo-border p-6 rounded-3xl group hover:border-slate-700 transition-all"
            >
              <div className={`mb-4 ${stat.color} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* User Data Table */}
        <div className="bg-hmo-card border border-hmo-border rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hmo-border bg-white/[0.02]">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Public Identity</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Auth Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enrollment</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Listener Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hmo-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Scanning Cloud Database...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500 text-sm">
                      No records match the current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-white/[0.01] transition-colors group/row">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${u.role === 'listener' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-hmo-border text-slate-400'} group-hover/row:border-primary/30 transition-colors`}>
                            {u.role === 'listener' ? <Headphones size={18} /> : (u.username?.[0]?.toUpperCase() || '?')}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{u.username || 'Unset Account'}</p>
                            <p className="text-[10px] text-slate-600 font-mono tracking-tighter uppercase">{u.uid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/30' : u.role === 'listener' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                          <Clock size={12} className="text-slate-600" />
                          {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.listenerStatus === 'pending' ? (
                          <span className="flex items-center gap-1.5 text-yellow-500 text-[10px] font-bold uppercase tracking-tighter">
                            <Clock size={12} /> Pending Approval
                          </span>
                        ) : u.role === 'listener' ? (
                          <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter ${u.listenerActive ? 'text-green-500' : 'text-slate-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${u.listenerActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                            {u.listenerActive ? 'Available' : 'Offline'}
                          </span>
                        ) : isDummy(u) ? (
                          <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-tighter">
                            <AlertTriangle size={12} /> Flagged
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-slate-600 text-[10px] font-bold uppercase tracking-tighter">
                            <Check size={12} /> Healthy
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {u.listenerStatus === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleApprove(u.uid)}
                                disabled={actionLoading === u.uid}
                                className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                                title="Approve Listener"
                              >
                                {actionLoading === u.uid ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                              </button>
                              <button 
                                onClick={() => handleReject(u.uid)}
                                disabled={actionLoading === u.uid}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Reject Listener"
                              >
                                {actionLoading === u.uid ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <XCircle size={16} />}
                              </button>
                              <button 
                                onClick={() => navigate(`/chat/${u.uid}?evaluate=true`)}
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title="Evaluation Chat"
                              >
                                <MessageSquare size={16} />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleDeleteUser(u.uid)}
                            disabled={actionLoading === u.uid}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                            title="Purge Record"
                          >
                            {actionLoading === u.uid ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Implementation Warning */}
        <div className="mt-8 flex items-start gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl shadow-inner">
          <AlertTriangle size={24} className="text-accent shrink-0 mt-0.5 animate-pulse" />
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            <span className="text-white font-bold block mb-1">Architecture Limitation:</span> 
            Pure client-side operations cannot erase Firebase Authentication records. This interface purges the Firestore user document only. For complete user disposal, bridge this action to a Firebase Cloud Function using the <code className="text-accent bg-accent/5 px-1 rounded">firebase-admin</code> SDK.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
