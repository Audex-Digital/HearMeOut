import React, { useEffect, useState } from 'react';
import { Shield, Users, MessageSquare, AlertTriangle, Trash2, UserX, Clock, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase/config';
import { collection, query, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

interface UserData {
  uid: string;
  username: string;
  email: string;
  role: string;
  createdAt: any;
  bio?: string;
}

const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'dummy'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers: UserData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push(doc.data() as UserData);
      });
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isDummy = (u: UserData) => {
    if (!u.username) return true;
    const dummyPatterns = ['test', 'dummy', 'spam', 'asdf', '123'];
    if (dummyPatterns.some(p => u.username.toLowerCase().includes(p))) return true;
    
    // Check if createdAt is more than 30 days ago and no bio (simple criteria)
    if (u.createdAt) {
      const createdDate = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      const daysOld = (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
      if (daysOld > 30 && !u.bio) return true;
    }
    
    return false;
  };

  const filteredUsers = filter === 'dummy' ? users.filter(isDummy) : users;

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This will remove their Firestore data. (Auth removal requires a Cloud Function)")) return;
    
    setActionLoading(uid);
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(users.filter(u => u.uid !== uid));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user document.");
    } finally {
      setActionLoading(null);
    }
  };

  const stats = [
    { label: 'Total Users', value: users.length.toString(), icon: <Users size={20} />, color: 'text-blue-500' },
    { label: 'Dummy Accounts', value: users.filter(isDummy).length.toString(), icon: <AlertTriangle size={20} />, color: 'text-red-500' },
    { label: 'Admin Users', value: users.filter(u => u.role === 'admin').length.toString(), icon: <Shield size={20} />, color: 'text-indigo-500' },
  ];

  return (
    <div className="pt-28 pb-10 min-h-screen bg-hmo-dark">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-500 text-sm">Community oversight and cleanup.</p>
            </div>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-hmo-border">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              All Users
            </button>
            <button 
              onClick={() => setFilter('dummy')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'dummy' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Dummy Accounts
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-hmo-card border border-hmo-border p-6 rounded-3xl"
            >
              <div className={`mb-4 ${stat.color}`}>{stat.icon}</div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-hmo-card border border-hmo-border rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hmo-border bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Joined</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hmo-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-slate-500 text-sm">Loading community data...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                      No users found matching this filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-hmo-border">
                            {u.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{u.username || 'No Username'}</p>
                            <p className="text-[10px] text-slate-500 font-mono tracking-tighter">{u.uid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-slate-800 text-slate-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <Clock size={12} />
                          {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isDummy(u) ? (
                          <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase">
                            <AlertTriangle size={12} /> Dummy
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-green-500 text-[10px] font-bold uppercase">
                            <Check size={12} /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleDeleteUser(u.uid)}
                            disabled={actionLoading === u.uid}
                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                            title="Delete User"
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

        <div className="mt-8 flex items-start gap-3 p-4 bg-white/5 border border-hmo-border rounded-xl">
          <AlertTriangle size={20} className="text-accent shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-white font-medium">Developer Note:</span> Purely client-side code cannot delete Firebase Auth accounts. The "Delete" button currently removes the User document from Firestore. For full account erasure, a Firebase Cloud Function using the <code className="text-accent">firebase-admin</code> SDK should be triggered.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
