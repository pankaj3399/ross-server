import { toast, ExternalToast } from 'sonner';

export const showToast = {
  success: (message: string, options?: ExternalToast) => toast.success(message, options),
  error: (message: string, options?: ExternalToast) => toast.error(message, options),
  info: (message: string, options?: ExternalToast) => toast.info(message, options),
  warning: (message: string, options?: ExternalToast) => toast.warning(message, options),
  loading: (message: string, options?: ExternalToast) => toast.loading(message, options),
  dismiss: (toastId?: string | number) => toast.dismiss(toastId),
  message: (message: string, options?: ExternalToast) => toast.message(message, options),
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => toast.promise(promise, options),
};

export default showToast;
