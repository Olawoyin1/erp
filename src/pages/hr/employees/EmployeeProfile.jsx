import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Badge from '../../../components/ui/Badge';
import Toast, { useToast } from '../../../components/ui/Toast';
import EditEmployeeModal from './EditEmployeeModal';
import { koboToNaira } from '../../../hooks/useKobo';

import {
  fetchEmployee,
  fetchEmployeeCertifications,
  fetchEmployeeLeaveHistory,
  fetchEmployeeProjects,
  fetchEmployeeDocuments,
  fetchEmployeePayroll,
  updateEmployee,
  selectEmployeeProfile,
  selectProfileLoading,
  selectProfileError,
  selectEmployeeSub,
  selectSubLoading,
  clearProfile,
} from '../../../store/hr/employeesSlice';

import {
  FiArrowLeft, FiMail, FiEdit2, FiUpload,
  FiAward, FiFileText, FiDownload,
} from 'react-icons/fi';

// ─── Small helpers ─────────────────────────────────────────────────────────────
function InfoCell({ label, value }) {
  return (
    <div style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.875rem', color: '#1E293B', fontWeight: 400 }}>{value || '—'}</div>
    </div>
  );
}

function InfoGrid({ rows }) {
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: ri < rows.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
          {row.map((cell) => <InfoCell key={cell.label} label={cell.label} value={cell.value} />)}
        </div>
      ))}
    </div>
  );
}

function TabSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ height: 52, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      ))}
    </div>
  );
}

const TABS = [
  { id: 'personal',       label: 'Personal' },
  { id: 'employment',     label: 'Employment' },
  { id: 'certifications', label: 'Certification & Training' },
  { id: 'leave',          label: 'Leave History' },
  { id: 'payroll',        label: 'Payroll' },
  { id: 'projects',       label: 'Projects' },
  { id: 'documents',      label: 'Documents' },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function EmployeeProfile() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();

  const [activeTab,      setActiveTab]      = useState('personal');
  const [showEditModal,  setShowEditModal]   = useState(false);

  const employee       = useSelector(selectEmployeeProfile);
  const profileLoading = useSelector(selectProfileLoading);
  const profileError   = useSelector(selectProfileError);

  // Sub-resource selectors
  const certs      = useSelector(selectEmployeeSub('certifications', id));
  const leave      = useSelector(selectEmployeeSub('leaveHistory', id));
  const projects   = useSelector(selectEmployeeSub('projects', id));
  const documents  = useSelector(selectEmployeeSub('documents', id));
  const payroll    = useSelector(selectEmployeeSub('payroll', id));

  const certsLoading = useSelector(selectSubLoading('certifications'));
  const leaveLoading = useSelector(selectSubLoading('leaveHistory'));
  const projLoading  = useSelector(selectSubLoading('projects'));
  const docsLoading  = useSelector(selectSubLoading('documents'));
  const payLoading   = useSelector(selectSubLoading('payroll'));

  // Fetch core profile on mount
  useEffect(() => {
    dispatch(fetchEmployee(id));
    return () => dispatch(clearProfile());
  }, [dispatch, id]);

  // Lazy-load sub-resources only when the tab is first opened
  useEffect(() => {
    if (activeTab === 'certifications' && !certs) dispatch(fetchEmployeeCertifications(id));
    if (activeTab === 'leave'          && !leave) dispatch(fetchEmployeeLeaveHistory(id));
    if (activeTab === 'projects'       && !projects) dispatch(fetchEmployeeProjects(id));
    if (activeTab === 'documents'      && !documents) dispatch(fetchEmployeeDocuments(id));
    if (activeTab === 'payroll'        && !payroll) dispatch(fetchEmployeePayroll(id));
  }, [activeTab]); // eslint-disable-line

  const handleEditSave = async (formData) => {
    const result = await dispatch(updateEmployee({ id: employee._id, data: formData }));
    if (updateEmployee.fulfilled.match(result)) {
      setShowEditModal(false);
      showToast('Profile updated successfully', 'success');
    } else {
      showToast(result.payload?.message || 'Update failed', 'error');
    }
  };

  // ── Loading / error states ──────────────────────────────────────────────────
  if (profileLoading && !employee) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        {[100, 200, 120].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 12, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        ))}
      </div>
    );
  }

  if (profileError) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#DC2626' }}>
        {profileError.message || 'Failed to load employee profile.'}
      </div>
    );
  }

  if (!employee) return null;

  // ── Derived display values ──────────────────────────────────────────────────
  const name        = employee.fullName ?? '—';
  const empId       = employee.employeeId ?? '—';
  const position    = employee.position ?? '—';
  const deptName    = employee.departmentId?.name ?? employee.departmentId ?? '—';
  const contractType = employee.contractType ?? '—';
  const grade       = employee.grade ?? '—';
  const statusVal   = employee.status ?? 'active';
  const email       = employee.email ?? '';
  const phone       = employee.phone ?? '—';
  const hireDate    = employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('en-GB') : '—';
  const managerName = employee.reportingManagerId?.fullName ?? '—';
  const currentProj = employee.currentProjectRef ?? '—';
  const initials    = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  // Payroll data from sub-resource
  const salaryStructure = payroll?.salaryStructure;
  const recentPayslips  = payroll?.recentPayslips ?? [];
  const baseSalary      = salaryStructure?.basicSalary ?? employee.baseSalary ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'var(--font)' }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Title bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Employees</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px', marginBottom: 0 }}>
            Manage employee records, roles, departments, and employment status
          </p>
          <div style={{ marginTop: '12px' }}>
            <Link to="/hr/employees" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.813rem', color: 'var(--text-secondary)', fontWeight: 500, textDecoration: 'none' }}>
              <FiArrowLeft size={14} /> Back to Directory
            </Link>
          </div>
        </div>
        <button className="btn btn-secondary"
          onClick={() => showToast('Bulk upload coming soon', 'info')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={13} />
        </button>
      </div>

      {/* Profile card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {/* Avatar */}
            <div style={{ width: 68, height: 68, borderRadius: '50%', backgroundColor: '#334155', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: '1.4rem', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', flexShrink: 0 }}>
              {employee.avatarUrl
                ? <img src={employee.avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{name}</h2>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 2 }}>{position} &bull; {empId}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { text: statusVal, bg: statusVal === 'active' ? '#DCFCE7' : statusVal === 'probation' ? '#FEF9C3' : '#F1F5F9', color: statusVal === 'active' ? '#166534' : statusVal === 'probation' ? '#854D0E' : '#475569' },
                  { text: deptName, bg: '#E0E7FF', color: '#3730A3' },
                  { text: contractType, bg: '#DBEAFE', color: '#1E40AF' },
                  { text: `Grade ${grade}`, bg: '#F1F5F9', color: '#475569' },
                ].map(({ text, bg, color }) => (
                  <span key={text} style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, backgroundColor: bg, color, textTransform: 'capitalize' }}>
                    {text.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href={`mailto:${email}`} className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#FFF', border: '1px solid #E2E8F0', color: '#334155', padding: '7px 14px', fontSize: '0.813rem', fontWeight: 500, borderRadius: 6 }}>
              <FiMail size={14} /> Email
            </a>
            <button className="btn btn-primary"
              onClick={() => setShowEditModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#1D4ED8', color: '#FFF', padding: '7px 16px', fontSize: '0.813rem', fontWeight: 600, borderRadius: 6, border: 'none' }}>
              <FiEdit2 size={14} /> Edit Profile
            </button>
          </div>
        </div>

        {/* Quick-info strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, backgroundColor: '#FAFAFA', padding: '16px 20px', borderRadius: 8, border: '1px solid #F1F5F9' }}>
          {[
            { emoji: '✉', label: 'EMAIL',           value: email },
            { emoji: '📞', label: 'PHONE',           value: phone },
            { emoji: '💼', label: 'CURRENT PROJECT', value: currentProj },
            { emoji: '📅', label: 'HIRE DATE',       value: hireDate },
            { emoji: '👤', label: 'MANAGER',         value: managerName },
          ].map(({ emoji, label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{emoji} {label}</div>
              <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B', marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 28, overflowX: 'auto', padding: '0 4px' }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '12px 0', border: 'none', background: 'none', fontSize: '0.85rem', fontWeight: active ? 600 : 500, color: active ? '#1D4ED8' : '#64748B', borderBottom: active ? '2.5px solid #1D4ED8' : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease' }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

        {/* PERSONAL */}
        {activeTab === 'personal' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Personal Information</h3>
            <InfoGrid rows={[
              [
                { label: 'FULL NAME',   value: name },
                { label: 'EMPLOYEE ID', value: empId },
                { label: 'EMAIL',       value: email },
              ],
              [
                { label: 'PHONE',       value: phone },
                { label: 'DATE OF BIRTH', value: employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-GB') : '—' },
                { label: 'NATIONALITY', value: employee.nationality },
              ],
              [
                { label: 'STATE',       value: employee.state },
                { label: 'ADDRESS',     value: employee.address },
                { label: 'NEXT OF KIN', value: employee.nextOfKin ? `${employee.nextOfKin.name} — ${employee.nextOfKin.relation} (${employee.nextOfKin.phone})` : '—' },
              ],
            ]} />
          </div>
        )}

        {/* EMPLOYMENT */}
        {activeTab === 'employment' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Employment Information</h3>
            <InfoGrid rows={[
              [
                { label: 'POSITION',      value: position },
                { label: 'DEPARTMENT',    value: deptName },
                { label: 'GRADE',         value: grade },
              ],
              [
                { label: 'CONTRACT TYPE',   value: contractType },
                { label: 'HIRE DATE',       value: hireDate },
                { label: 'REPORTING TO',    value: managerName },
              ],
              [
                { label: 'CURRENT PROJECT', value: currentProj },
                { label: 'EMPLOYMENT TYPE', value: employee.employmentType },
                { label: 'STATUS',          value: statusVal },
              ],
            ]} />
          </div>
        )}

        {/* CERTIFICATIONS */}
        {activeTab === 'certifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Certification & Training</h3>
              <button className="btn btn-secondary"
                onClick={() => showToast('Add certification — coming in next phase', 'info')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#FFF', border: '1px solid #E2E8F0', color: '#334155', padding: '6px 14px', fontSize: '0.813rem', borderRadius: 6 }}>
                <FiAward size={13} /> Add Certification
              </button>
            </div>
            {certsLoading ? <TabSkeleton /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9', textAlign: 'left' }}>
                    {['CERTIFICATE', 'ISSUED', 'EXPIRES', 'STATUS'].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(certs ?? []).length > 0 ? (certs).map((c) => (
                    <tr key={c._id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '14px 12px', fontWeight: 500, color: '#1E293B' }}>{c.certificateName}</td>
                      <td style={{ padding: '14px 12px', color: '#475569' }}>{c.issuedDate ? new Date(c.issuedDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td style={{ padding: '14px 12px', color: '#475569' }}>{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, backgroundColor: c.status === 'valid' ? '#DCFCE7' : '#FEE2E2', color: c.status === 'valid' ? '#166534' : '#991B1B', textTransform: 'capitalize' }}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>No certifications found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* LEAVE HISTORY */}
        {activeTab === 'leave' && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Leave History</h3>
            {leaveLoading ? <TabSkeleton /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9', textAlign: 'left' }}>
                    {['TYPE', 'FROM', 'TO', 'DAYS', 'STATUS'].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(leave ?? []).length > 0 ? (leave).map((lh) => (
                    <tr key={lh._id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '14px 12px', fontWeight: 500, color: '#1E293B' }}>{lh.leaveTypeId?.name ?? lh.leaveType ?? '—'}</td>
                      <td style={{ padding: '14px 12px', color: '#475569' }}>{lh.startDate ? new Date(lh.startDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td style={{ padding: '14px 12px', color: '#475569' }}>{lh.endDate ? new Date(lh.endDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td style={{ padding: '14px 12px', color: '#475569' }}>{lh.durationDays ?? '—'}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, backgroundColor: lh.status === 'approved' ? '#DCFCE7' : lh.status === 'pending' ? '#FEF9C3' : '#FEE2E2', color: lh.status === 'approved' ? '#166534' : lh.status === 'pending' ? '#854D0E' : '#991B1B', textTransform: 'capitalize' }}>
                          {lh.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>No leave history found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* PROJECTS */}
        {activeTab === 'projects' && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: '0 0 16px 0' }}>Project Assignments</h3>
            {projLoading ? <TabSkeleton /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(projects ?? []).length > 0 ? (projects).map((dep) => (
                  <div key={dep._id} style={{ padding: 16, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#FFF' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>{dep.deploymentId} — {dep.projectRef}</div>
                    <div style={{ fontSize: '0.781rem', color: '#64748B', marginTop: 4, textTransform: 'capitalize' }}>
                      {dep.status} &bull; {dep.role} &bull; {dep.startDate ? new Date(dep.startDate).toLocaleDateString('en-GB') : '—'}
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>No project assignments found.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PAYROLL */}
        {activeTab === 'payroll' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Payroll Information</h3>
              <button className="btn btn-secondary"
                onClick={() => showToast('Payslip download — coming in payroll phase', 'info')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#334155', padding: '7px 14px', fontSize: '0.813rem', borderRadius: 6, fontWeight: 500 }}>
                <FiFileText size={14} /> View Payslips
              </button>
            </div>
            {payLoading ? <TabSkeleton /> : (
              <>
                <InfoGrid rows={[
                  [
                    { label: 'BASE SALARY',    value: koboToNaira(baseSalary) },
                    { label: 'GRADE',          value: salaryStructure?.grade ?? grade },
                    { label: 'RECENT PAYSLIPS', value: recentPayslips.length > 0 ? `${recentPayslips.length} available` : 'None yet' },
                  ],
                ]} />
                {recentPayslips.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Recent Payslips</div>
                    {recentPayslips.slice(0, 5).map((ps) => (
                      <div key={ps._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.813rem' }}>
                        <span style={{ color: '#1E293B' }}>{ps.payslipId} — {ps.period}</span>
                        <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{koboToNaira(ps.netPay)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === 'documents' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Uploaded Documents</h3>
            {docsLoading ? <TabSkeleton /> : (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                {(documents ?? []).length > 0 ? (documents).map((doc, i, arr) => (
                  <div key={doc._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i < arr.length - 1 ? '1px solid #E2E8F0' : 'none', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FiFileText size={16} color="#64748B" />
                      <span style={{ fontSize: '0.875rem', color: '#1E293B' }}>{doc.originalName ?? doc.fileName ?? 'Document'}</span>
                    </div>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', fontSize: '0.813rem', color: '#334155', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}>
                      <FiDownload size={14} /> Download
                    </a>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>No documents uploaded yet.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEditModal && (
        <EditEmployeeModal isOpen employee={employee}
          onClose={() => setShowEditModal(false)} onSave={handleEditSave} />
      )}
    </div>
  );
}
