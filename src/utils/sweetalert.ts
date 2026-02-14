import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

/**
 * Enhanced SweetAlert2 Configuration for HearMeOut.
 * Uses custom Tailwind CSS classes for a seamless dark theme experience.
 */

// Initialize with React content support
const MySwal = withReactContent(Swal);

// Global theme variables (matching user request)
const HMO_THEME = {
  background: '#1e1e2f',
  text: '#f5f5f5',
  primary: '#4f46e5',
  primaryHover: '#4338ca',
  secondary: '#374151',
  error: '#ef4444',
  rounding: '1rem'
};

// Shared custom classes to avoid redundancy and fix TypeScript errors
const BASE_CUSTOM_CLASSES = {
  popup: 'rounded-[1rem] border border-white/10 shadow-2xl',
  title: 'text-xl font-bold text-white tracking-tight pt-4',
  htmlContainer: 'text-sm text-slate-300 font-medium',
  confirmButton: 'px-8 py-3 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all mx-2 shadow-lg shadow-indigo-500/20',
  cancelButton: 'px-8 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all mx-2',
  input: 'bg-[#05070a] border border-white/10 rounded-xl text-white px-4 py-2 focus:border-indigo-500 outline-none transition-all'
};

/**
 * Reusable Global SweetAlert2 Mixin
 * Centralizes the theme logic so all popups share the same aesthetic.
 */
export const hmoAlert = MySwal.mixin({
  background: HMO_THEME.background,
  color: HMO_THEME.text,
  buttonsStyling: false,
  customClass: BASE_CUSTOM_CLASSES,
  showClass: {
    popup: 'animate__animated animate__fadeInUp animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutDown animate__faster'
  }
});

/**
 * alertService
 * Higher-level abstractions for common HMO interactions.
 */
export const alertService = {
  /** Displays a success message. */
  success: (title: string, message?: string) => 
    hmoAlert.fire({
      icon: 'success',
      iconColor: '#10b981',
      title,
      text: message,
      timer: 3000,
    }),

  /** Displays an error message. */
  error: (title: string, message?: string) => 
    hmoAlert.fire({
      icon: 'error',
      iconColor: HMO_THEME.error,
      title,
      text: message,
    }),

  /** Displays an info message. */
  info: (title: string, message?: string) => 
    hmoAlert.fire({
      icon: 'info',
      iconColor: HMO_THEME.primary,
      title,
      text: message,
    }),

  /** Displays a warning message. */
  warning: (title: string, message?: string) => 
    hmoAlert.fire({
      icon: 'warning',
      iconColor: '#f59e0b',
      title,
      text: message,
    }),

  /** Confirmation dialog (Async). */
  confirm: async (title: string, message?: string, confirmText = 'Yes, Proceed'): Promise<boolean> => {
    const result = await hmoAlert.fire({
      title,
      text: message,
      icon: 'question',
      iconColor: HMO_THEME.primary,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancel'
    });
    return result.isConfirmed;
  },

  /** Specialized Delete confirmation. */
  delete: async (itemName?: string): Promise<boolean> => {
    const result = await hmoAlert.fire({
      title: 'Are you sure?',
      text: itemName ? `Permanently remove "${itemName}"?` : 'This action cannot be undone.',
      icon: 'warning',
      iconColor: HMO_THEME.error,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      customClass: {
        ...BASE_CUSTOM_CLASSES,
        confirmButton: 'px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all mx-2 shadow-lg shadow-red-500/20'
      }
    });
    return result.isConfirmed;
  },

  /** Quick toast notifications. */
  toast: {
    success: (message: string) => {
      hmoAlert.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    },
    error: (message: string) => {
      hmoAlert.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    }
  }
};

export default alertService;
