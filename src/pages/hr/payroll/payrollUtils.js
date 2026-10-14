import { nairaToKobo, koboToNaira } from '../../../hooks/useKobo';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

export const money = (kobo) => koboToNaira(kobo);

/** Kobo to the plain number string an input should show (no currency symbol, no grouping). */
export const koboToInput = (kobo) => (kobo == null ? '' : String(Math.round(kobo) / 100));

const NAIRA_PATTERN = /^\d+(\.\d{1,2})?$/;

/** Validates a naira input and returns whole kobo, or null when it is not a valid non-negative amount. */
export function parseNaira(value) {
  const text = String(value ?? '').trim();
  if (text === '') return 0;
  if (!NAIRA_PATTERN.test(text)) return null;
  return nairaToKobo(text);
}

/** Maps `details[]` of a 422 to `{ field: message }`. */
export function fieldErrors(err) {
  const out = {};
  (err?.details || []).forEach((d) => {
    if (d?.field && !out[d.field]) out[d.field] = d.message;
  });
  return out;
}

export function periodLabel(month, year) {
  return `${MONTHS_SHORT[(month || 1) - 1]} ${year}`;
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

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const SCALES = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

function belowThousand(n) {
  const parts = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
    if (n) parts.push('and');
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ''));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(' ');
}

function integerWords(n) {
  if (n === 0) return 'Zero';
  const groups = [];
  let scale = 0;
  while (n > 0) {
    const chunk = n % 1000;
    if (chunk) groups.unshift(`${belowThousand(chunk)}${SCALES[scale] ? ` ${SCALES[scale]}` : ''}`);
    n = Math.floor(n / 1000);
    scale += 1;
  }
  return groups.join(' ');
}

/** 450000000 kobo -> "Four Million Five Hundred Thousand Naira Only". */
export function koboInWords(kobo) {
  const total = Math.round(Number(kobo) || 0);
  const naira = Math.floor(total / 100);
  const k = total % 100;
  let words = `${integerWords(naira)} Naira`;
  if (k) words += ` and ${integerWords(k)} Kobo`;
  return `${words} Only`;
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** `columns` is [{ label, value: (row) => cell }]. */
export function exportCsv(filename, columns, rows) {
  const lines = [columns.map((c) => csvCell(c.label)).join(',')];
  rows.forEach((row) => lines.push(columns.map((c) => csvCell(c.value(row))).join(',')));
  const body = `\uFEFF${lines.join('\r\n')}`;
  saveBlob(new Blob([body], { type: 'text/csv;charset=utf-8' }), filename);
}

/** Reads every page of a paginated list (the API caps a page at 100) for an export. */
export async function fetchAllPages(fetchPage, maxPages = 50) {
  const rows = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const res = await fetchPage({ page, limit: 100 });
    rows.push(...(res.data.data || []));
    if (page >= (res.data.meta?.totalPages || 1)) break;
  }
  return rows;
}

export const grossOf = (s) =>
  (s.basicSalary || 0) + (s.housingAllowance || 0) + (s.transportAllowance || 0) +
  (s.utilityAllowance || 0) + (s.communicationAllowance || 0) + (s.otherAllowances || 0);

export const allowancesOf = (s) => grossOf(s) - (s.basicSalary || 0);

export const idOf = (v) => (v && typeof v === 'object' ? v._id || v.id : v);

export const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#fff', borderRadius: 6, fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '0.85rem' };
export const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' };

export const STATUS_PILL = {
  active: { bg: '#DCFCE7', color: '#166534', label: 'Active' },
  inactive: { bg: '#FEE2E2', color: '#991B1B', label: 'Inactive' },
  pending_approval: { bg: '#FFEDD5', color: '#C2410C', label: 'Pending Approval' },
  paid: { bg: '#DCFCE7', color: '#166534', label: 'Paid' },
  rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
};

