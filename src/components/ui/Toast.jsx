import React, { useEffect, useState } from 'react';
import { FiCheck, FiAlertCircle, FiX } from 'react-icons/fi';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 18px',
        borderRadius: '8px',
        backgroundColor: type === 'error' ? '#FEF2F2' : type === 'info' ? '#EFF6FF' : '#F0FDF4',
        border: type === 'error' ? '1px solid #FECACA' : type === 'info' ? '1px solid #BFDBFE' : '1px solid #BBF7D0',
        color: type === 'error' ? '#991B1B' : type === 'info' ? '#1E40AF' : '#166534',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        fontFamily: 'var(--font)',
        fontSize: '0.85rem',
        fontWeight: 500,
        animation: 'slideInUp 0.25s ease',
      }}
    >
      {type === 'error' ? <FiAlertCircle size={17} /> : <FiCheck size={17} />}
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: 0,
          marginLeft: '8px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <FiX size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return { toast, showToast, hideToast };
}
