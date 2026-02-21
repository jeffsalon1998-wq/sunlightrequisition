
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  PlusCircle, 
  Bell, 
  Search, 
  Settings as SettingsIcon,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight,
  PenTool,
  HelpCircle,
  Cloud,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { InventoryItem, Requisition, Department } from './types';
import Dashboard from './components/Dashboard';
import RequisitionList from './components/RequisitionList';
import RequisitionForm from './components/RequisitionForm';
import Inventory from './components/Inventory';
import Settings from './components/Settings';
import { SunlightTextLogo } from './src/components/SunlightTextLogo';
import { useDatabaseInit } from './src/hooks/useDatabaseInit';
import { 
  saveRequisitionDb, 
  updateRequisitionDb, 
  updateStatusDb 
} from './services/database';
import { Toaster, toast } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

type View = 'dashboard' | 'requisitions' | 'new-request' | 'inventory' | 'settings';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

function NavItem({ icon, label, active, onClick, collapsed }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl mb-1.5 transition-all duration-300 group relative ${
        active 
          ? 'bg-zinc-800 text-yellow-400 shadow-md border border-zinc-700/30' 
          : 'hover:bg-zinc-800/40 text-zinc-500 hover:text-zinc-200'
      }`}
    >
      {active && <div className="absolute left-0 w-1 h-4 maroon-bg rounded-r-full" />}
      <div className={active ? 'text-yellow-400' : 'group-hover:text-zinc-200'}>{icon}</div>
      {!collapsed && <span className="font-semibold whitespace-nowrap text-xs tracking-tight">{label}</span>}
      {active && !collapsed && <ChevronRight size={12} className="ml-auto opacity-30" />}
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 flex-1 py-1 transition-colors ${active ? 'maroon-text' : 'text-zinc-400'}`}>
      <div className={active ? 'scale-110 transition-transform' : ''}>{icon}</div>
      <span className={`text-[9px] font-bold uppercase tracking-tight ${active ? 'maroon-text' : 'text-zinc-400'}`}>{label}</span>
    </button>
  );
}

const SplashScreen = ({ onEnter, ready }: { onEnter: () => void; ready: boolean }) => (
  <div className="fixed inset-0 z-[100] bg-[#1a0000] flex flex-col items-center justify-center overflow-hidden">
    {/* Atmospheric Background */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-maroon-bg opacity-20 blur-[120px] rounded-full"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>
    </div>

    {/* Luxury Flourish Container */}
    <div className="relative group animate-flourish">
      <div className="absolute inset-0 bg-yellow-400/10 blur-[60px] rounded-full scale-125 group-hover:bg-yellow-400/20 transition-all duration-1000"></div>
      <div className={`relative transform transition-all duration-1000 ${ready ? 'hover:scale-105' : 'animate-pulse'}`}>
        <SunlightTextLogo light />
      </div>
    </div>
    
    <div className="mt-20 flex flex-col items-center gap-8 min-h-[140px] z-10">
      {!ready ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-1 h-1 rounded-full gold-bg animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1 h-1 rounded-full gold-bg animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1 h-1 rounded-full gold-bg animate-bounce"></div>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-[11px] font-black uppercase tracking-[0.6em] gold-text opacity-40">System Handshake</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/20 mt-2">Connecting Secured Channels</p>
          </div>
        </div>
      ) : (
        <button 
          onClick={onEnter}
          className="group flex items-center gap-4 px-12 py-5 bg-gradient-to-r from-[#5d0000] to-[#3d0000] gold-text font-black uppercase tracking-[0.4em] text-[11px] rounded-full shadow-[0_25px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_70px_rgba(128,0,0,0.4)] hover:-translate-y-1 active:scale-95 transition-all duration-500 animate-in zoom-in-95 fade-in slide-in-from-bottom-8 border border-white/5"
        >
          Access Registry
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1.5" strokeWidth={3} />
        </button>
      )}
    </div>

    <div className="absolute bottom-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] gold-text opacity-20">
      <div className="w-8 h-[1px] gold-bg opacity-30"></div>
      <span className="flex items-center gap-2">
        <Zap size={12} className="fill-current" />
        Purchasing Department System
      </span>
      <div className="w-8 h-[1px] gold-bg opacity-30"></div>
    </div>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

function AppContent() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { 
    inventory, 
    setInventory, 
    requisitions, 
    setRequisitions, 
    availableDepartments, 
    setAvailableDepartments, 
    isLoading,
    refresh: handleCloudSync
  } = useDatabaseInit();

  // DEFAULT DEPARTMENT SET TO NULL (BLANK)
  const [defaultDept, setDefaultDept] = useState<Department | null>(() => {
    const saved = localStorage.getItem('sunlight_default_dept');
    return saved ? (saved as Department) : null;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const saved = localStorage.getItem('sunlight_is_admin');
    return saved === 'true';
  });

  // Persist settings
  useEffect(() => {
    if (defaultDept) {
      localStorage.setItem('sunlight_default_dept', defaultDept);
    } else {
      localStorage.removeItem('sunlight_default_dept');
    }
  }, [defaultDept]);

  useEffect(() => {
    localStorage.setItem('sunlight_is_admin', String(isAdmin));
  }, [isAdmin]);

  const [isSplashActive, setIsSplashActive] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter notifications only for specific statuses and active department
  const deptNotifications = requisitions.filter(r => 
    defaultDept && r.department === defaultDept && (r.status === 'For signing' || r.status === 'Ready for Pickup')
  );
  const unreadCount = deptNotifications.length;
  const prevUnreadCount = useRef(unreadCount);

  // Request notification permission and initialize audio
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    audioRef.current = new Audio('/chime.wav');

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger browser notifications and chime
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current && Notification.permission === 'granted') {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }
      deptNotifications.forEach(req => {
        if (req.status === 'For signing') {
          new Notification('New Requisition for Signing', {
            body: `Requisition ${req.id} from ${req.requester} needs your signature.`,
            icon: '/notification-icon.png' // You might need to create this icon
          });
        } else if (req.status === 'Ready for Pickup') {
          new Notification('Requisition Ready for Pickup', {
            body: `Requisition ${req.id} from ${req.requester} is ready for collection.`, 
            icon: '/notification-icon.png'
          });
        }
      });
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount, deptNotifications]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await handleCloudSync();
      toast.success('System synchronized with cloud');
    } catch (error) {
      toast.error('Sync failed. Please check connection.');
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleNewRequisition = async (req: Requisition) => {
    setRequisitions(prev => [req, ...prev]);
    setActiveView('requisitions');
    try {
      await saveRequisitionDb(req);
      toast.success('Requisition submitted successfully');
    } catch (err) {
      toast.error('Failed to save requisition');
      console.error("Failed to save requisition to DB:", err);
    }
  };

  const updateRequisitionStatus = async (id: string, status: Requisition['status']) => {
    setRequisitions(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    try {
      await updateStatusDb(id, status);
      toast.info(`Status updated to ${status}`);
    } catch (err) {
      toast.error('Status update failed');
      console.error("Failed to update status in DB:", err);
    }
  };

  const handleUpdateRequisition = async (updatedReq: Requisition) => {
    setRequisitions(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
    try {
      await updateRequisitionDb(updatedReq);
      toast.success('Requisition updated');
    } catch (err) {
      toast.error('Update failed');
      console.error("Failed to update requisition in DB:", err);
    }
  };

  if (isSplashActive) {
    return <SplashScreen onEnter={() => setIsSplashActive(false)} ready={!isLoading} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-zinc-50 overflow-hidden font-sans text-zinc-900 animate-in fade-in duration-1000">
      <aside className={`hidden md:flex bg-zinc-950 text-white transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-56' : 'w-20'} flex-col z-50 shadow-2xl relative`}>
        <div className={`p-4 flex items-center transition-all duration-500 ${isSidebarOpen ? 'justify-start' : 'justify-center'} min-h-[140px]`}>
          <div className="w-full flex justify-center items-center scale-75">
             <SunlightTextLogo light collapsed={!isSidebarOpen} />
          </div>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto no-scrollbar">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} collapsed={!isSidebarOpen} />
          <NavItem icon={<ClipboardList size={18} />} label="Requisitions" active={activeView === 'requisitions'} onClick={() => setActiveView('requisitions')} collapsed={!isSidebarOpen} />
          <NavItem icon={<PlusCircle size={18} />} label="New Request" active={activeView === 'new-request'} onClick={() => setActiveView('new-request')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Package size={18} />} label="Inventory" active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} collapsed={!isSidebarOpen} />
          <NavItem icon={<SettingsIcon size={18} />} label="Settings" active={activeView === 'settings'} onClick={() => setActiveView('settings')} collapsed={!isSidebarOpen} />
        </nav>

        <div className="p-3 border-t border-zinc-800/40">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-zinc-800 transition-all active:scale-90 group"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <X size={18} className="text-zinc-600 group-hover:text-yellow-400" /> : <Menu size={18} className="text-zinc-600 group-hover:text-yellow-400" />}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-zinc-200 h-16 flex items-center justify-between px-4 md:px-6 z-40 relative">
          <div className="flex items-center gap-2 md:hidden">
            <SunlightTextLogo isMobile />
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center bg-zinc-100 px-4 py-1.5 rounded-xl w-72 border border-zinc-200 focus-within:ring-2 focus-within:ring-maroon-bg/10 focus-within:bg-white transition-all">
              <Search size={14} className="text-zinc-400" />
              <input type="text" placeholder="Search resources..." className="bg-transparent border-none focus:outline-none ml-2 text-[11px] w-full text-zinc-800 placeholder:text-zinc-400 font-medium" />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className={`relative text-zinc-400 hover:text-maroon-bg transition-all p-2 hover:bg-zinc-100 rounded-full group ${isSyncing ? 'cursor-not-allowed opacity-70' : ''}`}
              title="Cloud Sync"
              aria-label="Synchronize with cloud"
            >
              <Cloud size={20} />
              <div className="absolute -top-0.5 -right-0.5 bg-white rounded-full p-[1px]">
                 {isSyncing ? (
                    <RefreshCw size={10} className="animate-spin text-maroon-bg" />
                 ) : (
                    <div className="w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm"></div>
                 )}
              </div>
            </button>

            <div className="relative" ref={notificationRef}>
              <button 
                disabled={!defaultDept}
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative text-zinc-400 hover:text-maroon-bg transition-all p-2 hover:bg-zinc-100 rounded-full ${unreadCount > 0 ? 'animate-pulse' : ''} ${!defaultDept ? 'opacity-20 cursor-not-allowed' : ''}`}
                aria-label={`${unreadCount} notifications`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 maroon-bg text-yellow-400 text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-[0_4px_12px_rgba(128,0,0,0.3)] ring-1 ring-maroon-bg/10 transform scale-110">
                    {unreadCount}
                  </span>
                )}
              </button>



            </div>

            <div className="flex items-center gap-2 md:gap-3 border-l border-zinc-200 pl-3 md:pl-5">
              <div className="hidden sm:block text-right">
                <p className="text-[11px] font-bold text-zinc-900 leading-none">{defaultDept || "None Selected"}</p>
                <p className="text-[8px] font-bold text-zinc-400 mt-0.5 uppercase tracking-tight">
                  {isAdmin ? 'Admin' : (defaultDept ? 'Staff' : 'Guest')}
                </p>
              </div>
              <div 
                onClick={() => setActiveView('settings')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[11px] shadow-md border transform rotate-2 hover:rotate-0 transition-all duration-300 cursor-pointer group ${
                  defaultDept ? 'maroon-accent-bg text-yellow-400 border-red-900/10' : 'bg-zinc-100 text-zinc-300 border-zinc-200'
                }`}
              >
                {defaultDept ? String(defaultDept).substring(0, 2).toUpperCase() : <HelpCircle size={14} />}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-20 md:pb-6 bg-zinc-50">
          {activeView === 'dashboard' && <Dashboard inventory={inventory} requisitions={requisitions} defaultDept={defaultDept} />}
          {activeView === 'requisitions' && (
            <RequisitionList 
              requisitions={requisitions} 
              onStatusUpdate={updateRequisitionStatus} 
              onUpdateRequisition={handleUpdateRequisition} 
              defaultDept={defaultDept}
              availableDepartments={availableDepartments}
              isAdmin={isAdmin}
              inventory={inventory}
            />
          )}
          {activeView === 'new-request' && (
            <RequisitionForm 
              onSubmit={handleNewRequisition} 
              inventory={inventory} 
              defaultDepartment={defaultDept}
              requisitions={requisitions}
            />
          )}
          {activeView === 'inventory' && <Inventory inventory={inventory} />}
          {activeView === 'settings' && (
            <Settings 
              defaultDept={defaultDept} 
              availableDepartments={availableDepartments}
              onSave={setDefaultDept} 
              isAdmin={isAdmin}
              onAdminToggle={setIsAdmin}
            />
          )}
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 h-14 flex items-center justify-around px-2 pb-safe z-50 shadow-[0_-8px_20px_rgba(0,0,0,0.03)]">
          <MobileNavItem icon={<LayoutDashboard size={18} />} label="Dash" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <MobileNavItem icon={<ClipboardList size={18} />} label="Orders" active={activeView === 'requisitions'} onClick={() => setActiveView('requisitions')} />
          <div className="relative -top-3">
             <button onClick={() => setActiveView('new-request')} className={`bg-zinc-900 p-3 rounded-full text-yellow-400 shadow-lg border-4 border-white ${activeView === 'new-request' ? 'ring-2 ring-maroon-bg/5' : ''}`}>
              <PlusCircle size={22} />
            </button>
          </div>
          <MobileNavItem icon={<Package size={18} />} label="Stock" active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} />
          <MobileNavItem icon={<SettingsIcon size={18} />} label="Set" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </nav>
      </div>
    </div>
  );
}
