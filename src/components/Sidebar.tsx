import React from 'react';
import { LayoutDashboard, ClipboardList, Plus, Package, Settings as SettingsIcon, Menu } from 'lucide-react';
import { SunlightTextLogo } from './SunlightTextLogo';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'requisitions', icon: ClipboardList, label: 'Requisitions' },
    { id: 'new-request', icon: Plus, label: 'New Request' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <aside className="w-20 md:w-56 bg-zinc-950 text-white flex flex-col py-4 shadow-2xl z-20 transition-all duration-300">
      <div className="h-24 flex items-center justify-center md:px-4 mb-6">
        <div className="md:hidden"><SunlightTextLogo isMobile /></div>
        <div className="hidden md:block"><SunlightTextLogo light collapsed={false} /></div>
      </div>
      <nav className="flex-1 flex flex-col gap-2 px-2 md:px-4">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center justify-center md:justify-start gap-3 p-3 rounded-lg transition-colors duration-200 relative ${
              activeView === item.id ? 'bg-maroon-bg text-gold-text' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
            aria-label={item.label}
          >
            <item.icon size={20} />
            <span className="hidden md:inline font-semibold text-sm">{item.label}</span>
            {activeView === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gold-text rounded-r-full" />
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
