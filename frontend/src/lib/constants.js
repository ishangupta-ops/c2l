// Status helpers
export const STATUS_LABELS = {
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  'delayed': 'Delayed',
  'completed': 'Completed',
};

export const STATUS_COLORS = {
  'on-track': { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', dot: 'bg-emerald-400', fill: 'bg-emerald-400' },
  'at-risk': { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', dot: 'bg-amber-400', fill: 'bg-amber-400' },
  'delayed': { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', dot: 'bg-rose-400', fill: 'bg-rose-400' },
  'completed': { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', dot: 'bg-blue-400', fill: 'bg-blue-400' },
};

export const STEP_STATUS_COLORS = {
  'done': { text: 'text-emerald-400', dot: 'bg-emerald-400' },
  'in-progress': { text: 'text-blue-400', dot: 'bg-blue-400' },
  'pending': { text: 'text-neutral-500', dot: 'bg-neutral-500' },
  'blocked': { text: 'text-rose-400', dot: 'bg-rose-400' },
};

export const TYPE_COLORS = {
  'NPD': { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  'Gift Kit': { text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  'CPR': { text: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20' },
};

export const TIER_COLORS = {
  'Disruptor': { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
  'Challenger': { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  'Commoner': { text: 'text-neutral-400', bg: 'bg-neutral-400/10', border: 'border-neutral-400/20' },
};

// R&D Classification (replaces old complexity)
export const RD_CLASSIFICATIONS = [
  'Complex - Innovation',
  'Complex - Prototype Tested',
  'Non Complex - Variation L1',
  'Non Complex - Variation L2',
  'Shop & Deploy',
];

export const RD_COLORS = {
  'Complex - Innovation': { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
  'Complex - Prototype Tested': { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  'Non Complex - Variation L1': { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  'Non Complex - Variation L2': { text: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
  'Shop & Deploy': { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
};

// Business Classification
export const BIZ_CLASSIFICATIONS = [
  'Focus - Core',
  'Portfolio Filler - Growth',
  'Experimental',
  'Complementary - Support',
];

export const BIZ_COLORS = {
  'Focus - Core': { text: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
  'Portfolio Filler - Growth': { text: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
  'Experimental': { text: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20' },
  'Complementary - Support': { text: 'text-lime-400', bg: 'bg-lime-400/10', border: 'border-lime-400/20' },
};

export const TEAMS = ['NPD', 'R&D', 'Design & Creatives', 'Supply', 'Quality'];

export const TEAM_COLORS = {
  'NPD': '#3B82F6',
  'R&D': '#2563EB',
  'Design & Creatives': '#A855F7',
  'Supply': '#F59E0B',
  'Quality': '#10B981',
};

export function calcProgress(phases) {
  if (!phases || !phases.length) return 0;
  return Math.round(phases.reduce((a, p) => a + (p.progress || 0), 0) / phases.length);
}

export function getBlockers(project) {
  const blockers = [];
  (project.phases || []).forEach(ph =>
    (ph.steps || []).forEach(s => {
      if (s.problem && s.problem.trim()) {
        blockers.push({ phase: ph.name, step: s.step, problem: s.problem, owner: s.owner });
      }
    })
  );
  return blockers;
}

// Date utilities
export function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatDateForStorage(date) {
  if (!date) return '';
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return date;
}

export function parseDateString(str) {
  if (!str) return undefined;
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
}
