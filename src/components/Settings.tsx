import React, { useState } from 'react';
import { Department } from '../types';
import { ShieldCheck, Lock, Save, AlertTriangle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsProps {
  defaultDept: Department | null;
  availableDepartments: Department[];
  onSave: (department: Department | null) => void;
  isAdmin: boolean;
  onAdminToggle: (isAdmin: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ defaultDept, availableDepartments, onSave, isAdmin, onAdminToggle }) => {
  const [selectedDept, setSelectedDept] = useState<Department | null>(defaultDept);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleSaveDepartment = () => {
    onSave(selectedDept);
    toast.success('Default department saved!');
  };

  const verifyAdminPassword = (password: string): boolean => {
    // In a real application, this would be an API call to a secure backend
    // For this demo, we'll use a simple environment variable check
    return password === import.meta.env.VITE_ADMIN_PASSWORD;
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      // If currently admin, toggle off without password
      onAdminToggle(false);
      setAdminPassword('');
      setShowPasswordInput(false);
      toast.info('Admin access revoked.');
    } else {
      // If not admin, show password input
      setShowPasswordInput(true);
    }
  };

  const handleAdminPasswordSubmit = () => {
    if (verifyAdminPassword(adminPassword)) {
      onAdminToggle(true);
      setShowPasswordInput(false);
      setAdminPassword('');
      toast.success('Admin access granted!');
    } else {
      toast.error('Incorrect admin password.');
      setAdminPassword('');
    }
  };

  return (
    <div className="space-y-8 p-6 bg-white rounded-2xl shadow-xl border border-zinc-100 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-zinc-800">Application Settings</h1>

      {/* Default Department Setting */}
      <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200">
        <h2 className="text-xl font-semibold text-zinc-800 mb-3">Default Department</h2>
        <p className="text-sm text-zinc-500 mb-4">Set a default department for new requisitions and dashboard filtering.</p>
        <div className="flex items-center gap-3">
          <div className="relative flex-grow">
            <select
              value={selectedDept || ''}
              onChange={(e) => setSelectedDept(e.target.value as Department)}
              className="w-full p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-maroon-bg/20 focus:border-maroon-bg/30 outline-none appearance-none transition-all text-sm font-medium"
            >
              <option value="" disabled>Select a department</option>
              {availableDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown size={16} className="text-zinc-400" />
            </div>
          </div>
          <button
            onClick={handleSaveDepartment}
            disabled={selectedDept === defaultDept}
            className="px-5 py-3 bg-zinc-900 text-yellow-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={16} /> Save
          </button>
        </div>
        {!defaultDept && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertTriangle size={14} /> No default department set. Please select one.
          </p>
        )}
      </div>

      {/* Admin Access Setting */}
      <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200">
        <h2 className="text-xl font-semibold text-zinc-800 mb-3">Admin Access</h2>
        <p className="text-sm text-zinc-500 mb-4">Toggle administrative privileges for advanced features.</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className={isAdmin ? 'text-green-600' : 'text-zinc-400'} />
            <span className={`font-medium ${isAdmin ? 'text-green-700' : 'text-zinc-600'}`}>
              {isAdmin ? 'Admin Access Enabled' : 'Admin Access Disabled'}
            </span>
          </div>
          <button
            onClick={handleAdminToggle}
            className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2 ${isAdmin ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-zinc-900 hover:bg-black text-yellow-400'}`}
          >
            {isAdmin ? 'Revoke Admin' : 'Grant Admin'}
          </button>
        </div>
        {showPasswordInput && (
          <div className="mt-4 flex gap-3">
            <input
              type="password"
              placeholder="Enter Admin Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="flex-grow p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-maroon-bg/20 focus:border-maroon-bg/30 outline-none transition-all text-sm font-medium"
            />
            <button
              onClick={handleAdminPasswordSubmit}
              className="px-5 py-3 bg-maroon-bg text-yellow-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-900 transition-colors"
            >
              <Lock size={16} /> Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
