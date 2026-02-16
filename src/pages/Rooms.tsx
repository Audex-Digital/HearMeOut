/**
 * Rooms.tsx
 * 
 * Premium Community Rooms. 
 * Allows users to join group moderated chat sessions.
 * creation restricted to Premium users.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  MessageSquare, 
  Lock, 
  Shield, 
  Search,
  Users2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import LoggedLayout from '../components/Layout/LoggedLayout';
import toast from 'react-hot-toast';
import { alertService } from '../utils/sweetalert';

interface Room {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  participantCount: number;
  type: 'public' | 'premium';
  createdAt: any;
}

const Rooms: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRooms: Room[] = [];
      snapshot.forEach((doc) => {
        fetchedRooms.push({ id: doc.id, ...doc.data() } as Room);
      });
      setRooms(fetchedRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!user.isPremium && !isAdmin) {
      toast.error("Room creation is a premium feature.");
      return;
    }

    try {
      await addDoc(collection(db, 'rooms'), {
        name: newName,
        description: newDesc,
        ownerId: user.uid,
        ownerName: user.username,
        participantCount: 1,
        type: user.isPremium ? 'premium' : 'public',
        createdAt: serverTimestamp()
      });
      toast.success("Room created!");
      setShowCreateModal(false);
      setNewName('');
      setNewDesc('');
    } catch (err) {
      console.error("Room creation failed:", err);
      toast.error("Failed to create room.");
    }
  };

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    const confirmed = await alertService.confirm("Dissolve Space", "Are you sure you want to delete this room?");
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      toast.success("Room deleted.");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete room.");
    }
  };

  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LoggedLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black hmo-text-primary mb-2 tracking-tight flex items-center gap-3">
              <Users2 size={32} className="text-primary" />
              Community Rooms
            </h1>
            <p className="hmo-text-secondary font-medium">Join moderated group discussions and support circles.</p>
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={20} />
            Create Room
          </button>
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search rooms by topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 hmo-card border border-hmo-border rounded-2xl hmo-text-primary placeholder:hmo-text-muted focus:outline-none focus:border-primary/50 transition-all shadow-inner"
            />
          </div>
          <div className="px-6 py-4 hmo-card border border-hmo-border rounded-2xl flex items-center gap-3 hmo-text-muted">
            <Users size={18} className="text-primary" />
            <span className="text-xs font-black uppercase tracking-widest">
              <span className="hmo-text-primary">{rooms.length}</span> Active Rooms
            </span>
          </div>
        </div>

        {/* Room Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 hmo-card border border-hmo-border rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-20 text-center hmo-card border border-hmo-border rounded-[2.5rem] border-dashed">
            <MessageSquare size={48} className="mx-auto hmo-text-muted opacity-20 mb-4" />
            <p className="hmo-text-muted font-bold uppercase tracking-widest text-xs">No rooms found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRooms.map((room) => (
              <motion.div 
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="hmo-card p-8 shadow-xl dark:shadow-none relative overflow-hidden group cursor-pointer"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary mb-4 group-hover:scale-110 transition-transform">
                      <MessageSquare size={24} />
                    </div>
                    {room.type === 'premium' && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                        <Lock size={10} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Premium</span>
                      </div>
                    )}
                    {(isAdmin || user?.uid === room.ownerId) && (
                      <button 
                        onClick={(e) => handleDeleteRoom(e, room.id)}
                        className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <h3 className="text-xl font-black hmo-text-primary mb-2 line-clamp-1">{room.name}</h3>
                  <p className="hmo-text-secondary text-sm mb-6 line-clamp-2 leading-relaxed h-10 italic">
                    "{room.description}"
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-hmo-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 border border-hmo-border flex items-center justify-center text-[10px] font-bold hmo-text-muted">
                        {room.ownerName[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs font-bold hmo-text-muted">@{room.ownerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-primary text-xs font-black">
                      <Users size={14} />
                      {room.participantCount}
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
            <Shield size={32} />
          </div>
          <div>
            <h4 className="hmo-text-primary font-black uppercase tracking-tighter text-lg mb-1">Moderated Safespace</h4>
            <p className="hmo-text-secondary text-sm leading-relaxed">
              Every room is monitored by our <span className="text-indigo-400 font-bold">Approved Listeners</span> and <span className="text-primary font-bold">Admins</span>. 
              Report any harassment immediately to community staff.
            </p>
          </div>
        </div>

        {/* Create Room Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCreateModal(false)}
                className="absolute inset-0 bg-hmo-dark/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="hmo-card w-full max-w-lg p-8 sm:p-12 relative z-10 shadow-3xl dark:shadow-none"
              >
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="absolute top-8 right-8 text-slate-600 hover:text-white transition-colors"
                >
                  <Lock size={20} />
                </button>

                <div className="text-center mb-10">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                    <Plus size={32} />
                  </div>
                  <h2 className="text-2xl font-black hmo-text-primary mb-2">Host a Session</h2>
                  <p className="hmo-text-secondary text-sm font-medium">Create a safe space for your community.</p>
                </div>

                <form onSubmit={handleCreateRoom} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Room Topic</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. Late Night Venting"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-hmo-dark border border-hmo-border rounded-2xl hmo-text-primary placeholder:hmo-text-muted focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Short Description</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="Describe the vibes of your room..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-hmo-dark border border-hmo-border rounded-2xl hmo-text-primary placeholder:hmo-text-muted focus:outline-none focus:border-primary transition-all resize-none italic"
                    />
                  </div>
                  
                  <div className="pt-4 flex flex-col gap-4">
                    <button 
                      type="submit"
                      className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                    >
                      Establish Safe Space
                    </button>
                    <p className="text-[10px] text-slate-600 text-center uppercase font-bold tracking-widest">
                      {!user?.isPremium ? "Requires Premium Membership" : "Premium Member Advantage"}
                    </p>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </LoggedLayout>
  );
};

export default Rooms;
