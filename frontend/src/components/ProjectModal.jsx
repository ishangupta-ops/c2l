import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TEAMS } from '@/lib/constants';
import { createProject, updateProject, fetchNPDTemplate } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, X, FileText } from 'lucide-react';

const emptyProject = {
  name: '', cat: '', owner: '', launch: '', alau: '', pd: '', ad: '',
  status: 'on-track', type: 'NPD', tier: 'Challenger', cx: 'Moderate',
  ui: '', ci: '', teams: [], pt: '', pe: '', pn: '', notes: '',
  phases: [{ id: crypto.randomUUID(), name: '', team: 'NPD', status: 'pending', progress: 0, steps: [] }],
};

export default function ProjectModal({ open, onClose, onSaved, editProject }) {
  const isEdit = !!editProject;
  const initial = isEdit ? {
    ...editProject,
    pd: editProject.pd || '',
    ad: editProject.ad || '',
    ui: editProject.ui || '',
    ci: editProject.ci || '',
  } : { ...emptyProject, phases: [{ id: crypto.randomUUID(), name: '', team: 'NPD', status: 'pending', progress: 0, steps: [] }] };

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const toggleTeam = (team) => setForm(f => ({
    ...f,
    teams: f.teams.includes(team) ? f.teams.filter(t => t !== team) : [...f.teams, team],
  }));

  const addPhase = () => setForm(f => ({
    ...f,
    phases: [...f.phases, { id: crypto.randomUUID(), name: '', team: 'NPD', status: 'pending', progress: 0, steps: [] }],
  }));

  const removePhase = (idx) => setForm(f => ({
    ...f,
    phases: f.phases.filter((_, i) => i !== idx),
  }));

  const updatePhase = (idx, field, val) => setForm(f => ({
    ...f,
    phases: f.phases.map((ph, i) => i === idx ? { ...ph, [field]: val } : ph),
  }));

  const loadNPDTemplate = async () => {
    setLoadingTemplate(true);
    try {
      const data = await fetchNPDTemplate();
      const phases = (data.phases || []).map(ph => ({
        ...ph,
        id: crypto.randomUUID(),
        steps: (ph.steps || []).map(s => ({ ...s, id: crypto.randomUUID() })),
      }));
      setForm(f => ({ ...f, phases, teams: ['NPD', 'R&D', 'Design & Creatives', 'Supply', 'Quality'] }));
      toast.success('NPD template loaded with 8 phases & 54 steps');
    } catch { toast.error('Failed to load template'); }
    finally { setLoadingTemplate(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        pd: form.pd ? parseInt(form.pd) : null,
        ad: form.ad ? parseInt(form.ad) : null,
        ui: form.ui ? parseInt(form.ui) : null,
        ci: form.ci ? parseInt(form.ci) : null,
        phases: form.phases.filter(ph => ph.name.trim()).map(ph => ({
          ...ph, name: ph.name.trim(), status: ph.status || 'pending', progress: ph.progress || 0,
          steps: (ph.steps || []).map(s => ({ ...s, date_history: s.date_history || [] })),
        })),
      };
      if (isEdit) {
        await updateProject(editProject.id, payload);
        toast.success('Project updated');
      } else {
        await createProject(payload);
        toast.success('Project created');
      }
      onSaved();
    } catch (err) {
      toast.error('Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-neutral-900 border-neutral-800 max-w-2xl max-h-[90vh] overflow-y-auto text-white" data-testid="project-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white font-display">{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
          <DialogDescription className="text-neutral-400 text-sm">Fill in the project details below</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Project Name *</label>
            <input data-testid="project-name-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Herbal Body Wash" className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Category</label>
              <input value={form.cat} onChange={e => set('cat', e.target.value)} placeholder="e.g. Skincare" className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Owner</label>
              <input data-testid="project-owner-input" value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="e.g. Priya S." className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Target Launch Date</label>
              <input value={form.launch} onChange={e => set('launch', e.target.value)} placeholder="e.g. Apr 15, 2025" className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Actual Launch Date</label>
              <input value={form.alau} onChange={e => set('alau', e.target.value)} placeholder="e.g. May 30, 2025" className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Planned Days</label>
              <input type="number" value={form.pd} onChange={e => set('pd', e.target.value)} placeholder="e.g. 90" className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Actual Days</label>
              <input type="number" value={form.ad} onChange={e => set('ad', e.target.value)} placeholder="e.g. 135" className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Status</label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger data-testid="project-status-select" className="h-9 bg-neutral-950 border-neutral-800 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  <SelectItem value="on-track">On Track</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Type</label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger className="h-9 bg-neutral-950 border-neutral-800 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  <SelectItem value="NPD">NPD</SelectItem>
                  <SelectItem value="Gift Kit">Gift Kit</SelectItem>
                  <SelectItem value="CPR">CPR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Tier</label>
              <Select value={form.tier} onValueChange={v => set('tier', v)}>
                <SelectTrigger className="h-9 bg-neutral-950 border-neutral-800 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  <SelectItem value="Disruptor">Disruptor</SelectItem>
                  <SelectItem value="Challenger">Challenger</SelectItem>
                  <SelectItem value="Commoner">Commoner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* R&D */}
          <div className="pt-3 border-t border-neutral-800">
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mb-3">R&D / Formulation</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Complexity</label>
                <Select value={form.cx} onValueChange={v => set('cx', v)}>
                  <SelectTrigger className="h-9 bg-neutral-950 border-neutral-800 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem value="Simple">Simple</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Complex">Complex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Unique Ingredients</label>
                <input type="number" value={form.ui} onChange={e => set('ui', e.target.value)} className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Common Ingredients</label>
                <input type="number" value={form.ci} onChange={e => set('ci', e.target.value)} className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="pt-3 border-t border-neutral-800">
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mb-3">Teams Involved</div>
            <div className="flex flex-wrap gap-2">
              {TEAMS.map(team => (
                <button key={team} onClick={() => toggleTeam(team)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.teams.includes(team) ? 'bg-white/10 text-white border-white/20' : 'text-neutral-400 border-neutral-800 hover:border-neutral-600'}`}>{team}</button>
              ))}
            </div>
          </div>

          {/* Packaging */}
          <div className="pt-3 border-t border-neutral-800">
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mb-3">Packaging</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Type</label>
                <Select value={form.pt || 'none'} onValueChange={v => set('pt', v === 'none' ? '' : v)}>
                  <SelectTrigger className="h-9 bg-neutral-950 border-neutral-800 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem value="none">-- Select --</SelectItem>
                    <SelectItem value="Existing">Existing</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Executability</label>
                <Select value={form.pe || 'none'} onValueChange={v => set('pe', v === 'none' ? '' : v)}>
                  <SelectTrigger className="h-9 bg-neutral-950 border-neutral-800 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem value="none">-- Select --</SelectItem>
                    <SelectItem value="Executable">Executable</SelectItem>
                    <SelectItem value="Tough to Execute">Tough to Execute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <input value={form.pn} onChange={e => set('pn', e.target.value)} placeholder="Packaging notes..." className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
          </div>

          {/* Phases */}
          <div className="pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500">Phases</div>
              {!isEdit && (
                <button data-testid="load-npd-template-btn" onClick={loadNPDTemplate} disabled={loadingTemplate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-400/10 text-blue-400 border border-blue-400/20 hover:bg-blue-400/20 transition-colors disabled:opacity-50">
                  <FileText className="w-3 h-3" />{loadingTemplate ? 'Loading...' : 'Load NPD Template (54 steps)'}
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {form.phases.map((ph, i) => (
                <div key={ph.id} className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2">
                  <span className="text-[11px] font-mono text-neutral-500 min-w-[20px]">{i + 1}</span>
                  <input data-testid={`phase-name-input-${i}`} value={ph.name} onChange={e => updatePhase(i, 'name', e.target.value)} placeholder="Phase name" className="flex-1 h-7 bg-transparent border-none text-sm text-white placeholder:text-neutral-600 focus:outline-none" />
                  <Select value={ph.team} onValueChange={v => updatePhase(i, 'team', v)}>
                    <SelectTrigger className="h-7 w-40 bg-transparent border-neutral-700 text-xs text-neutral-300"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      {TEAMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {ph.steps?.length > 0 && <span className="text-[10px] text-neutral-600">{ph.steps.length} steps</span>}
                  <button onClick={() => removePhase(i)} className="text-neutral-500 hover:text-rose-400 transition-colors p-1"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <button data-testid="add-phase-btn" onClick={addPhase} className="w-full mt-2 py-2 border border-dashed border-neutral-700 rounded-md text-xs text-neutral-500 hover:text-white hover:border-neutral-500 transition-colors">
              <Plus className="w-3.5 h-3.5 inline mr-1" />Add Phase
            </button>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5 block">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional context..." rows={2} className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800 mt-2">
          <button data-testid="cancel-project-btn" onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-neutral-800 bg-transparent hover:bg-neutral-800 text-white h-9 px-4 transition-colors">Cancel</button>
          <button data-testid="save-project-btn" onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white text-black hover:bg-neutral-200 h-9 px-4 transition-colors disabled:opacity-50">{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
