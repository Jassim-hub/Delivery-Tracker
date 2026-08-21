import React, { memo } from 'react';
import { DeliveryStatus } from '@/types';
import { CheckCircle2, Clock, PackageCheck, Truck, CheckCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusStepperProps {
  currentStatus: DeliveryStatus;
  className?: string;
}

const STEPS = [
  { key: 'pending', label: 'Placed', icon: Clock },
  { key: 'assigned', label: 'Assigned', icon: CheckCircle2 },
  { key: 'picked_up', label: 'Picked Up', icon: PackageCheck },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCheck },
];

const StatusStepperComponent: React.FC<StatusStepperProps> = ({ currentStatus, className = '' }) => {
  const getStepIndex = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'assigned':
      case 'accepted':
        return 1;
      case 'picked_up':
        return 2;
      case 'in_transit':
        return 3;
      case 'delivered':
        return 4;
      case 'failed':
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(currentStatus);
  const isFailedOrCancelled = currentStatus === 'failed' || currentStatus === 'cancelled';

  if (isFailedOrCancelled) {
    return (
      <div className={cn('flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800', className)}>
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
        <div>
          <h4 className="text-sm font-bold capitalize">Delivery {currentStatus}</h4>
          <p className="text-xs text-rose-700">This delivery exception has been recorded in the dispatch log.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full py-3', className)}>
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Bar */}
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full -z-0">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${(activeIndex / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Nodes */}
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 shadow-sm',
                  isCompleted && 'bg-primary border-primary text-white',
                  isCurrent && 'bg-accent border-accent-hover text-gray-900 ring-4 ring-accent/25 scale-110 font-bold',
                  !isCompleted && !isCurrent && 'bg-white border-gray-300 text-gray-400'
                )}
              >
                <Icon className={cn('w-4 h-4', isCurrent && 'animate-pulse')} />
              </div>
              <span
                className={cn(
                  'text-[9px] sm:text-[11px] mt-1.5 font-semibold transition-colors text-center select-none px-1',
                  isCurrent ? 'text-primary font-bold' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                )}
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

// FIX INEFFICIENCY 5: memoize so the stepper only re-renders when currentStatus
// actually changes, not on every parent GPS-tick re-render.
export const StatusStepper = memo(StatusStepperComponent);
