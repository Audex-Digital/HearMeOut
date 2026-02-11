import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Initialize with React content support
export const MySwal = withReactContent(Swal);

// HMO Theme Configuration
const theme = {
  background: '#0d1117', // hmo-card
  color: '#fff',
  confirmButtonColor: '#6366f1', // primary
  cancelButtonColor: '#ef4444', // red-500 equivalent
};

// Pre-configured alert types for consistency
export const alertService = {
  success: (title: string, message?: string) => 
    MySwal.fire({
      icon: 'success',
      title,
      text: message,
      timer: 3000,
      showConfirmButton: true,
      background: theme.background,
      color: theme.color,
      confirmButtonColor: theme.confirmButtonColor,
    }),

  error: (title: string, message?: string) => 
    MySwal.fire({
      icon: 'error',
      title,
      text: message,
      background: theme.background,
      color: theme.color,
      confirmButtonColor: theme.confirmButtonColor,
    }),

  warning: (title: string, message?: string) => 
    MySwal.fire({
      icon: 'warning',
      title,
      text: message,
      background: theme.background,
      color: theme.color,
      confirmButtonColor: theme.confirmButtonColor,
    }),

  info: (title: string, message?: string) => 
    MySwal.fire({
      icon: 'info',
      title,
      text: message,
      background: theme.background,
      color: theme.color,
      confirmButtonColor: theme.confirmButtonColor,
    }),

  confirm: async (title: string, message?: string): Promise<boolean> => {
    const result = await MySwal.fire({
      title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: theme.confirmButtonColor,
      cancelButtonColor: theme.cancelButtonColor,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      background: theme.background,
      color: theme.color,
    });
    return result.isConfirmed;
  },

  delete: async (itemName?: string): Promise<boolean> => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: itemName ? `Delete "${itemName}"? This cannot be undone.` : 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: theme.cancelButtonColor,
      cancelButtonColor: theme.confirmButtonColor, // Swap for destructive action
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      background: theme.background,
      color: theme.color,
    });
    return result.isConfirmed;
  },

  prompt: async (title: string, placeholder?: string): Promise<string | null> => {
    const { value } = await MySwal.fire({
      title,
      input: 'text',
      inputPlaceholder: placeholder || 'Enter value',
      showCancelButton: true,
      confirmButtonColor: theme.confirmButtonColor,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      background: theme.background,
      color: theme.color,
    });
    return value;
  },

  toast: {
    success: (message: string) => {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: theme.background,
        color: theme.color,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
      Toast.fire({ icon: 'success', title: message });
    },
    error: (message: string) => {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: theme.background,
        color: theme.color,
      });
      Toast.fire({ icon: 'error', title: message });
    }
  }
};
