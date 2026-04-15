import { useState } from 'react';
import { Plus, X, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { createManufacturer, updateManufacturerRating, deleteManufacturer } from '@/lib/api';
import { toast } from 'sonner';

export default function ManufacturersPage({ manufacturers, refreshManufacturers }) {
  const [showModal, setShowModal] = useState(false);
  const handleRatingClick = async (mfrId, field, value) => { try { await updateManufacturerRating(mfrId, field, value); refreshManufacturers(); } catch { toast.error('Failed'); } };
  const handleDelete = async (id) => { if (!window.confirm('Remove?')) return; try { await deleteManufacturer(id); toast.success('Removed'); refreshManufacturers(); } catch { toast.error('Failed'); } };

  return (
    <div data-testid="manufacturers-page">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 font-display" data-testid="manufacturers-title">Manufacturer Ratings</h1>
            <p className="text-sm text-slate-500 mt-1">Output · QC · Priority</p>
          </div>
          <button data-testid="add-manufacturer-btn" onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 transition-colors shadow-sm"><Plus className="w-4 h-4" /> Add</button>
        </div>
      </div>
      <div className="px-8 py-6">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm" data-testid="manufacturers-table">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-4 py-3 text-left">Name</th>
              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-3 text-left">Location</th>
              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-3 text-left">Output</th>
              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-3 text-left">QC</th>
              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-3 text-left">Priority</th>
              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-3 text-center">Avg</th>
              <th className="px-3 py-3 w-10"></th>
            </tr></thead>
            <tbody>
              {manufacturers.map(m => {
                const or = m.or || m.or_rating || 0;
                const avg = ((or + (m.qr || 0) + (m.pr || 0)) / 3);
                const avgC = avg >= 4 ? 'text-emerald-600' : avg >= 2.5 ? 'text-amber-600' : 'text-rose-600';
                return (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-blue-50/30" data-testid={`manufacturer-row-${m.id}`}>
                    <td className="px-4 py-3"><div className="text-sm font-medium text-slate-900">{m.name}</div>{m.notes && <div className="text-[11px] text-slate-400 mt-0.5">{m.notes}</div>}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{m.loc || '—'}</td>
                    <td className="px-3 py-3"><SR value={or} onChange={v => handleRatingClick(m.id, 'or', v)} /></td>
                    <td className="px-3 py-3"><SR value={m.qr || 0} onChange={v => handleRatingClick(m.id, 'qr', v)} /></td>
                    <td className="px-3 py-3"><SR value={m.pr || 0} onChange={v => handleRatingClick(m.id, 'pr', v)} /></td>
                    <td className="px-3 py-3 text-center"><span className={`text-sm font-semibold font-mono ${avgC}`}>{avg.toFixed(1)}</span></td>
                    <td className="px-3 py-3"><button onClick={() => handleDelete(m.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <MfrModal open={showModal} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); refreshManufacturers(); }} />
    </div>
  );
}

function SR({ value, onChange }) {
  return (<div className="flex gap-0.5">{[1,2,3,4,5].map(i => (<button key={i} onClick={() => onChange(i)} className={`star-btn ${i <= value ? 'text-amber-500' : 'text-slate-200'}`}><Star className="w-4 h-4" fill={i <= value ? 'currentColor' : 'none'} strokeWidth={1.5} /></button>))}</div>);
}

function MfrModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', loc: '', cat: '', or: 0, qr: 0, pr: 0, notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try { await createManufacturer(form); toast.success('Added'); setForm({ name: '', loc: '', cat: '', or: 0, qr: 0, pr: 0, notes: '' }); onSaved(); }
    catch { toast.error('Failed'); } finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-white border-slate-200 max-w-md" data-testid="manufacturer-modal">
        <DialogHeader><DialogTitle className="text-lg font-semibold text-slate-900 font-display">Add Manufacturer</DialogTitle><DialogDescription className="text-slate-500 text-sm">Enter details</DialogDescription></DialogHeader>
        <div className="space-y-4 mt-2">
          <div><label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1.5 block">Name *</label><input data-testid="manufacturer-name-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. XYZ Cosmetics" className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1.5 block">Location</label><input value={form.loc} onChange={e => set('loc', e.target.value)} placeholder="Mumbai" className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div><label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1.5 block">Specialty</label><input value={form.cat} onChange={e => set('cat', e.target.value)} placeholder="Skincare" className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1.5 block">Output</label><SR value={form.or} onChange={v => set('or', v)} /></div>
            <div><label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1.5 block">QC</label><SR value={form.qr} onChange={v => set('qr', v)} /></div>
            <div><label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1.5 block">Priority</label><SR value={form.pr} onChange={v => set('pr', v)} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
          <button onClick={onClose} className="rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-9 px-4">Cancel</button>
          <button data-testid="save-manufacturer-btn" onClick={handleSave} disabled={saving} className="rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 disabled:opacity-50 shadow-sm">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
