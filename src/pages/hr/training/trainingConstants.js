export const STATUS_STYLES = {
  scheduled:  { bg: '#FFF7ED', color: '#EA580C', label: 'Scheduled' },
  active:     { bg: '#DBEAFE', color: '#1D4ED8', label: 'Active' },
  completed:  { bg: '#D1FAE5', color: '#065F46', label: 'Completed' },
  evaluation: { bg: '#F5F3FF', color: '#7C3AED', label: 'Evaluation' },
  cancelled:  { bg: '#FEF2F2', color: '#991B1B', label: 'Cancelled' },
};

export const OUTCOME_STYLES = {
  value_created:          { bg: '#D1FAE5', color: '#065F46', label: 'Value Created' },
  value_not_yet_observed: { bg: '#FEE2E2', color: '#B91C1C', label: 'Value Not Yet Observed' },
  under_evaluation:       { bg: '#FEF3C7', color: '#B45309', label: 'Under Evaluation' },
  not_applicable:         { bg: '#F1F5F9', color: '#64748B', label: 'Not Applicable' },
};

export const OUTCOME_OPTIONS = Object.entries(OUTCOME_STYLES).map(([value, s]) => ({ value, label: s.label }));

export const durationDays = (start, end) => {
  if (!start || !end) return null;
  return Math.round((new Date(end) - new Date(start)) / 86_400_000) + 1;
};

export const durationLabel = (start, end) => {
  const d = durationDays(start, end);
  return d == null ? '—' : `${d} ${d === 1 ? 'Day' : 'Days'}`;
};
