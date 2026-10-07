import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { FiMoreVertical } from 'react-icons/fi';
import { createPortal } from 'react-dom';

/**
 * Reusable kebab-menu dropdown for table rows.
 * items: [{ label, icon, action, color? }]
 */
export default function RowMenu({ items = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const menuRef = useRef();
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    // Also close on scroll to avoid detached menus
    window.addEventListener('scroll', () => setOpen(false), true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', () => setOpen(false), true);
    };
  }, []);

  useLayoutEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right - window.scrollX,
      });
    }
  }, [open]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <FiMoreVertical size={16} />
      </button>
      {open && createPortal(
        <div ref={menuRef} style={{
          position: 'absolute', right: pos.right, top: pos.top + 4,
          backgroundColor: '#fff', borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0',
          padding: '6px 0', zIndex: 9999, minWidth: '170px',
        }}>
          {items.map((item, i) => (
            <div
              key={i}
              onClick={(e) => { e.stopPropagation(); item.action(); setOpen(false); }}
              className="menu-item-hover"
              style={{
                padding: '8px 14px', fontSize: '13px',
                color: item.color || '#334155',
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {item.icon}{item.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
