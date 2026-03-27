import React, { useState, useEffect } from 'react';
import { Save, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface DepartmentHeadProps {
  availableDepartments: string[];
  departmentHeads: Record<string, string>;
  onSave: (heads: Record<string, string>) => Promise<void>;
}

const DepartmentHead: React.FC<DepartmentHeadProps> = ({ availableDepartments, departmentHeads, onSave }) => {
  const [localHeads, setLocalHeads] = useState<Record<string, string>>(departmentHeads);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalHeads(departmentHeads);
  }, [departmentHeads]);

  const handleChange = (dept: string, value: string) => {
    setLocalHeads(prev => ({ ...prev, [dept]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(localHeads);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
            <Users className="text-maroon-bg dark:text-gold-bg" />
            Department Heads
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Manage department head names for requisitions</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {availableDepartments.map(dept => (
            <div key={dept} className="space-y-2">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider pl-1">{dept}</label>
              <input
                type="text"
                value={localHeads[dept] || ''}
                onChange={(e) => handleChange(dept, e.target.value)}
                placeholder={`Head of ${dept}`}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-maroon-bg/20 dark:focus:ring-gold-bg/20 transition-all text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepartmentHead;
