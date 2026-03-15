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
      className={`bg-stone-950/80 dark:bg-stone-950/80 text-white border-r border-stone-800 flex flex-row md:flex-col py-2 md:py-4 shadow-2xl z-20 transition-all duration-300 fixed md:relative bottom-0 left-0 right-0 md:w-64 md:h-full md:bottom-auto md:left-auto md:right-auto ${
        isCollapsed ? 'md:w-20' : 'md:w-64'
      }`}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-stone-800 rounded-full items-center justify-center text-stone-400 hover:text-white border border-stone-700 z-50 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="hidden md:flex h-24 items-center justify-center md:px-4 mb-6">
        <div className={isCollapsed ? 'block' : 'md:hidden'}><SunlightTextLogo isMobile /></div>
        <div className={isCollapsed ? 'hidden' : 'hidden md:block'}><SunlightTextLogo light collapsed={false} /></div>
      </div>
      
      <nav className="flex-1 flex flex-row md:flex-col justify-around md:justify-start gap-2 px-2 md:px-4">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:p-3 rounded-xl transition-colors duration-200 relative group ${
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
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-1 md:gap-3 w-full justify-center md:justify-start">
              <item.icon size={20} className={activeView === item.id ? 'text-gold-text' : ''} />
              <span className={`font-medium text-[10px] md:text-sm whitespace-nowrap transition-opacity duration-200 ${
                isCollapsed ? 'hidden' : 'hidden md:inline'
              }`}>
                {item.label}
              </span>
            </div>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
