import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * Pixel-faithful Pagination component matching ERP screenshots
 * Features:
 * - "Page X of Y" label on left
 * - Circular active page pill (#EFF6FF / #1D4ED8)
 * - Muted number buttons with hover highlights
 * - Solid royal blue circular prev/next navigation buttons (#1D4ED8)
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  style = {},
  className = '',
}) {
  const getPages = () => {
    const maxVisible = 6;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    // Generate window around currentPage
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    const list = [];
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  };

  const pages = getPages();

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '16px 0 8px 0',
        fontFamily: 'var(--font)',
        ...style,
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: '0.813rem',
          color: '#64748B',
          fontWeight: 500,
          marginRight: '8px',
          whiteSpace: 'nowrap',
        }}
      >
        Page {currentPage} of {totalPages}
      </span>

      {/* Page Numbers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {pages.map((page) => {
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                color: isActive ? '#1D4ED8' : '#64748B',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.813rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'var(--font)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#F1F5F9';
                  e.currentTarget.style.color = '#0F172A';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#64748B';
                }
              }}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Nav Buttons (Circular Blue) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
        {/* Prev */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#1D4ED8',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage <= 1 ? 0.4 : 1,
            transition: 'all 0.15s ease',
            boxShadow: currentPage <= 1 ? 'none' : '0 2px 4px rgba(29, 78, 216, 0.2)',
          }}
          onMouseEnter={(e) => {
            if (currentPage > 1) e.currentTarget.style.backgroundColor = '#1E40AF';
          }}
          onMouseLeave={(e) => {
            if (currentPage > 1) e.currentTarget.style.backgroundColor = '#1D4ED8';
          }}
          aria-label="Previous page"
        >
          <FiChevronLeft size={16} color="#FFFFFF" />
        </button>

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#1D4ED8',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage >= totalPages ? 0.4 : 1,
            transition: 'all 0.15s ease',
            boxShadow: currentPage >= totalPages ? 'none' : '0 2px 4px rgba(29, 78, 216, 0.2)',
          }}
          onMouseEnter={(e) => {
            if (currentPage < totalPages) e.currentTarget.style.backgroundColor = '#1E40AF';
          }}
          onMouseLeave={(e) => {
            if (currentPage < totalPages) e.currentTarget.style.backgroundColor = '#1D4ED8';
          }}
          aria-label="Next page"
        >
          <FiChevronRight size={16} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
}
