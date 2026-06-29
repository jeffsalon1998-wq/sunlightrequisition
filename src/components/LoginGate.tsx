import React, { useState } from 'react';
import { Shield, KeyRound, Eye, EyeOff, LogIn, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Department } from '../../types';
import { verifyDepartmentPassword } from '../../services/database';
import { SunlightTextLogo } from './SunlightTextLogo';
import { toast } from 'sonner';

interface LoginGateProps {
  onLogin: (dept: Department) => void;
  availableDepartments: Department[];
}

export const LoginGate: React.FC<LoginGateProps> = ({ onLogin, availableDepartments }) => {
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) {
      toast.error('Please select your department');
      return;
    }
    
    setIsVerifying(true);
    try {
      const isValid = await verifyDepartmentPassword(selectedDept, password);
      if (isValid) {
        onLogin(selectedDept);
        toast.success(`Access granted to ${selectedDept}`);
      } else {
        toast.error('Invalid authorization token');
      }
    } catch (error) {
      toast.error('Connection error');
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#1a0000] flex items-center justify-center p-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-maroon-bg opacity-10 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-10">
          <SunlightTextLogo light />
          <div className="mt-4 flex items-center gap-2">
            <div className="w-8 h-[1px] bg-gold-bg/20"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] gold-text">Terminal Access</span>
            <div className="w-8 h-[1px] bg-gold-bg/20"></div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase mb-2 ml-1 tracking-[0.1em]">Select Department</label>
                <div className="relative group">
                  <select 
                    value={selectedDept || ""} 
                    onChange={e => setSelectedDept(e.target.value as Department)}
                    className="w-full bg-black/40 border border-white/10 px-4 py-4 rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-gold-bg/30 appearance-none transition-all group-hover:border-white/20"
                  >
                    <option value="" className="bg-stone-900">Select Department...</option>
                    {availableDepartments.map(d => (
                      <option key={d} value={d} className="bg-stone-900 text-white">{d}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                    <Shield size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase mb-2 ml-1 tracking-[0.1em]">Verification Token</label>
                <div className="relative group">
                  <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-text transition-colors" />
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-black/40 border border-white/10 pl-12 pr-12 py-4 rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-gold-bg/30 transition-all group-hover:border-white/20"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isVerifying}
              className="w-full py-4 bg-gradient-to-r from-gold-bg to-[#e0a94b] text-maroon-bg rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-gold-bg/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isVerifying ? (
                <div className="w-5 h-5 border-2 border-maroon-bg/30 border-t-maroon-bg rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={18} />
                  Establish Link
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">Authorized Personnel Only</p>
        </div>
      </motion.div>
    </div>
  );
};
