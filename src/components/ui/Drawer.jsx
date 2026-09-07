import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Reusable Right-Side Slide-Over Drawer component
 * Used for right-aligned form panels (Register Personnel, Edit Credentials, Filters, etc.)
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = '520px',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(2px)',
          transition: 'opacity 0.25s ease',
          zIndex: 1000,
        }}
      />

      {/* Slide-over Drawer Panel */}
      <div
        style={{
          position: 'relative',
          zIndex: 1001,
          width: '100%',
          maxWidth: width,
          height: '100vh',
          backgroundColor: '#FFFFFF',
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h2>
            {subtitle && (
              <p style={{ fontSize: '0.813rem', color: '#64748B', margin: '4px 0 0 0' }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#F1F5F9',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E2E8F0';
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.color = '#64748B';
            }}
            title="Close drawer"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>{children}</div>

        {/* Drawer Footer */}
        {footer && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#FAFAFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
