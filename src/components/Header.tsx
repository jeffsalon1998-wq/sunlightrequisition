import React from 'react';
import { Search, Cloud, Bell, RefreshCw } from 'lucide-react';
import { Department } from '../../types';

interface HeaderProps {
  defaultDept: Department | null;
  isAdmin: boolean;
  isSyncing: boolean;
  handleSync: () => void;
  unreadCount: number;
  setShowNotifications: (show: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  defaultDept,
  isAdmin,
  isSyncing,
  handleSync,
  unreadCount,
  setShowNotifications
}) => {
  return (
    <header className="bg-white h-20 flex items-center justify-between px-8 border-b border-zinc-200">
      <div></div>
      <div className="flex items-center gap-6">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="relative text-zinc-500 hover:text-maroon-bg transition-colors"
          title="Cloud Sync"
        >
          <Cloud size={22} />
          {isSyncing && <RefreshCw size={12} className="absolute -top-1 -right-1 animate-spin text-maroon-bg" />}
        </button>
        <button 
          onClick={() => setShowNotifications(true)}
          className="relative text-zinc-500 hover:text-maroon-bg transition-colors"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-maroon-bg rounded-full border-2 border-white" />
          )}
        </button>
        <div className="flex items-center gap-3 border-l border-zinc-200 pl-6">
          <div className="text-right">
            <p className="text-sm font-bold text-zinc-900">{defaultDept || 'No Department'}</p>
            <p className="text-xs text-zinc-500 font-medium">{isAdmin ? 'Administrator' : 'Staff'}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-maroon-bg text-white flex items-center justify-center font-bold text-lg shadow-md">
            {defaultDept ? defaultDept.slice(0, 2).toUpperCase() : '?'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
