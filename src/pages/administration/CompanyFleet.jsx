import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiTruck, FiTool, FiAlertTriangle, FiCheckCircle, FiMapPin,
  FiCalendar, FiEdit2, FiNavigation,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import { Input, FormField, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockFleet, mockMaintenanceLog } from '../../data/mockAdmin';

const ITEMS_PER_PAGE = 8;

function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(v => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '170px' }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => { item.action(); setOpen(false); }} className="menu-item-hover"
              style={{ padding: '8px 14px', fontSize: '0.813rem', color: item.color || '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              {item.icon} {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>{sub}</div>}
      </div>
    </div>
  );
}

function VehicleDrawer({ vehicle, onClose, onShowToast }) {
  if (!vehicle) return null;
  const statusColors = { 'Available': '#16A34A', 'In Use': '#1D4ED8', 'Under Maintenance': '#D97706', 'Overdue Service': '#DC2626' };
  const statusBg = { 'Available': '#DCFCE7', 'In Use': '#DBEAFE', 'Under Maintenance': '#FEF3C7', 'Overdue Service': '#FEE2E2' };

  const footer = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="btn btn-secondary" style={{ flex: 1, padding: '9px', fontWeight: 600 }}
        onClick={() => { onShowToast('Maintenance request logged', 'success'); }}>
        <FiTool size={14} style={{ marginRight: 6 }} /> Log Maintenance
      </button>
      <button className="btn btn-primary" style={{ flex: 1, padding: '9px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}>
        <FiEdit2 size={14} style={{ marginRight: 6 }} /> Edit Vehicle
      </button>
    </div>
  );

  return (
    <Drawer isOpen={!!vehicle} onClose={onClose} title="Vehicle Details" footer={footer} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Vehicle Header Card */}
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>{vehicle.make} {vehicle.model}</div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>{vehicle.year} • {vehicle.type}</div>
            </div>
            <span style={{ backgroundColor: statusBg[vehicle.status], color: statusColors[vehicle.status], padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
              {vehicle.status}
            </span>
          </div>
          <div style={{ display: 'inline-block', backgroundColor: '#1D4ED8', color: '#fff', padding: '6px 16px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            {vehicle.plateNo}
          </div>
        </div>

        {/* Details */}
        {[
          { label: 'Assigned To', value: vehicle.assignedTo },
          { label: 'Driver', value: vehicle.driver },
          { label: 'Current Mileage', value: vehicle.mileage, icon: <FiNavigation size={13} /> },
          { label: 'Last Service', value: vehicle.lastService, icon: <FiCalendar size={13} /> },
          { label: 'Next Service Due', value: vehicle.nextService, icon: <FiCalendar size={13} /> },
          { label: 'Insurance Expiry', value: vehicle.insExpiry, icon: <FiCheckCircle size={13} /> },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              {icon && <span style={{ color: '#94A3B8' }}>{icon}</span>}{value}
            </span>
          </div>
        ))}

        {/* Maintenance History */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Maintenance History</div>
          {mockMaintenanceLog.filter(m => m.vehicle === vehicle.plateNo).length > 0
            ? mockMaintenanceLog.filter(m => m.vehicle === vehicle.plateNo).map(log => (
              <div key={log.id} style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.83rem', color: '#0F172A' }}>{log.type}</span>
                  <Badge status={log.status === 'Completed' ? 'Completed' : log.status === 'In Progress' ? 'In Progress' : 'Overdue'} text={log.status} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{log.date} · {log.mechanic} · <strong style={{ color: '#0F172A' }}>{log.cost}</strong></div>
              </div>
            ))
            : <div style={{ fontSize: '0.83rem', color: '#94A3B8', fontStyle: 'italic' }}>No maintenance records for this vehicle</div>
          }
        </div>
      </div>
    </Drawer>
  );
}

export default function CompanyFleet() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const tabs = [
    { key: 'fleet', label: 'Fleet Register', icon: <FiTruck size={15} /> },
    { key: 'maintenance', label: 'Maintenance Log', icon: <FiTool size={15} /> },
  ];

  const filtered = (activeTab === 'fleet' ? mockFleet : mockMaintenanceLog).filter(item => {
    const q = search.toLowerCase();
    return !q || JSON.stringify(item).toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const fleetStatusStyle = status => {
    const map = {
      'Available': { bg: '#DCFCE7', color: '#166534' },
      'In Use': { bg: '#DBEAFE', color: '#1E40AF' },
      'Under Maintenance': { bg: '#FEF3C7', color: '#92400E' },
      'Overdue Service': { bg: '#FEE2E2', color: '#991B1B' },
    };
    return map[status] || { bg: '#F1F5F9', color: '#475569' };
  };

  const fleetColumns = [
    { key: 'id', label: 'FLEET ID', render: v => <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}</span> },
    {
      key: 'plateNo', label: 'PLATE NO',
      render: v => <span style={{ backgroundColor: '#0F172A', color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em' }}>{v}</span>
    },
    { key: 'make', label: 'MAKE/MODEL', render: (v, row) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{row.make} {row.model}</span> },
    { key: 'type', label: 'TYPE' },
    { key: 'assignedTo', label: 'ASSIGNED TO' },
    { key: 'driver', label: 'DRIVER' },
    { key: 'nextService', label: 'NEXT SERVICE' },
    { key: 'insExpiry', label: 'INS. EXPIRY' },
    {
      key: 'status', label: 'STATUS',
      render: v => {
        const s = fleetStatusStyle(v);
        return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 9px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{v}</span>;
      }
    },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View" onClick={() => setSelectedVehicle(row)}><FiEye size={15} /></button>
          <RowMenu items={[
            { label: 'Edit Vehicle', icon: <FiEdit2 size={13} />, action: () => showToast('Edit mode', 'info') },
            { label: 'Log Maintenance', icon: <FiTool size={13} />, action: () => showToast('Maintenance request logged', 'success') },
            { label: 'Report Incident', icon: <FiAlertTriangle size={13} />, color: '#DC2626', action: () => showToast('Incident report created', 'success') },
          ]} />
        </div>
      )
    },
  ];

  const maintColumns = [
    { key: 'id', label: 'LOG ID', render: v => <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}</span> },
    {
      key: 'vehicle', label: 'VEHICLE',
      render: v => <span style={{ backgroundColor: '#0F172A', color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em' }}>{v}</span>
    },
    { key: 'type', label: 'SERVICE TYPE', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'date', label: 'DATE' },
    { key: 'mechanic', label: 'MECHANIC / GARAGE' },
    { key: 'cost', label: 'COST', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'status', label: 'STATUS', render: v => <Badge status={v === 'Completed' ? 'Completed' : v === 'In Progress' ? 'In Progress' : 'Overdue'} text={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: () => (
        <button className="icon-btn" title="View"><FiEye size={15} /></button>
      )
    },
  ];

  const available = mockFleet.filter(v => v.status === 'Available').length;
  const inUse = mockFleet.filter(v => v.status === 'In Use').length;
  const maintenance = mockFleet.filter(v => v.status === 'Under Maintenance').length;
  const overdue = mockFleet.filter(v => v.status === 'Overdue Service').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <VehicleDrawer vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} onShowToast={showToast} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Company Fleet</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage company vehicles, track assignments, maintenance, and insurance compliance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
            <FiDownload size={14} /> Export
          </button>
          <button onClick={() => setAddModal(true)}
            className="btn btn-primary"
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
            <FiPlus size={14} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdue > 0 && (
        <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiAlertTriangle size={16} color="#EA580C" />
            <span style={{ fontSize: '0.875rem', color: '#92400E' }}>
              {overdue} vehicle{overdue > 1 ? 's have' : ' has'} overdue maintenance. Schedule service immediately to ensure roadworthiness.
            </span>
          </div>
          <button style={{ fontSize: '0.875rem', color: '#EA580C', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            View Overdue →
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiTruck size={20} />} label="Total Vehicles" value={mockFleet.length} sub="In fleet" accent="#1D4ED8" />
        <StatCard icon={<FiCheckCircle size={20} />} label="Available" value={available} sub="Ready for deployment" accent="#16A34A" />
        <StatCard icon={<FiNavigation size={20} />} label="In Use" value={inUse} sub="Currently deployed" accent="#7C3AED" />
        <StatCard icon={<FiTool size={20} />} label="In Maintenance" value={maintenance + overdue} sub={`${overdue} overdue`} accent="#DC2626" />
      </div>

      {/* Tab + Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 24px' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); setPage(1); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeTab === tab.key ? '2px solid #1D4ED8' : '2px solid transparent', color: activeTab === tab.key ? '#1D4ED8' : '#64748B', marginBottom: '-1px', transition: 'all 150ms ease' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="table-toolbar">
            <div className="table-toolbar-search" style={{ position: 'relative' }}>
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search vehicle, plate number, driver..." style={{ paddingLeft: '36px', width: '100%' }} />
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
            </div>
            <div className="table-toolbar-actions">
              <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
                <FiFilter size={14} /> Filter
              </button>
            </div>
          </div>

          <DataTable
            columns={activeTab === 'fleet' ? fleetColumns : maintColumns}
            data={paginated}
            selectable selectedIds={selectedIds}
            onSelectRow={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id"
            emptyMessage="No records found."
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Register New Vehicle" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Make"><Input placeholder="e.g. Toyota" /></FormField>
            <FormField label="Model"><Input placeholder="e.g. Land Cruiser V8" /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Year"><Input type="number" placeholder="2024" /></FormField>
            <FormField label="Vehicle Type">
              <select className="form-input">
                {['SUV', 'Sedan', 'Bus', 'Pickup', 'Truck', 'Van'].map(o => <option key={o}>{o}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Plate Number"><Input placeholder="e.g. ABJ-009-GH" /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Assigned To"><Input placeholder="Unit or person" /></FormField>
            <FormField label="Driver"><Input placeholder="Driver full name" /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Insurance Expiry"><Input type="date" /></FormField>
            <FormField label="Next Service Due"><Input type="date" /></FormField>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary"
              onClick={() => { setAddModal(false); showToast('Vehicle registered successfully', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600 }}>
              Register Vehicle
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
