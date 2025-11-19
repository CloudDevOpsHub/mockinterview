import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Notification({ type, message, onClose, duration = 3000 }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColors[type]} min-w-[320px]`}>
        {icons[type]}
        <p className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
          {message}
        </p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
      </div>
    </div>
  );
}
