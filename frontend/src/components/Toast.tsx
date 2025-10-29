'use client';

import { Toaster } from 'react-hot-toast';

const ToastComponent: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: '!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100',
        success: {
          duration: 3000,
          className: '!bg-green-50 dark:!bg-green-900 !text-green-800 dark:!text-green-200 border border-green-200 dark:border-green-700',
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff',
          },
        },
        error: {
          duration: 5000,
          className: '!bg-red-50 dark:!bg-red-900 !text-red-800 dark:!text-red-200 border border-red-200 dark:border-red-700',
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff',
          },
        },
        loading: {
          duration: Infinity,
          className: '!bg-blue-50 dark:!bg-blue-900 !text-blue-800 dark:!text-blue-200 border border-blue-200 dark:border-blue-700',
        },
      }}
    />
  );
};

export default ToastComponent;
