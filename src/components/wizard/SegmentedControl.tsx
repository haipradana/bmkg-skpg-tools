import React from 'react';
import { cn } from '@/lib/utils';

interface SegmentedControlProps {
  value: 0 | 1;
  onChange: (value: 0 | 1) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  value,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium">{label}</label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <div className="inline-flex rounded-lg border-2 border-[#0D73A5] bg-muted p-1">
        <button
          type="button"
          onClick={() => !disabled && onChange(0)}
          disabled={disabled}
          className={cn(
            'px-6 py-2 rounded-md text-sm font-medium transition-all',
            value === 0
              ? 'bg-[#0D73A5] text-white shadow-md font-semibold'
              : 'text-muted-foreground hover:text-[#0D73A5] hover:bg-[#0D73A5]/10',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          0
        </button>
        <button
          type="button"
          onClick={() => !disabled && onChange(1)}
          disabled={disabled}
          className={cn(
            'px-6 py-2 rounded-md text-sm font-medium transition-all',
            value === 1
              ? 'bg-[#0D73A5] text-white shadow-md font-semibold'
              : 'text-muted-foreground hover:text-[#0D73A5] hover:bg-[#0D73A5]/10',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          1
        </button>
      </div>
    </div>
  );
};

