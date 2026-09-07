import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Badge from '../../../components/ui/Badge';
import Toast, { useToast } from '../../../components/ui/Toast';
import EditEmployeeModal from './EditEmployeeModal';
import { mockEmployees } from '../../../data/mockEmployees';

import {
  FiArrowLeft,
  FiMail,
  FiEdit2,
  FiUpload,
  FiPlus,
  FiAward,
  FiFileText,
  FiDownload,
  FiBriefcase,
} from 'react-icons/fi';

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [activeTab, setActiveTab] = useState('certifications');
  const [showEditModal, setShowEditModal] = useState(false);

  // Find employee or fallback to first
  const employee = mockEmployees.find((e) => e.id === id) || mockEmployees[0];

  const formatCurrency = (val) => {
    if (!val) return '₦0.00';
    return '₦' + Number(val).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  const totalGross =
    (employee.basicSalary || 0) +
    (employee.housingAllowance || 0) +
    (employee.transportAllowance || 0) +
    (employee.projectAllowance || 0) +
    (employee.currentMonthOvertime || 0);

  const tabs = [
    { id: 'personal', label: 'Personal' },
    { id: 'employment', label: 'Employment' },
    { id: 'certifications', label: 'Certification & Training' },
    { id: 'leave', label: 'Leave History' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'projects', label: 'Projects' },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'var(--font)' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Top Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Employees</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px', marginBottom: 0 }}>
            Manage employee records, roles, departments, and employment status
          </p>

          <div style={{ marginTop: '12px' }}>
            <Link
              to="/hr/employees"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.813rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <FiArrowLeft size={14} /> Back to Directory
            </Link>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => showToast('Bulk upload initialized', 'info')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
        >
          Upload <FiUpload size={13} />
        </button>
      </div>

      {/* Main Employee Profile Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Profile Info Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {/* Employee Avatar */}
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: '#334155',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1.4rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                flexShrink: 0,
              }}
            >
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                employee.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
              )}
            </div>

            {/* Name, Position, Badges */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{employee.name}</h2>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '2px' }}>
                {employee.position} &bull; {employee.id}
              </div>

              {/* Badges Pill Row */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                  }}
                >
                  {employee.status || 'Active'}
                </span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: '#E0E7FF',
                    color: '#3730A3',
                  }}
                >
                  {employee.department}
                </span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: '#DBEAFE',
                    color: '#1E40AF',
                  }}
                >
                  {employee.contractType || 'Permanent'}
                </span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                  }}
                >
                  Grade {employee.grade || 'M3'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <a
              href={`mailto:${employee.email}`}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: '#334155',
                padding: '7px 14px',
                fontSize: '0.813rem',
                fontWeight: 500,
                borderRadius: '6px',
              }}
            >
              <FiMail size={14} /> Email
            </a>
            <button
              className="btn btn-secondary"
              onClick={() => showToast(`Deployment workflow triggered for ${employee.name}`, 'info')}
              style={{
                backgroundColor: '#F1F5F9',
                border: 'none',
                color: '#334155',
                padding: '7px 14px',
                fontSize: '0.813rem',
                fontWeight: 500,
                borderRadius: '6px',
              }}
            >
              Deploy
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowEditModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                padding: '7px 16px',
                fontSize: '0.813rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
              }}
            >
              <FiEdit2 size={14} /> Edit Profile
            </button>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            backgroundColor: '#FAFAFA',
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid #F1F5F9',
          }}
        >
          <div>
            <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ✉ EMAIL
            </div>
            <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B', marginTop: '4px' }}>
              {employee.email}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📞 PHONE
            </div>
            <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B', marginTop: '4px' }}>
              {employee.phone}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🎯 LOCATION
            </div>
            <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B', marginTop: '4px' }}>
              {employee.location}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              💼 CURRENT PROJECT
            </div>
            <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B', marginTop: '4px' }}>
              {employee.project}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📅 HIRE DATE
            </div>
            <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B', marginTop: '4px' }}>
              {employee.hireDate}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              👤 MANAGER
            </div>
            <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B', marginTop: '4px' }}>
              {employee.reportingManager || employee.manager}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div
        style={{
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          gap: '28px',
          overflowX: 'auto',
          padding: '0 4px',
        }}
      >
        {tabs.map((tab) => {
          const isActiveTab = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 0',
                border: 'none',
                background: 'none',
                fontSize: '0.85rem',
                fontWeight: isActiveTab ? 600 : 500,
                color: isActiveTab ? '#1D4ED8' : '#64748B',
                borderBottom: isActiveTab ? '2.5px solid #1D4ED8' : '2.5px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content Box */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* TAB: CERTIFICATION & TRAINING */}
        {activeTab === 'certifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Certification & Training
              </h3>
              <button
                className="btn btn-secondary"
                onClick={() => showToast('Add certification dialog', 'info')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  color: '#334155',
                  padding: '6px 14px',
                  fontSize: '0.813rem',
                  borderRadius: '6px',
                }}
              >
                <FiAward size={13} /> Add Certification
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      CERTIFICATE
                    </th>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      ISSUED
                    </th>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      EXPIRES
                    </th>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employee.certifications && employee.certifications.length > 0 ? (
                    employee.certifications.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 500, color: '#1E293B' }}>{c.name}</td>
                        <td style={{ padding: '14px 12px', color: '#475569' }}>{c.issued}</td>
                        <td style={{ padding: '14px 12px', color: '#475569' }}>{c.expires}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: c.status === 'Valid' ? '#DCFCE7' : '#FEE2E2',
                              color: c.status === 'Valid' ? '#166534' : '#991B1B',
                            }}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#94A3B8', padding: '24px' }}>
                        No certification records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: LEAVE HISTORY */}
        {activeTab === 'leave' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Leave History
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      TYPE
                    </th>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      FROM
                    </th>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      TO
                    </th>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      DAYS
                    </th>
                    <th style={{ padding: '10px 12px', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employee.leaveHistory && employee.leaveHistory.length > 0 ? (
                    employee.leaveHistory.map((lh, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 500, color: '#1E293B' }}>{lh.type}</td>
                        <td style={{ padding: '14px 12px', color: '#475569' }}>{lh.from}</td>
                        <td style={{ padding: '14px 12px', color: '#475569' }}>{lh.to}</td>
                        <td style={{ padding: '14px 12px', color: '#475569' }}>{lh.days}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: lh.status === 'Approved' ? '#DCFCE7' : '#FEE2E2',
                              color: lh.status === 'Approved' ? '#166534' : '#991B1B',
                            }}
                          >
                            {lh.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#94A3B8', padding: '24px' }}>
                        No leave history records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PROJECTS */}
        {activeTab === 'projects' && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px', margin: '0 0 16px 0' }}>
              Project Assignments
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {employee.projects && employee.projects.length > 0 ? (
                employee.projects.map((proj, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>{proj.name}</div>
                    <div style={{ fontSize: '0.781rem', color: '#64748B', marginTop: '4px' }}>
                      {proj.status} &bull; {proj.location} &bull; {proj.period}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '24px' }}>No projects assigned.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB: PERSONAL */}
        {activeTab === 'personal' && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px', margin: '0 0 16px 0' }}>
              Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>FULL NAME</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>EMPLOYEE ID</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>EMAIL</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PHONE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>DATE OF BIRTH</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.dob || '14/02/1985'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>NATIONALITY</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.nationality || 'Nigerian'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>STATE OF ORIGIN</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.state || 'Imo'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>NEXT OF KIN</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.nextOfKin || 'Mrs. Sarah Okonkwo'}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: EMPLOYMENT */}
        {activeTab === 'employment' && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px', margin: '0 0 16px 0' }}>
              Employment Credentials
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>POSITION</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.position}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>DEPARTMENT</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.department}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>GRADE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>Grade {employee.grade || 'M3'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>CONTRACT TYPE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.contractType || 'Permanent'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>HIRE DATE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.hireDate}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>REPORTING MANAGER</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', marginTop: '4px' }}>{employee.reportingManager || employee.manager}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAYROLL */}
        {activeTab === 'payroll' && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px', margin: '0 0 16px 0' }}>
              Payroll Structure
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>BASIC SALARY</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{formatCurrency(employee.basicSalary || 850000)}</div>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>HOUSING ALLOWANCE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{formatCurrency(employee.housingAllowance || 280000)}</div>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>TRANSPORT ALLOWANCE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{formatCurrency(employee.transportAllowance || 120000)}</div>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>MONTHLY GROSS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1D4ED8', marginTop: '4px' }}>{formatCurrency(totalGross)}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Documents</h3>
              <button className="btn btn-secondary" onClick={() => showToast('Upload document dialog', 'info')} style={{ fontSize: '0.813rem' }}>
                + Upload Document
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {['Employment Contract.pdf', 'NYSC Discharge Certificate.pdf', 'Degree Certificate.pdf', 'BOSIET Certificate.pdf'].map((doc, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 14px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#FAFAFA',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiFileText size={18} />
                    <span style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B' }}>{doc}</span>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => showToast(`Downloading ${doc}`, 'success')}>
                    <FiDownload size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {showEditModal && (
        <EditEmployeeModal
          employee={employee}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedData) => {
            setShowEditModal(false);
            showToast(`Profile updated successfully for ${updatedData.name}`, 'success');
          }}
        />
      )}
    </div>
  );
}
