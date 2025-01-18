import { createContext, ReactNode, useContext, useState } from "react";
import { Toast } from "../components/Toast";

interface Toast {
    message: string;
    type: 'success' | 'error';
  }
  
  interface ToastContextType {
    toast: Toast | null;
    showToast: (toast: Toast) => void;
    hideToast: () => void;
  }
  
  const ToastContext = createContext<ToastContextType | undefined>(undefined);
  
  export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<Toast | null>(null);
  
    const showToast = (newToast: Toast) => {
      setToast(newToast);
    };
  
    const hideToast = () => {
      setToast(null);
    };
  
    return (
      <ToastContext.Provider value={{ toast, showToast, hideToast }}>
        {children}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
      </ToastContext.Provider>
    );
  }
  
  export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
      throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
  };