import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiUpload, FiEye } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import { mockAttendance } from '../../../data/mockAttendance';

const ITEMS_PER_PAGE = 10;

export default function AttendanceTimesheets() {
  const [data, setData] = useState(mockAttendance);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const { toast, showToast, hideToast } = useToast();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    { key: 'id', label: 'EMPLOYEE ID' },
    { key: 'name', label: 'EMPLOYEE', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'location', label: 'LOCATION' },
    { key: 'clockIn', label: 'CLOCK IN' },
    { key: 'clockOut', label: 'CLOCK OUT' },
    { key: 'hoursWorked', label: 'HOURS WORKED' },
    { key: 'status', label: 'STATUS', render: (val) => <Badge status={val} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button className="icon-btn" title="View Details">
            <FiEye size={15} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Attendance & Timesheets</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Monitor employee attendance, working hours, overtime, and site-based timesheet records
          </p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={14} />
        </button>
      </div>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
              Today's Attendance
            </span>
            <span style={{ color: '#0F172A', fontSize: '0.875rem', fontWeight: 500 }}>Friday, Aug 7, 2026</span>
          </div>
          <button className="btn" style={{ backgroundColor: '#10B981', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '6px', fontWeight: 600 }}>
             Clock In
          </button>
        </div>
        
        <div>
          <div style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: '16px' }}>
            <span style={{ fontWeight: 600 }}>Staff Profile: </span> Helen Okoye <span style={{ color: '#94A3B8' }}>(HR Admin • Human Resources)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>Current Attendance Status</div>
              <Badge status="Pending" text="Not Clocked In" />
            </div>
            <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>Clock-In Time</div>
              <div style={{ color: '#0F172A', fontWeight: 500 }}>--:--</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>Clock-Out Time</div>
              <div style={{ color: '#0F172A', fontWeight: 500 }}>--:--</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>Total Hours Worked</div>
              <div style={{ color: '#0F172A', fontWeight: 500 }}>0 hrs</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'PRESENT TODAY', value: '118', subtitle: 'Employees successfully clocked in today', bg: '#D1FAE5' },
          { title: 'LATE ARRIVALS', value: '8', subtitle: 'Clocked in after scheduled start time', bg: '#FFEDD5' },
          { title: 'ABSENT TODAY', value: '3', subtitle: 'No attendance record for today', bg: '#FEE2E2' },
          { title: 'OVERTIME HOURS', value: '116 hrs', subtitle: 'Total approved overtime hours', bg: '#DBEAFE' }
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{stat.title}</span>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {/* Icon placeholder */}
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{stat.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', minWidth: '180px' }}>
            Site Attendance - 22/06/2026
          </div>
          <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
            <div className="table-toolbar-search" style={{ maxWidth: '300px' }}>
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search employee, location..."
                style={{ paddingLeft: '36px', width: '100%' }}
              />
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <FiSearch size={15} />
              </div>
            </div>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter
            </button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              Export <FiDownload size={14} />
            </button>
            <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
              Log Attendance
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
          keyField="id"
          emptyMessage="No attendance records found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
