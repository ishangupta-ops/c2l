import { useState } from 'react';
import { ArrowLeft, Edit, Trash2, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_LABELS, STATUS_COLORS, TYPE_COLORS, TIER_COLORS, CX_COLORS, STEP_STATUS_COLORS, TEAM_COLORS, calcProgress, getBlockers } from '@/lib/constants';
import { deleteProject, updatePhase as apiUpdatePhase, updateStep as apiUpdateStep } from '@/lib/api';
import ProjectModal from '@/components/ProjectModal';
import { toast } from 'sonner';

export default function ProjectDetailPage({ project: p, refreshProjects, colors, navigate }) {
  const [editModal, setEditModal] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState(null);

  const sc = STATUS_COLORS[p.status] || STATUS_COLORS['on-track'];
  const tc = TYPE_COLORS[p.type] || TYPE_COLORS['NPD'];
  const trc = TIER_COLORS[p.tier] || TIER_COLORS['Commoner'];
  const cxc = CX_COLORS[p.cx] || CX_COLORS['Simple'];

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await deleteProject(p.id);
      toast.success('Project deleted');
      navigate('/');
      refreshProjects();
    } catch { toast.error('Failed to delete'); }
  };

  const handlePhaseStatusChange = async (phaseId, status) => {
    await apiUpdatePhase(p.id, phaseId, { status });
    refreshProjects();
  };

  const handlePhaseProgressChange = async (phaseId, progress) => {
    await apiUpdatePhase(p.id, phaseId, { progress: parseInt(progress) || 0 });
    refreshProjects();
  };

  const handleStepStatusChange = async (phaseId, stepId, status) => {
    await apiUpdateStep(p.id, phaseId, stepId, { status });
    refreshProjects();
  };

  const blockers = getBlockers(p);

  // Team view data
  const teamData = {};
  (p.phases || []).forEach(ph => {
    const t = ph.team || 'Other';
    if (!teamData[t]) teamData[t] = { phases: [], total: 0, done: 0 };
    teamData[t].phases.push(ph.name);
    (ph.steps || []).forEach(s => { teamData[t].total++; if (s.status === 'done') teamData[t].done++; });
  });

  return (
    <div data-testid="project-detail-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800 px-8 py-5">
        <button data-testid="back-to-dashboard-btn" onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white font-display" data-testid="project-detail-title">{p.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {p.cat && <span className="text-xs text-neutral-400"><strong className="text-neutral-300">{p.cat}</strong></span>}
              {p.launch && <span className="text-xs text-neutral-400">Launch: <strong className="text-neutral-300">{p.launch}</strong></span>}
              {p.owner && <span className="text-xs text-neutral-400">Owner: <strong className="text-neutral-300">{p.owner}</strong></span>}
              <Badge className={`${sc.bg} ${sc.text} ${sc.border} text-[10px]`}>{STATUS_LABELS[p.status]}</Badge>
              {p.type && <Badge className={`${tc.bg} ${tc.text} ${tc.border} text-[10px]`}>{p.type}</Badge>}
              {p.tier && <Badge className={`${trc.bg} ${trc.text} ${trc.border} text-[10px]`}>{p.tier}</Badge>}
              {p.cx && <Badge className={`${cxc.bg} ${cxc.text} text-[10px] border border-transparent`}>{p.cx} formulation</Badge>}
              {(p.ui || p.ci) && <span className="text-[11px] text-neutral-500">{p.ui || 0} unique + {p.ci || 0} common ingredients</span>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button data-testid="edit-project-btn" onClick={() => setEditModal(true)} className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium border border-neutral-800 bg-transparent hover:bg-neutral-800 text-white h-9 px-3 transition-colors">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button data-testid="delete-project-btn" onClick={handleDelete} className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium bg-rose-400/10 text-rose-400 border border-rose-400/20 hover:bg-rose-400/20 h-9 px-3 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 py-6">
        <Tabs defaultValue="phases" data-testid="project-tabs">
          <TabsList className="bg-neutral-900 border border-neutral-800 h-9 p-0.5 rounded-md mb-5">
            <TabsTrigger value="phases" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400 rounded-sm text-xs px-4" data-testid="tab-phases">Phases & Steps</TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400 rounded-sm text-xs px-4" data-testid="tab-teams">Team View</TabsTrigger>
            <TabsTrigger value="packaging" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400 rounded-sm text-xs px-4" data-testid="tab-packaging">Packaging</TabsTrigger>
            <TabsTrigger value="blockers" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400 rounded-sm text-xs px-4" data-testid="tab-blockers">Blockers</TabsTrigger>
          </TabsList>

          {/* Phases Tab */}
          <TabsContent value="phases">
            <div className="space-y-2" data-testid="phases-list">
              {(!p.phases || p.phases.length === 0) && <div className="text-neutral-500 text-sm py-8 text-center">No phases added.</div>}
              {(p.phases || []).map((ph, pi) => {
                const phSc = STEP_STATUS_COLORS[ph.status] || STEP_STATUS_COLORS['pending'];
                const isOpen = expandedPhase === ph.id;
                return (
                  <div key={ph.id} className="bg-neutral-900 border border-neutral-800 rounded-md overflow-hidden" data-testid={`phase-${pi}`}>
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-800/50 transition-colors" onClick={() => setExpandedPhase(isOpen ? null : ph.id)}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold font-mono ${phSc.dot === 'bg-emerald-400' ? 'bg-emerald-400/15 text-emerald-400' : phSc.dot === 'bg-blue-400' ? 'bg-blue-400/15 text-blue-400' : phSc.dot === 'bg-rose-400' ? 'bg-rose-400/15 text-rose-400' : 'bg-neutral-700 text-neutral-400'}`}>
                        {pi + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{ph.name}</div>
                        <div className="text-[11px] text-neutral-500">{ph.team}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16">
                          <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full progress-fill ${phSc.dot}`} style={{ width: `${ph.progress || 0}%` }} />
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400 w-8 text-right">{ph.progress || 0}%</span>
                        <Select value={ph.status} onValueChange={v => handlePhaseStatusChange(ph.id, v)}>
                          <SelectTrigger className="h-7 w-28 bg-transparent border-neutral-700 text-[11px] text-neutral-300" onClick={e => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-900 border-neutral-800">
                            {['pending', 'in-progress', 'done', 'blocked'].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <input type="number" min="0" max="100" value={ph.progress || 0} onClick={e => e.stopPropagation()} onChange={e => handlePhaseProgressChange(ph.id, e.target.value)} className="w-12 h-7 bg-neutral-950 border border-neutral-700 rounded text-[11px] font-mono text-right text-neutral-300 px-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-600" />
                        <ChevronRight className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    {isOpen && (
                      <div className="border-t border-neutral-800 overflow-x-auto">
                        <table className="w-full text-sm min-w-[560px]">
                          <thead>
                            <tr className="border-b border-neutral-800">
                              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-4 py-2 text-left">Step</th>
                              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2 text-left">Owner</th>
                              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2 text-left">Planned</th>
                              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2 text-left">Actual</th>
                              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(ph.steps || []).map(s => {
                              const sSc = STEP_STATUS_COLORS[s.status] || STEP_STATUS_COLORS['pending'];
                              return (
                                <tr key={s.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30" data-testid={`step-${s.id}`}>
                                  <td className="px-4 py-2.5">
                                    <div className="text-xs text-neutral-200">{s.step}</div>
                                    {s.problem && <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{s.problem}</div>}
                                    {s.remark && <div className="text-[11px] text-neutral-500 mt-0.5 italic">{s.remark}</div>}
                                  </td>
                                  <td className="px-3 py-2.5 text-xs text-neutral-400">{s.owner || '—'}</td>
                                  <td className="px-3 py-2.5 text-[11px] font-mono text-neutral-500">{s.planned || '—'}</td>
                                  <td className="px-3 py-2.5 text-[11px] font-mono text-neutral-500">{s.actual || '—'}</td>
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${sSc.dot}`} />
                                      <Select value={s.status} onValueChange={v => handleStepStatusChange(ph.id, s.id, v)}>
                                        <SelectTrigger className="h-6 w-24 bg-transparent border-neutral-700 text-[11px] text-neutral-300"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-neutral-800">
                                          {['pending', 'in-progress', 'done', 'blocked'].map(st => <SelectItem key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1).replace('-', ' ')}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {(!ph.steps || ph.steps.length === 0) && (
                              <tr><td colSpan={5} className="text-center text-neutral-600 text-xs py-4">No steps</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="teams-grid">
              {Object.entries(teamData).map(([team, data]) => {
                const pct = data.total ? Math.round((data.done / data.total) * 100) : 0;
                const col = TEAM_COLORS[team] || '#6B7280';
                return (
                  <div key={team} className="bg-neutral-900 border border-neutral-800 rounded-md p-4" data-testid={`team-card-${team}`}>
                    <div className="text-sm font-semibold mb-3" style={{ color: col }}>{team}</div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: col }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-neutral-500 mb-3">
                      <span>{data.done}/{data.total} done</span>
                      <span className="font-semibold font-mono" style={{ color: col }}>{pct}%</span>
                    </div>
                    <div className="space-y-1">
                      {data.phases.map(ph => <div key={ph} className="text-[11px] text-neutral-500">- {ph}</div>)}
                    </div>
                  </div>
                );
              })}
              {Object.keys(teamData).length === 0 && <div className="col-span-full text-center text-neutral-500 text-sm py-8">No team data</div>}
            </div>
          </TabsContent>

          {/* Packaging Tab */}
          <TabsContent value="packaging">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6" data-testid="packaging-info">
              <div className={`bg-neutral-900 border rounded-md p-4 ${p.pt === 'New' ? 'border-l-2 border-l-purple-400 border-neutral-800' : 'border-l-2 border-l-blue-400 border-neutral-800'}`}>
                <div className="text-xs font-bold text-neutral-500 mb-1">TYPE</div>
                <div className="text-lg font-semibold text-white">{p.pt || 'Not set'}</div>
                <div className={`text-[11px] mt-1 ${p.pt === 'New' ? 'text-purple-400' : 'text-blue-400'}`}>
                  {p.pt === 'New' ? 'New tooling required' : 'Using existing mold'}
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4">
                <div className="text-xs font-bold text-neutral-500 mb-1">EXECUTABILITY</div>
                <div className={`text-lg font-semibold ${p.pe === 'Tough to Execute' ? 'text-rose-400' : 'text-emerald-400'}`}>{p.pe || 'Not set'}</div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  {p.pe === 'Tough to Execute' ? 'Extra lead time expected' : 'Standard execution path'}
                </div>
              </div>
              {p.pn && (
                <div className="sm:col-span-2 bg-neutral-900 border border-neutral-800 rounded-md p-4">
                  <div className="text-xs font-bold text-neutral-500 mb-1">NOTES</div>
                  <div className="text-sm text-neutral-300">{p.pn}</div>
                </div>
              )}
            </div>

            <div className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-500 mb-3">Color Bank Preview</div>
            <div className="flex flex-wrap gap-3">
              {(colors || []).slice(0, 6).map(c => (
                <div key={c.id} className="text-center">
                  <div className="w-12 h-12 rounded-md border border-neutral-700" style={{ backgroundColor: c.hex }} />
                  <div className="text-[10px] text-neutral-400 mt-1 font-medium">{c.name}</div>
                  <div className="text-[9px] text-neutral-600 font-mono">{c.hex}</div>
                </div>
              ))}
              {(!colors || colors.length === 0) && <div className="text-xs text-neutral-600">No colors yet.</div>}
            </div>
          </TabsContent>

          {/* Blockers Tab */}
          <TabsContent value="blockers">
            <div className="space-y-2" data-testid="blockers-list">
              {blockers.length === 0 && (
                <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-md p-4 text-sm text-emerald-400 text-center flex items-center justify-center gap-2" data-testid="no-blockers">
                  <CheckCircle2 className="w-4 h-4" /> No blockers flagged — all clear!
                </div>
              )}
              {blockers.map((b, i) => (
                <div key={i} className="bg-rose-400/5 border border-rose-400/20 rounded-md px-4 py-3" data-testid={`blocker-${i}`}>
                  <div className="text-sm font-semibold text-rose-400 flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {b.step}
                  </div>
                  <div className="text-xs text-neutral-300">{b.problem}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">{b.phase}{b.owner ? ` · Owner: ${b.owner}` : ''}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ProjectModal
        open={editModal}
        onClose={() => setEditModal(false)}
        editProject={p}
        onSaved={() => { setEditModal(false); refreshProjects(); }}
      />
    </div>
  );
}
