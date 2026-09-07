import React, { useRef } from 'react';
import { FiCalendar } from 'react-icons/fi';

/**
 * Reusable DatePicker / Calendar Input Component
 * Hides native browser calendar icon and renders a single custom FiCalendar icon.
 */
export default function DatePicker({
  value = '',
  onChange,
  placeholder = 'Select date',
  min,
  max,
  disabled = false,
  error = false,
  style = {},
  className = '',
  ...props
}) {
  const inputRef = useRef(null);

  const handleIconClick = () => {
    if (inputRef.current && !disabled) {
      if (typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        fontFamily: 'var(--font)',
        ...style,
      }}
    >
      {/* Suppress native browser calendar icon */}
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
          pointer-events: none;
        }
        input[type="date"]::-webkit-inner-spin-button,
        input[type="date"]::-webkit-clear-button {
          display: none;
        }
      `}</style>

      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 40px 10px 14px',
          fontSize: '0.85rem',
          fontFamily: 'var(--font)',
          fontWeight: 500,
          borderRadius: '8px',
          border: error ? '1.5px solid #DC2626' : '1px solid #E2E8F0',
          backgroundColor: disabled ? '#F1F5F9' : '#F8FAFC',
          color: value ? '#0F172A' : '#94A3B8',
          outline: 'none',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.backgroundColor = '#FFFFFF';
            e.target.style.borderColor = '#1D4ED8';
            e.target.style.boxShadow = '0 0 0 3px rgba(29, 78, 216, 0.12)';
          }
        }}
        onBlur={(e) => {
          e.target.style.backgroundColor = '#F8FAFC';
          e.target.style.borderColor = error ? '#DC2626' : '#E2E8F0';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />

      {/* Custom calendar icon — single, no native duplicate */}
      <button
        type="button"
        onClick={handleIconClick}
        disabled={disabled}
        tabIndex={-1}
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: '#64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        <FiCalendar size={16} />
      </button>
    </div>
  );
}
