import { useState } from 'react';
import { Plus, X, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { createManufacturer, updateManufacturerRating, deleteManufacturer } from '@/lib/api';
import { toast } from 'sonner';

export default function ManufacturersPage({ manufacturers, refreshManufacturers }) {
  const [showModal, setShowModal] = useState(false);

  const handleRatingClick = async (mfrId, field, value) => {
    try {
      await updateManufacturerRating(mfrId, field, value);
      refreshManufacturers();
    } catch { toast.error('Failed to update rating'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this manufacturer?')) return;
    try {
      await deleteManufacturer(id);
      toast.success('Manufacturer removed');
      refreshManufacturers();
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div data-testid="manufacturers-page">
      <div className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800 px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-display" data-testid="manufacturers-title">Manufacturer Ratings</h1>
            <p className="text-sm text-neutral-400 mt-1">Output capability · QC standards · Priority to us</p>
          </div>
          <button
            data-testid="add-manufacturer-btn"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium bg-white text-black hover:bg-neutral-200 h-9 px-4 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2} /> Add Manufacturer
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-md overflow-hidden" data-testid="manufacturers-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-4 py-3 text-left">Name</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-3 text-left">Location</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-3 text-left">Specialty</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-3 text-left">Output</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-3 text-left">QC</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-3 text-left">Priority</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-3 text-center">Avg</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-3 text-center w-10"></th>
              </tr>
            </thead>
            <tbody>
              {manufacturers.map(m => {
                const or = m.or || m.or_rating || 0;
                const avg = ((or + (m.qr || 0) + (m.pr || 0)) / 3);
                const avgColor = avg >= 4 ? 'text-emerald-400' : avg >= 2.5 ? 'text-amber-400' : 'text-rose-400';
                return (
                  <tr key={m.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30" data-testid={`manufacturer-row-${m.id}`}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white">{m.name}</div>
                      {m.notes && <div className="text-[11px] text-neutral-500 mt-0.5">{m.notes}</div>}
                    </td>
                    <td className="px-3 py-3 text-xs text-neutral-400">{m.loc || '—'}</td>
                    <td className="px-3 py-3 text-xs text-neutral-400">{m.cat || '—'}</td>
                    <td className="px-3 py-3"><StarRating value={or} onChange={v => handleRatingClick(m.id, 'or', v)} testId={`rating-output-${m.id}`} /></td>
                    <td className="px-3 py-3"><StarRating value={m.qr || 0} onChange={v => handleRatingClick(m.id, 'qr', v)} testId={`rating-qc-${m.id}`} /></td>
                    <td className="px-3 py-3"><StarRating value={m.pr || 0} onChange={v => handleRatingClick(m.id, 'pr', v)} testId={`rating-priority-${m.id}`} /></td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-sm font-semibold font-mono ${avgColor}`}>{avg.toFixed(1)}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button data-testid={`delete-manufacturer-${m.id}`} onClick={() => handleDelete(m.id)} className="p-1.5 rounded hover:bg-rose-400/10 text-neutral-500 hover:text-rose-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {manufacturers.length === 0 && (
                <tr><td colSpan={8} className="text-center text-neutral-500 text-sm py-10">No manufacturers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <button
          data-testid="add-manufacturer-bottom-btn"
          onClick={() => setShowModal(true)}
          className="w-full mt-3 py-2.5 border border-dashed border-neutral-700 rounded-md text-xs text-neutral-500 hover:text-white hover:border-neutral-500 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Manufacturer
        </button>
      </div>

      <ManufacturerModal open={showModal} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); refreshManufacturers(); }} />
    </div>
  );
}

function StarRating({ value, onChange, testId }) {
  return (
    <div className="flex gap-0.5" data-testid={testId}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`star-btn ${i <= value ? 'text-amber-400' : 'text-neutral-700'}`}
        >
          <Star className="w-4 h-4" fill={i <= value ? 'currentColor' : 'none'} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

function ManufacturerModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', loc: '', cat: '', or: 0, qr: 0, pr: 0, notes: '' });
  const [saving, setSaving] = useState(false);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      await createManufacturer(form);
      toast.success('Manufacturer added');
      setForm({ name: '', loc: '', cat: '', or: 0, qr: 0, pr: 0, notes: '' });
      onSaved();
    } catch { toast.error('Failed to add manufacturer'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-neutral-900 border-neutral-800 max-w-md text-white" data-testid="manufacturer-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white font-display">Add Manufacturer</DialogTitle>
          <DialogDescription className="text-neutral-400 text-sm">Enter manufacturer details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Name *</label>
            <input data-testid="manufacturer-name-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. XYZ Cosmetics" className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Location</label>
              <input value={form.loc} onChange={e => set('loc', e.target.value)} placeholder="e.g. Mumbai" className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Specialty</label>
              <input value={form.cat} onChange={e => set('cat', e.target.value)} placeholder="e.g. Skincare" className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Output</label>
              <StarRating value={form.or} onChange={v => set('or', v)} testId="modal-rating-output" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">QC</label>
              <StarRating value={form.qr} onChange={v => set('qr', v)} testId="modal-rating-qc" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Priority</label>
              <StarRating value={form.pr} onChange={v => set('pr', v)} testId="modal-rating-priority" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Lead times, limitations..." rows={2} className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800 mt-2">
          <button onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-neutral-800 bg-transparent hover:bg-neutral-800 text-white h-9 px-4 transition-colors">Cancel</button>
          <button data-testid="save-manufacturer-btn" onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white text-black hover:bg-neutral-200 h-9 px-4 transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
