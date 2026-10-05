import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical } from 'react-icons/fi';
import { mockTravelRequests } from '../../data/mockAdmin';

const statusStyle = {
  'Approved': { bg: '#DCFCE7', color: '#15803D' },
  'Pending':  { bg: '#FEF3C7', color: '#B45309' },
  'Rejected': { bg: '#FEE2E2', color: '#DC2626' },
  'Draft':    { bg: '#F1F5F9', color: '#64748B' },
};

export default function TravelsLogistics() {
  const [tab, setTab] = useState('requests');
  const [search, setSearch] = useState('');

  const filtered = mockTravelRequests.filter(r =>
    r.traveler.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  const tabStyle = (t) => ({
    padding: '10px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none',
    color: tab === t ? '#1D4ED8' : '#64748B',
    borderBottom: tab === t ? '2px solid #1D4ED8' : '2px solid transparent',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Travel & Logistics</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Track travel, movements and allowances</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '20px' }}>
        <button style={tabStyle('requests')} onClick={() => setTab('requests')}>Travel Requests</button>
        <button style={tabStyle('equipment')} onClick={() => setTab('equipment')}>Equipment Movement</button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input placeholder="Search by Id, traveler, destination..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiFilter size={15} /> Filter
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiDownload size={15} /> Export
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '8px', background: '#1E3A5F', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
            <FiPlus size={15} /> New Travel Request
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ width: 36, padding: '12px 16px' }}><input type="checkbox" /></th>
              {['REQUEST ID', 'TRAVELER', 'FROM', 'TO', 'DEPARTURE', 'RETURN', 'MODE', 'ACCOM.', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '12px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '13px 16px' }}><input type="checkbox" /></td>
                <td style={{ padding: '13px 10px', fontSize: '13px', color: '#3B82F6', fontWeight: 500, whiteSpace: 'nowrap' }}>{r.id}</td>
                <td style={{ padding: '13px 10px', fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{r.traveler}</td>
                <td style={{ padding: '13px 10px', fontSize: '13px', color: '#64748B' }}>{r.from}</td>
                <td style={{ padding: '13px 10px', fontSize: '13px', color: '#64748B', maxWidth: 140 }}>{r.to}</td>
                <td style={{ padding: '13px 10px', fontSize: '13px', color: '#64748B' }}>{r.departure}</td>
                <td style={{ padding: '13px 10px', fontSize: '13px', color: r.status === 'Pending' ? '#3B82F6' : '#64748B', fontWeight: r.status === 'Pending' ? 600 : 400 }}>{r.returnDate}</td>
                <td style={{ padding: '13px 10px', fontSize: '13px', color: '#64748B' }}>{r.mode}</td>
                <td style={{ padding: '13px 10px', fontSize: '13px', color: '#64748B' }}>{r.accommodation}</td>
                <td style={{ padding: '13px 10px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: statusStyle[r.status]?.bg || '#F1F5F9', color: statusStyle[r.status]?.color || '#64748B' }}>{r.status}</span>
                </td>
                <td style={{ padding: '13px 10px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><FiEye size={16} /></button>
                    {r.status !== 'Approved' && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><FiMoreVertical size={16} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>Page 1 of 8</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1,2,3,4,5,6].map(p => (
              <button key={p} style={{ width: 32, height: 32, borderRadius: '6px', border: '1px solid #E2E8F0', background: p === 1 ? '#1E3A5F' : '#fff', color: p === 1 ? '#fff' : '#374151', fontSize: '13px', cursor: 'pointer' }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
