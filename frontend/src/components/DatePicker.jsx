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
        <button type="button" className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:border-slate-400 transition-colors ${!isValid ? 'text-slate-400' : ''} ${className}`}>
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          {isValid ? format(dateValue, 'dd MMM yyyy') : placeholder}
          {isValid && <X className="w-3 h-3 text-slate-400 hover:text-rose-500 ml-1" onClick={(e) => { e.stopPropagation(); onChange(''); }} />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={isValid ? dateValue : undefined} onSelect={(d) => { if (d) onChange(d.toISOString().split('T')[0]); setOpen(false); }} initialFocus />
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
        <span className={`text-[11px] font-mono cursor-pointer hover:text-blue-600 transition-colors ${isValid ? 'text-slate-600' : 'text-slate-400'}`}>
          {isValid ? format(dateValue, 'dd MMM yyyy') : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={isValid ? dateValue : undefined} onSelect={(d) => { if (d) onChange(d.toISOString().split('T')[0]); else onChange(''); setOpen(false); }} initialFocus />
      </PopoverContent>
    </Popover>
  );
}
