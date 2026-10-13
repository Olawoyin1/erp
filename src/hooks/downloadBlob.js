/** Saves a Blob (a file response fetched with `responseType: 'blob'`) through the browser's download flow. */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** File name from the response's Content-Disposition header, or `fallback`. */
export function filenameFromResponse(response, fallback) {
  const header = response?.headers?.['content-disposition'] || '';
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match ? match[1] : fallback;
}

/**
 * A blob request that fails comes back as a Blob, not JSON: read the server's message out of it.
 */
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

/** Builds and downloads a CSV from plain rows (used to export only the rows a user ticked). */
export function downloadCsv(filename, headers, rows) {
  const cell = (value) => {
    let text = value == null ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
  downloadBlob(new Blob([String.fromCharCode(0xfeff), csv], { type: 'text/csv;charset=utf-8' }), filename);
}
