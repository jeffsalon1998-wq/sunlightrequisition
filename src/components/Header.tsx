import React from 'react';
import { Search, Cloud, Bell, RefreshCw, Moon, Sun, CheckCircle2, PenTool } from 'lucide-react';
import { Department, Requisition } from '../../types';
import { useTheme } from './ThemeProvider';
import { AnimatePresence, motion } from 'framer-motion';

interface HeaderProps {
  defaultDept: Department | null;
  isAdmin: boolean;
  isSyncing: boolean;
  handleSync: () => void;
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  deptNotifications: Requisition[];
  notificationRef: React.RefObject<HTMLDivElement>;
}

const Header: React.FC<HeaderProps> = ({
  defaultDept,
  isAdmin,
  isSyncing,
  handleSync,
  unreadCount,
  showNotifications,
  setShowNotifications,
  deptNotifications,
  notificationRef
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-stone-900 h-20 flex items-center justify-between px-8 border-b border-stone-200 dark:border-stone-800 transition-colors duration-300">
      <div></div>
      <div className="flex items-center gap-6">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="relative text-stone-500 hover:text-maroon-bg dark:text-stone-400 dark:hover:text-gold-text transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
        </button>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="relative text-stone-500 hover:text-maroon-bg dark:text-stone-400 dark:hover:text-gold-text transition-colors"
          title="Cloud Sync"
        >
          <Cloud size={22} />
          {isSyncing && <RefreshCw size={12} className="absolute -top-1 -right-1 animate-spin text-maroon-bg dark:text-gold-text" />}
        </button>
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-stone-500 hover:text-maroon-bg dark:text-stone-400 dark:hover:text-gold-text transition-colors"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-maroon-bg dark:bg-gold-bg rounded-full border-2 border-white dark:border-stone-900" />
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-4 w-80 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-between items-center">
                  <h3 className="font-bold text-stone-900 dark:text-stone-100">Notifications</h3>
                  <span className="text-[10px] font-black bg-maroon-bg text-gold-text px-2 py-0.5 rounded-full">{unreadCount} New</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {deptNotifications.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 dark:text-stone-400 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100 dark:divide-stone-800">
                      {deptNotifications.map(req => (
                        <div key={req.id} className="p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer">
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              req.status === 'For signing' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {req.status === 'For signing' ? <PenTool size={14} /> : <CheckCircle2 size={14} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-1">
                                {req.status === 'For signing' ? 'Signature Required' : 'Ready for Pickup'}
                              </p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                                Requisition <span className="font-mono font-bold text-stone-700 dark:text-stone-300">{req.id}</span> from {req.requester} is {req.status === 'For signing' ? 'waiting for your signature' : 'ready for collection'}.
                              </p>
                              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-2 font-medium">
                                {new Date(req.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-3 border-l border-stone-200 dark:border-stone-800 pl-6">
          <div className="text-right">
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{defaultDept || 'No Department'}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{isAdmin ? 'Administrator' : 'Staff'}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-maroon-bg dark:bg-maroon-900 text-white dark:text-gold-text flex items-center justify-center font-bold text-lg shadow-md border border-transparent dark:border-maroon-800">
            {defaultDept ? defaultDept.slice(0, 2).toUpperCase() : '?'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
