import toast from 'react-hot-toast';

export const showToastSuccess = (message: string): string => toast.success(message);
export const showToastError = (message: string): string => toast.error(message);

export const getBaseURL = (): string =>
  import.meta.env.VITE_API_URL || 'http://localhost:4000';
