import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck, FiSearch, FiX } from 'react-icons/fi';

/**
 * Custom Select Dropdown component used across all pages
 * Replaces native HTML <select> with a sleek, accessible, styled dropdown.
 */
export default function Select({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  error = false,
  searchable = false,
  style = {},
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Normalize options array
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options if searchable
  const filteredOptions = searchable && searchTerm
    ? normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : normalizedOptions;

  const handleSelect = (optionValue) => {
    if (onChange) {
      // Pass synthetic event format or direct value
      onChange({ target: { value: optionValue } });
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        fontFamily: 'var(--font)',
        ...style,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          fontSize: '0.85rem',
          fontFamily: 'var(--font)',
          fontWeight: 500,
          borderRadius: '8px',
          border: error ? '1.5px solid #DC2626' : isOpen ? '1.5px solid #1D4ED8' : '1px solid #E2E8F0',
          backgroundColor: disabled ? '#F1F5F9' : isOpen ? '#FFFFFF' : '#F8FAFC',
          color: selectedOption ? '#0F172A' : '#94A3B8',
          boxShadow: isOpen ? '0 0 0 3px rgba(29, 78, 216, 0.12)' : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown
          size={16}
          style={{
            color: isOpen ? '#1D4ED8' : '#64748B',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
            marginLeft: '8px',
          }}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden',
            animation: 'slideInUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Header if searchable */}
          {searchable && (
            <div
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#F8FAFC',
              }}
            >
              <FiSearch size={14} style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '0.813rem',
                  fontFamily: 'var(--font)',
                  color: '#0F172A',
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          )}

          {/* Options Scroll List */}
          <div
            style={{
              overflowY: 'auto',
              padding: '6px',
              flex: 1,
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: '12px 14px',
                  fontSize: '0.813rem',
                  color: '#94A3B8',
                  textAlign: 'center',
                }}
              >
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      padding: '9px 12px',
                      fontSize: '0.84rem',
                      borderRadius: '6px',
                      color: isSelected ? '#1D4ED8' : '#1E293B',
                      fontWeight: isSelected ? 600 : 400,
                      backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <FiCheck size={16} style={{ color: '#1D4ED8' }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
