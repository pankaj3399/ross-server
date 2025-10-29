import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message),
  warning: (message: string) => toast(message, { icon: '⚠️' }),
  loading: (message: string) => toast.loading(message),
  dismiss: (toastId?: string) => toast.dismiss(toastId),
  remove: (toastId?: string) => toast.remove(toastId),
};

export default showToast;
