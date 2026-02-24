
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Bell, 
  Search, 
  ShieldCheck,
  Zap,
  ArrowRight,
  Cloud,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InventoryItem, Requisition, Department } from './types';
import Dashboard from './components/Dashboard';
import RequisitionList from './components/RequisitionList';
import RequisitionForm from './components/RequisitionForm';
import Inventory from './components/Inventory';
import Settings from './components/Settings';
import Sidebar from './src/components/Sidebar';
import Header from './src/components/Header';
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

const SplashScreen = ({ onEnter, ready }: { onEnter: () => void; ready: boolean }) => (
  <div className="fixed inset-0 z-[100] bg-[#1a0000] flex flex-col items-center justify-center overflow-hidden">
    {/* Atmospheric Background */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-maroon-bg opacity-20 blur-[120px] rounded-full"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>
    </div>

    {/* Luxury Flourish Container */}
    <div className="relative group animate-flourish">
      <div className="absolute inset-0 bg-gold-bg/10 blur-[60px] rounded-full scale-125 group-hover:bg-gold-bg/20 transition-all duration-1000"></div>
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
          className="group flex items-center gap-4 px-12 py-5 bg-gradient-to-r from-maroon-bg to-maroon-accent-bg gold-text font-black uppercase tracking-[0.4em] text-[11px] rounded-full shadow-[0_25px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_70px_rgba(128,0,0,0.4)] hover:-translate-y-1 active:scale-95 transition-all duration-500 animate-in zoom-in-95 fade-in slide-in-from-bottom-8 border border-white/5"
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
  const [activeView, setActiveView] = useState<View>('requisitions');
  
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  const handleSync = useCallback(async (silent = false) => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await handleCloudSync();
      if (!silent) {
        toast.success('System synchronized with cloud');
      }
    } catch (error) {
      if (!silent) {
        toast.error('Sync failed. Please check connection.');
      }
      console.error('Sync failed:', error);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, [handleCloudSync, isSyncing]);

  // Auto-sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleSync(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [handleSync]);

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

  const updateRequisitionStatus = async (id: string, status: Requisition['status'], reason?: string | null) => {
    setRequisitions(prev => prev.map(r => r.id === id ? { ...r, status, rejectionReason: reason === null ? undefined : (reason || r.rejectionReason) } : r));
    try {
      await updateStatusDb(id, status, reason);
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
    <div className="flex h-screen bg-white dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 animate-in fade-in duration-500 transition-colors">
      <Sidebar activeView={activeView} setActiveView={setActiveView as (view: string) => void} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          defaultDept={defaultDept}
          isAdmin={isAdmin}
          isSyncing={isSyncing}
          handleSync={() => handleSync(false)}
          unreadCount={unreadCount}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          deptNotifications={deptNotifications}
          notificationRef={notificationRef}
        />
        <main className="flex-1 overflow-y-auto bg-stone-50 dark:bg-stone-950 p-6 transition-colors">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
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
                  isDarkMode={isDarkMode}
                  onThemeToggle={setIsDarkMode}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
