import React, { useState } from 'react';
import {
  FiDownload,
  FiUploadCloud,
  FiCheckCircle,
  FiTrendingUp,
  FiAlertTriangle,
  FiFileText,
  FiFilter,
  FiBarChart2,
  FiCalendar,
} from 'react-icons/fi';

export default function QualityReports() {
  const [dateRange, setDateRange] = useState('YTD 2026');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '24px',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#0F172A',
              margin: 0,
            }}
          >
            Reports — Quality System
          </h1>
          <p
            style={{
              color: '#64748B',
              fontSize: '0.875rem',
              margin: '4px 0 0 0',
            }}
          >
            Cross-section quality performance summary
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
              color: '#334155',
            }}
          >
            <option value="This Month">This Month</option>
            <option value="Q2 2026">Q2 2026</option>
            <option value="YTD 2026">Contracts YTD 2026</option>
          </select>

          <button
            onClick={() => alert('Bulk upload Quality Report data initiated')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#1E293B',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <FiUploadCloud size={16} /> Upload ↑
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              AUDIT COMPLIANCE RATE
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1D4ED8',
              }}
            >
              <FiCheckCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '10px' }}>
            94.6%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiTrendingUp size={12} /> +8% vs last year
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              CALIBRATION ADHERENCE
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284C7',
              }}
            >
              <FiBarChart2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '10px' }}>
            88%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiTrendingUp size={12} /> +4.2% vs Q1 average
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              FIRST-PASS INSPECTION YIELD
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#15803D',
              }}
            >
              <FiCheckCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '10px' }}>
            91.4%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiTrendingUp size={12} /> +1.5% higher drawing precision
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              NCR CORRECTIVE ACTIONS RESOLVED
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#F3E8FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7E22CE',
              }}
            >
              <FiFileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '10px' }}>
            18/20
          </div>
          <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiAlertTriangle size={12} /> 1 critical audit finding pending
          </div>
        </div>
      </div>

      {/* Row 2: Charts and Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: '16px' }}>
        {/* Monthly Quality Audits & Inspection Yield */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '24px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                Monthly Inspection & Audit Volume
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                Total volume of passed materials & open quality inspections
              </p>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#EF4444', borderRadius: '2px' }} />
                <span>Non-Conformance</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#1D4ED8', borderRadius: '2px' }} />
                <span>Passed Inspections</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Simulation */}
          <div style={{ marginTop: '30px', height: '220px', display: 'flex', alignItems: 'flex-end', gap: '24px', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0' }}>
            {[
              { month: 'Jan', passedH: 50, ncrH: 30 },
              { month: 'Feb', passedH: 90, ncrH: 60 },
              { month: 'Mar', passedH: 140, ncrH: 80 },
              { month: 'Apr', passedH: 80, ncrH: 170 },
              { month: 'May', passedH: 120, ncrH: 45 },
              { month: 'Jun', passedH: 40, ncrH: 130 },
            ].map((bar, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '6px', height: '180px' }}>
                  <div
                    title={`Non-conformance: ${bar.ncrH}`}
                    style={{
                      width: '16px',
                      height: `${bar.ncrH}px`,
                      backgroundColor: '#EF4444',
                      borderRadius: '3px 3px 0 0',
                    }}
                  />
                  <div
                    title={`Passed: ${bar.passedH}`}
                    style={{
                      width: '16px',
                      height: `${bar.passedH}px`,
                      backgroundColor: '#1D4ED8',
                      borderRadius: '3px 3px 0 0',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                  {bar.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Material Inspection Distribution */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '24px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
              Materials Quality Assurance
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              Receipt verification speed & test compliance rate
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>INSPECTIONS COMPLETED</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>42</div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Batch certifications logged</div>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>VERIFIED MATERIAL VALUE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>₦52.6M</div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Approved for site utilization</div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>
              STATUS DISTRIBUTION VOLUME
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Passed & Accepted into Inventory', count: '34 MRNs', pct: 80, color: '#15803D' },
                { label: 'Pending Compressive Lab Testing', count: '5 MRNs', pct: 12, color: '#D97706' },
                { label: 'Under Review / Quarantine', count: '2 MRNs', pct: 5, color: '#0284C7' },
                { label: 'Rejected / NCR Issued', count: '1 MRN', pct: 3, color: '#DC2626' },
              ].map((row, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.color }} />
                      {row.label}
                    </span>
                    <span style={{ fontWeight: 600 }}>{row.count}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${row.pct}%`, height: '100%', backgroundColor: row.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Quality Conformance Funnel & Calibration Reliability Health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr', gap: '16px' }}>
        {/* QMS Conformance Lifecycle Funnel */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '24px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                QMS Conformance Lifecycle Funnel
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                Survival rates of quality inspection milestones to final sign-off
              </p>
            </div>
            <span style={{ backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              32 audits / batches
            </span>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Scheduled / Intake (100%)', count: 32, width: '100%', color: '#1D4ED8' },
              { label: 'Documentation Verified (75%)', count: 24, width: '75%', color: '#9333EA' },
              { label: 'Physical Testing Complete (45%)', count: 14, width: '45%', color: '#2563EB' },
              { label: 'Corrective Action Plan (27%)', count: 9, width: '27%', color: '#EA580C' },
              { label: 'Approved & Signed Off (16%)', count: 5, width: '16%', color: '#16A34A' },
              { label: 'Rejected / Closed NCR (2%)', count: 1, width: '3%', color: '#DC2626' },
            ].map((f, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                  <span>{f.label}</span>
                  <span style={{ fontWeight: 600 }}>{f.count}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: f.width, height: '100%', backgroundColor: f.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calibration & Equipment Reliability Health */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '24px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
              Instrument Calibration Health Analysis
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              Calibration currency breakdown across site & laboratory instruments
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>OVERALL PASS RATIO</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15803D', marginTop: '4px' }}>88%</div>
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>10 instruments monitored</div>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>AWAITING SERVICE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#D97706', marginTop: '4px' }}>2</div>
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Lab calibration scheduled</div>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Valid / In Tolerance', value: '6 instruments', pct: 60, color: '#16A34A' },
              { label: 'Due Soon (within 30 days)', value: '2 instruments', pct: 20, color: '#D97706' },
              { label: 'Overdue Calibration', value: '2 instruments', pct: 20, color: '#DC2626' },
              { label: 'Out of Service / Quarantined', value: '1 instrument', pct: 10, color: '#64748B' },
            ].map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 600 }}>{item.value}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
