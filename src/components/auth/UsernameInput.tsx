import React, { useEffect } from 'react';
import { User } from 'lucide-react';
import { checkUsernameAvailability } from '../../utils/checkUsernameAvailability';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  onAvailabilityChange: (isAvailable: 'yes' | 'no' | 'checking' | null) => void;
  isAvailable: 'yes' | 'no' | 'checking' | null;
}

/**
 * Reusable Username Input with real-time Firestore availability checking.
 * 
 * Features:
 * - Debounced checks (600ms) to reduce Firestore reads.
 * - Error resilience: resets to 'null' (Unknown) on Firestore failures.
 * - Visual indicators for 'Free' (Green) and 'Taken' (Red).
 */
const UsernameInput: React.FC<UsernameInputProps> = ({ 
  value, 
  onChange, 
  onAvailabilityChange,
  isAvailable 
}) => {
  
  useEffect(() => {
    // 1. Local validation (Sanity Check)
    if (!value || value.trim().length < 3) {
      onAvailabilityChange(null);
      return;
    }

    // 2. Set checking state before async call
    onAvailabilityChange('checking');

    const timer = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailability(value);
        onAvailabilityChange(available ? 'yes' : 'no');
      } catch (error) {
        console.error("Username check failed:", error);
        // Requirement: Reset to null on failure (Unknown != Taken)
        onAvailabilityChange(null);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
        Unique Username
      </label>

      <div className="relative group">
        <User
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors"
          size={20}
        />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="yourhandle"
          autoComplete="off"
          className={`w-full bg-hmo-dark border ${
            isAvailable === 'no'
              ? 'border-red-500/50'
              : isAvailable === 'yes'
                ? 'border-green-500/50'
                : 'border-hmo-border'
          } rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/50 focus:ring-4 focus:ring-white/5 transition-all text-sm font-medium`}
        />

        {/* Status Indicators */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isAvailable === 'checking' && (
            <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          {isAvailable === 'yes' && (
            <div className="text-green-500 text-xs font-black uppercase tracking-tighter">
              Free
            </div>
          )}
          {isAvailable === 'no' && (
            <div className="text-red-500 text-xs font-black uppercase tracking-tighter">
              Taken
            </div>
          )}
        </div>
      </div>

      {isAvailable === 'no' && (
        <p className="text-[9px] text-red-400 font-bold ml-1 uppercase">
          Choose a different handle
        </p>
      )}
    </div>
  );
};

export default UsernameInput;
