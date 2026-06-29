import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const MaintenanceScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-stone-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-maroon-bg rounded-full flex items-center justify-center mb-8 animate-pulse">
        <AlertTriangle size={48} className="text-gold-text" />
      </div>
      <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-4">System Maintenance</h1>
      <p className="text-stone-400 max-w-md font-medium">
        We are currently performing scheduled maintenance to improve our services. 
        Please check back shortly.
      </p>
    </div>
  );
};
