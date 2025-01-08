//src\components\Timeline.tsx
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface TimelineProps {
  steps: string[];
  currentStep: number;
}

export function Timeline({ steps, currentStep }: TimelineProps) {
  return (
    <div className="w-full py-16">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            {/* Step circle */}
            <div className="relative">
              <div
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-full border-2 transition-colors",
                  index < currentStep
                    ? "bg-teal-600 border-teal-600"
                    : index === currentStep
                    ? "border-teal-600 text-teal-600"
                    : "border-gray-300 text-gray-300"
                )}
              >
                {index < currentStep ? (
                  <Check className="w-7 h-7 text-white" />
                ) : (
                  <span className="text-lg">{index + 1}</span>
                )}
              </div>
              <span className="absolute top-16 left-1/2 -translate-x-1/2 text-sm font-medium text-gray-600 whitespace-nowrap">
                {step}
              </span>
            </div>
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-32",
                  index < currentStep
                    ? "bg-teal-600"
                    : "bg-gray-300"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}