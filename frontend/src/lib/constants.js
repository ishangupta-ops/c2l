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

export const CX_COLORS = {
  'Complex': { text: 'text-rose-400', bg: 'bg-rose-400/10' },
  'Moderate': { text: 'text-amber-400', bg: 'bg-amber-400/10' },
  'Simple': { text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
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
