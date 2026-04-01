import { useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineScreen = () => {
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      if (navigator.onLine) {
        // The App.tsx event listener will catch this and remove the screen automatically
        window.dispatchEvent(new Event('online'));
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center transition-colors">
      <div className="w-24 h-24 bg-maroon-bg rounded-full flex items-center justify-center mb-8 animate-bounce">
        <WifiOff size={48} className="text-gold-text" />
      </div>
      <h1 className="text-4xl font-black text-stone-900 dark:text-white uppercase tracking-tight mb-4">No Connection</h1>
      <p className="text-stone-600 dark:text-stone-400 max-w-md font-medium mb-8">
        It seems you are offline. The system will automatically reconnect when your internet is restored.
      </p>
      <button
        onClick={handleRetry}
        disabled={isChecking}
        className="flex items-center gap-2 px-6 py-3 bg-maroon-bg text-gold-text rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-maroon-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw size={18} className={isChecking ? "animate-spin" : ""} />
        {isChecking ? "Checking..." : "Check Connection"}
      </button>
    </div>
  );
};
