import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import { PenLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickPost: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div 
      onClick={() => navigate('/create-post')}
      className="bg-hmo-card border border-hmo-border rounded-3xl p-4 flex items-center gap-4 cursor-pointer hover:border-slate-700 transition-all group mb-8 shadow-sm"
    >
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/20 shrink-0">
        YOU
      </div>
      <div className="flex-grow bg-[#05070a]/50 border border-hmo-border rounded-2xl px-5 py-3 text-sm text-slate-500 font-medium group-hover:text-slate-300 transition-colors">
        Share your thoughts safely...
      </div>
      <div className="w-10 h-10 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
        <PenLine size={20} />
      </div>
    </div>
  );
};

export default QuickPost;
