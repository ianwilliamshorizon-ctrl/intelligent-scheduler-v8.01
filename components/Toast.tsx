
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const icons = {
  success: <CheckCircle className="text-white" />,
  error: <XCircle className="text-white" />,
  warning: <AlertTriangle className="text-white" />,
};

const toastColors = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-500',
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div 
      className={`fixed bottom-5 right-5 flex items-center p-4 rounded-lg text-white shadow-lg animate-fade-in-up ${toastColors[type]}`}
    >
      <div className="mr-3">
        {icons[type]}
      </div>
      <div>
        {message}
      </div>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
        &times;
      </button>
    </div>
  );
};

export default Toast;
