import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical, FiAlertCircle } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { Input } from '../../components/ui/FormField';

const mockCalibration = [
  { id: 'PG-001', name: 'Pressure Gauge (0-100 bar)', location: 'Warri Yard', custodian: 'Chinonso Okafor', lastCalibrated: '28/05/25', nextDue: '28/05/25', status: 'Valid' },
  { id: 'PG-002', name: 'Pressure Gauge (0-400 bar)', location: 'Port Harcourt Site', custodian: 'Fatima Ibrahim', lastCalibrated: '28/05/25', nextDue: '28/05/25', status: 'Due Soon' },
  { id: 'TG-001', name: 'Temperature Gauge (Industrial)', location: 'Port Harcourt Site', custodian: 'Emmanuel Eze', lastCalibrated: '28/05/25', nextDue: '28/05/25', status: 'Overdue' },
  { id: 'UTG-001', name: 'Ultrasonic Thickness Gauge', location: 'Port Harcourt Site', custodian: 'Zainab Mohammed', lastCalibrated: '28/05/25', nextDue: '28/05/25', status: 'Valid' },
  { id: 'TW-001', name: 'Torque Wrench (200 Nm)', location: 'Port Harcourt Site', custodian: 'Adeola Olatunji', lastCalibrated: '28/05/25', nextDue: '28/05/25', status: 'Overdue' },
  { id: 'TW-002', name: 'Torque Wrench (500 Nm)', location: 'Port Harcourt Site', custodian: 'Tunde Bakare', lastCalibrated: '28/05/25', nextDue: '28/05/25', status: 'Due Soon' },
  { id: 'MM-001', name: 'Digital Multimeter', location: 'Port Harcourt Site', custodian: 'Amaka Ugochukwu', lastCalibrated: '28/05/25', nextDue: '28/05/25', status: 'Valid' },
  { id: 'CTG-001', name: 'Coating Thickness Gauge', location: 'Port Harcourt Site', custodian: 'Damilola Adebayo', lastCalibrated: '28/05/25', nextDue: '28/05/25', status: 'Valid' },
  { id: 'GD-001', name: 'Portable 4-Gas Detector', location: 'Port Harcourt Site', custodian: 'Chidera Nwosu', lastCalibrated: '28/05/25', nextDue: '28/05/25', status: 'Overdue' },
  { id: 'HT-001', name: 'Brinell Hardness Tester', location: 'Port Harcourt Site', custodian: 'Ijeoma Chukwuma', lastCalibrated: '28/05/25', nextDue: '28/05/25', status: 'Out of Service' },
];

function StatusPill({ status }) {
  const colors = {
    'Valid': { bg: '#D1FAE5', color: '#059669' },
    'Due Soon': { bg: '#FEF3C7', color: '#D97706' },
    'Overdue': { bg: '#FEE2E2', color: '#DC2626' },
    'Out of Service': { bg: '#F1F5F9', color: '#64748B' },
  };
  const c = colors[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: c.bg, color: c.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
}

export default function CalibrationRecords() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS = 10;
  
  const filtered = mockCalibration.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((currentPage - 1) * ITEMS, currentPage * ITEMS);

  const columns = [
    { key: 'id', label: 'INSTRUMENT ID', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'name', label: 'NAME', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'location', label: 'LOCATION' },
    { key: 'custodian', label: 'CUSTODIAN' },
    { key: 'lastCalibrated', label: 'LAST CALIBRATED' },
    { key: 'nextDue', label: 'NEXT DUE' },
    { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: () => (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
        <button className="icon-btn"><FiEye size={14} /></button>
        <button className="icon-btn"><FiMoreVertical size={14} /></button>
      </div>
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Calibration Records</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Register of measuring and test instruments with calibration status</p>
      </div>

      <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <FiAlertCircle color="#EF4444" size={18} />
        <span style={{ fontSize: '0.875rem', color: '#7F1D1D' }}>3 instruments are out of calibration. Remove from service immediately until recalibrated. <b>View Overdue &rarr;</b></span>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Instrument ID..." style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
            <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}><FiPlus size={14} /> Schedule Calibration</button>
          </div>
        </div>
        <DataTable columns={columns} data={paginated} selectable keyField="id" emptyMessage="No calibration records found." />
        <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length/ITEMS) || 1} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
