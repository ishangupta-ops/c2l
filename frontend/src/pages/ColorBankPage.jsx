import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createColor, deleteColor } from '@/lib/api';
import { toast } from 'sonner';

export default function ColorBankPage({ colors, refreshColors }) {
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#3B82F6');
  const [proj, setProj] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) { toast.error('Enter a color name'); return; }
    try {
      await createColor({ hex, name: name.trim(), proj: proj.trim(), notes: notes.trim() });
      toast.success('Color added');
      setName(''); setProj(''); setNotes('');
      refreshColors();
    } catch { toast.error('Failed to add color'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this color?')) return;
    try {
      await deleteColor(id);
      toast.success('Color removed');
      refreshColors();
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div data-testid="color-bank-page">
      <div className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800 px-8 py-5">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-display" data-testid="color-bank-title">Color Bank</h1>
        <p className="text-sm text-neutral-400 mt-1">Approved packaging colors for reconciliation & reuse</p>
      </div>

      <div className="px-8 py-6">
        <p className="text-sm text-neutral-400 mb-6">Shared palette for Design & Creatives. Add approved colors here for cross-project reconciliation.</p>

        {/* Swatches */}
        <div className="flex flex-wrap gap-4 mb-8" data-testid="color-swatches">
          {colors.map(c => (
            <div key={c.id} className="text-center group relative color-swatch" data-testid={`color-swatch-${c.id}`}>
              <div className="w-16 h-16 rounded-md border border-neutral-700 relative" style={{ backgroundColor: c.hex }}>
                <button
                  data-testid={`delete-color-${c.id}`}
                  onClick={() => handleDelete(c.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:border-rose-500"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="text-[10px] font-medium text-neutral-300 mt-1.5 max-w-[72px] truncate">{c.name}</div>
              <div className="text-[9px] font-mono text-neutral-600">{c.hex}</div>
              {c.proj && <div className="text-[9px] text-neutral-600">{c.proj}</div>}
              {c.notes && <div className="text-[9px] text-neutral-600 italic">{c.notes}</div>}
            </div>
          ))}
          {colors.length === 0 && <div className="text-sm text-neutral-600">No colors yet.</div>}
        </div>

        {/* Add Color */}
        <div className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-500 mb-3">Add New Color</div>
        <div className="flex items-end gap-3 flex-wrap" data-testid="add-color-form">
          <div>
            <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 mb-1 block">Pick Color</label>
            <input
              type="color"
              data-testid="color-picker"
              value={hex}
              onChange={e => setHex(e.target.value)}
              className="w-11 h-10 rounded-md border border-neutral-700 bg-neutral-950 cursor-pointer"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 mb-1 block">Name / Code</label>
            <input
              data-testid="color-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sage Green"
              className="h-10 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600 w-36"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 mb-1 block">Project</label>
            <input
              data-testid="color-project-input"
              value={proj}
              onChange={e => setProj(e.target.value)}
              placeholder="Project name"
              className="h-10 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600 w-36"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 mb-1 block">Notes</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional"
              className="h-10 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600 w-36"
            />
          </div>
          <button
            data-testid="add-color-btn"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium bg-white text-black hover:bg-neutral-200 h-10 px-4 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
