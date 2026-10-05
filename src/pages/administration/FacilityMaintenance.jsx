import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical } from 'react-icons/fi';
import { mockFacilityMaintenance } from '../../data/mockAdmin';

const typeStyle = {
  'Preventive': { bg: '#EFF6FF', color: '#1D4ED8' },
  'Corrective': { bg: '#FEF3C7', color: '#B45309' },
};

const statusStyle = {
  'Scheduled':  { bg: '#EFF6FF', color: '#1D4ED8' },
  'In Progress':{ bg: '#FEF9C3', color: '#854D0E' },
  'Completed':  { bg: '#DCFCE7', color: '#15803D' },
  'Overdue':    { bg: '#FEE2E2', color: '#DC2626' },
  'Cancelled':  { bg: '#F1F5F9', color: '#64748B' },
};

export default function FacilityMaintenance() {
  const [search, setSearch] = useState('');
  const filtered = mockFacilityMaintenance.filter(r =>
    r.facility.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Facility Maintenance</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Planned and active facility maintenance jobs</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            placeholder="Search by id, facility, description..."
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
            <FiPlus size={15} /> Schedule Maintenance
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ width: 36, padding: '12px 16px' }}><input type="checkbox" /></th>
              {['MAINTENANCE ID', 'FACILITY/ASSET', 'TYPE', 'DESCRIPTION', 'ASSIGNED TO', 'FREQUENCY', 'DUE DATE', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '12px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '13px 16px' }}><input type="checkbox" /></td>
                <td style={{ padding: '13px 12px', fontSize: '13px', color: '#3B82F6', fontWeight: 500, whiteSpace: 'nowrap' }}>{r.id}</td>
                <td style={{ padding: '13px 12px', fontSize: '13px', color: '#0F172A', fontWeight: 500, maxWidth: 160 }}>{r.facility}</td>
                <td style={{ padding: '13px 12px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: typeStyle[r.type]?.bg, color: typeStyle[r.type]?.color }}>{r.type}</span>
                </td>
                <td style={{ padding: '13px 12px', fontSize: '13px', color: '#64748B', maxWidth: 200 }}>{r.description}</td>
                <td style={{ padding: '13px 12px', fontSize: '13px', color: '#0F172A' }}>{r.assignedTo}</td>
                <td style={{ padding: '13px 12px', fontSize: '13px', color: '#64748B' }}>{r.frequency}</td>
                <td style={{ padding: '13px 12px', fontSize: '13px', color: '#64748B' }}>{r.dueDate}</td>
                <td style={{ padding: '13px 12px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: statusStyle[r.status]?.bg, color: statusStyle[r.status]?.color }}>{r.status}</span>
                </td>
                <td style={{ padding: '13px 12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><FiEye size={16} /></button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><FiMoreVertical size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>Page 1 of 8</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1,2,3,4,5].map(p => (
              <button key={p} style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #E2E8F0', background: p === 1 ? '#1E3A5F' : '#fff', color: p === 1 ? '#fff' : '#374151', fontSize: '13px', cursor: 'pointer' }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
