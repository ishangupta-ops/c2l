import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS, RD_COLORS, BIZ_COLORS, RD_CLASSIFICATIONS, BIZ_CLASSIFICATIONS, formatDateForDisplay } from '@/lib/constants';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

export default function TimelinePage({ projects, navigate }) {
  const [expandedProject, setExpandedProject] = useState(null);
  const withData = projects.filter(p => p.pd && p.ad);
  const delayed = withData.filter(p => p.ad > p.pd);
  const avgDelay = delayed.length ? Math.round(delayed.reduce((a, p) => a + (p.ad - p.pd), 0) / delayed.length) : 0;
  const maxDays = Math.max(...projects.filter(p => p.ad || p.pd).map(p => Math.max(p.ad || 0, p.pd || 0, 1)), 1);
  const byRD = {}; RD_CLASSIFICATIONS.forEach(r => { byRD[r] = projects.filter(p => p.rd_class === r); });
  const byBiz = {}; BIZ_CLASSIFICATIONS.forEach(b => { byBiz[b] = projects.filter(p => p.biz_class === b); });

  return (
    <div data-testid="timeline-page">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-5">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 font-display" data-testid="timeline-title">Timeline Analysis</h1>
        <p className="text-sm text-slate-500 mt-1">Category breakdown & per-project deep dive</p>
      </div>
      <div className="px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[{ l: 'Total', v: projects.length, c: 'text-slate-900' }, { l: 'Delayed', v: delayed.length, c: 'text-rose-600' }, { l: 'Avg Delay', v: `${avgDelay}d`, c: 'text-amber-600' }, { l: 'Completed', v: projects.filter(p => p.status === 'completed').length, c: 'text-emerald-600' }].map(m => (
            <div key={m.l} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm"><div className={`text-2xl font-semibold font-mono ${m.c}`}>{m.v}</div><div className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mt-1">{m.l}</div></div>
          ))}
        </div>

        <SH>By R&D Classification</SH>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {RD_CLASSIFICATIONS.map(rd => { const list = byRD[rd] || []; const comp = list.filter(p => p.pd && p.ad); const avgD = comp.length ? Math.round(comp.reduce((a, p) => a + (p.ad - p.pd), 0) / comp.length) : null; const rc = RD_COLORS[rd];
            return (<div key={rd} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm"><div className={`text-[10px] font-bold tracking-[0.1em] uppercase ${rc.text} mb-2 leading-tight`}>{rd}</div><div className={`text-2xl font-semibold font-mono ${rc.text}`}>{list.length}</div>{avgD != null && <div className={`text-xs mt-1 font-medium ${avgD > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{avgD > 0 ? `+${avgD}d` : `${avgD}d`} avg</div>}</div>);
          })}
        </div>

        <SH>By Business Classification</SH>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {BIZ_CLASSIFICATIONS.map(biz => { const list = byBiz[biz] || []; const comp = list.filter(p => p.pd && p.ad); const avgD = comp.length ? Math.round(comp.reduce((a, p) => a + (p.ad - p.pd), 0) / comp.length) : null; const bc = BIZ_COLORS[biz];
            return (<div key={biz} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm"><div className={`text-[10px] font-bold tracking-[0.1em] uppercase ${bc.text} mb-2`}>{biz}</div><div className={`text-2xl font-semibold font-mono ${bc.text}`}>{list.length}</div>{avgD != null && <div className={`text-xs mt-1 font-medium ${avgD > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{avgD > 0 ? `+${avgD}d` : `${avgD}d`} avg</div>}</div>);
          })}
        </div>

        <SH>Planned vs Actual</SH>
        <div className="flex gap-4 mb-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-sm bg-blue-200" /> Planned</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-sm bg-blue-500" /> Actual</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-sm bg-rose-500" /> Delay</div>
        </div>
        <div className="space-y-2 mb-8">
          {projects.filter(p => p.pd).map(p => { const s = 280 / maxDays; const pw = Math.round(p.pd * s); const aw = p.ad ? Math.round(Math.min(p.ad, p.pd) * s) : 0; const dw = p.ad && p.ad > p.pd ? Math.round((p.ad - p.pd) * s) : 0; const dl = p.ad ? p.ad - p.pd : null;
            return (<div key={p.id} className="flex items-center gap-3"><div className="min-w-[140px]"><div className="text-[11px] font-medium text-blue-600 cursor-pointer hover:text-blue-800 truncate" onClick={() => navigate(`/project/${p.id}`)}>{p.name.length > 24 ? p.name.slice(0, 24) + '...' : p.name}</div><div className="text-[10px] text-slate-400">{p.rd_class}</div></div><div className="flex-1 relative h-7"><div className="absolute top-0.5 h-2 rounded-sm bg-blue-100 timeline-bar" style={{ width: `${pw}px` }} />{aw > 0 && <div className="absolute top-4 h-2 rounded-sm bg-blue-500 timeline-bar" style={{ width: `${aw}px` }} />}{dw > 0 && <div className="absolute top-4 h-2 rounded-sm bg-rose-400 timeline-bar" style={{ left: `${pw}px`, width: `${dw}px` }} />}</div><div className={`text-[11px] font-mono min-w-[80px] text-right ${dl > 0 ? 'text-rose-600' : dl && dl <= 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{p.ad ? `${p.pd}d → ${p.ad}d` : `${p.pd}d`}</div></div>);
          })}
        </div>

        <SH>Per-Project Deep Dive — Critical Steps</SH>
        <div className="space-y-2">
          {projects.map(p => {
            const isExp = expandedProject === p.id;
            const psc = STATUS_COLORS[p.status]; const rdc = RD_COLORS[p.rd_class] || { text: 'text-slate-500', bg: 'bg-slate-50' }; const bzc = BIZ_COLORS[p.biz_class] || { text: 'text-slate-500', bg: 'bg-slate-50' };
            const critSteps = []; (p.phases || []).forEach(ph => (ph.steps || []).forEach(s => { if (s.critical) critSteps.push({ ...s, phaseName: ph.name }); }));
            const dl = p.ad && p.pd ? p.ad - p.pd : null;
            return (
              <div key={p.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedProject(isExp ? null : p.id)}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${psc.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.brand && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px]">{p.brand}</Badge>}
                      <Badge className={`${rdc.bg} ${rdc.text} text-[9px] border border-transparent`}>{p.rd_class}</Badge>
                      <span className="text-[10px] text-slate-400">{critSteps.length} critical</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {dl != null && <span className={`text-xs font-mono font-semibold ${dl > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{dl > 0 ? `+${dl}d` : `${dl}d`}</span>}
                    <Badge className={`${psc.bg} ${psc.text} ${psc.border} text-[10px]`}>{STATUS_LABELS[p.status]}</Badge>
                    {isExp ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
                {isExp && critSteps.length > 0 && (
                  <div className="border-t border-slate-200 overflow-x-auto">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead><tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2 text-left">Phase</th>
                        <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2 text-left">Step</th>
                        <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2 text-left">Planned</th>
                        <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2 text-left">Actual</th>
                        <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2 text-left">Status</th>
                        <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2 text-center">Rev</th>
                      </tr></thead>
                      <tbody>{critSteps.map((s, i) => {
                        const sC = s.status === 'done' ? 'text-emerald-600' : s.status === 'in-progress' ? 'text-blue-600' : s.status === 'blocked' ? 'text-rose-600' : 'text-slate-400';
                        return (<tr key={i} className="border-b border-slate-100 hover:bg-blue-50/30">
                          <td className="px-3 py-2 text-[11px] text-slate-500">{s.phaseName}</td>
                          <td className="px-3 py-2"><div className="text-xs text-slate-800">{s.step}</div>{s.problem && <div className="text-[10px] text-rose-600 mt-0.5 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />{s.problem}</div>}</td>
                          <td className="px-3 py-2 text-[11px] font-mono text-slate-500">{formatDateForDisplay(s.planned) || '—'}</td>
                          <td className="px-3 py-2 text-[11px] font-mono text-slate-600">{formatDateForDisplay(s.actual) || '—'}</td>
                          <td className={`px-3 py-2 text-[11px] font-medium ${sC}`}>{s.status?.replace('-', ' ')}</td>
                          <td className="px-3 py-2 text-center">{(s.date_history || []).length > 0 ? <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">{(s.date_history || []).length}</span> : <span className="text-[10px] text-slate-300">—</span>}</td>
                        </tr>);
                      })}</tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function SH({ children }) { return <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 mb-3">{children}</div>; }
