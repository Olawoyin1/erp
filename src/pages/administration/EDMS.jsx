import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye, FiMoreVertical } from 'react-icons/fi';
import { mockEDMS } from '../../data/mockAdmin';

const statusStyle = {
  'Approved':    { background: '#DCFCE7', color: '#15803D' },
  'Checked Out': { background: '#EFF6FF', color: '#1D4ED8' },
  'Archived':    { background: '#F1F5F9', color: '#64748B' },
  'Draft':       { background: '#FEF3C7', color: '#B45309' },
};

export default function EDMS() {
  const [search, setSearch] = useState('');
  const filtered = mockEDMS.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Document Management (EDMS)</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Centralised register of controlled documents across all PGSL sites</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            placeholder="Search by doc no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', background: '#fff', color: '#0F172A', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>
            <FiFilter size={15} /> Filter
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>
            <FiDownload size={15} /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['DOC NO', 'DOC TITLE', 'DEPARTMENT', 'VERSION', 'STATUS', 'LAST MODIFIED', 'OWNER', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, i) => (
              <tr key={doc.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#3B82F6', fontWeight: 500 }}>{doc.id}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0F172A', fontWeight: 500, maxWidth: '260px' }}>{doc.title}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{doc.department}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{doc.version}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, ...( statusStyle[doc.status] || { background: '#F1F5F9', color: '#64748B' } ) }}>
                    {doc.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{doc.lastModified}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0F172A' }}>{doc.owner}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}><FiEye size={16} /></button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}><FiDownload size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>Page 1 of 8</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5, 6].map(p => (
              <button key={p} style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #E2E8F0', background: p === 1 ? '#1E3A5F' : '#fff', color: p === 1 ? '#fff' : '#374151', fontSize: '13px', cursor: 'pointer', fontWeight: p === 1 ? 600 : 400 }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
