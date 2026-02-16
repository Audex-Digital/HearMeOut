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
      className="hmo-card p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
    >
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/20 shrink-0">
        YOU
      </div>
      <div className="flex-grow bg-slate-50 dark:bg-black/50 border border-hmo-border rounded-2xl px-5 py-3 text-sm hmo-text-muted font-medium group-hover:hmo-text-secondary transition-colors">
        Share your thoughts safely...
      </div>
      <div className="w-10 h-10 flex items-center justify-center hmo-text-muted group-hover:text-primary transition-colors">
        <PenLine size={20} />
      </div>
    </div>
  );
};

export default QuickPost;
