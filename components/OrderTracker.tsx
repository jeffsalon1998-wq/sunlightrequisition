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

  if (status === 'Rejected') {
    return (
      <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">
        <XCircle size={16} />
        Order Rejected
      </div>
    );
  }

  const currentStepIndex = steps.findIndex(s => s.label === status);

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative px-2">
        {/* Background Line */}
        <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-zinc-200 -translate-y-1/2 z-0" />
        
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
                  isCompleted ? 'maroon-accent-bg text-yellow-400 shadow-sm' : 
                  isCurrent ? 'yellow-bg maroon-text border border-maroon-bg/20 shadow-lg scale-110' : 
                  'bg-white text-zinc-300 border border-zinc-200'
                }`}
              >
                {isCompleted ? <CheckCircle2 size={14} /> : step.icon}
              </div>
              <span 
                className={`absolute -bottom-5 text-[7px] md:text-[8px] font-black whitespace-nowrap uppercase tracking-tighter ${
                  isCurrent ? 'maroon-text' : 'text-zinc-300'
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