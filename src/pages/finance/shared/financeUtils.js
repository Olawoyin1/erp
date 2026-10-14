import { useEffect, useState } from 'react';
import { koboToNaira } from '../../../hooks/useKobo';
import { apiError } from '../../../services/apiHelpers';

/** Field-level messages from a failed request payload (`{ details: [{ field, message }] }`). */
export function fieldErrorsOf(payload) {
  const errors = {};
  (payload?.details || []).forEach((d) => {
    const key = String(d.field || '').split('.')[0];
    if (key && !errors[key]) errors[key] = d.message;
  });
  return errors;
}

export const STATUS_LABEL = {
  pending_approval: 'Pending Approval', partially_paid: 'Partially Paid', under_review: 'Under Review',
  pending_filing: 'Pending Filing', in_progress: 'In Progress', expiring_soon: 'Expiring Soon',
};

export function statusLabel(status) {
  if (!status) return '—';
  return STATUS_LABEL[status] || String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const countFilters = (filters) => Object.values(filters).filter((v) => v !== '' && v != null).length;

export const ymd =(value) => (value ? String(value).slice(0, 10) : '');
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

/** Whole kobo to a display string in the document's currency. */
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
  if (!/^-?\d+(\.\d{0,2})?$/.test(cleaned)) return NaN;
  return Math.round(parseFloat(cleaned) * 100);
}

/** Whole kobo to the plain naira text an input shows ("1250000.50"). */
export function fromKobo(kobo) {
  if (kobo == null || kobo === '') return '';
  const naira = Number(kobo) / 100;
  return Number.isInteger(naira) ? String(naira) : naira.toFixed(2);
}

/** `stats` is `[{ key, label, value }]`; missing keys read as 0. */
export function statValue(stats, key) {
  const row = (stats || []).find((s) => s.key === key);
  return row ? row.value : 0;
}

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
  return err?.response?.data?.error?.message || fallback;
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

/**
 * Exports every row matching the current filters as CSV: pages through `fetchPage(page)` (100 per page,
 * at most 100 pages) and writes naira amounts with two decimals.
 * `columns`: [{ label, value: (row) => string | number }].
 */
export async function exportRowsCsv({ filename, columns, fetchPage }) {
  const rows = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 100) {
    const res = await fetchPage(page);
    rows.push(...(res.data?.data || []));
    totalPages = res.data?.meta?.totalPages || 1;
    page += 1;
  }
  const lines = [columns.map((c) => csvCell(c.label)).join(',')];
  rows.forEach((row) => lines.push(columns.map((c) => csvCell(c.value(row))).join(',')));
  saveBlob(new Blob([String.fromCharCode(0xfeff), lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), filename);
  return rows.length;
}

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

/** Kobo amount as naira text with two decimals for a CSV cell. */
export const csvMoney = (kobo) => (kobo == null ? '' : (Number(kobo) / 100).toFixed(2));
