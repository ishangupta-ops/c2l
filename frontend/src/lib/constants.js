// Status helpers
export const STATUS_LABELS = { 'on-track': 'On Track', 'at-risk': 'At Risk', 'delayed': 'Delayed', 'completed': 'Completed' };

export const STATUS_COLORS = {
  'on-track': { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', fill: 'bg-emerald-500' },
  'at-risk': { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', fill: 'bg-amber-500' },
  'delayed': { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500', fill: 'bg-rose-500' },
  'completed': { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', fill: 'bg-blue-500' },
};

export const STEP_STATUS_COLORS = {
  'done': { text: 'text-emerald-600', dot: 'bg-emerald-500' },
  'in-progress': { text: 'text-blue-600', dot: 'bg-blue-500' },
  'pending': { text: 'text-slate-400', dot: 'bg-slate-400' },
  'blocked': { text: 'text-rose-600', dot: 'bg-rose-500' },
};

export const TYPE_COLORS = {
  'NPD': { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  'Gift Kit': { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  'CPR': { text: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
};

export const TIER_COLORS = {
  'Disruptor': { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  'Challenger': { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  'Commoner': { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
};

export const RD_CLASSIFICATIONS = [
  'Complex - Innovation', 'Complex - Prototype Tested',
  'Non Complex - Variation L1', 'Non Complex - Variation L2', 'Shop & Deploy',
];

export const RD_COLORS = {
  'Complex - Innovation': { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  'Complex - Prototype Tested': { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  'Non Complex - Variation L1': { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  'Non Complex - Variation L2': { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  'Shop & Deploy': { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

export const BIZ_CLASSIFICATIONS = ['Focus - Core', 'Portfolio Filler - Growth', 'Experimental', 'Complementary - Support'];

export const BIZ_COLORS = {
  'Focus - Core': { text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  'Portfolio Filler - Growth': { text: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  'Experimental': { text: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200' },
  'Complementary - Support': { text: 'text-lime-700', bg: 'bg-lime-50', border: 'border-lime-200' },
};

export const PKG_CLASSIFICATIONS = [
  'Complex - Innovation - China Sourced',
  'Complex - Mould - HDPE / PET / Bottle',
  'Complex - Mould - Glass',
  'Complex - Mould - Jar',
  'Complex - India Sourced - Innovation',
  'Non Complex - Variation to established',
];

export const BRAND_OPTIONS = ['Hyphen', 'mCaffeine'];

export const TEAMS = ['NPD', 'R&D', 'Design & Creatives', 'Supply', 'Quality'];
export const TEAM_COLORS = { 'NPD': '#3B82F6', 'R&D': '#2563EB', 'Design & Creatives': '#A855F7', 'Supply': '#F59E0B', 'Quality': '#10B981' };

export function calcProgress(phases) {
  if (!phases || !phases.length) return 0;
  return Math.round(phases.reduce((a, p) => a + (p.progress || 0), 0) / phases.length);
}

export function getBlockers(project) {
  const blockers = [];
  (project.phases || []).forEach(ph =>
    (ph.steps || []).forEach(s => {
      if (s.problem && s.problem.trim()) blockers.push({ phase: ph.name, step: s.step, problem: s.problem, owner: s.owner });
    })
  );
  return blockers;
}

export function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  try { const d = new Date(dateStr); return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return dateStr; }
}
