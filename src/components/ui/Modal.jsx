import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Modern shadcn-inspired Modal / Dialog component
 * Features backdrop blur, smooth pop animation, accessible keyboard Escape handling,
 * and a prominent top-right close icon button.
 */
export default function Modal({
  isOpen = true,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '520px',
  showCloseButton = true,
  style = {},
}) {
  // Handle ESC key press & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'var(--font)',
      }}
    >
      {/* Backdrop with Blur */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.15s ease-out',
          zIndex: 1100,
        }}
      />

      {/* Dialog Card (shadcn style) */}
      <div
        style={{
          position: 'relative',
          zIndex: 1101,
          width: '100%',
          maxWidth: maxWidth,
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
          animation: 'slideInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          ...style,
        }}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div
            style={{
              padding: '20px 24px 16px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              backgroundColor: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            <div>
              {title && (
                <h2
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p
                  style={{
                    fontSize: '0.813rem',
                    color: '#64748B',
                    margin: '4px 0 0 0',
                    lineHeight: 1.4,
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {/* Top-Right Close Button */}
            {showCloseButton && (
              <button
                onClick={onClose}
                type="button"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
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
                title="Close modal"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            color: '#334155',
            fontSize: '0.875rem',
          }}
        >
          {children}
        </div>

        {/* Modal Footer */}
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
