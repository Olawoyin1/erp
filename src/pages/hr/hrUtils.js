import { apiError } from '../../services/apiHelpers';

/** `{ field: message }` from the `details[]` of a 422, whether given an axios error or a rejected thunk payload. */
export function fieldErrorsOf(errOrDetails) {
  const details = Array.isArray(errOrDetails)
    ? errOrDetails
    : errOrDetails?.response?.data?.error?.details || errOrDetails?.details || [];
  const out = {};
  details.forEach((d) => {
    if (d?.field && !out[d.field]) out[d.field] = d.message;
  });
  return out;
}

/** The server's message plus any per-field errors, from an axios error. */
export function errorInfo(err, fallback) {
  const body = err?.response?.data?.error;
  return {
    message: apiError(err, fallback),
    code: body?.code,
    status: err?.response?.status,
    details: body?.details || [],
    fields: fieldErrorsOf(err),
  };
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

export function filenameFromResponse(res, fallback) {
  const header = res?.headers?.['content-disposition'] || '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match ? decodeURIComponent(match[1]) : fallback;
}

/** Downloads the result of an axios `responseType: 'blob'` call; resolves true on success. */
export async function downloadFromResponse(res, fallbackName) {
  saveBlob(res.data, filenameFromResponse(res, fallbackName));
  return true;
}

export function fullName(person) {
  if (!person) return '—';
  if (typeof person === 'string') return person;
  return person.fullName || [person.firstName, person.lastName].filter(Boolean).join(' ') || person.name || '—';
}

export const ymd = (value) => (value ? String(value).slice(0, 10) : '');
