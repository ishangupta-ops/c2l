import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function DatePicker({ value, onChange, placeholder = 'Pick date', className = '' }) {
  const [open, setOpen] = useState(false);

  const dateValue = value ? new Date(value) : undefined;
  const isValid = dateValue && !isNaN(dateValue.getTime());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 h-7 px-2 rounded border border-neutral-700 bg-neutral-950 text-[11px] font-mono text-neutral-300 hover:border-neutral-500 transition-colors ${!isValid ? 'text-neutral-600' : ''} ${className}`}
        >
          <CalendarIcon className="w-3 h-3 text-neutral-500" />
          {isValid ? format(dateValue, 'dd MMM yyyy') : placeholder}
          {isValid && (
            <X
              className="w-3 h-3 text-neutral-500 hover:text-white ml-0.5"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-800" align="start">
        <Calendar
          mode="single"
          selected={isValid ? dateValue : undefined}
          onSelect={(d) => {
            if (d) {
              onChange(d.toISOString().split('T')[0]);
            }
            setOpen(false);
          }}
          initialFocus
          className="text-white"
        />
      </PopoverContent>
    </Popover>
  );
}

export function DatePickerInline({ value, onChange, placeholder = '—' }) {
  const [open, setOpen] = useState(false);

  const dateValue = value ? new Date(value) : undefined;
  const isValid = dateValue && !isNaN(dateValue.getTime());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className={`text-[11px] font-mono cursor-pointer hover:text-white transition-colors ${isValid ? 'text-neutral-400' : 'text-neutral-600'}`}>
          {isValid ? format(dateValue, 'dd MMM yyyy') : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-800" align="start">
        <Calendar
          mode="single"
          selected={isValid ? dateValue : undefined}
          onSelect={(d) => {
            if (d) {
              onChange(d.toISOString().split('T')[0]);
            } else {
              onChange('');
            }
            setOpen(false);
          }}
          initialFocus
          className="text-white"
        />
      </PopoverContent>
    </Popover>
  );
}
