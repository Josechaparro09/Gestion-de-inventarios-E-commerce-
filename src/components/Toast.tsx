//src\components\Toast.tsx
import  { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={cn(
      "fixed bottom-4 right-4 flex items-center p-4 rounded-lg shadow-lg",
      type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
    )}>
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 mr-2" />
      ) : (
        <AlertCircle className="w-5 h-5 mr-2" />
      )}
      <span className="mr-2">{message}</span>
      <button onClick={onClose}>
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}