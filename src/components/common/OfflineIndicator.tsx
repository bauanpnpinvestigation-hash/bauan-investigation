import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const toast = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored. Live database active.', 'Online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline mode enabled. Cached records remain accessible.', 'Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-3 right-3 z-40 flex items-center gap-2 px-3 py-2 bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-lg border border-amber-400">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Using local cache</span>
    </div>
  );
};
