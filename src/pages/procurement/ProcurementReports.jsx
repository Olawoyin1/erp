import React, { useState } from 'react';
import {
  FiDownload, FiPieChart, FiBarChart2, FiTrendingUp, FiTarget,
  FiFileText, FiCheckCircle, FiDollarSign, FiAward, FiAlertCircle
} from 'react-icons/fi';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockProcurementAnalytics } from '../../data/mockProcurement';

export default function ProcurementReports() {
  const { kpis, monthlyRevenueWon, rfqPerformance, commercialConversion, tenderOutcome } = mockProcurementAnalytics;
  const { toast, showToast, hideToast } = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Reports — Procurement</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Monitor procurement performance through operational reports and procurement analytics
          </p>
        </div>
        <div>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Exporting executive report...', 'success')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px' }}
          >
            <FiDownload size={15} /> Export
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards matching exact screenshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL PIPELINE VALUE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{kpis.totalPipelineValue}</div>
            <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '4px', fontWeight: 600 }}>↗ {kpis.pipelineGrowth}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <FiDollarSign size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>OPPORTUNITY CONVERSION</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{kpis.opportunityConversion}</div>
            <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '4px', fontWeight: 600 }}>↗ {kpis.conversionGrowth}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
            <FiTarget size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>RFQ PROPOSAL SUCCESS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{kpis.rfqProposalSuccess}</div>
            <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '4px', fontWeight: 600 }}>↗ {kpis.proposalPrecision}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <FiCheckCircle size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TEAM TASKS RESOLVED</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{kpis.teamTasksResolved}</div>
            <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '4px', fontWeight: 600 }}>⚠ {kpis.taskAlert}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
            <FiFileText size={18} />
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Monthly Revenue Won & RFQ Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Monthly Revenue Won Bar Chart */}
        <div className="card" style={{ padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Monthly Revenue Won</h3>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', padding: '3px 10px', borderRadius: '12px', color: '#64748B', fontWeight: 600 }}>
              Contracts YTD
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0 0 20px 0' }}>
            Total volume of awarded & pipeline projects
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 12, height: 12, backgroundColor: '#EF4444', borderRadius: '2px' }} />
              <span style={{ color: '#475569', fontWeight: 500 }}>Awarded</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 12, height: 12, backgroundColor: '#1E40AF', borderRadius: '2px' }} />
              <span style={{ color: '#475569', fontWeight: 500 }}>Pipeline</span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
            {monthlyRevenueWon.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px', width: '100%', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: '40%',
                      backgroundColor: '#EF4444',
                      height: `${(m.awarded / 200) * 100}%`,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s'
                    }}
                    title={`Awarded: ₦${m.awarded}M`}
                  />
                  <div
                    style={{
                      width: '40%',
                      backgroundColor: '#1E40AF',
                      height: `${(m.pipeline / 200) * 100}%`,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s'
                    }}
                    title={`Pipeline: ₦${m.pipeline}M`}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginTop: '8px' }}>{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RFQ Performance */}
        <div className="card" style={{ padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>RFQ Performance</h3>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '4px 0 20px 0' }}>
            RFQ feedback speed & accuracy analysis pipeline
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>SUBMITTED RFQS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{rfqPerformance.submittedRfqs}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Estimations completed directly</div>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>RFQ VALUE YTD</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{rfqPerformance.rfqValueYtd}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Estimations completed directly</div>
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
            STATUS DISTRIBUTION VOLUME
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rfqPerformance.statusDistribution.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.813rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563EB' }} />
                  <span style={{ color: '#334155' }}>{s.label}</span>
                </div>
                <div style={{ fontWeight: 600, color: '#0F172A' }}>
                  {s.count} RFQ <span style={{ color: '#94A3B8', fontWeight: 400 }}>({s.value})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Commercial Conversion Pipeline Funnel & Tender Outcome Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Commercial Conversion Pipeline Funnel */}
        <div className="card" style={{ padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Commercial Conversion Pipeline Funnel</h3>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', padding: '3px 10px', borderRadius: '12px', color: '#64748B', fontWeight: 600 }}>
              32 cases
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0 0 20px 0' }}>
            Survival rates of opportunities from registration to close sign-off
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {commercialConversion.map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.813rem', marginBottom: '6px' }}>
                  <span style={{ color: '#334155', fontWeight: 500 }}>{item.stage}</span>
                  <span style={{ color: '#0F172A', fontWeight: 700 }}>{item.count}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.pct}%`,
                      height: '100%',
                      backgroundColor: item.color,
                      borderRadius: '4px',
                      transition: 'width 0.5s'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tender Outcome Analysis */}
        <div className="card" style={{ padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Tender Outcome Analysis</h3>
          <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '4px 0 20px 0' }}>
            Win ratio breakdown & procurement bidding outcome metrics
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>OVERALL BIDS WON</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{tenderOutcome.overallBidsWon}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Out of {tenderOutcome.totalBidsTracked} tracked</div>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>AWAITING DECISION</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>{tenderOutcome.awaitingDecision}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Bids submitted</div>
            </div>
          </div>

          {/* Outcome breakdown bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {tenderOutcome.categories.map((cat, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.813rem', marginBottom: '4px' }}>
                  <span style={{ color: '#334155' }}>{cat.label}</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{cat.amount}</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(parseFloat(cat.amount.replace(/[^0-9.]/g, '')) / 60) * 100}%`,
                      height: '100%',
                      backgroundColor: cat.color,
                      borderRadius: '3px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
