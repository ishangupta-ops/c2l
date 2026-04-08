import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS, TYPE_COLORS, TIER_COLORS, RD_COLORS, BIZ_COLORS, RD_CLASSIFICATIONS, BIZ_CLASSIFICATIONS, formatDateForDisplay } from '@/lib/constants';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

export default function TimelinePage({ projects, navigate }) {
  const [expandedProject, setExpandedProject] = useState(null);

  const withData = projects.filter(p => p.pd && p.ad);
  const delayed = withData.filter(p => p.ad > p.pd);
  const avgDelay = delayed.length ? Math.round(delayed.reduce((a, p) => a + (p.ad - p.pd), 0) / delayed.length) : 0;

  // Group by R&D Classification
  const byRD = {};
  RD_CLASSIFICATIONS.forEach(r => { byRD[r] = projects.filter(p => p.rd_class === r); });

  // Group by Business Classification
  const byBiz = {};
  BIZ_CLASSIFICATIONS.forEach(b => { byBiz[b] = projects.filter(p => p.biz_class === b); });

  const maxDays = Math.max(...projects.filter(p => p.ad || p.pd).map(p => Math.max(p.ad || 0, p.pd || 0, 1)), 1);

  return (
    <div data-testid="timeline-page">
      <div className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800 px-8 py-5">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-display" data-testid="timeline-title">Timeline Analysis</h1>
        <p className="text-sm text-neutral-400 mt-1">Category breakdown & per-project deep dive with critical steps</p>
      </div>

      <div className="px-8 py-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" data-testid="timeline-metrics">
          <MetricCard label="Total Projects" value={projects.length} color="text-white" />
          <MetricCard label="With Delays" value={delayed.length} color="text-rose-400" />
          <MetricCard label="Avg Delay" value={`${avgDelay}d`} color="text-amber-400" />
          <MetricCard label="Completed" value={projects.filter(p => p.status === 'completed').length} color="text-emerald-400" />
        </div>

        {/* By R&D Classification */}
        <SectionHeader>By R&D Classification</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-8">
          {RD_CLASSIFICATIONS.map(rd => {
            const list = byRD[rd] || [];
            const comp = list.filter(p => p.pd && p.ad);
            const avgD = comp.length ? Math.round(comp.reduce((a, p) => a + (p.ad - p.pd), 0) / comp.length) : null;
            const rc = RD_COLORS[rd] || { text: 'text-neutral-400', bg: 'bg-neutral-400/10' };
            return (
              <div key={rd} className="bg-neutral-900 border border-neutral-800 rounded-md p-4" data-testid={`rd-card-${rd}`}>
                <div className={`text-[10px] font-bold tracking-[0.1em] uppercase ${rc.text} mb-2 leading-tight`}>{rd}</div>
                <div className={`text-2xl font-semibold font-mono ${rc.text}`}>{list.length}</div>
                <div className="text-[11px] text-neutral-500 mt-1">{comp.length} with timeline</div>
                {avgD != null && <div className={`text-xs mt-1 font-medium ${avgD > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{avgD > 0 ? `+${avgD}d avg` : `${avgD}d avg`}</div>}
              </div>
            );
          })}
        </div>

        {/* By Business Classification */}
        <SectionHeader>By Business Classification</SectionHeader>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {BIZ_CLASSIFICATIONS.map(biz => {
            const list = byBiz[biz] || [];
            const comp = list.filter(p => p.pd && p.ad);
            const avgD = comp.length ? Math.round(comp.reduce((a, p) => a + (p.ad - p.pd), 0) / comp.length) : null;
            const bc = BIZ_COLORS[biz] || { text: 'text-neutral-400', bg: 'bg-neutral-400/10' };
            return (
              <div key={biz} className="bg-neutral-900 border border-neutral-800 rounded-md p-4" data-testid={`biz-card-${biz}`}>
                <div className={`text-[10px] font-bold tracking-[0.1em] uppercase ${bc.text} mb-2`}>{biz}</div>
                <div className={`text-2xl font-semibold font-mono ${bc.text}`}>{list.length}</div>
                <div className="text-[11px] text-neutral-500 mt-1">{comp.length} with timeline</div>
                {avgD != null && <div className={`text-xs mt-1 font-medium ${avgD > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{avgD > 0 ? `+${avgD}d avg` : `${avgD}d avg`}</div>}
              </div>
            );
          })}
        </div>

        {/* Planned vs Actual Overview */}
        <SectionHeader>Planned vs Actual — All Projects</SectionHeader>
        <div className="flex gap-4 mb-3 text-[11px] text-neutral-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-sm bg-blue-300/60" /> Planned</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-sm bg-blue-400" /> Actual</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-sm bg-rose-400" /> Delay</div>
        </div>
        <div className="space-y-2 mb-8" data-testid="timeline-chart">
          {projects.filter(p => p.pd).map(p => {
            const scale = 280 / maxDays;
            const pw = Math.round(p.pd * scale);
            const aw = p.ad ? Math.round(Math.min(p.ad, p.pd) * scale) : 0;
            const dw = p.ad && p.ad > p.pd ? Math.round((p.ad - p.pd) * scale) : 0;
            const dl = p.ad ? p.ad - p.pd : null;
            return (
              <div key={p.id} className="flex items-center gap-3" data-testid={`timeline-row-${p.id}`}>
                <div className="min-w-[140px]">
                  <div className="text-[11px] font-medium text-blue-400 cursor-pointer hover:text-blue-300 truncate" onClick={() => navigate(`/project/${p.id}`)}>
                    {p.name.length > 24 ? p.name.slice(0, 24) + '...' : p.name}
                  </div>
                  <div className="text-[10px] text-neutral-600">{p.rd_class || p.type}</div>
                </div>
                <div className="flex-1 relative h-7">
                  <div className="absolute top-0.5 h-2 rounded-sm bg-blue-300/30 timeline-bar" style={{ width: `${pw}px` }} />
                  {aw > 0 && <div className="absolute top-4 h-2 rounded-sm bg-blue-400 timeline-bar" style={{ width: `${aw}px` }} />}
                  {dw > 0 && <div className="absolute top-4 h-2 rounded-sm bg-rose-400/70 timeline-bar" style={{ left: `${pw}px`, width: `${dw}px` }} />}
                </div>
                <div className={`text-[11px] font-mono min-w-[80px] text-right ${dl && dl > 0 ? 'text-rose-400' : dl && dl <= 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                  {p.ad ? `${p.pd}d > ${p.ad}d` : `${p.pd}d planned`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-Project Deep Dive */}
        <SectionHeader>Per-Project Deep Dive — Critical Steps</SectionHeader>
        <div className="space-y-2" data-testid="project-deep-dive">
          {projects.map(p => {
            const isExpanded = expandedProject === p.id;
            const sc = STATUS_COLORS[p.status] || STATUS_COLORS['on-track'];
            const rdc = RD_COLORS[p.rd_class] || { text: 'text-neutral-400', bg: 'bg-neutral-400/10' };
            const bzc = BIZ_COLORS[p.biz_class] || { text: 'text-neutral-400', bg: 'bg-neutral-400/10' };
            const criticalSteps = [];
            (p.phases || []).forEach(ph => {
              (ph.steps || []).forEach(s => {
                if (s.critical) criticalSteps.push({ ...s, phaseName: ph.name });
              });
            });
            const dl = p.ad && p.pd ? p.ad - p.pd : null;

            return (
              <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-md overflow-hidden" data-testid={`deep-dive-${p.id}`}>
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-800/50 transition-colors" onClick={() => setExpandedProject(isExpanded ? null : p.id)}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{p.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`${rdc.bg} ${rdc.text} text-[9px] border border-transparent`}>{p.rd_class}</Badge>
                      <Badge className={`${bzc.bg} ${bzc.text} text-[9px] border border-transparent`}>{p.biz_class}</Badge>
                      <span className="text-[10px] text-neutral-600">{criticalSteps.length} critical steps</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {dl != null && <span className={`text-xs font-mono font-semibold ${dl > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{dl > 0 ? `+${dl}d` : `${dl}d`}</span>}
                    <Badge className={`${sc.bg} ${sc.text} ${sc.border} text-[10px]`}>{STATUS_LABELS[p.status]}</Badge>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-neutral-800 px-4 py-3">
                    {/* Project Summary */}
                    <div className="flex gap-4 text-[11px] text-neutral-500 mb-3 flex-wrap">
                      {p.launch && <span>Launch: <strong className="text-neutral-300">{formatDateForDisplay(p.launch)}</strong></span>}
                      {p.pd && <span>Planned: <strong className="text-neutral-300">{p.pd}d</strong></span>}
                      {p.ad && <span>Actual: <strong className="text-neutral-300">{p.ad}d</strong></span>}
                      {p.owner && <span>Owner: <strong className="text-neutral-300">{p.owner}</strong></span>}
                    </div>

                    {/* Critical Steps Timeline */}
                    {criticalSteps.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[600px]">
                          <thead>
                            <tr className="border-b border-neutral-800">
                              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2 text-left">Phase</th>
                              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2 text-left">Critical Step</th>
                              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2 text-left">Planned</th>
                              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2 text-left">Actual</th>
                              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2 text-left">Status</th>
                              <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2 text-center">Revisions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {criticalSteps.map((s, i) => {
                              const sColor = s.status === 'done' ? 'text-emerald-400' : s.status === 'in-progress' ? 'text-blue-400' : s.status === 'blocked' ? 'text-rose-400' : 'text-neutral-500';
                              const revCount = (s.date_history || []).length;
                              return (
                                <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                                  <td className="px-3 py-2 text-[11px] text-neutral-500">{s.phaseName}</td>
                                  <td className="px-3 py-2">
                                    <div className="text-xs text-neutral-200">{s.step}</div>
                                    {s.problem && <div className="text-[10px] text-rose-400 mt-0.5 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />{s.problem}</div>}
                                  </td>
                                  <td className="px-3 py-2 text-[11px] font-mono text-neutral-500">{formatDateForDisplay(s.planned) || '—'}</td>
                                  <td className="px-3 py-2 text-[11px] font-mono text-neutral-400">{formatDateForDisplay(s.actual) || '—'}</td>
                                  <td className={`px-3 py-2 text-[11px] font-medium ${sColor}`}>{s.status?.replace('-', ' ')}</td>
                                  <td className="px-3 py-2 text-center">
                                    {revCount > 0 ? <span className="text-[10px] bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded-full">{revCount}</span> : <span className="text-[10px] text-neutral-700">—</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-600 py-2">No critical steps defined for this project</div>
                    )}
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

function SectionHeader({ children }) {
  return <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3">{children}</div>;
}

function MetricCard({ label, value, color }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4">
      <div className={`text-2xl font-semibold font-mono ${color}`}>{value}</div>
      <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mt-1">{label}</div>
    </div>
  );
}
