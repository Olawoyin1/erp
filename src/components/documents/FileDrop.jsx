import { useRef, useState } from 'react';
import { FiUpload, FiPaperclip, FiX } from 'react-icons/fi';
import { UPLOAD_ACCEPT, UPLOAD_HINT, formatFileSize, normalizeUpload, validateUpload } from './fileHelpers';

/**
 * Drop zone matching the designs ("Drop file here or click to browse"). `files` is the picked list;
 * `multiple` controls whether picking replaces it or appends. Invalid files are reported through `onError`.
 */
export default function FileDrop({ files = [], onChange, onError, multiple = false, disabled = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const accept = (picked) => {
    const list = Array.from(picked || []);
    const good = [];
    for (const file of list) {
      const problem = validateUpload(file);
      if (problem) onError?.(problem);
      else good.push(normalizeUpload(file));
    }
    if (!good.length) return;
    onChange(multiple ? [...files, ...good] : [good[0]]);
  };

  const remove = (index) => onChange(files.filter((_, i) => i !== index));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) accept(e.dataTransfer.files); }}
        style={{
          border: `1px dashed ${dragging ? '#1D4ED8' : '#CBD5E1'}`, borderRadius: 8, padding: 24, textAlign: 'center',
          backgroundColor: dragging ? '#EFF6FF' : '#F8FAFC', cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: disabled ? 0.6 : 1,
        }}
      >
        <FiUpload size={20} color="#64748B" />
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Drop file here or click to browse</div>
        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{UPLOAD_HINT}</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(e) => { accept(e.target.files); e.target.value = ''; }}
      />
      {files.map((file, index) => (
        <div key={`${file.name}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#fff' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.813rem', color: '#334155', minWidth: 0 }}>
            <FiPaperclip size={14} color="#64748B" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name} ({formatFileSize(file.size)})</span>
          </span>
          <button type="button" onClick={() => remove(index)} title="Remove" style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex' }}>
            <FiX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
