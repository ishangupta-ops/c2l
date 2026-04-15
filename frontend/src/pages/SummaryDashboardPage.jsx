import { useState, useMemo } from 'react';
import { Download, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_LABELS, STATUS_COLORS, RD_COLORS, BIZ_COLORS, RD_CLASSIFICATIONS, BIZ_CLASSIFICATIONS, BRAND_OPTIONS, TEAMS, TYPE_COLORS, calcProgress, getBlockers, formatDateForDisplay } from '@/lib/constants';

export default function SummaryDashboardPage({ projects, navigate }) {
  const [brandFilter, setBrandFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [rdFilter, setRdFilter] = useState('all');
  const [bizFilter, setBizFilter] = useState('all');

  const filtered = useMemo(() => projects.filter(p => {
    if (brandFilter !== 'all' && p.brand !== brandFilter) return false;
    if (deptFilter !== 'all' && !(p.teams || []).includes(deptFilter)) return false;
    if (rdFilter !== 'all' && p.rd_class !== rdFilter) return false;
    if (bizFilter !== 'all' && p.biz_class !== bizFilter) return false;
    return true;
  }), [projects, brandFilter, deptFilter, rdFilter, bizFilter]);

  // Group by category
  const byCategory = {};
  filtered.forEach(p => { const c = p.cat || 'Uncategorized'; if (!byCategory[c]) byCategory[c] = []; byCategory[c].push(p); });

  // Bulk CSV export
  const handleBulkExport = () => {
    const rows = [['Project', 'Brand', 'Category', 'Status', 'Type', 'R&D Class', 'Biz Class', 'Pkg Class', 'Owner', 'Launch', 'Planned Days', 'Actual Days', 'Delay', 'Progress', 'Blockers', 'Teams']];
    filtered.forEach(p => {
      const delay = p.ad && p.pd ? p.ad - p.pd : '';
      rows.push([p.name, p.brand || '', p.cat || '', STATUS_LABELS[p.status] || p.status, p.type, p.rd_class || '', p.biz_class || '', p.pkg_class || '', p.owner || '', p.launch || '', p.pd || '', p.ad || '', delay, `${calcProgress(p.phases)}%`, getBlockers(p).length, (p.teams || []).join('; ')]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'projects_summary.csv'; a.click();
  };

  const totalDelayed = filtered.filter(p => p.ad && p.pd && p.ad > p.pd).length;
  const avgDelay = (() => { const d = filtered.filter(p => p.ad && p.pd && p.ad > p.pd); return d.length ? Math.round(d.reduce((a, p) => a + (p.ad - p.pd), 0) / d.length) : 0; })();

  return (
    <div data-testid="summary-dashboard-page">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 font-display" data-testid="summary-title">Summary Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">{filtered.length} of {projects.length} projects · Category & classification overview</p>
          </div>
          <button data-testid="bulk-csv-btn" onClick={handleBulkExport} className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap bg-white border border-slate-200 rounded-lg p-3 shadow-sm" data-testid="summary-filters">
          <Filter className="w-4 h-4 text-slate-400" />
          <div>
            <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Brand</div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="h-8 w-32 text-xs border-slate-200" data-testid="brand-filter"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Brands</SelectItem>{BRAND_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Department</div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="h-8 w-40 text-xs border-slate-200" data-testid="dept-filter"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Departments</SelectItem>{TEAMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">R&D Class</div>
            <Select value={rdFilter} onValueChange={setRdFilter}>
              <SelectTrigger className="h-8 w-44 text-xs border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem>{RD_CLASSIFICATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Business Priority</div>
            <Select value={bizFilter} onValueChange={setBizFilter}>
              <SelectTrigger className="h-8 w-44 text-xs border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem>{BIZ_CLASSIFICATIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-semibold font-mono text-slate-900">{filtered.length}</div>
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mt-1">Projects</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-semibold font-mono text-rose-600">{totalDelayed}</div>
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mt-1">Delayed</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-semibold font-mono text-amber-600">{avgDelay}d</div>
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mt-1">Avg Delay</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-semibold font-mono text-blue-600">{Object.keys(byCategory).length}</div>
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mt-1">Categories</div>
          </div>
        </div>

        {/* By Category */}
        {Object.entries(byCategory).map(([cat, catProjects]) => (
          <div key={cat} className="mb-6" data-testid={`category-${cat}`}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-semibold text-slate-800 font-display">{cat}</h2>
              <Badge className="bg-slate-100 text-slate-600 text-[10px]">{catProjects.length}</Badge>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-4 py-2.5 text-left">Project</th>
                    <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2.5 text-left">Brand</th>
                    <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2.5 text-left">Status</th>
                    <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2.5 text-left">R&D</th>
                    <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2.5 text-left">Priority</th>
                    <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2.5 text-left">Launch</th>
                    <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2.5 text-right">Delay</th>
                    <th className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 px-3 py-2.5 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {catProjects.map(p => {
                    const sc = STATUS_COLORS[p.status];
                    const rdc = RD_COLORS[p.rd_class] || { text: 'text-slate-500', bg: 'bg-slate-50' };
                    const bzc = BIZ_COLORS[p.biz_class] || { text: 'text-slate-500', bg: 'bg-slate-50' };
                    const delay = p.ad && p.pd ? p.ad - p.pd : null;
                    return (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-blue-50/30 cursor-pointer" onClick={() => navigate(`/project/${p.id}`)}>
                        <td className="px-4 py-2.5">
                          <div className="text-sm font-medium text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-400">{p.owner}</div>
                        </td>
                        <td className="px-3 py-2.5">{p.brand && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">{p.brand}</Badge>}</td>
                        <td className="px-3 py-2.5"><Badge className={`${sc.bg} ${sc.text} ${sc.border} text-[10px]`}>{STATUS_LABELS[p.status]}</Badge></td>
                        <td className="px-3 py-2.5"><Badge className={`${rdc.bg} ${rdc.text} text-[9px] border border-transparent`}>{p.rd_class}</Badge></td>
                        <td className="px-3 py-2.5"><Badge className={`${bzc.bg} ${bzc.text} text-[9px] border border-transparent`}>{p.biz_class}</Badge></td>
                        <td className="px-3 py-2.5 text-xs text-slate-500 font-mono">{formatDateForDisplay(p.launch)}</td>
                        <td className={`px-3 py-2.5 text-xs font-mono font-semibold text-right ${delay > 0 ? 'text-rose-600' : delay < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {delay != null ? (delay > 0 ? `+${delay}d` : `${delay}d`) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-xs font-mono font-semibold text-slate-700">{calcProgress(p.phases)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {Object.keys(byCategory).length === 0 && <div className="text-center py-16 text-slate-400 text-sm">No projects match the current filters</div>}
      </div>
    </div>
  );
}
