import { useEffect, useState } from 'react';
import { koboToNaira } from '../../../hooks/useKobo';
import { apiError } from '../../../services/apiHelpers';

/** Field-level messages from a failed request payload (`{ details: [{ field, message }] }`), keyed by the first path segment. */
export function fieldErrorsOf(payload) {
  const errors = {};
  (payload?.details || []).forEach((d) => {
    const key = String(d.field || '').split('.')[0];
    if (key && !errors[key]) errors[key] = d.message;
  });
  return errors;
}

/** Messages for one array row of a failed payload: `rowErrorsOf(payload, 'materialServiceSpecification')[0] -> { unitPrice: '...' }`. */
export function rowErrorsOf(payload, listField) {
  const rows = {};
  (payload?.details || []).forEach((d) => {
    const parts = String(d.field || '').split('.');
    if (parts[0] !== listField || parts.length < 3) return;
    const index = Number(parts[1]);
    rows[index] = { ...(rows[index] || {}), [parts[2]]: d.message };
  });
  return rows;
}

const LABELS = {
  pending_approval: 'Pending Approval',
  converted_to_rfq: 'Converted to RFQ',
  under_evaluation: 'Under Evaluation',
  in_production: 'In Production',
  ready_for_shipment: 'Ready for Shipment',
  customs_clearance: 'Customs Clearance',
  in_transit: 'In Transit',
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

export function statusLabel(status) {
  if (!status) return '—';
  return LABELS[status] || String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const countFilters = (filters) => Object.values(filters).filter((v) => v !== '' && v != null).length;

export const ymd = (value) => (value ? String(value).slice(0, 10) : '');
export const today = () => new Date().toISOString().slice(0, 10);

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export function money(kobo, currency = 'NGN') {
  if (kobo == null || Number.isNaN(Number(kobo))) return '—';
  try {
    return koboToNaira(Number(kobo), { currency: currency || 'NGN' });
  } catch {
    return koboToNaira(Number(kobo));
  }
}

export function compactMoney(kobo) {
  if (kobo == null || Number.isNaN(Number(kobo))) return '—';
  const naira = Number(kobo) / 100;
  const abs = Math.abs(naira);
  const sign = naira < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}₦${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}₦${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}₦${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₦${abs.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

/** Naira text typed by a user ("1,250,000.50") to whole kobo; NaN when it is not a valid amount. */
export function toKobo(text) {
  if (text == null || text === '') return NaN;
  const cleaned = String(text).replace(/,/g, '').trim();
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return NaN;
  return Math.round(parseFloat(cleaned) * 100);
}

/** Whole kobo to the plain naira text an input shows ("1250000.50"). */
export function fromKobo(kobo) {
  if (kobo == null || kobo === '') return '';
  const naira = Number(kobo) / 100;
  return Number.isInteger(naira) ? String(naira) : naira.toFixed(2);
}

/** `stats` is `[{ key, label, value, change? }]`; missing keys read as 0. */
export function statValue(stats, key) {
  const row = (stats || []).find((s) => s.key === key);
  return row ? row.value : 0;
}

export function statChange(stats, key) {
  const row = (stats || []).find((s) => s.key === key);
  return row && row.change != null ? row.change : null;
}

/** The populated ref's display name, or the plain value when it is only an id string. */
export function refName(ref, field) {
  if (!ref) return '—';
  if (typeof ref === 'string') return ref;
  return ref[field] || '—';
}

export const refId = (ref) => (ref && typeof ref === 'object' ? ref._id : ref) || '';

export function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function filenameFromResponse(res, fallback) {
  const header = res?.headers?.['content-disposition'] || '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match ? decodeURIComponent(match[1]) : fallback;
}

/** With `responseType: 'blob'` an error body arrives as a Blob of JSON; read the server's message out of it. */
export async function blobErrorMessage(err, fallback = 'Download failed') {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      return parsed?.error?.message || fallback;
    } catch {
      return fallback;
    }
  }
  return apiError(err, fallback);
}

/** Runs a blob request and saves the file; resolves with an error message or null. */
export async function downloadFile(request, fallbackName) {
  try {
    const res = await request();
    saveBlob(res.data, filenameFromResponse(res, fallbackName));
    return null;
  } catch (err) {
    return blobErrorMessage(err);
  }
}

const csvCell = (value) => {
  const text = value == null ? '' : String(value);
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
};

/** Writes the given rows as a CSV file; `columns`: [{ label, value: (row) => string | number }]. */
export function saveRowsCsv(rows, columns, filename) {
  const lines = [columns.map((c) => csvCell(c.label)).join(',')];
  rows.forEach((row) => lines.push(columns.map((c) => csvCell(c.value(row))).join(',')));
  saveBlob(new Blob([String.fromCharCode(0xfeff), lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), filename);
}

/** Kobo amount as naira text with two decimals for a CSV cell. */
export const csvMoney = (kobo) => (kobo == null ? '' : (Number(kobo) / 100).toFixed(2));

/** Uploads staged files to a record; resolves with the names that failed, with the server's reason. */
export async function uploadStagedFiles(api, id, files) {
  const failed = [];
  for (const file of files) {
    try {
      await api.uploadAttachment(id, file);
    } catch (err) {
      failed.push(`${file.name} (${apiError(err, 'upload failed')})`);
    }
  }
  return failed;
}

/** Positive quantity text to a number; NaN when it is not a valid positive amount. */
export function toQuantity(text) {
  if (text == null || text === '') return NaN;
  const n = Number(String(text).replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

/** `{ value, label }` options out of a lookup list. */
export const toOptions = (rows, label) => (rows || []).map((r) => ({ value: r._id, label: typeof label === 'function' ? label(r) : r[label] }));

export const PRIORITIES = ['Low', 'Medium', 'High', 'Hot'];
export const CATEGORIES = ['Materials', 'Equipment', 'Services', 'PPE', 'Spare Parts', 'Office Supplies', 'IT Equipment', 'Consumables'];
export const UNITS = ['Pieces', 'Tonnes', 'Units', 'Sets', 'Litres', 'Bags', 'Lots', 'Metres', 'Kilograms', 'Cartons', 'Rolls'];
