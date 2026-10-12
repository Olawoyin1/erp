import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiEdit2, FiCheck, FiX, FiRefreshCw, FiFileText
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockRisks, mockInsurancePolicies } from '../../data/mockFinance';

const ITEMS_PER_PAGE = 10;
const fmt = (n) => '₦' + Number(n).toLocaleString();

const SEVERITIES = ['All Severities', 'Low', 'Medium', 'High'];
const POLICY_TYPES = ['All Types', 'Insurance', 'Bond'];

function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}>
        <FiMoreVertical size={16} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: '4px',
          backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '180px'
        }}>
          {items.map((it, idx) => (
            <div
              key={idx}
              onClick={() => { it.onClick(); setOpen(false); }}
              style={{
                padding: '8px 14px', fontSize: '0.813rem', color: it.danger ? '#DC2626' : '#334155',
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = it.danger ? '#FEE2E2' : '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              {it.icon} {it.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommercialRisksInsurance() {
  const [tab, setTab] = useState('risks'); // 'risks' | 'insurance'
  const [risks, setRisks] = useState(mockRisks);
  const [policies, setPolicies] = useState(mockInsurancePolicies);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('All Severities');
  const [policyTypeFilter, setPolicyTypeFilter] = useState('All Types');

  const { toast, showToast, hideToast } = useToast();

  // Drawers and Modals
  const [viewRisk, setViewRisk] = useState(null);
  const [createRiskModal, setCreateRiskModal] = useState(false);
  const [viewPolicy, setViewPolicy] = useState(null);
  const [createPolicyModal, setCreatePolicyModal] = useState(false);
  const [renewPolicyModal, setRenewPolicyModal] = useState(null);
  const [renewDate, setRenewDate] = useState('');

  const activeList = tab === 'risks' ? risks : policies;

  const filteredData = activeList.filter(item => {
    const q = search.toLowerCase();
    if (tab === 'risks') {
      const matchesSearch = !q || item.riskId.toLowerCase().includes(q) || item.client.toLowerCase().includes(q) || item.riskOwner.toLowerCase().includes(q);
      const matchesSev = severityFilter === 'All Severities' || item.severity === severityFilter;
      return matchesSearch && matchesSev;
    } else {
      const matchesSearch = !q || item.policyNo.toLowerCase().includes(q) || item.provider.toLowerCase().includes(q) || item.project.toLowerCase().includes(q);
      const matchesType = policyTypeFilter === 'All Types' || item.policyType === policyTypeFilter;
      return matchesSearch && matchesType;
    }
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginated = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map((item) => item.id));
  };

  const riskColumns = [
    {
      key: 'riskId',
      label: 'RISK ID',
      render: (val, row) => (
        <span
          style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setViewRisk(row)}
        >
          {val}
        </span>
      )
    },
    { key: 'client', label: 'CLIENT' },
    { key: 'project', label: 'PROJECT' },
    { key: 'riskCategory', label: 'CATEGORY' },
    {
      key: 'potentialExposure',
      label: 'POTENTIAL EXPOSURE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmt(val)}</span>
    },
    {
      key: 'severity',
      label: 'SEVERITY',
      render: (val) => (
        <span style={{
          padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
          background: val === 'High' ? '#FEE2E2' : val === 'Medium' ? '#FEF3C7' : '#DCFCE7',
          color: val === 'High' ? '#DC2626' : val === 'Medium' ? '#D97706' : '#16A34A'
        }}>
          {val}
        </span>
      )
    },
    { key: 'riskOwner', label: 'OWNER' },
    {
      key: 'status',
      label: 'STATUS',
      render: (val) => <Badge status={val} />
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" onClick={() => setViewRisk(row)}>
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Details',
                onClick: () => setViewRisk(row)
              },
              {
                icon: <FiCheck size={14} />,
                label: 'Mark Mitigated',
                onClick: () => {
                  setRisks(risks.map(r => r.id === row.id ? { ...r, status: 'Mitigated' } : r));
                  showToast('Risk status updated to Mitigated', 'success');
                }
              },
              {
                icon: <FiX size={14} />,
                label: 'Close Risk',
                danger: true,
                onClick: () => {
                  setRisks(risks.map(r => r.id === row.id ? { ...r, status: 'Closed' } : r));
                  showToast('Risk closed', 'info');
                }
              }
            ]}
          />
        </div>
      )
    }
  ];

  const policyColumns = [
    {
      key: 'policyNo',
      label: 'POLICY NO.',
      render: (val, row) => (
        <span
          style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setViewPolicy(row)}
        >
          {val}
        </span>
      )
    },
    {
      key: 'policyType',
      label: 'TYPE',
      render: (val) => (
        <span style={{
          padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
          background: val === 'Insurance' ? '#EDE9FE' : '#FEF3C7',
          color: val === 'Insurance' ? '#7C3AED' : '#D97706'
        }}>
          {val}
        </span>
      )
    },
    {
      key: 'coverageType',
      label: 'COVERAGE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
    },
    { key: 'provider', label: 'INSURER / BANK' },
    { key: 'project', label: 'PROJECT' },
    {
      key: 'coverageValue',
      label: 'COVERAGE VALUE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmt(val)}</span>
    },
    { key: 'expiryDate', label: 'EXPIRY DATE' },
    {
      key: 'status',
      label: 'STATUS',
      render: (val) => <Badge status={val} />
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" onClick={() => setViewPolicy(row)}>
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Policy',
                onClick: () => setViewPolicy(row)
              },
              {
                icon: <FiRefreshCw size={14} />,
                label: 'Renew Policy',
                onClick: () => {
                  setRenewPolicyModal(row);
                  setRenewDate('2027-06-30');
                }
              }
            ]}
          />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Commercial Risks & Insurance
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Manage commercial exposure registers, insurance policies, performance bonds, and renewals
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Exporting schedule...', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FiDownload size={14} /> Export
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (tab === 'risks') setCreateRiskModal(true);
              else setCreatePolicyModal(true);
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, border: 'none'
            }}
          >
            <FiPlus size={14} /> {tab === 'risks' ? 'Add Commercial Risk' : 'Add Policy / Bond'}
          </button>
        </div>
      </div>

      {/* Pill Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px' }}>
        <button
          onClick={() => { setTab('risks'); setCurrentPage(1); setSelectedIds([]); }}
          style={{
            padding: '8px 18px',
            fontSize: '0.85rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: tab === 'risks' ? '2px solid #1D4ED8' : '2px solid transparent',
            color: tab === 'risks' ? '#1D4ED8' : '#64748B',
            fontFamily: 'var(--font)'
          }}
        >
          Commercial Risks ({risks.length})
        </button>
        <button
          onClick={() => { setTab('insurance'); setCurrentPage(1); setSelectedIds([]); }}
          style={{
            padding: '8px 18px',
            fontSize: '0.85rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: tab === 'insurance' ? '2px solid #1D4ED8' : '2px solid transparent',
            color: tab === 'insurance' ? '#1D4ED8' : '#64748B',
            fontFamily: 'var(--font)'
          }}
        >
          Insurance Policies & Bonds ({policies.length})
        </button>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={tab === 'risks' ? "Search risk ID, owner, client..." : "Search policy no, provider, project..."}
              style={{ paddingLeft: '36px', width: '100%' }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>

          <div className="table-toolbar-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setFilterOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <FiFilter size={14} /> Filter
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => showToast('Exporting data...', 'info')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <FiDownload size={14} /> Export
            </button>
          </div>
        </div>

        {/* Base Enterprise DataTable */}
        <DataTable
          columns={tab === 'risks' ? riskColumns : policyColumns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          emptyMessage="No commercial records found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* ─── SLIDE-OVER DRAWER: RISK DETAILS ─── */}
      <Drawer
        isOpen={!!viewRisk}
        onClose={() => setViewRisk(null)}
        title={viewRisk ? `${viewRisk.riskId} – ${viewRisk.project}` : ''}
        subtitle="Commercial exposure and mitigation assessment"
        width="520px"
        footer={(
          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
            onClick={() => setViewRisk(null)}
          >
            Close
          </button>
        )}
      >
        {viewRisk && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>Financial Exposure</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {fmt(viewRisk.potentialExposure)}
              </div>
              <div style={{ marginTop: '8px' }}>
                <Badge status={viewRisk.status} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748B' }}>Client:</strong> {viewRisk.client}</div>
              <div><strong style={{ color: '#64748B' }}>Category:</strong> {viewRisk.riskCategory}</div>
              <div><strong style={{ color: '#64748B' }}>Severity:</strong> {viewRisk.severity}</div>
              <div><strong style={{ color: '#64748B' }}>Assigned Owner:</strong> {viewRisk.riskOwner}</div>
            </div>

            <div>
              <strong style={{ fontSize: '0.813rem', color: '#64748B', display: 'block', marginBottom: '6px' }}>Mitigation Plan</strong>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', fontSize: '0.813rem', color: '#1E293B', lineHeight: 1.5, border: '1px solid #E2E8F0' }}>
                {viewRisk.mitigationPlan || 'Active risk monitoring in progress.'}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── SLIDE-OVER DRAWER: POLICY DETAILS ─── */}
      <Drawer
        isOpen={!!viewPolicy}
        onClose={() => setViewPolicy(null)}
        title={viewPolicy ? `${viewPolicy.policyNo}` : ''}
        subtitle="Policy coverage schedule and endorsement terms"
        width="520px"
        footer={(
          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
            onClick={() => setViewPolicy(null)}
          >
            Close
          </button>
        )}
      >
        {viewPolicy && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>Coverage Amount</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {fmt(viewPolicy.coverageValue)}
              </div>
              <div style={{ marginTop: '8px' }}>
                <Badge status={viewPolicy.status} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748B' }}>Policy Type:</strong> {viewPolicy.policyType}</div>
              <div><strong style={{ color: '#64748B' }}>Coverage:</strong> {viewPolicy.coverageType}</div>
              <div><strong style={{ color: '#64748B' }}>Provider:</strong> {viewPolicy.provider}</div>
              <div><strong style={{ color: '#64748B' }}>Project:</strong> {viewPolicy.project}</div>
              <div><strong style={{ color: '#64748B' }}>Premium:</strong> {fmt(viewPolicy.premiumAmount)}</div>
              <div><strong style={{ color: '#64748B' }}>Expiry Date:</strong> {viewPolicy.expiryDate}</div>
            </div>

            {viewPolicy.doc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EFF6FF', padding: '10px 14px', borderRadius: '6px', color: '#1D4ED8', fontSize: '0.813rem' }}>
                <FiFileText size={16} />
                <span>Policy Document: {viewPolicy.doc}</span>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Records"
        subtitle="Refine view by risk severities and policy types"
        width="420px"
        footer={(
          <>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
              onClick={() => { setSeverityFilter('All Severities'); setPolicyTypeFilter('All Types'); setFilterOpen(false); }}
            >
              Reset
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#1D4ED8' }}
              onClick={() => setFilterOpen(false)}
            >
              Apply Filters
            </button>
          </>
        )}
      >
        {tab === 'risks' ? (
          <FormField label="Risk Severity">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
              {SEVERITIES.map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="sev"
                    checked={severityFilter === s}
                    onChange={() => setSeverityFilter(s)}
                    style={{ accentColor: '#1D4ED8', cursor: 'pointer' }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </FormField>
        ) : (
          <FormField label="Policy Type">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
              {POLICY_TYPES.map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="ptype"
                    checked={policyTypeFilter === t}
                    onChange={() => setPolicyTypeFilter(t)}
                    style={{ accentColor: '#1D4ED8', cursor: 'pointer' }}
                  />
                  {t}
                </label>
              ))}
            </div>
          </FormField>
        )}
      </Drawer>

      {/* Modal: Renew Policy */}
      {renewPolicyModal && (
        <Modal
          isOpen={true}
          onClose={() => setRenewPolicyModal(null)}
          title={`Renew Policy: ${renewPolicyModal.policyNo}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
              Specify the extended expiration date for <strong>{renewPolicyModal.coverageType}</strong> ({renewPolicyModal.provider}).
            </p>
            <FormField label="New Expiration Date">
              <Input
                type="date"
                value={renewDate}
                onChange={(e) => setRenewDate(e.target.value)}
                required
              />
            </FormField>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setRenewPolicyModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ backgroundColor: '#1D4ED8' }}
                onClick={() => {
                  setPolicies(policies.map(p => p.id === renewPolicyModal.id ? { ...p, expiryDate: renewDate, status: 'Active' } : p));
                  showToast('Policy renewed successfully', 'success');
                  setRenewPolicyModal(null);
                }}
              >
                Confirm Renewal
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
