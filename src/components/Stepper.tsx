import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (stepId: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: `${(completedSteps.length / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && (isCompleted || index <= currentStep);

          return (
            <div
              key={step.id}
              className="flex flex-col items-center flex-1"
              onClick={() => isClickable && onStepClick(step.id)}
            >
              {/* Circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2',
                  isCompleted && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && !isCompleted && 'border-primary bg-background text-primary',
                  !isCurrent && !isCompleted && 'border-muted bg-background text-muted-foreground',
                  isClickable && 'cursor-pointer hover:scale-110'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="mt-2 text-center max-w-[120px]">
                <div
                  className={cn(
                    'text-xs font-medium transition-colors',
                    isCurrent && 'text-primary',
                    !isCurrent && isCompleted && 'text-foreground',
                    !isCurrent && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

