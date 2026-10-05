import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical } from 'react-icons/fi';
import { mockFixedAssets, mockOfficeSupplies } from '../../data/mockAdmin';

const conditionColor = { 'Good': '#15803D', 'Fair': '#B45309', 'Poor': '#DC2626', 'Excellent': '#2563EB' };
const conditionBg    = { 'Good': '#DCFCE7', 'Fair': '#FEF3C7', 'Poor': '#FEE2E2', 'Excellent': '#EFF6FF' };

const assetStatusStyle = {
  'Active':        { bg: '#DCFCE7', color: '#15803D' },
  'In Maintenance':{ bg: '#EFF6FF', color: '#1D4ED8' },
  'On Loan':       { bg: '#FEF9C3', color: '#854D0E' },
  'Retired':       { bg: '#F1F5F9', color: '#64748B' },
  'In Stock':      { bg: '#DCFCE7', color: '#15803D' },
  'Low Stock':     { bg: '#FEF3C7', color: '#B45309' },
  'Out of Stock':  { bg: '#FEE2E2', color: '#DC2626' },
};

const TableBase = ({ cols, rows, renderRow }) => (
  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <th style={{ width: 36, padding: '12px 16px' }}>
            <input type="checkbox" style={{ accentColor: '#1E3A5F' }} />
          </th>
          {cols.map(c => (
            <th key={c} style={{ padding: '12px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>{rows.map((r, i) => renderRow(r, i))}</tbody>
    </table>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #F1F5F9' }}>
      <span style={{ fontSize: '13px', color: '#64748B' }}>Page 1 of 8</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5, 6].map(p => (
          <button key={p} style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #E2E8F0', background: p === 1 ? '#1E3A5F' : '#fff', color: p === 1 ? '#fff' : '#374151', fontSize: '13px', cursor: 'pointer' }}>{p}</button>
        ))}
      </div>
    </div>
  </div>
);

export default function AssetSupplies() {
  const [tab, setTab] = useState('fixed');
  const [search, setSearch] = useState('');

  const tabStyle = (t) => ({
    padding: '10px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none',
    color: tab === t ? '#1D4ED8' : '#64748B',
    borderBottom: tab === t ? '2px solid #1D4ED8' : '2px solid transparent',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Assets & Supplies</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Track fixed assets and office supplies across all PGSL locations</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '20px', gap: '0' }}>
        <button style={tabStyle('fixed')} onClick={() => setTab('fixed')}>Fixed Assets</button>
        <button style={tabStyle('supplies')} onClick={() => setTab('supplies')}>Office Supplies</button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            placeholder={tab === 'fixed' ? 'Search by tag, name, custodian...' : 'Search by code, name...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiFilter size={15} /> Filter
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiDownload size={15} /> Export
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '8px', background: '#1E3A5F', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
            <FiPlus size={15} /> {tab === 'fixed' ? 'Register Asset' : 'Add Item'}
          </button>
        </div>
      </div>

      {tab === 'fixed' ? (
        <TableBase
          cols={['ASSET TAG', 'ASSET NAME', 'CATEGORY', 'CUSTODIAN', 'LOCATION', 'CONDITION', 'STATUS', 'ACTIONS']}
          rows={mockFixedAssets}
          renderRow={(r, i) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '12px 16px' }}><input type="checkbox" /></td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: '#3B82F6', fontWeight: 500 }}>{r.id}</td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: '#0F172A', fontWeight: 500, maxWidth: 180 }}>{r.name}</td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: '#64748B' }}>{r.category}</td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: '#0F172A' }}>{r.custodian}</td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: '#64748B' }}>{r.location}</td>
              <td style={{ padding: '12px 12px' }}>
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 600, background: conditionBg[r.condition] || '#F1F5F9', color: conditionColor[r.condition] || '#64748B' }}>{r.condition}</span>
              </td>
              <td style={{ padding: '12px 12px' }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: assetStatusStyle[r.status]?.bg || '#F1F5F9', color: assetStatusStyle[r.status]?.color || '#64748B' }}>{r.status}</span>
              </td>
              <td style={{ padding: '12px 12px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><FiEye size={16} /></button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><FiMoreVertical size={16} /></button>
                </div>
              </td>
            </tr>
          )}
        />
      ) : (
        <TableBase
          cols={['ITEM CODE', 'ITEM NAME', 'CATEGORY', 'UNIT', 'QTY', 'REORDER LEVEL', 'LOCATION', 'LAST RESTOCKED', 'STATUS', 'ACTIONS']}
          rows={mockOfficeSupplies}
          renderRow={(r, i) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '12px 16px' }}><input type="checkbox" /></td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: '#3B82F6', fontWeight: 500 }}>{r.id}</td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{r.name}</td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: '#64748B' }}>{r.category}</td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: '#64748B' }}>{r.unit}</td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: '#0F172A', fontWeight: 600 }}>{r.qty}</td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: r.qty <= r.reorderLevel ? '#DC2626' : '#64748B', fontWeight: r.qty <= r.reorderLevel ? 700 : 400 }}>{r.reorderLevel}</td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: '#64748B' }}>{r.location}</td>
              <td style={{ padding: '12px 12px', fontSize: '13px', color: '#64748B' }}>{r.lastRestocked}</td>
              <td style={{ padding: '12px 12px' }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: assetStatusStyle[r.status]?.bg || '#F1F5F9', color: assetStatusStyle[r.status]?.color || '#64748B' }}>{r.status}</span>
              </td>
              <td style={{ padding: '12px 12px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><FiEye size={16} /></button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><FiMoreVertical size={16} /></button>
                </div>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
