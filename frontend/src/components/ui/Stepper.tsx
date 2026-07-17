import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-300
                    ${isCompleted 
                      ? 'bg-wave-500 text-white' 
                      : isCurrent 
                        ? 'bg-wave-500 text-white ring-4 ring-wave-500/20' 
                        : 'bg-gray-200 dark:bg-dark-border text-gray-500 dark:text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-wave-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-2 ${index < currentStep ? 'bg-wave-500' : 'bg-gray-200 dark:bg-dark-border'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
