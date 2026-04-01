
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
import DepartmentHead from './src/components/DepartmentHead';
import Sidebar from './src/components/Sidebar';
import Header from './src/components/Header';
import { useTheme } from './src/components/ThemeProvider';
import { SunlightTextLogo } from './src/components/SunlightTextLogo';
import { MaintenanceScreen } from './src/components/MaintenanceScreen';
import { OfflineScreen } from './src/components/OfflineScreen';
import { useDatabaseInit } from './src/hooks/useDatabaseInit';
import { 
  saveRequisitionDb, 
  updateRequisitionDb, 
  updateStatusDb,
  saveConfig,
  getConfig,
  getDepartmentPasswords,
  saveDepartmentPassword,
  verifyAdminPassword,
  verifyDepartmentPassword
} from './services/database';
import { Toaster, toast } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

type View = 'dashboard' | 'requisitions' | 'new-request' | 'inventory' | 'department-head' | 'settings';

const LoadingScreen = () => (
  <div className="fixed inset-0 z-[100] bg-[#1a0000] flex flex-col items-center justify-center overflow-hidden">
    {/* Atmospheric Background */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-maroon-bg opacity-20 blur-[120px] rounded-full"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>
    </div>

    {/* Luxury Flourish Container */}
    <div className="relative group animate-flourish">
      <div className="absolute inset-0 bg-gold-bg/10 blur-[60px] rounded-full scale-125 group-hover:bg-gold-bg/20 transition-all duration-1000"></div>
      <div className="relative transform transition-all duration-1000 animate-pulse">
        <SunlightTextLogo light />
      </div>
    </div>
    
    <div className="mt-20 flex flex-col items-center gap-8 min-h-[140px] z-10">
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
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode) {
    return <MaintenanceScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

function AppContent() {
  const [activeView, setActiveView] = useState<View>('requisitions');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { 
    inventory, 
    setInventory, 
    requisitions, 
    setRequisitions, 
    availableDepartments, 
    setAvailableDepartments, 
    isLoading,
    error,
    refresh: handleCloudSync
  } = useDatabaseInit();



  // DEFAULT DEPARTMENT SET TO NULL (BLANK)
  const [defaultDept, setDefaultDept] = useState<Department | null>(() => {
    const saved = localStorage.getItem('sunlight_default_dept');
    return saved ? (saved as Department) : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('sunlight_default_dept'));
  const [isManualAdmin, setIsManualAdmin] = useState<boolean>(() => {
    const saved = localStorage.getItem('sunlight_is_admin');
    return saved === 'true';
  });

  const isAdmin = useMemo(() => {
    return defaultDept === 'Purchasing' || isManualAdmin;
  }, [defaultDept, isManualAdmin]);

  // Persist settings
  useEffect(() => {
    if (defaultDept) {
      localStorage.setItem('sunlight_default_dept', defaultDept);
    } else {
      localStorage.removeItem('sunlight_default_dept');
    }
    // Reset manual admin when department changes
    setIsManualAdmin(false);
  }, [defaultDept]);

  useEffect(() => {
    localStorage.setItem('sunlight_is_admin', String(isManualAdmin));
  }, [isManualAdmin]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [bgConfig, setBgConfig] = useState<{ bgUrlDark?: string; bgUrlLight?: string }>({
    bgUrlDark: import.meta.env.VITE_BG_URL_DARK || '',
    bgUrlLight: import.meta.env.VITE_BG_URL_LIGHT || 'https://i.ibb.co/FkH6MZVk/486295351-1190977103027465-6274870662942126036-n-1.jpg'
  });
  const [departmentHeads, setDepartmentHeads] = useState<Record<string, string>>({});
  const [departmentPasswords, setDepartmentPasswords] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadDeptData = async () => {
      const [heads, passwords] = await Promise.all([
        getConfig('department_heads'),
        getDepartmentPasswords()
      ]);
      if (heads) setDepartmentHeads(heads);
      if (passwords) setDepartmentPasswords(passwords);
    };
    loadDeptData();
  }, []);

  useEffect(() => {
    const loadBgConfig = async () => {
      // 1. Try to load from database
      let saved = await getConfig('bg_config');
      
      // 2. If not in database, try to load from localStorage (migration)
      if (!saved) {
        const localSaved = localStorage.getItem('sunlight_bg_config');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (parsed) {
            // Try to save to database
            await saveConfig('bg_config', parsed);
            
            // Verify if it was saved
            const verified = await getConfig('bg_config');
            if (verified) {
              saved = parsed;
              localStorage.removeItem('sunlight_bg_config');
              toast.success('Background settings migrated to cloud');
            } else {
              // If saving failed, keep it in localStorage
              saved = parsed;
              toast.warning('Could not sync background settings to cloud. Using local settings.');
            }
          }
        }
      }
      
      if (saved) {
        setBgConfig(saved);
      }
    };
    loadBgConfig();
  }, []);


  const handleUpdateBgConfig = async (config: { bgUrlDark?: string; bgUrlLight?: string }) => {
    setBgConfig(config);
    await saveConfig('bg_config', config);
    toast.success('Background settings updated');
  };

  const handleSaveDeptHeads = async (heads: Record<string, string>, passwords: Record<string, string>) => {
    try {
      setDepartmentHeads(heads);
      setDepartmentPasswords(passwords);
      
      // Save heads to config
      await saveConfig('department_heads', heads);
      
      // Save each password to app_config
      const savePromises = Object.entries(passwords).map(([dept, pass]) => 
        saveDepartmentPassword(dept as Department, pass)
      );
      await Promise.all(savePromises);
      
      toast.success('Department management updated successfully');
    } catch (error) {
      console.error('Failed to save department data:', error);
      toast.error('Failed to save changes');
    }
  };

  useEffect(() => {
    const bgUrl = isDarkMode 
      ? (bgConfig.bgUrlDark || import.meta.env.VITE_BG_URL_DARK) 
      : (bgConfig.bgUrlLight || import.meta.env.VITE_BG_URL_LIGHT || 'https://i.ibb.co/FkH6MZVk/486295351-1190977103027465-6274870662942126036-n-1.jpg');

    if (bgUrl) {
      const tint = isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.0)';
      document.body.style.backgroundImage = `linear-gradient(${tint}, ${tint}), url(${bgUrl})`;
      document.body.style.backgroundColor = 'transparent';
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    }
  }, [isDarkMode, bgConfig]);

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

  // Add a log to detect if AppContent re-mounts
  useEffect(() => {
    return () => {};
  }, []);

  const handleSync = useCallback(async (silent = false) => {
    // Use a ref to track syncing state to avoid dependency on isSyncing in handleSync
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      await handleCloudSync(true); // Use silent=true to avoid full-screen LoadingScreen
      if (!silent) {
        toast.success('System synchronized with cloud');
      }
    } catch (error) {
      if (!silent) {
        toast.error('Sync failed. Please check connection.');
      }
      console.error('Sync failed:', error);
    } finally {
      setTimeout(() => {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }, 800);
    }
  }, [handleCloudSync]);

  const isSyncingRef = useRef(false);

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



  const handleDeptLogin = async (dept: Department, password: string) => {
    try {
      const isAdminPass = await verifyAdminPassword(password);
      const isDeptPass = await verifyDepartmentPassword(dept, password);
      
      if (isAdminPass || isDeptPass) {
        setDefaultDept(dept);
        setIsLoggedIn(true);
        if (isAdminPass) setIsManualAdmin(true);
        toast.success(`Logged in as ${dept}`);
      } else {
        toast.error('Invalid password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    }
  };

  const handleLogout = () => {
    setDefaultDept(null);
    setIsLoggedIn(false);
    setIsManualAdmin(false);
    localStorage.removeItem('sunlight_default_dept');
    localStorage.removeItem('sunlight_is_admin');
    toast.success('Logged out successfully');
  };

  if (!isOnline) {
    return <OfflineScreen />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#1a0000] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Database Connection Error</h2>
        <p className="text-stone-300 max-w-md">
          {error.message === 'Failed to fetch' 
            ? 'Unable to connect to the database. Please check your internet connection or database configuration.' 
            : error.message}
        </p>
        <button 
          onClick={() => handleCloudSync()}
          className="mt-6 px-4 py-2 bg-gold-bg text-stone-900 font-bold rounded-lg hover:bg-gold-bg/90 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-stone-100 overflow-hidden">
          <div className="p-8 text-center bg-stone-900 text-white">
            <SunlightTextLogo light />
            <p className="text-xs text-stone-400 mt-2 font-medium tracking-widest uppercase">Department Access</p>
          </div>
          <form className="p-8 space-y-6" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleDeptLogin(formData.get('dept') as Department, formData.get('password') as string);
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase mb-2 ml-1 tracking-widest">Select Department</label>
                <select name="dept" required className="w-full bg-stone-50 border border-stone-200 px-4 py-3 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-maroon-bg/10 outline-none appearance-none transition-all">
                  {availableDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase mb-2 ml-1 tracking-widest">Password</label>
                <input name="password" type="password" required placeholder="Enter password..." className="w-full bg-stone-50 border border-stone-200 px-4 py-3 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-maroon-bg/10 outline-none transition-all" />
              </div>
            </div>
            <button type="submit" className="w-full py-4 maroon-accent-bg gold-text rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
              Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-transparent dark:bg-stone-950/10 font-sans text-stone-900 dark:text-stone-100 animate-in fade-in duration-500 transition-colors">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView as (view: string) => void} 
        defaultDept={defaultDept}
        isAdmin={isAdmin}
      />
      <div className="flex-1 flex flex-col min-w-0 order-first md:order-none">
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
        <main className="flex-1 overflow-y-auto bg-transparent dark:bg-stone-950/80 p-6 transition-colors">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {activeView === 'dashboard' && <Dashboard inventory={inventory} requisitions={requisitions} defaultDept={defaultDept} isAdmin={isAdmin} />}
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
                  onUpdate={handleUpdateRequisition}
                  inventory={inventory} 
                  defaultDepartment={defaultDept}
                  requisitions={requisitions}
                />
              )}
              {activeView === 'inventory' && <Inventory inventory={inventory} />}
              {activeView === 'department-head' && (
                <DepartmentHead 
                  availableDepartments={availableDepartments}
                  departmentHeads={departmentHeads}
                  departmentPasswords={departmentPasswords}
                  onSave={handleSaveDeptHeads}
                />
              )}
              {activeView === 'settings' && (
                <Settings 
                  defaultDept={defaultDept} 
                  availableDepartments={availableDepartments}
                  onSave={setDefaultDept} 
                  isAdmin={isAdmin}
                  onAdminToggle={setIsManualAdmin}
                  isDarkMode={isDarkMode}
                  onThemeToggle={(active) => setTheme(active ? 'dark' : 'light')}
                  bgConfig={bgConfig}
                  onUpdateBgConfig={handleUpdateBgConfig}
                  onLogout={handleLogout}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
