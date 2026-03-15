import React from 'react';
import { RequestStatus } from '../types';
import { Clock, PenTool, Loader2, PackageSearch, CheckCircle2, XCircle } from 'lucide-react';

interface OrderTrackerProps { status: RequestStatus; }

const OrderTracker: React.FC<OrderTrackerProps> = ({ status }) => {
  const steps: { label: RequestStatus; icon: React.ReactNode }[] = [
    { label: 'Pending', icon: <Clock size={12} /> },
    { label: 'For signing', icon: <PenTool size={12} /> },
    { label: 'In Progress', icon: <Loader2 size={12} /> },
    { label: 'Ready for Pickup', icon: <PackageSearch size={12} /> },
    { label: 'Completed', icon: <CheckCircle2 size={12} /> },
  ];

  if (status === 'Rejected' || status === 'For Justification') {
    const isJustification = status === 'For Justification';
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
        isJustification 
          ? 'text-orange-700 bg-orange-50 border-orange-100 dark:text-orange-400 dark:bg-orange-900/30 dark:border-orange-900/50' 
          : 'text-red-700 bg-red-50 border-red-100 dark:text-red-400 dark:bg-red-900/30 dark:border-red-900/50'
      }`}>
        {isJustification ? <PenTool size={16} /> : <XCircle size={16} />}
        {isJustification ? 'For Justification' : 'Order Rejected'}
      </div>
    );
  }

  const currentStepIndex = steps.findIndex(s => s.label === status);

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative px-2">
        {/* Background Line */}
        <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-stone-200 dark:bg-stone-800 -translate-y-1/2 z-0" />
        
        {/* Progress Line */}
        <div 
          className="absolute top-1/2 left-4 h-[2px] maroon-bg -translate-y-1/2 z-0 transition-all duration-700 ease-in-out" 
          style={{ width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 2rem)` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={step.label} className="flex flex-col items-center relative z-10">
              <div 
                className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted ? 'maroon-accent-bg gold-text shadow-sm' : 
                  isCurrent ? 'gold-bg maroon-text border border-maroon-bg/20 shadow-lg scale-110' : 
                  'bg-white dark:bg-stone-900 text-stone-300 dark:text-stone-600 border border-stone-200 dark:border-stone-800'
                }`}
              >
                {isCompleted ? <CheckCircle2 size={14} /> : step.icon}
              </div>
              <span 
                className={`absolute -bottom-5 text-[7px] md:text-[8px] font-black whitespace-nowrap uppercase tracking-tighter ${
                  isCurrent ? 'maroon-text dark:text-gold-text' : 'text-stone-300 dark:text-stone-600'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracker;