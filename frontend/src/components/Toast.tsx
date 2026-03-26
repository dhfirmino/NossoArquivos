import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-toast-slide-in">
      <div
        className={`relative flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white overflow-hidden ${
          type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}
      >
        {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        <span className="text-sm">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-75 transition-opacity">
          <X className="w-4 h-4" />
        </button>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30">
          <div className="h-full bg-white/70 animate-toast-progress" />
        </div>
      </div>

      <style>{`
        @keyframes toast-slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-slide-in {
          animation: toast-slide-in 0.3s ease-out;
        }
        .animate-toast-progress {
          animation: toast-progress 4s linear forwards;
        }
      `}</style>
    </div>
  );
}
