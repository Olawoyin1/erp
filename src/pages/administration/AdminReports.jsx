import React from 'react';
import { FiDownload, FiTrendingUp } from 'react-icons/fi';
import { mockAdminReportStats, mockMonthlyRevenue, mockRFQPerformance, mockPipelineFunnel } from '../../data/mockAdmin';

const FUNNEL_COLORS = ['#1E3A5F', '#1D4ED8', '#7C3AED', '#F59E0B', '#10B981', '#EF4444'];

export default function AdminReports() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Reports — Administration</h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Consolidated view of tender, client and deadline activity</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
          <FiDownload size={15} /> Export
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {mockAdminReportStats.map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{s.label}</p>
            <p style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: s.label === 'TEAM TASKS RESOLVED' ? '#DC2626' : '#15803D', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiTrendingUp size={12} /> {s.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Bar chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Monthly Revenue Won</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>Total volume of awarded & pipeline projects</p>
            </div>
            <span style={{ fontSize: '12px', color: '#1D4ED8', cursor: 'pointer', fontWeight: 500 }}>Contracts YTD</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#EF4444', display: 'inline-block' }}></span> Awarded</span>
            <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#1E3A5F', display: 'inline-block' }}></span> Pipeline</span>
          </div>
          {/* Simple bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, paddingTop: 10 }}>
            {mockMonthlyRevenue.map(m => (
              <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 130 }}>
                  <div style={{ width: 14, height: `${(m.awarded / 200) * 130}px`, background: '#EF4444', borderRadius: '3px 3px 0 0', minHeight: 4 }}></div>
                  <div style={{ width: 14, height: `${(m.pipeline / 200) * 130}px`, background: '#1E3A5F', borderRadius: '3px 3px 0 0', minHeight: 4 }}></div>
                </div>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{m.month}</span>
              </div>
            ))}
          </div>
          {/* Y-axis labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {['0M', '50M', '100M', '150M', '200M'].map(l => (
              <span key={l} style={{ fontSize: '10px', color: '#CBD5E1' }}>{l}</span>
            ))}
          </div>
        </div>

        {/* RFQ Performance */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>RFQ Performance</h3>
          <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#64748B' }}>RFQ feedback speed & accuracy analysis pipeline</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase' }}>SUBMITTED RFQS</p>
              <p style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{mockRFQPerformance.submittedRFQs}</p>
              <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>Estimations completed directly</p>
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase' }}>RFQ VALUE YTD</p>
              <p style={{ fontSize: '28px', fontWeight: 800, color: '#1D4ED8', margin: 0 }}>{mockRFQPerformance.rfqValueYTD}</p>
              <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>Estimations completed directly</p>
            </div>
          </div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', margin: '0 0 10px', textTransform: 'uppercase' }}>STATUS DISTRIBUTION VOLUME</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mockRFQPerformance.distribution.map(d => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D4ED8', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{d.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>{d.rfqs} RFQ</span>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>({d.value})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Pipeline funnel */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Commercial Conversion Pipeline Funnel</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>Survival rates of opportunities from registration to close sign-off</p>
            </div>
            <span style={{ fontSize: '12px', color: '#1D4ED8', fontWeight: 500 }}>32 cases</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mockPipelineFunnel.map((s, i) => (
              <div key={s.stage}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{s.stage}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{s.count}</span>
                </div>
                <div style={{ background: '#F1F5F9', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.percent}%`, background: FUNNEL_COLORS[i] || '#64748B', borderRadius: 4 }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tender outcome */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Tender Outcome Analysis</h3>
          <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#64748B' }}>Win ratio breakdown & procurement bidding outcome metrics</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, margin: '0 0 8px', textTransform: 'uppercase' }}>OVERALL BIDS WON</p>
              <p style={{ fontSize: '42px', fontWeight: 800, color: '#0F172A', margin: 0 }}>4</p>
              <p style={{ fontSize: '12px', color: '#64748B' }}>Out of 10 tracked</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, margin: '0 0 8px', textTransform: 'uppercase' }}>AWAITING DECISION</p>
              <p style={{ fontSize: '42px', fontWeight: 800, color: '#0F172A', margin: 0 }}>1</p>
              <p style={{ fontSize: '12px', color: '#64748B' }}>Bids submitted</p>
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Under Review (2)', value: '#20.6M', color: '#1D4ED8' },
              { label: 'Submitted (2)', value: '#59.0M', color: '#7C3AED' },
              { label: 'Awaiting Decision (4)', value: '#10.8M', color: '#F59E0B' },
              { label: 'Awarded (2)', value: '#47.0M', color: '#10B981' },
              { label: 'Lost (1)', value: '#12.2M', color: '#EF4444' },
            ].map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: t.color, display: 'inline-block' }}></span>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{t.label}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
