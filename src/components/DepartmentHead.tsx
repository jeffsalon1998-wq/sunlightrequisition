import React, { useState, useEffect } from 'react';
import { Save, Users, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface DepartmentHeadProps {
  availableDepartments: string[];
  departmentHeads: Record<string, string>;
  departmentPasswords: Record<string, string>;
  onSave: (heads: Record<string, string>, passwords: Record<string, string>) => Promise<void>;
}

const DepartmentHead: React.FC<DepartmentHeadProps> = ({ availableDepartments, departmentHeads, departmentPasswords, onSave }) => {
  const [localHeads, setLocalHeads] = useState<Record<string, string>>(departmentHeads);
  const [localPasswords, setLocalPasswords] = useState<Record<string, string>>(departmentPasswords);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalHeads(departmentHeads);
  }, [departmentHeads]);

  useEffect(() => {
    setLocalPasswords(departmentPasswords);
  }, [departmentPasswords]);

  const handleChange = (dept: string, value: string) => {
    setLocalHeads(prev => ({ ...prev, [dept]: value }));
  };

  const handlePasswordChange = (dept: string, value: string) => {
    setLocalPasswords(prev => ({ ...prev, [dept]: value }));
  };

  const togglePasswordVisibility = (dept: string) => {
    setShowPasswords(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(localHeads, localPasswords);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
            <Users className="text-maroon-bg dark:text-gold-bg" />
            Department Management
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Manage department heads and passwords for requisitions</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 maroon-bg gold-text rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50 shadow-md"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {availableDepartments.map(dept => (
            <div key={dept} className="space-y-4 p-4 bg-stone-50/50 dark:bg-stone-950/50 rounded-xl border border-stone-100 dark:border-stone-800/50">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-maroon-bg dark:text-gold-bg uppercase tracking-widest">{dept}</label>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Department Head</label>
                  <input
                    type="text"
                    value={localHeads[dept] || ''}
                    onChange={(e) => handleChange(dept, e.target.value)}
                    placeholder={`Head of ${dept}`}
                    className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-maroon-bg/20 dark:focus:ring-gold-bg/20 transition-all text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">
                    {dept === 'Purchasing' ? 'Admin/Purchasing Password' : 'Access Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords[dept] ? "text" : "password"}
                      value={localPasswords[dept] || ''}
                      onChange={(e) => handlePasswordChange(dept, e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-maroon-bg/20 dark:focus:ring-gold-bg/20 transition-all text-stone-900 dark:text-stone-100 placeholder:text-stone-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(dept)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    >
                      {showPasswords[dept] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepartmentHead;
