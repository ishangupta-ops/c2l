import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS, STATUS_COLORS, TYPE_COLORS, TIER_COLORS, RD_COLORS, BIZ_COLORS, RD_CLASSIFICATIONS, BIZ_CLASSIFICATIONS, calcProgress, getBlockers, formatDateForDisplay } from '@/lib/constants';
import { fetchMetrics } from '@/lib/api';
import ProjectModal from '@/components/ProjectModal';

const statusFilters = ['all', 'on-track', 'at-risk', 'delayed', 'completed'];
const typeFilters = ['NPD', 'Gift Kit', 'CPR'];

export default function DashboardPage({ projects, refreshProjects, navigate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [metrics, setMetrics] = useState({ total: 0, on_track: 0, at_risk: 0, delayed: 0, completed: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowModal(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const loadMetrics = useCallback(async () => {
    try { setMetrics(await fetchMetrics()); } catch {}
  }, []);
  useEffect(() => { loadMetrics(); }, [loadMetrics, projects]);

  const filtered = projects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.cat || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const metricCards = [
    { label: 'Total', value: metrics.total, color: 'text-white' },
    { label: 'On Track', value: metrics.on_track, color: 'text-emerald-400' },
    { label: 'At Risk', value: metrics.at_risk, color: 'text-amber-400' },
    { label: 'Delayed', value: metrics.delayed, color: 'text-rose-400' },
    { label: 'Completed', value: metrics.completed, color: 'text-blue-400' },
  ];

  return (
    <div data-testid="dashboard-page">
      <div className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800 px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-display" data-testid="dashboard-title">Dashboard</h1>
            <p className="text-sm text-neutral-400 mt-1">{metrics.total} project{metrics.total !== 1 ? 's' : ''} tracked</p>
          </div>
          <button data-testid="create-project-btn" onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium bg-white text-black hover:bg-neutral-200 h-9 px-4 transition-colors">
            <Plus className="w-4 h-4" strokeWidth={2} /> New Project
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6" data-testid="metrics-grid">
          {metricCards.map(mc => (
            <div key={mc.label} className="bg-neutral-900 border border-neutral-800 rounded-md p-4" data-testid={`metric-${mc.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className={`text-2xl font-semibold font-mono ${mc.color}`}>{mc.value}</div>
              <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mt-1">{mc.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-5 flex-wrap" data-testid="filters-row">
          {statusFilters.map(f => (
            <button key={f} data-testid={`filter-${f}`} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${statusFilter === f ? 'bg-white text-black border-white' : 'bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-neutral-200'}`}>
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
            </button>
          ))}
          <span className="w-px h-5 bg-neutral-800 mx-1" />
          {typeFilters.map(t => {
            const tc = TYPE_COLORS[t] || TYPE_COLORS['NPD'];
            return (
              <button key={t} data-testid={`filter-type-${t.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${typeFilter === t ? `${tc.bg} ${tc.text} ${tc.border}` : 'bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600'}`}>
                {t}
              </button>
            );
          })}
          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            <input data-testid="search-input" type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-full text-xs bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600 w-44" />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" data-testid="project-grid">
          {filtered.map((p, i) => <ProjectCard key={p.id} project={p} navigate={navigate} index={i} />)}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16" data-testid="empty-state">
              <p className="text-neutral-500 text-sm">{projects.length ? 'No matches found.' : 'No projects yet.'}</p>
              {!projects.length && <button onClick={() => setShowModal(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium bg-white text-black hover:bg-neutral-200 h-9 px-4 transition-colors"><Plus className="w-4 h-4" /> Create first project</button>}
            </div>
          )}
        </div>
      </div>

      <ProjectModal open={showModal} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); refreshProjects(); }} />
    </div>
  );
}

function ProjectCard({ project: p, navigate, index }) {
  const sc = STATUS_COLORS[p.status] || STATUS_COLORS['on-track'];
  const tc = TYPE_COLORS[p.type] || TYPE_COLORS['NPD'];
  const trc = TIER_COLORS[p.tier] || TIER_COLORS['Commoner'];
  const rdc = RD_COLORS[p.rd_class] || RD_COLORS['Complex - Innovation'] || { text: 'text-neutral-400', bg: 'bg-neutral-400/10' };
  const bzc = BIZ_COLORS[p.biz_class] || BIZ_COLORS['Focus - Core'] || { text: 'text-neutral-400', bg: 'bg-neutral-400/10' };
  const progress = calcProgress(p.phases);
  const blockers = getBlockers(p).length;
  const delay = p.ad && p.pd ? p.ad - p.pd : null;

  return (
    <div data-testid={`project-card-${p.id}`} onClick={() => navigate(`/project/${p.id}`)}
      className="bg-neutral-900 border border-neutral-800 rounded-md p-4 cursor-pointer card-hover relative overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${sc.fill}`} />
      <div className="flex justify-between items-start mb-2 mt-1">
        <h3 className="text-sm font-semibold text-white leading-snug pr-2 flex-1">{p.name}</h3>
        <Badge className={`${sc.bg} ${sc.text} ${sc.border} text-[10px] font-semibold shrink-0`}>{STATUS_LABELS[p.status]}</Badge>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-2.5">
        {p.type && <Badge className={`${tc.bg} ${tc.text} ${tc.border} text-[10px]`}>{p.type}</Badge>}
        {p.tier && <Badge className={`${trc.bg} ${trc.text} ${trc.border} text-[10px]`}>{p.tier}</Badge>}
        {p.rd_class && <Badge className={`${rdc.bg} ${rdc.text} text-[10px] border border-transparent`}>{p.rd_class}</Badge>}
        {p.biz_class && <Badge className={`${bzc.bg} ${bzc.text} text-[10px] border border-transparent`}>{p.biz_class}</Badge>}
        {p.pt && <Badge className={`text-[10px] border ${p.pt === 'New' ? 'bg-purple-400/10 text-purple-400 border-purple-400/20' : 'bg-blue-400/10 text-blue-400 border-blue-400/20'}`}>Pkg: {p.pt}</Badge>}
      </div>

      <div className="flex gap-3 flex-wrap mb-3 text-[11px] text-neutral-500">
        {p.cat && <span><strong className="text-neutral-300">{p.cat}</strong></span>}
        {p.launch && <span>Launch: <strong className="text-neutral-300">{formatDateForDisplay(p.launch)}</strong></span>}
        {p.owner && <span><strong className="text-neutral-300">{p.owner}</strong></span>}
        {blockers > 0 && <span className="text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{blockers}</span>}
        {delay > 0 && <span className="text-rose-400">+{delay}d</span>}
      </div>

      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] text-neutral-500">{(p.phases || []).length} phases</span>
        <span className="text-xs font-semibold font-mono text-neutral-300">{progress}%</span>
      </div>
      <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full progress-fill ${sc.fill}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
