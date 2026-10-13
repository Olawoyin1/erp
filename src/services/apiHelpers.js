/** Unwrap `data` from the standard API envelope. */
export const unwrap = (res) => res?.data?.data;

/** Unwrap a paginated list: `{ data, meta }`. */
export const unwrapList = (res) => ({
  data: res?.data?.data || [],
  meta: res?.data?.meta || null,
});

/** Human-readable API error message. */
export const apiError = (err, fallback = 'Request failed') =>
  err?.response?.data?.error?.message || fallback;

/** Display a populated ref (object or string). */
export const populatedName = (v) => {
  if (v == null || v === '') return '—';
  if (typeof v === 'string') return v;
  return (
    v.fullName ||
    v.name ||
    v.clientName ||
    v.assetName ||
    v.itemName ||
    v.projectName ||
    v.title ||
    [v.firstName, v.lastName].filter(Boolean).join(' ') ||
    v.email ||
    '—'
  );
};

export const formatDate = (v) => {
  if (!v) return '—';
  return String(v).slice(0, 10);
};

export const titleCase = (s) => {
  if (s == null || s === '') return '—';
  return String(s)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const idempotencyHeaders = () => ({
  headers: { 'Idempotency-Key': crypto.randomUUID() },
});
