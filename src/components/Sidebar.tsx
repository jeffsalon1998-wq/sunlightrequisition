import React, { useState } from 'react';
import { LayoutDashboard, ClipboardList, Plus, Package, Settings as SettingsIcon, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { SunlightTextLogo } from './SunlightTextLogo';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'requisitions', icon: ClipboardList, label: 'Requisitions' },
    { id: 'new-request', icon: Plus, label: 'New Request' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <aside 
      className={`bg-stone-950 dark:bg-stone-950 text-white flex flex-col py-4 shadow-2xl z-20 transition-all duration-300 relative ${
        isCollapsed ? 'w-20' : 'w-20 md:w-64'
      }`}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-stone-800 rounded-full items-center justify-center text-stone-400 hover:text-white border border-stone-700 z-50 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="h-24 flex items-center justify-center md:px-4 mb-6">
        <div className={isCollapsed ? 'block' : 'md:hidden'}><SunlightTextLogo isMobile /></div>
        <div className={isCollapsed ? 'hidden' : 'hidden md:block'}><SunlightTextLogo light collapsed={false} /></div>
      </div>
      
      <nav className="flex-1 flex flex-col gap-2 px-2 md:px-4">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl transition-colors duration-200 relative group ${
              activeView === item.id 
                ? 'text-gold-text' 
                : 'text-stone-400 hover:bg-stone-900 dark:hover:bg-stone-900 hover:text-stone-100'
            }`}
            aria-label={item.label}
            title={isCollapsed ? item.label : undefined}
          >
            {activeView === item.id && (
              <motion.div 
                layoutId="active-nav"
                className="absolute inset-0 bg-maroon-bg dark:bg-maroon-900 rounded-xl"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            <div className="relative z-10 flex items-center gap-3 w-full justify-center md:justify-start">
              <item.icon size={20} className={activeView === item.id ? 'text-gold-text' : ''} />
              <span className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${
                isCollapsed ? 'hidden' : 'hidden md:inline'
              }`}>
                {item.label}
              </span>
            </div>

            {activeView === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gold-text rounded-r-full z-10" />
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
