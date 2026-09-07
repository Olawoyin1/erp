import React from 'react';
import CustomSelect from './Select';
import CustomDatePicker from './DatePicker';
import CustomFileUpload from './FileUpload';

/**
 * Standardized FormField wrapper with uppercase label, optional required asterisk, error text, and help hint.
 */
export function FormField({ label, required, error, helpText, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      {label && (
        <label
          style={{
            fontSize: '0.688rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            color: error ? '#DC2626' : '#475569',
            fontFamily: 'var(--font)',
          }}
        >
          {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
        </label>
      )}
      {children}
      {error && <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 500 }}>{error}</span>}
      {helpText && !error && <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{helpText}</span>}
    </div>
  );
}

export function Input({ error, style, ...props }) {
  return (
    <input
      style={{
        width: '100%',
        padding: '10px 14px',
        fontSize: '0.85rem',
        fontFamily: 'var(--font)',
        borderRadius: '6px',
        border: error ? '1px solid #DC2626' : '1px solid #E2E8F0',
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
        outline: 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
        boxSizing: 'border-box',
        ...style,
      }}
      onFocus={(e) => {
        e.target.style.backgroundColor = '#FFFFFF';
        e.target.style.borderColor = '#1D4ED8';
        e.target.style.boxShadow = '0 0 0 3px rgba(29, 78, 216, 0.12)';
      }}
      onBlur={(e) => {
        e.target.style.backgroundColor = '#F8FAFC';
        e.target.style.borderColor = error ? '#DC2626' : '#E2E8F0';
        e.target.style.boxShadow = 'none';
      }}
      {...props}
    />
  );
}

// Re-export customized Select dropdown
export const Select = CustomSelect;

// Re-export customized DatePicker calendar input
export const DatePicker = CustomDatePicker;

// Re-export customized FileUpload component
export const FileUpload = CustomFileUpload;

export function Textarea({ error, style, rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      style={{
        width: '100%',
        padding: '10px 14px',
        fontSize: '0.85rem',
        fontFamily: 'var(--font)',
        borderRadius: '6px',
        border: error ? '1px solid #DC2626' : '1px solid #E2E8F0',
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
        outline: 'none',
        resize: 'vertical',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
        boxSizing: 'border-box',
        ...style,
      }}
      onFocus={(e) => {
        e.target.style.backgroundColor = '#FFFFFF';
        e.target.style.borderColor = '#1D4ED8';
        e.target.style.boxShadow = '0 0 0 3px rgba(29, 78, 216, 0.12)';
      }}
      onBlur={(e) => {
        e.target.style.backgroundColor = '#F8FAFC';
        e.target.style.borderColor = error ? '#DC2626' : '#E2E8F0';
        e.target.style.boxShadow = 'none';
      }}
      {...props}
    />
  );
}

