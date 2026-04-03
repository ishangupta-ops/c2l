import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, TYPE_COLORS, TIER_COLORS, CX_COLORS } from '@/lib/constants';

export default function TimelinePage({ projects, navigate }) {
  const withData = projects.filter(p => p.pd && p.ad);
  const delayed = withData.filter(p => p.ad > p.pd);
  const avgDelay = delayed.length ? Math.round(delayed.reduce((a, p) => a + (p.ad - p.pd), 0) / delayed.length) : 0;
  const maxDays = Math.max(...projects.filter(p => p.ad || p.pd).map(p => Math.max(p.ad || 0, p.pd || 0, 1)), 1);

  const byType = {};
  projects.forEach(p => { const t = p.type || 'NPD'; if (!byType[t]) byType[t] = []; byType[t].push(p); });

  const typeColors = { 'NPD': 'text-blue-400', 'Gift Kit': 'text-purple-400', 'CPR': 'text-teal-400' };
  const tierColors = { 'Disruptor': 'text-rose-400', 'Challenger': 'text-amber-400', 'Commoner': 'text-neutral-400' };

  return (
    <div data-testid="timeline-page">
      <div className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800 px-8 py-5">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-display" data-testid="timeline-title">Timeline Analysis</h1>
        <p className="text-sm text-neutral-400 mt-1">Planned vs actual across types, tiers & formulation complexity</p>
      </div>

      <div className="px-8 py-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" data-testid="timeline-metrics">
          <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4">
            <div className="text-2xl font-semibold font-mono text-white">{projects.length}</div>
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mt-1">Total Projects</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4">
            <div className="text-2xl font-semibold font-mono text-rose-400">{delayed.length}</div>
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mt-1">With Delays</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4">
            <div className="text-2xl font-semibold font-mono text-amber-400">{avgDelay}d</div>
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mt-1">Avg Delay</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4">
            <div className="text-2xl font-semibold font-mono text-emerald-400">{projects.filter(p => p.status === 'completed').length}</div>
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mt-1">Completed</div>
          </div>
        </div>

        {/* By Type */}
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3">By Project Type</div>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {['NPD', 'Gift Kit', 'CPR'].map(type => {
            const list = byType[type] || [];
            const comp = list.filter(p => p.pd && p.ad);
            const ap = comp.length ? Math.round(comp.reduce((a, p) => a + p.pd, 0) / comp.length) : null;
            const aa = comp.length ? Math.round(comp.reduce((a, p) => a + p.ad, 0) / comp.length) : null;
            const col = typeColors[type];
            return (
              <div key={type} className="bg-neutral-900 border border-neutral-800 rounded-md p-4 text-center" data-testid={`type-card-${type.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className={`text-[10px] font-bold tracking-[0.15em] uppercase ${col} mb-1`}>{type}</div>
                <div className={`text-3xl font-semibold font-mono ${col}`}>{list.length}</div>
                <div className="text-xs text-neutral-500 mt-1">{ap ? `Planned avg: ${ap}d` : '—'}</div>
                {aa && <div className={`text-xs mt-0.5 ${aa > ap ? 'text-rose-400' : 'text-emerald-400'}`}>Actual avg: {aa}d</div>}
              </div>
            );
          })}
        </div>

        {/* By Tier */}
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3">By Product Tier</div>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {['Disruptor', 'Challenger', 'Commoner'].map(tier => {
            const list = projects.filter(p => p.tier === tier);
            const comp = list.filter(p => p.pd && p.ad);
            const ap = comp.length ? Math.round(comp.reduce((a, p) => a + p.pd, 0) / comp.length) : null;
            const aa = comp.length ? Math.round(comp.reduce((a, p) => a + p.ad, 0) / comp.length) : null;
            const col = tierColors[tier];
            return (
              <div key={tier} className="bg-neutral-900 border border-neutral-800 rounded-md p-4 text-center" data-testid={`tier-card-${tier.toLowerCase()}`}>
                <div className={`text-[10px] font-bold tracking-[0.15em] uppercase ${col} mb-1`}>{tier}</div>
                <div className={`text-3xl font-semibold font-mono ${col}`}>{list.length}</div>
                <div className="text-xs text-neutral-500 mt-1">{ap ? `Planned: ${ap}d` : '—'}</div>
                {aa && <div className={`text-xs mt-0.5 ${aa > ap ? 'text-rose-400' : 'text-emerald-400'}`}>Actual: {aa}d</div>}
              </div>
            );
          })}
        </div>

        {/* Gantt-like Timeline */}
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3">Planned vs Actual — All Projects</div>
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
            const delay = p.ad ? p.ad - p.pd : null;
            return (
              <div key={p.id} className="flex items-center gap-3" data-testid={`timeline-row-${p.id}`}>
                <div className="min-w-[140px]">
                  <div className="text-[11px] font-medium text-blue-400 cursor-pointer hover:text-blue-300 truncate" onClick={() => navigate(`/project/${p.id}`)}>
                    {p.name.length > 24 ? p.name.slice(0, 24) + '...' : p.name}
                  </div>
                  <div className="text-[10px] text-neutral-600">{p.type} · {p.tier} · {p.cx}</div>
                </div>
                <div className="flex-1 relative h-7">
                  <div className="absolute top-0.5 h-2 rounded-sm bg-blue-300/30 timeline-bar" style={{ width: `${pw}px` }} />
                  {aw > 0 && <div className="absolute top-4 h-2 rounded-sm bg-blue-400 timeline-bar" style={{ width: `${aw}px` }} />}
                  {dw > 0 && <div className="absolute top-4 h-2 rounded-sm bg-rose-400/70 timeline-bar" style={{ left: `${pw}px`, width: `${dw}px` }} />}
                </div>
                <div className={`text-[11px] font-mono min-w-[80px] text-right ${delay && delay > 0 ? 'text-rose-400' : delay && delay <= 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                  {p.ad ? `${p.pd}d > ${p.ad}d` : `${p.pd}d planned`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Delay Table */}
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3">Delay Table</div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-md overflow-hidden mb-8" data-testid="delay-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-4 py-2.5 text-left">Project</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2.5 text-left">Type</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2.5 text-left">Tier</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2.5 text-left">Complexity</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2.5 text-right">Planned</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2.5 text-right">Actual</th>
                <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-neutral-500 px-3 py-2.5 text-right">Delay</th>
              </tr>
            </thead>
            <tbody>
              {projects.filter(p => p.pd).sort((a, b) => ((b.ad && b.pd ? b.ad - b.pd : 0) - (a.ad && a.pd ? a.ad - a.pd : 0))).map(p => {
                const dl = p.ad ? p.ad - p.pd : null;
                const tc = TYPE_COLORS[p.type] || TYPE_COLORS['NPD'];
                const trc = TIER_COLORS[p.tier] || TIER_COLORS['Commoner'];
                const cxc = CX_COLORS[p.cx] || CX_COLORS['Simple'];
                return (
                  <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                    <td className="px-4 py-2.5 text-xs font-medium text-blue-400 cursor-pointer hover:text-blue-300" onClick={() => navigate(`/project/${p.id}`)}>
                      {p.name.length > 28 ? p.name.slice(0, 28) + '...' : p.name}
                    </td>
                    <td className="px-3 py-2.5"><Badge className={`${tc.bg} ${tc.text} ${tc.border} text-[10px]`}>{p.type}</Badge></td>
                    <td className="px-3 py-2.5"><Badge className={`${trc.bg} ${trc.text} ${trc.border} text-[10px]`}>{p.tier}</Badge></td>
                    <td className="px-3 py-2.5"><Badge className={`${cxc.bg} ${cxc.text} text-[10px] border border-transparent`}>{p.cx}</Badge></td>
                    <td className="px-3 py-2.5 text-xs font-mono text-neutral-500 text-right">{p.pd}d</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-neutral-400 text-right">{p.ad ? `${p.ad}d` : '—'}</td>
                    <td className={`px-3 py-2.5 text-xs font-mono font-semibold text-right ${dl > 0 ? 'text-rose-400' : dl < 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {dl != null ? (dl > 0 ? `+${dl}d` : `${dl}d`) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Complexity Insight */}
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3">Formulation Complexity vs Delay</div>
        <div className="grid grid-cols-3 gap-3 mb-8" data-testid="complexity-grid">
          {['Complex', 'Moderate', 'Simple'].map(cx => {
            const list = projects.filter(p => p.cx === cx && p.pd && p.ad);
            const avgD = list.length ? Math.round(list.reduce((a, p) => a + (p.ad - p.pd), 0) / list.length) : null;
            const cxc = CX_COLORS[cx] || CX_COLORS['Simple'];
            return (
              <div key={cx} className="bg-neutral-900 border border-neutral-800 rounded-md p-4" data-testid={`complexity-${cx.toLowerCase()}`}>
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-medium text-white">{cx}</div>
                  <div className={`text-xl font-semibold font-mono ${cxc.text}`}>{projects.filter(p => p.cx === cx).length}</div>
                </div>
                <div className="text-[11px] text-neutral-500">{list.length} with timeline data</div>
                {avgD != null && <div className={`text-xs mt-2 font-medium ${avgD > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>Avg delay: {avgD > 0 ? `+${avgD}d` : `${avgD}d`}</div>}
              </div>
            );
          })}
        </div>

        {/* Packaging Type */}
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3">Packaging Type vs Delay</div>
        <div className="grid grid-cols-2 gap-3" data-testid="packaging-delay-grid">
          {['New', 'Existing'].map(pt => {
            const list = projects.filter(p => p.pt === pt && p.pd && p.ad);
            const avgD = list.length ? Math.round(list.reduce((a, p) => a + (p.ad - p.pd), 0) / list.length) : null;
            return (
              <div key={pt} className="bg-neutral-900 border border-neutral-800 rounded-md p-4" data-testid={`pkg-type-${pt.toLowerCase()}`}>
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-medium text-white">Pkg: {pt}</div>
                  <div className={`text-xl font-semibold font-mono ${pt === 'New' ? 'text-purple-400' : 'text-blue-400'}`}>{projects.filter(p => p.pt === pt).length}</div>
                </div>
                <div className="text-[11px] text-neutral-500">{list.length} with data</div>
                {avgD != null && <div className={`text-xs mt-2 font-medium ${avgD > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>Avg delay: {avgD > 0 ? `+${avgD}d` : `${avgD}d`}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
