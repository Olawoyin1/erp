import React from 'react';

/**
 * Reusable Enterprise Base DataTable component
 *
 * Props:
 * - columns: Array of column definitions [{ key, label, render, align }]
 * - data: Array of data objects
 * - selectable: boolean (show select checkboxes)
 * - selectedIds: Array of selected row IDs
 * - onSelectRow: (id) => void
 * - onSelectAll: () => void
 * - keyField: string (default 'id')
 * - emptyMessage: string
 */
export default function DataTable({
  columns = [],
  data = [],
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  keyField = 'id',
  emptyMessage = 'No records found matching criteria.',
  onRowClick,
}) {
  const allSelected = data.length > 0 && data.every((row) => selectedIds.includes(row[keyField]));

  return (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem', fontFamily: 'var(--font)' }}>
        <thead>
          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
            {selectable && (
              <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#1D4ED8' }}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '12px 14px',
                  color: '#64748B',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textAlign: col.align || 'left',
                  whiteSpace: 'nowrap',
                  ...col.headerStyle,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => {
              const rowId = row[keyField] || rowIndex;
              const isSelected = selectedIds.includes(rowId);

              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{
                    borderBottom: rowIndex === data.length - 1 ? 'none' : '1px solid #F1F5F9',
                    backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  {selectable && (
                    <td
                      style={{ padding: '12px 14px', textAlign: 'center' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow && onSelectRow(rowId)}
                        style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#1D4ED8' }}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '12px 14px',
                        color: '#1E293B',
                        textAlign: col.align || 'left',
                        whiteSpace: col.nowrap ? 'nowrap' : 'normal',
                        ...col.cellStyle,
                      }}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📂</div>
                <div style={{ fontWeight: 500, color: '#64748B' }}>{emptyMessage}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
