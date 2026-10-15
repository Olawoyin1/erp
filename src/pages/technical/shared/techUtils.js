export {
  countFilters, csvMoney, fieldErrorsOf, formatDate, formatDateTime, fromKobo, money, compactMoney, refId, refName, statusLabel,
  statValue, toKobo, toOptions, uploadStagedFiles, ymd, today, saveBlob, downloadFile, blobErrorMessage,
} from '../../procurement/shared/procUtils';

/** The "attach to a record" dialog searches with `search`; the Technical lists search with `q`. */
export const searchAsQ = (service) => ({
  ...service,
  list: ({ search, ...params }) => service.list({ ...params, ...(search ? { q: search } : {}) }),
});

export const PROJECT_TYPES =['EPCIC', 'Maintenance'];
export const CONTRACT_TYPES = ['Lump Sum', 'EPCIC', 'Unit Rate', 'Cost Plus'];
export const CURRENCIES = ['NGN', 'USD'];
export const TIMELINE_REASONS = ['Client-Requested Delay', 'Vendor/Material Delay', 'Weather/Site Conditions', 'Scope Change', 'Resource Constraint', 'Other'];
export const WBS_PHASES = ['Planning', 'Engineering', 'Procurement', 'Construction', 'Commissioning', 'Close-out'];
export const PRIORITIES = ['High', 'Medium', 'Low', 'Hot'];
export const LOG_TYPES = ['Risk', 'Issue', 'Change Request'];
export const RESOURCE_CATEGORIES = ['Equipment', 'Material', 'PPE', 'Vehicle'];
export const RESOURCE_UNITS = ['Units', 'Pieces', 'Sets', 'Rolls', 'Boxes', 'Litres', 'Metres', 'Tonnes'];
export const WEATHER = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Foggy', 'Stormy'];
export const SHIFTS = ['Morning', 'Afternoon', 'Night'];
export const DOCUMENT_CATEGORIES = ['Method Statement', 'Site Visit Report', 'Progress Report', 'Drawing', 'Technical Specification'];
export const INSTRUMENT_TYPES = [
  'Pressure Gauge', 'Temperature Gauge', 'Ultrasonic Thickness Gauge', 'Torque Wrench', 'Multimeter', 'Coating Thickness Gauge', 'Gas Detector', 'Hardness Tester',
];
export const CALIBRATION_FREQUENCIES = ['Monthly', 'Quarterly', 'Six-Monthly', 'Annually', 'Two-Yearly'];
export const FREQUENCY_MONTHS = { Monthly: 1, Quarterly: 3, 'Six-Monthly': 6, Annually: 12, 'Two-Yearly': 24 };

export const PROJECT_STATUS_OPTIONS = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'completed', label: 'Completed' },
];

/** Next due date text (yyyy-mm-dd) for a calibration done on `date` at `frequency`; '' when either is unknown. */
export function nextDueText(date, frequency) {
  const months = FREQUENCY_MONTHS[frequency];
  if (!date || !months) return '';
  const [y, m, d] = String(date).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

/** A person's initials for the little avatar circles. */
export const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

export const sizeText = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round((bytes || 0) / 1024))}KB`);

/** 8.5 hours as "8h 30m", the way the timesheet table shows them. */
export function hoursMinutes(value) {
  const total = Math.round(Number(value || 0) * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** "28" style counts and hours for tiles. */
export const hoursText = (value) => `${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 1 })} hrs`;
