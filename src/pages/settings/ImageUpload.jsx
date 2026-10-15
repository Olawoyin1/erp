import { useRef, useState } from 'react';
import { FiUpload, FiTrash2 } from 'react-icons/fi';
import { apiError } from '../../services/apiHelpers';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/png', 'image/jpeg'];

const buttonStyle = (disabled) => ({
  padding: '7px 16px',
  borderRadius: 6,
  border: '1px solid #E2E8F0',
  backgroundColor: '#FFFFFF',
  color: disabled ? '#94A3B8' : '#334155',
  fontSize: '0.813rem',
  fontWeight: 500,
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
});

export default function ImageUpload({ imageUrl, fallback, size = 56, rounded = true, canEdit = true, onUpload, onRemove, onChanged, showToast, hint, label = 'Upload Photo' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!TYPES.includes(file.type)) { setError('Choose a PNG or JPG image'); return; }
    if (file.size > MAX_BYTES) { setError('The image must be 5 MB or smaller'); return; }
    setBusy(true);
    setError('');
    try {
      await onUpload(file);
      showToast?.('Image updated', 'success');
      onChanged?.();
    } catch (err) {
      setError(apiError(err, 'Could not upload the image'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await onRemove();
      showToast?.('Image removed', 'success');
      onChanged?.();
    } catch (err) {
      setError(apiError(err, 'Could not remove the image'));
    } finally {
      setBusy(false);
    }
  };

  const frame = { width: size, height: size, borderRadius: rounded ? '50%' : 10, flexShrink: 0, overflow: 'hidden' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {imageUrl ? (
        <img src={imageUrl} alt="" style={{ ...frame, objectFit: 'cover', border: '1px solid #E2E8F0' }} />
      ) : (
        <div style={{ ...frame, backgroundColor: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: size > 50 ? '1rem' : '0.85rem', fontWeight: 700 }}>
          {fallback}
        </div>
      )}
      <div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg" onChange={pick} style={{ display: 'none' }} />
            <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} style={buttonStyle(busy)}>
              <FiUpload size={13} /> {busy ? 'Working…' : imageUrl ? 'Replace' : label}
            </button>
            {imageUrl && (
              <button type="button" disabled={busy} onClick={remove} style={{ ...buttonStyle(busy), color: busy ? '#94A3B8' : '#B91C1C' }}>
                <FiTrash2 size={13} /> Remove
              </button>
            )}
          </div>
        )}
        <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: error ? '#B91C1C' : '#94A3B8' }}>{error || hint || 'PNG or JPG, up to 5 MB.'}</p>
      </div>
    </div>
  );
}
