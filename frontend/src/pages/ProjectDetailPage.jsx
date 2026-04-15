import { useState } from 'react';
import { ArrowLeft, Edit, Trash2, ChevronRight, AlertTriangle, CheckCircle2, Download, History, Save, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_LABELS, STATUS_COLORS, TYPE_COLORS, RD_COLORS, BIZ_COLORS, STEP_STATUS_COLORS, TEAM_COLORS, calcProgress, getBlockers, formatDateForDisplay } from '@/lib/constants';
import { deleteProject, updatePhase as apiUpdatePhase, updateStep as apiUpdateStep, exportProjectCSV } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { DatePickerInline } from '@/components/DatePicker';
import ProjectModal from '@/components/ProjectModal';
import { toast } from 'sonner';

export default function ProjectDetailPage({ project: p, refreshProjects, navigate }) {
  const { user } = useAuth();
  const [editModal, setEditModal] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [editingStep, setEditingStep] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [historyModal, setHistoryModal] = useState(null);
  const [exporting, setExporting] = useState(false);

  const sc = STATUS_COLORS[p.status] || STATUS_COLORS['on-track'];
  const rdc = RD_COLORS[p.rd_class] || { text: 'text-slate-600', bg: 'bg-slate-50' };
  const bzc = BIZ_COLORS[p.biz_class] || { text: 'text-slate-600', bg: 'bg-slate-50' };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try { await deleteProject(p.id); toast.success('Deleted'); navigate('/'); refreshProjects(); } catch { toast.error('Failed'); }
  };
  const handlePhaseStatusChange = async (phaseId, status) => { await apiUpdatePhase(p.id, phaseId, { status }); refreshProjects(); };
  const handlePhaseProgressChange = async (phaseId, progress) => { await apiUpdatePhase(p.id, phaseId, { progress: parseInt(progress) || 0 }); refreshProjects(); };
  const handleStepStatusChange = async (phaseId, stepId, status) => { await apiUpdateStep(p.id, phaseId, stepId, { status, changed_by: user?.name || user?.email || 'Unknown' }); refreshProjects(); };
  const handleDateChange = async (phaseId, stepId, field, value) => { await apiUpdateStep(p.id, phaseId, stepId, { [field]: value, changed_by: user?.name || user?.email || 'Unknown' }); refreshProjects(); };
  const startEditStep = (phaseId, step) => { setEditingStep({ phaseId, stepId: step.id }); setEditForm({ owner: step.owner || '' }); };
  const saveStepEdit = async () => { if (!editingStep) return; try { await apiUpdateStep(p.id, editingStep.phaseId, editingStep.stepId, { ...editForm, changed_by: user?.name || 'Unknown' }); toast.success('Updated'); setEditingStep(null); refreshProjects(); } catch { toast.error('Failed'); } };
  const handleExport = async () => { setExporting(true); try { const blob = await exportProjectCSV(p.id); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${p.name}.csv`; a.click(); toast.success('Exported'); } catch { toast.error('Failed'); } finally { setExporting(false); } };

  const blockers = getBlockers(p);
  const teamData = {};
  (p.phases || []).forEach(ph => { const t = ph.team || 'Other'; if (!teamData[t]) teamData[t] = { phases: [], total: 0, done: 0 }; teamData[t].phases.push(ph.name); (ph.steps || []).forEach(s => { teamData[t].total++; if (s.status === 'done') teamData[t].done++; }); });

  return (
    <div data-testid="project-detail-page">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-5">
        <button data-testid="back-to-dashboard-btn" onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors mb-3"><ArrowLeft className="w-3.5 h-3.5" /> Dashboard</button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 font-display" data-testid="project-detail-title">{p.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {p.brand && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">{p.brand}</Badge>}
              <Badge className={`${sc.bg} ${sc.text} ${sc.border} text-[10px]`}>{STATUS_LABELS[p.status]}</Badge>
              {p.rd_class && <Badge className={`${rdc.bg} ${rdc.text} text-[10px] border border-transparent`}>{p.rd_class}</Badge>}
              {p.biz_class && <Badge className={`${bzc.bg} ${bzc.text} text-[10px] border border-transparent`}>{p.biz_class}</Badge>}
              {p.launch && <span className="text-xs text-slate-500">Launch: <strong className="text-slate-700">{formatDateForDisplay(p.launch)}</strong></span>}
              {p.owner && <span className="text-xs text-slate-500">Owner: <strong className="text-slate-700">{p.owner}</strong></span>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button data-testid="export-csv-btn" onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-9 px-3 transition-colors"><Download className="w-3.5 h-3.5" /> CSV</button>
            <button data-testid="edit-project-btn" onClick={() => setEditModal(true)} className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-9 px-3 transition-colors"><Edit className="w-3.5 h-3.5" /> Edit</button>
            <button data-testid="delete-project-btn" onClick={handleDelete} className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 h-9 px-3 transition-colors"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        <Tabs defaultValue="phases" data-testid="project-tabs">
          <TabsList className="bg-white border border-slate-200 h-9 p-0.5 rounded-lg mb-5 shadow-sm">
            <TabsTrigger value="phases" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-500 rounded-md text-xs px-4" data-testid="tab-phases">Phases & Steps</TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-500 rounded-md text-xs px-4" data-testid="tab-teams">Team View</TabsTrigger>
            <TabsTrigger value="packaging" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-500 rounded-md text-xs px-4" data-testid="tab-packaging">Packaging</TabsTrigger>
            <TabsTrigger value="blockers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-500 rounded-md text-xs px-4" data-testid="tab-blockers">Blockers</TabsTrigger>
          </TabsList>

          <TabsContent value="phases">
            <div className="space-y-2" data-testid="phases-list">
              {(p.phases || []).map((ph, pi) => {
                const phSc = STEP_STATUS_COLORS[ph.status] || STEP_STATUS_COLORS['pending'];
                const isOpen = expandedPhase === ph.id;
                return (
                  <div key={ph.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm" data-testid={`phase-${pi}`}>
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedPhase(isOpen ? null : ph.id)}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold font-mono ${phSc.dot === 'bg-emerald-500' ? 'bg-emerald-50 text-emerald-700' : phSc.dot === 'bg-blue-500' ? 'bg-blue-50 text-blue-700' : phSc.dot === 'bg-rose-500' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>{pi + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900">{ph.name}</div>
                        <div className="text-[11px] text-slate-400">{ph.team}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-16"><div className="h-1 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full progress-fill ${phSc.dot}`} style={{ width: `${ph.progress || 0}%` }} /></div></div>
                        <span className="text-[11px] font-mono text-slate-500 w-8 text-right">{ph.progress || 0}%</span>
                        <Select value={ph.status} onValueChange={v => handlePhaseStatusChange(ph.id, v)}>
                          <SelectTrigger className="h-7 w-28 border-slate-200 text-[11px]" onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                          <SelectContent>{['pending', 'in-progress', 'done', 'blocked'].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</SelectItem>)}</SelectContent>
                        </Select>
                        <input type="number" min="0" max="100" value={ph.progress || 0} onClick={e => e.stopPropagation()} onChange={e => handlePhaseProgressChange(ph.id, e.target.value)} className="w-12 h-7 bg-white border border-slate-200 rounded text-[11px] font-mono text-right text-slate-700 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    {isOpen && (
                      <div className="border-t border-slate-200 overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                          <thead><tr className="border-b border-slate-100 bg-slate-50">
                            <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-4 py-2 text-left">Step</th>
                            <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2 text-left w-24">Owner</th>
                            <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2 text-left w-28">Planned</th>
                            <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2 text-left w-28">Actual</th>
                            <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2 text-left w-28">Status</th>
                            <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2 text-center w-16">Rev</th>
                            <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-2 py-2 w-10"></th>
                          </tr></thead>
                          <tbody>
                            {(ph.steps || []).map(s => {
                              const sSc = STEP_STATUS_COLORS[s.status] || STEP_STATUS_COLORS['pending'];
                              const isEditing = editingStep?.phaseId === ph.id && editingStep?.stepId === s.id;
                              const revCount = (s.date_history || []).length;
                              return (
                                <tr key={s.id} className={`border-b border-slate-100 hover:bg-blue-50/30 ${s.critical ? 'border-l-2 border-l-amber-400' : ''}`} data-testid={`step-${s.id}`}>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                      {s.critical && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Critical" />}
                                      <span className="text-xs text-slate-800">{s.step}</span>
                                    </div>
                                    {s.problem && <div className="text-[11px] text-rose-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{s.problem}</div>}
                                    {s.remark && <div className="text-[11px] text-slate-400 mt-0.5 italic">{s.remark}</div>}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {isEditing ? <input value={editForm.owner} onChange={e => setEditForm(f => ({ ...f, owner: e.target.value }))} className="w-full h-6 bg-white border border-slate-200 rounded px-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-400" />
                                    : <span className="text-xs text-slate-600 cursor-pointer hover:text-blue-600" onClick={() => startEditStep(ph.id, s)}>{s.owner || '—'}</span>}
                                  </td>
                                  <td className="px-3 py-2.5"><DatePickerInline value={s.planned} onChange={v => handleDateChange(ph.id, s.id, 'planned', v)} placeholder="Set date" /></td>
                                  <td className="px-3 py-2.5"><DatePickerInline value={s.actual} onChange={v => handleDateChange(ph.id, s.id, 'actual', v)} placeholder="Set date" /></td>
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${sSc.dot}`} />
                                      <Select value={s.status} onValueChange={v => handleStepStatusChange(ph.id, s.id, v)}>
                                        <SelectTrigger className="h-6 w-24 border-slate-200 text-[11px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{['pending', 'in-progress', 'done', 'blocked'].map(st => <SelectItem key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1).replace('-', ' ')}</SelectItem>)}</SelectContent>
                                      </Select>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    {revCount > 0 ? <button data-testid={`history-btn-${s.id}`} onClick={() => setHistoryModal(s)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"><History className="w-3 h-3" />{revCount}</button>
                                    : <span className="text-[10px] text-slate-300">—</span>}
                                  </td>
                                  <td className="px-2 py-2.5 text-center">
                                    {isEditing ? <div className="flex gap-1"><button onClick={saveStepEdit} className="text-emerald-600 p-0.5"><Save className="w-3.5 h-3.5" /></button><button onClick={() => setEditingStep(null)} className="text-slate-400 p-0.5"><X className="w-3.5 h-3.5" /></button></div>
                                    : <button onClick={() => startEditStep(ph.id, s)} className="text-slate-300 hover:text-blue-600 p-0.5"><Edit className="w-3.5 h-3.5" /></button>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="teams">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="teams-grid">
              {Object.entries(teamData).map(([team, data]) => {
                const pct = data.total ? Math.round((data.done / data.total) * 100) : 0;
                const col = TEAM_COLORS[team] || '#6B7280';
                return (
                  <div key={team} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                    <div className="text-sm font-semibold mb-3" style={{ color: col }}>{team}</div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: col }} /></div>
                    <div className="flex justify-between text-[11px] text-slate-500"><span>{data.done}/{data.total}</span><span className="font-semibold font-mono" style={{ color: col }}>{pct}%</span></div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="packaging">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6" data-testid="packaging-info">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm border-l-4 border-l-blue-500">
                <div className="text-xs font-bold text-slate-400 mb-1">PACKAGING CLASS</div>
                <div className="text-base font-semibold text-slate-900">{p.pkg_class || p.pt || 'Not set'}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="text-xs font-bold text-slate-400 mb-1">EXECUTABILITY</div>
                <div className={`text-base font-semibold ${p.pe === 'Tough to Execute' ? 'text-rose-600' : 'text-emerald-600'}`}>{p.pe || 'Not set'}</div>
              </div>
              {p.pn && <div className="sm:col-span-2 bg-white border border-slate-200 rounded-lg p-4 shadow-sm"><div className="text-xs font-bold text-slate-400 mb-1">NOTES</div><div className="text-sm text-slate-700">{p.pn}</div></div>}
            </div>
          </TabsContent>

          <TabsContent value="blockers">
            <div className="space-y-2" data-testid="blockers-list">
              {blockers.length === 0 && <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700 text-center flex items-center justify-center gap-2" data-testid="no-blockers"><CheckCircle2 className="w-4 h-4" /> No blockers — all clear!</div>}
              {blockers.map((b, i) => (
                <div key={i} className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
                  <div className="text-sm font-semibold text-rose-700 flex items-center gap-1.5 mb-1"><AlertTriangle className="w-3.5 h-3.5" /> {b.step}</div>
                  <div className="text-xs text-slate-700">{b.problem}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{b.phase}{b.owner ? ` · ${b.owner}` : ''}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!historyModal} onOpenChange={() => setHistoryModal(null)}>
        <DialogContent className="bg-white border-slate-200 max-w-lg" data-testid="date-history-modal">
          <DialogHeader><DialogTitle className="text-base font-semibold text-slate-900 font-display">Date Change History</DialogTitle><DialogDescription className="text-slate-500 text-sm">{historyModal?.step}</DialogDescription></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {(historyModal?.date_history || []).sort((a, b) => (b.changed_at || '').localeCompare(a.changed_at || '')).map((h, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-[10px] ${h.field === 'planned' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{h.field === 'planned' ? 'Planned' : 'Actual'}</Badge>
                  <span className="text-[10px] text-slate-400 font-mono">Rev #{h.revision}</span>
                </div>
                <div className="flex items-center gap-2 text-xs"><span className="text-slate-400 line-through">{h.old_value || '(empty)'}</span><span className="text-slate-300">→</span><span className="text-slate-900 font-medium">{h.new_value || '(empty)'}</span></div>
                <div className="text-[10px] text-slate-400 mt-1">by {h.changed_by} · {h.changed_at ? new Date(h.changed_at).toLocaleString() : ''}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ProjectModal open={editModal} onClose={() => setEditModal(false)} editProject={p} onSaved={() => { setEditModal(false); refreshProjects(); }} />
    </div>
  );
}
