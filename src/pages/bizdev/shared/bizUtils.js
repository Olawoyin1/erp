export {
  fieldErrorsOf, formatDate, formatDateTime, money, compactMoney, toKobo, fromKobo, ymd, today, countFilters, statValue, statChange,
  downloadFile, uploadStagedFiles, refId, refName, saveRowsCsv, csvMoney, PRIORITIES, useDebounced,
} from '../../procurement/shared/procUtils';

export const OPPORTUNITY_STAGES = [
  { value: 'lead', label: 'Lead' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'meeting_held', label: 'Meeting Held' },
  { value: 'proposal_discussed', label: 'Proposal Discussed' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted_to_tender', label: 'Converted to Tender' },
  { value: 'lost', label: 'Lost' },
];
export const OPPORTUNITY_CHAIN = OPPORTUNITY_STAGES.slice(0, 5);

export const TENDER_CHAIN = [
  { value: 'received', label: 'Received' },
  { value: 'review', label: 'Review' },
  { value: 'in_preparation', label: 'In Preparation' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'clarification', label: 'Negotiation' },
];
export const TENDER_STAGES = [...TENDER_CHAIN, { value: 'won', label: 'Awarded' }, { value: 'lost', label: 'Not Awarded' }];

export const RFQ_CHAIN = [
  { value: 'received', label: 'Received' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
];
export const RFQ_STAGES = [...RFQ_CHAIN, { value: 'awarded', label: 'Awarded' }, { value: 'lost', label: 'Lost' }];

const LABELS = {
  opportunity: OPPORTUNITY_STAGES,
  tender: TENDER_STAGES,
  rfq: RFQ_STAGES,
};

export const stageLabel = (kind, stage) => (LABELS[kind] || []).find((s) => s.value === stage)?.label || String(stage || '').replace(/_/g, ' ');

export const STAGE_TONES = {
  opportunity: { lead: 'slate', contacted: 'blue', meeting_held: 'purple', proposal_discussed: 'amber', qualified: 'green', converted_to_tender: 'slate', lost: 'red' },
  tender: { received: 'blue', review: 'sky', in_preparation: 'blue', submitted: 'purple', evaluation: 'amber', clarification: 'amber', won: 'green', lost: 'red' },
  rfq: { received: 'blue', in_progress: 'amber', submitted: 'purple', awarded: 'green', lost: 'red' },
};

export const PRIORITY_TONES = { Low: 'sky', Medium: 'amber', High: 'red', Hot: 'red' };
export const RELATIONSHIP_TONES = { Hot: 'red', Warm: 'amber', Strategic: 'blue', Cold: 'slate' };
export const INTERACTION_TONES = { Meeting: 'blue', Call: 'green', Email: 'amber', 'Site Visit': 'red', Presentation: 'purple' };

export const RELATIONSHIPS = ['Hot', 'Warm', 'Strategic', 'Cold'];
export const INTERACTION_TYPES = ['Meeting', 'Call', 'Email', 'Site Visit', 'Presentation'];
export const OPPORTUNITY_TYPES = ['Tender', 'Maintenance', 'Engineering Services', 'Consultancy', 'Equipment Supply', 'Material Supply', 'Construction'];
export const RFQ_TYPES = ['Goods', 'Materials', 'Equipment', 'Services', 'Works', 'Other'];
export const CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP'];

export const toOptions = (rows, label) => (rows || []).map((r) => ({ value: r._id, label: typeof label === 'function' ? label(r) : r[label] }));
export const plainOptions = (values) => values.map((v) => ({ value: v, label: v }));

/** Whole days from today to the date (negative when past); null without a date. */
export function daysUntil(value) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

export const dateOnly = (value) => (value ? String(value).slice(0, 10) : '');
export const percentText = (value) => `${Math.round(Number(value) || 0)}%`;

/** Weighted value in kobo, as the server computes it. */
export const weighted = (estimated, probability) => Math.round((Number(estimated) || 0) * ((Number(probability) || 0) / 100));
