import { useState } from 'react';
import { FiPaperclip, FiDownload } from 'react-icons/fi';

const sizeText = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round((bytes || 0) / 1024))}KB`);

/**
 * The "Attached documents" panel of a View drawer. `files`: [{ id, name, size, kind? }] (already normalised by the caller);
 * `download(file)` resolves with an error message or null. `kinds` maps a file kind to a small label.
 */
export function FileList({ title = 'Attached documents', files, download, kinds, empty = 'No documents attached.' }) {
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  const run = async (file) => {
    setBusyId(file.id);
    setMessage('');
    const problem = await download(file);
    setBusyId('');
    if (problem) setMessage(problem);
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>{title}</div>
      {files.length === 0 && <span style={{ fontSize: '0.84rem', color: '#94A3B8' }}>{empty}</span>}
      {files.map((file) => (
        <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', borderRadius: 8, padding: '10px 14px', fontSize: '0.84rem', color: '#334155' }}>
          <FiPaperclip size={14} color="#64748B" />
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name} ({sizeText(file.size)}){kinds && file.kind && kinds[file.kind] ? <span style={{ color: '#94A3B8' }}> • {kinds[file.kind]}</span> : null}
          </span>
          <button type="button" aria-label={`Download ${file.name}`} disabled={busyId === file.id} onClick={() => run(file)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', display: 'flex' }}>
            <FiDownload size={16} />
          </button>
        </div>
      ))}
      {message && <span style={{ fontSize: '0.78rem', color: '#991B1B' }}>{message}</span>}
    </div>
  );
}
