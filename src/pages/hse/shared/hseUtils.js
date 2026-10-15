import { apiError } from '../../../services/apiHelpers';

/**
 * Opens a signed download link: `request()` resolves with the API response whose `data.data.url` is the link.
 * Resolves with an error message or null.
 */
export async function openSignedDownload(request) {
  try {
    const res = await request();
    const url = res.data?.data?.url;
    if (!url) return 'The server did not return a download link';
    window.open(url, '_blank', 'noopener');
    return null;
  } catch (err) {
    return apiError(err, 'Download failed');
  }
}

/** Subject files from the API (`{ id, fileName, sizeBytes, kind }`) as FileList rows. */
export const toFileRows = (files) => (files || []).map((f) => ({ id: f.id, name: f.fileName, size: f.sizeBytes, kind: f.kind }));

/** Generic attachment rows (`{ _id, originalName, sizeBytes }`) as FileList rows. */
export const toAttachmentRows = (items) => (items || []).map((a) => ({ id: a._id, name: a.originalName, size: a.sizeBytes }));

/** The name of a populated reference (`{ fullName | name | ... }`) or an em dash. */
export const nameOf = (ref, ...fields) => {
  if (!ref) return '—';
  if (typeof ref === 'string') return ref;
  for (const field of [...fields, 'fullName', 'name']) if (ref[field]) return ref[field];
  return '—';
};

export const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref) || '';
