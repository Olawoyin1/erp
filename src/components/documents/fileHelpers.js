export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const UPLOAD_ACCEPT = '.pdf,.docx,.xlsx,.csv,.dwg,.png,.jpg,.jpeg';
export const UPLOAD_HINT = 'PDF, DOCX, XLSX, CSV, DWG, PNG, JPEG. up to 50MB';

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'csv', 'dwg', 'png', 'jpg', 'jpeg'];

/** Returns an error message for a file the API would refuse, or null when it is acceptable. */
export function validateUpload(file) {
  if (!file) return 'Please choose a file';
  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `${file.name}: unsupported file type. Allowed: PDF, DOCX, XLSX, CSV, DWG, PNG, JPEG`;
  }
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name}: file exceeds the 50MB limit`;
  if (file.size === 0) return `${file.name}: file is empty`;
  return null;
}

const MIME_BY_EXTENSION = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  dwg: 'image/vnd.dwg',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

/**
 * Browsers label CSV and DWG files inconsistently (or not at all) and the API checks the declared type,
 * so the declared type is set from the extension before the file is sent.
 */
export function normalizeUpload(file) {
  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  const mime = MIME_BY_EXTENSION[extension];
  if (!mime || file.type === mime) return file;
  return new File([file], file.name, { type: mime, lastModified: file.lastModified });
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Opens a presigned URL returned by the API (documents and task attachments are never proxied). */
export function openDownloadUrl(url) {
  if (!url) return;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Saves a `responseType: 'blob'` response (CSV export). */
export function saveBlob(response, fallbackName) {
  const disposition = response.headers?.['content-disposition'] || '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = match ? match[1] : fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** A blob error body still holds the API's JSON envelope; read the message out of it. */
export async function blobErrorMessage(err, fallback) {
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

/** Maps a 422 `details` array to `{ field: message }` so errors show against the right input. */
export function fieldErrors(err) {
  const details = err?.response?.data?.error?.details;
  if (!Array.isArray(details)) return {};
  return details.reduce((all, item) => (item.field && !all[item.field] ? { ...all, [item.field]: item.message } : all), {});
}

export function personName(person) {
  if (!person) return '—';
  if (typeof person === 'string') return person;
  const full = [person.firstName, person.lastName].filter(Boolean).join(' ');
  return person.fullName || full || person.email || '—';
}

export function displayDate(value) {
  if (!value) return '—';
  const text = String(value).slice(0, 10);
  const [year, month, day] = text.split('-');
  if (!year || !month || !day) return text;
  return `${day}/${month}/${year.slice(2)}`;
}

export function displayDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} • ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
