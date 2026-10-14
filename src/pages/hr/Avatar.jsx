const initialsOf = (name) => String(name || '').split(' ').filter(Boolean).map((n) => n[0]).join('').substring(0, 2).toUpperCase() || '?';

/** Round photo or initials. */
export default function Avatar({ name, url, size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#334155', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: size * 0.34, flexShrink: 0 }}>
      {url ? <img src={url} alt={name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initialsOf(name)}
    </div>
  );
}
