import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TEAMS, RD_CLASSIFICATIONS, BIZ_CLASSIFICATIONS, PKG_CLASSIFICATIONS, BRAND_OPTIONS } from '@/lib/constants';
import { createProject, updateProject, fetchNPDTemplate } from '@/lib/api';
import { DatePicker } from '@/components/DatePicker';
import { toast } from 'sonner';
import { Plus, X, FileText } from 'lucide-react';

const emptyProject = {
  name: '', cat: '', owner: '', brand: '', launch: '', alau: '', pd: '', ad: '',
  status: 'on-track', type: 'NPD', tier: 'Challenger',
  rd_class: 'Complex - Innovation', biz_class: 'Focus - Core', pkg_class: '',
  teams: [], pt: '', pe: '', pn: '', notes: '',
  phases: [{ id: crypto.randomUUID(), name: '', team: 'NPD', status: 'pending', progress: 0, steps: [] }],
};

export default function ProjectModal({ open, onClose, onSaved, editProject }) {
  const isEdit = !!editProject;
  const initial = isEdit ? { ...editProject, pd: editProject.pd || '', ad: editProject.ad || '' }
    : { ...emptyProject, phases: [{ id: crypto.randomUUID(), name: '', team: 'NPD', status: 'pending', progress: 0, steps: [] }] };
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const toggleTeam = (team) => setForm(f => ({ ...f, teams: f.teams.includes(team) ? f.teams.filter(t => t !== team) : [...f.teams, team] }));
  const addPhase = () => setForm(f => ({ ...f, phases: [...f.phases, { id: crypto.randomUUID(), name: '', team: 'NPD', status: 'pending', progress: 0, steps: [] }] }));
  const removePhase = (idx) => setForm(f => ({ ...f, phases: f.phases.filter((_, i) => i !== idx) }));
  const updatePhase = (idx, field, val) => setForm(f => ({ ...f, phases: f.phases.map((ph, i) => i === idx ? { ...ph, [field]: val } : ph) }));

  const loadNPDTemplate = async () => {
    setLoadingTemplate(true);
    try {
      const data = await fetchNPDTemplate();
      const phases = (data.phases || []).map(ph => ({ ...ph, id: crypto.randomUUID(), steps: (ph.steps || []).map(s => ({ ...s, id: crypto.randomUUID() })) }));
      setForm(f => ({ ...f, phases, teams: ['NPD', 'R&D', 'Design & Creatives', 'Supply', 'Quality'] }));
      const stepCount = phases.reduce((a, ph) => a + ph.steps.length, 0);
      toast.success(`NPD template loaded — ${phases.length} phases, ${stepCount} critical steps`);
    } catch { toast.error('Failed to load template'); }
    finally { setLoadingTemplate(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, pd: form.pd ? parseInt(form.pd) : null, ad: form.ad ? parseInt(form.ad) : null,
        phases: form.phases.filter(ph => ph.name.trim()).map(ph => ({ ...ph, name: ph.name.trim(), status: ph.status || 'pending', progress: ph.progress || 0,
          steps: (ph.steps || []).map(s => ({ ...s, date_history: s.date_history || [], critical: s.critical || false })) })) };
      if (isEdit) { await updateProject(editProject.id, payload); toast.success('Project updated'); }
      else { await createProject(payload); toast.success('Project created'); }
      onSaved();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const iCls = "w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400";
  const lCls = "text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1.5 block";

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-white border-slate-200 max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="project-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900 font-display">{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">Fill in the project details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div><label className={lCls}>Project Name *</label><input data-testid="project-name-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Herbal Body Wash" className={iCls} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lCls}>Category</label><input value={form.cat} onChange={e => set('cat', e.target.value)} placeholder="e.g. Skincare" className={iCls} /></div>
            <div><label className={lCls}>Owner</label><input data-testid="project-owner-input" value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="e.g. Priya S." className={iCls} /></div>
            <div><label className={lCls}>Brand</label>
              <Select value={form.brand || 'none'} onValueChange={v => set('brand', v === 'none' ? '' : v)}>
                <SelectTrigger data-testid="brand-select" className="h-9 border-slate-200"><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent><SelectItem value="none">-- Select --</SelectItem>{BRAND_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lCls}>Target Launch</label><DatePicker value={form.launch} onChange={v => set('launch', v)} placeholder="Select date" className="w-full h-9" /></div>
            <div><label className={lCls}>Actual Launch</label><DatePicker value={form.alau} onChange={v => set('alau', v)} placeholder="Select date" className="w-full h-9" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lCls}>Planned Days</label><input type="number" value={form.pd} onChange={e => set('pd', e.target.value)} placeholder="90" className={iCls} /></div>
            <div><label className={lCls}>Actual Days</label><input type="number" value={form.ad} onChange={e => set('ad', e.target.value)} placeholder="135" className={iCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lCls}>Status</label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger data-testid="project-status-select" className="h-9 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>{['on-track', 'at-risk', 'delayed', 'completed'].map(s => <SelectItem key={s} value={s}>{s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><label className={lCls}>Type</label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger className="h-9 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>{['NPD', 'Gift Kit', 'CPR'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lCls}>R&D Classification</label>
              <Select value={form.rd_class} onValueChange={v => set('rd_class', v)}>
                <SelectTrigger data-testid="rd-class-select" className="h-9 border-slate-200 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>{RD_CLASSIFICATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><label className={lCls}>Business Priority</label>
              <Select value={form.biz_class} onValueChange={v => set('biz_class', v)}>
                <SelectTrigger data-testid="biz-class-select" className="h-9 border-slate-200 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>{BIZ_CLASSIFICATIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><label className={lCls}>Packaging Class</label>
              <Select value={form.pkg_class || 'none'} onValueChange={v => set('pkg_class', v === 'none' ? '' : v)}>
                <SelectTrigger data-testid="pkg-class-select" className="h-9 border-slate-200 text-[11px]"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="none">-- Select --</SelectItem>{PKG_CLASSIFICATIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          {/* Teams */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-3">Teams</div>
            <div className="flex flex-wrap gap-2">
              {TEAMS.map(team => (
                <button key={team} onClick={() => toggleTeam(team)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.teams.includes(team) ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-slate-500 border-slate-200 hover:border-slate-400'}`}>{team}</button>
              ))}
            </div>
          </div>
          {/* Phases */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-500">Phases</div>
              {!isEdit && (
                <button data-testid="load-npd-template-btn" onClick={loadNPDTemplate} disabled={loadingTemplate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50">
                  <FileText className="w-3 h-3" />{loadingTemplate ? 'Loading...' : 'Load NPD Template (Critical Steps)'}
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {form.phases.map((ph, i) => (
                <div key={ph.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-[11px] font-mono text-slate-400 min-w-[20px]">{i + 1}</span>
                  <input data-testid={`phase-name-input-${i}`} value={ph.name} onChange={e => updatePhase(i, 'name', e.target.value)} placeholder="Phase name" className="flex-1 h-7 bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none" />
                  <Select value={ph.team} onValueChange={v => updatePhase(i, 'team', v)}>
                    <SelectTrigger className="h-7 w-36 bg-white border-slate-200 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{TEAMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  {ph.steps?.length > 0 && <span className="text-[10px] text-slate-400">{ph.steps.length}</span>}
                  <button onClick={() => removePhase(i)} className="text-slate-400 hover:text-rose-500 transition-colors p-1"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <button data-testid="add-phase-btn" onClick={addPhase} className="w-full mt-2 py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-400 hover:text-blue-600 hover:border-blue-400 transition-colors"><Plus className="w-3.5 h-3.5 inline mr-1" />Add Phase</button>
          </div>
          <div><label className={lCls}>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional context..." rows={2} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
          <button data-testid="cancel-project-btn" onClick={onClose} className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-9 px-4 transition-colors">Cancel</button>
          <button data-testid="save-project-btn" onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 transition-colors disabled:opacity-50 shadow-sm">{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
