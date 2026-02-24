
import React, { useState } from 'react';
import { Department } from '../types';
import { DEPARTMENTS } from '../constants';
import { verifyAdminPassword } from '../services/database';
import { Save, Lock, ShieldCheck, ShieldAlert, KeyRound, Shield, Eye, EyeOff, X, HelpCircle, Moon, Sun } from 'lucide-react';

interface SettingsProps {
  defaultDept: Department | null;
  availableDepartments: Department[];
  onSave: (dept: Department | null) => void;
  isAdmin: boolean;
  onAdminToggle: (active: boolean) => void;
  isDarkMode: boolean;
  onThemeToggle: (active: boolean) => void;
}

type VerifyingAction = 'save_settings' | 'activate_admin' | null;

export default function Settings({ 
  defaultDept, 
  availableDepartments,
  onSave, 
  isAdmin, 
  onAdminToggle,
  isDarkMode,
  onThemeToggle
}: SettingsProps) {
  const [selectedDept, setSelectedDept] = useState<Department | null>(defaultDept);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingAction, setVerifyingAction] = useState<VerifyingAction>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const startVerification = (action: VerifyingAction) => {
    setVerifyingAction(action);
    setFeedback(null);
    setPassword('');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isValid = await verifyAdminPassword(password);
      
      if (isValid) {
        if (verifyingAction === 'save_settings') {
          onSave(selectedDept);
          setFeedback({ type: 'success', message: 'Preferences updated!' });
        } else if (verifyingAction === 'activate_admin') {
          onAdminToggle(true);
          setFeedback({ type: 'success', message: 'Admin Access granted!' });
        }
        setVerifyingAction(null);
        setPassword('');
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: 'Unauthorized token.' });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Verification error.' });
    }
  };

  return (
    <div className="max-w-sm mx-auto space-y-5 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-end px-1">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">Preferences</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium italic mt-1">Global configuration</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full border border-red-100 dark:border-red-900/50 shadow-sm animate-pulse">
            <ShieldCheck size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Admin</span>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-stone-900 p-5 rounded-[24px] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6 transition-colors">
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 maroon-bg rounded-full"></div>
            <h3 className="text-[9px] font-black text-stone-900 dark:text-stone-100 uppercase tracking-[0.2em]">General</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[8px] font-black text-stone-400 uppercase mb-1.5 ml-1 tracking-wider">Access Department</label>
              <div className="relative">
                <select 
                  value={selectedDept || ""} 
                  onChange={e => setSelectedDept(e.target.value ? (e.target.value as Department) : null)}
                  className={`w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 px-4 py-3 rounded-xl text-xs font-bold focus:ring-4 focus:ring-maroon-bg/20 dark:focus:ring-gold-bg/20 outline-none appearance-none transition-all ${
                    selectedDept ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500'
                  }`}
                >
                  <option value="">Select Department...</option>
                  {availableDepartments.map(d => <option key={d} value={d} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">{d}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-300 dark:text-stone-600">
                  {selectedDept ? <Shield size={12} /> : <HelpCircle size={12} />}
                </div>
              </div>
            </div>
            
            <button 
              disabled={!!verifyingAction}
              onClick={() => startVerification('save_settings')}
              className="w-full py-3.5 maroon-accent-bg gold-text rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 border border-red-900/10 dark:border-white/5"
            >
              <Save size={14} /> Save Preferences
            </button>
          </div>
        </section>

        <section className="space-y-3 pt-3 border-t border-stone-50 dark:border-stone-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 maroon-bg rounded-full"></div>
            <h3 className="text-[9px] font-black text-stone-900 dark:text-stone-100 uppercase tracking-[0.2em]">Appearance</h3>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-100 dark:border-stone-800 flex items-center justify-between transition-colors">
            <div>
              <h4 className="text-[10px] font-black text-stone-800 dark:text-stone-200 uppercase tracking-tight">Dark Mode</h4>
              <p className="text-[8px] text-stone-500 dark:text-stone-400 font-medium italic">Adjust visual theme</p>
            </div>
            <button 
              onClick={() => onThemeToggle(!isDarkMode)}
              className={`w-12 h-6 rounded-full transition-all relative ${isDarkMode ? 'bg-stone-800' : 'bg-stone-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-all flex items-center justify-center ${isDarkMode ? 'left-7 bg-indigo-500' : 'left-1 bg-white shadow-sm'}`}>
                {isDarkMode ? <Moon size={10} className="text-white" /> : <Sun size={10} className="text-amber-500" />}
              </div>
            </button>
          </div>
        </section>

        <section className="space-y-3 pt-3 border-t border-stone-50 dark:border-stone-800">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-1 h-4 rounded-full ${isAdmin ? 'bg-red-500' : 'bg-stone-200 dark:bg-stone-700'}`}></div>
            <h3 className="text-[9px] font-black text-stone-900 dark:text-stone-100 uppercase tracking-[0.2em]">Security</h3>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-100 dark:border-stone-800 flex items-center justify-between transition-colors">
            <div>
              <h4 className="text-[10px] font-black text-stone-800 dark:text-stone-200 uppercase tracking-tight">Elevated Controls</h4>
              <p className="text-[8px] text-stone-500 dark:text-stone-400 font-medium italic">Cross-departmental oversight</p>
            </div>
            {isAdmin ? (
              <button onClick={() => onAdminToggle(false)} className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-black dark:hover:bg-white transition-colors">Logout</button>
            ) : (
              <button disabled={!!verifyingAction} onClick={() => startVerification('activate_admin')} className="px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-lg text-[9px] font-black uppercase tracking-wider hover:border-maroon-bg/50 dark:hover:border-gold-bg/50 hover:text-maroon-bg dark:hover:text-gold-text transition-all shadow-sm disabled:opacity-50">Auth</button>
            )}
          </div>
        </section>

        {verifyingAction && (
          <div className="animate-in zoom-in-95 fade-in duration-300">
            <form onSubmit={handleVerify} className="space-y-3 p-4 maroon-accent-bg rounded-xl gold-text shadow-2xl border border-red-900/10 dark:border-white/5">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <Lock size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Verify Admin</span>
                </div>
                <button type="button" onClick={() => setVerifyingAction(null)} className="p-1 hover:bg-white/10 rounded-full"><X size={12} /></button>
              </div>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input required autoFocus type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Token..." className="w-full bg-black/30 border border-white/10 pl-9 pr-10 py-2.5 rounded-lg focus:ring-4 focus:ring-gold-text/10 outline-none text-xs font-bold text-white placeholder:text-white/20 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
              <button type="submit" className="w-full py-2.5 gold-bg text-red-950 rounded-lg font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg">Authorize</button>
            </form>
          </div>
        )}

        {feedback && (
          <div className={`p-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-bottom-1 duration-300 ${feedback.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/50 shadow-lg' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50 shadow-lg'}`}>
            <div className={`p-1 rounded-md ${feedback.type === 'success' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
              {feedback.type === 'success' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">{feedback.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
