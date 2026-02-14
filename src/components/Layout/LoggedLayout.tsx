import React from 'react';
import { 
  LifeBuoy} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface LoggedLayoutProps {
  children: React.ReactNode;
}

const LoggedLayout: React.FC<LoggedLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const categories = [
    { name: 'Anxiety Support', color: 'bg-slate-500', disabled: true },
    { name: 'Daily Vent', color: 'bg-slate-500', disabled: true },
    { name: 'Positive Vibes', color: 'bg-slate-500', disabled: true },
    { name: 'Relationships', color: 'bg-slate-500', disabled: true },
    { name: 'Community Rooms', color: 'bg-indigo-500', premium: true },
  ];

  const rules = [
    'No hate speech or bullying',
    'Keep identities private',
    'Be supportive and kind'
  ];

  const handleGetHelp = async () => {
    const loadingToast = toast.loading("Finding an active listener...");
    try {
      const q = query(
        collection(db, 'users'), 
        where('role', '==', 'listener'),
        where('listenerStatus', '==', 'approved'),
        where('listenerActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const activeListeners = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

      toast.dismiss(loadingToast);

      if (activeListeners.length === 0) {
        toast.error("No listeners are active right now. Join a Room or try again later.", {
          icon: '🙏',
          duration: 5000
        });
        return;
      }

      const randomListener = activeListeners[Math.floor(Math.random() * activeListeners.length)] as any;
      navigate(`/chat/${randomListener.uid}?session=help`);
      toast.success("Connecting you with a listener...");
      
    } catch (error) {
      console.error("Get Help error:", error);
      toast.dismiss(loadingToast);
      toast.error("Connection failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] pt-28 pb-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-8">
          
          {/* Left Sidebar (Desktop Only) */}
          <aside className="hidden lg:flex flex-col gap-6 sticky top-28 h-fit">
            <div className="bg-hmo-card border border-hmo-border rounded-3xl p-6">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Categories</h3>
              <ul className="space-y-6">
                {categories.map((cat) => (
                  <li 
                    key={cat.name} 
                    className={`flex items-center gap-3 transition-colors ${cat.disabled ? 'cursor-not-allowed opacity-50 grayscale' : 'cursor-pointer group'}`}
                    onClick={() => {
                      if (cat.disabled) return;
                      cat.name === 'Community Rooms' ? navigate('/rooms') : null;
                    }}
                  >
                    <div className={`w-2 h-2 rounded-full ${cat.color} ${!cat.disabled && 'group-hover:scale-125'} transition-transform`} />
                    <span className={`text-sm font-bold ${cat.disabled ? 'text-slate-600' : 'text-slate-300 group-hover:text-white'} transition-colors`}>
                      {cat.name}
                      {cat.premium && !cat.disabled && <span className="ml-2 text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">Premium</span>}
                      {cat.disabled && <span className="ml-2 text-[8px] bg-white/5 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-tighter italic">Soon</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 rounded-3xl p-6 relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-sm font-bold text-white mb-2 leading-tight">Feeling overwhelmed?</h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed line-clamp-2">Our approved listeners are here to support you 24/7.</p>
                <button 
                  onClick={handleGetHelp}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Help Now
                </button>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <LifeBuoy size={80} />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            {/* Mobile/Tablet categories and help banner (Visible only on < lg) */}
            <div className="flex lg:hidden flex-col gap-6 mb-8">
              {/* Compact horizontal categories for mobile */}
              <div className="bg-hmo-card border border-hmo-border rounded-3xl p-6 overflow-hidden">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Categories</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((cat) => (
                    <button 
                      key={cat.name} 
                      disabled={cat.disabled}
                      onClick={() => cat.name === 'Community Rooms' ? navigate('/rooms') : null}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${cat.disabled ? 'opacity-40 grayscale border-hmo-border' : 'border-indigo-500/30 bg-indigo-500/5 active:scale-95'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${cat.color}`} />
                      <span className="text-xs font-bold text-slate-300 whitespace-nowrap">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Get Help Banner (Mobile version) */}
              <div className="bg-gradient-to-r from-primary to-accent border border-primary/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Need someone to talk to?</h4>
                  <p className="text-[11px] text-white/70 font-bold uppercase tracking-widest mt-0.5">Approved listeners are active now.</p>
                </div>
                <button 
                  onClick={handleGetHelp}
                  className="w-full sm:w-auto px-8 py-3 bg-white text-primary rounded-xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  Get Help Now
                </button>
              </div>
            </div>

            {children}
          </main>

          {/* Right Sidebar (Desktop Only) */}
          <aside className="hidden lg:flex flex-col gap-6 sticky top-28 h-fit">
            <div className="bg-hmo-card border border-hmo-border rounded-3xl p-6">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Community Rules</h3>
              <ul className="space-y-4">
                {rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                    <span className="text-xs font-medium text-slate-400 leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-6">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                © 2026 HearMeOut
              </p>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default LoggedLayout;
