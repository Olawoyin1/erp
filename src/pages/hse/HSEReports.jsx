import React from 'react';
import { FiUpload } from 'react-icons/fi';

export default function HSEReports() {
  const stats = [
    { title: 'TOTAL PIPELINE VALUE', value: '₦2.62B', trend: '+8%', text: 'vs last year', pos: true, bg: '#EFF6FF' },
    { title: 'OPPORTUNITY CONVERSION', value: '61%', trend: '+4.2%', text: 'vs Q1 average', pos: true, bg: '#EEF2FF' },
    { title: 'RFQ PROPOSAL SUCCESS', value: '57%', trend: '+1.5%', text: 'higher drawing precision', pos: true, bg: '#ECFDF5' },
    { title: 'TEAM TASKS RESOLVED', value: '12/20', trend: '⚠ 1 critical bidding delays', text: '', pos: false, isAlert: true, bg: '#FEF9C3' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Reports — HSE</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Cross-section HSE performance summary</p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={14} />
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{stat.title}</span>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: stat.bg }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>{stat.value}</div>
            {stat.trend && (
              <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {stat.isAlert ? (
                  <span style={{ color: '#DC2626' }}>{stat.trend}</span>
                ) : (
                  <span style={{ color: stat.pos ? '#10B981' : '#DC2626', fontWeight: 500 }}>↗ {stat.trend}</span>
                )}
                {stat.text && <span style={{ color: '#94A3B8' }}>{stat.text}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Monthly Revenue Won */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>Monthly Revenue Won</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Total volume of awarded & pipeline projects</p>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#1D4ED8', fontWeight: 500 }}>Contracts YTD</span>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#EF4444' }} /><span style={{ fontSize: '0.8rem', color: '#334155' }}>Awarded</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#1D4ED8' }} /><span style={{ fontSize: '0.8rem', color: '#334155' }}>Pipeline</span></div>
          </div>

          {/* Bar Chart Mock */}
          <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingTop: '16px' }}>
            {[
              { awarded: 30, pipeline: 60 },
              { awarded: 70, pipeline: 100 },
              { awarded: 90, pipeline: 130 },
              { awarded: 180, pipeline: 150 },
              { awarded: 60, pipeline: 100 },
              { awarded: 140, pipeline: 80 },
            ].map((bar, i) => {
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
              const maxVal = 200;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', height: '150px' }}>
                    <div style={{ flex: 1, backgroundColor: '#EF4444', borderRadius: '3px 3px 0 0', height: `${(bar.awarded / maxVal) * 100}%` }} />
                    <div style={{ flex: 1, backgroundColor: '#1D4ED8', borderRadius: '3px 3px 0 0', height: `${(bar.pipeline / maxVal) * 100}%` }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{months[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RFQ Performance */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>RFQ Performance</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>RFQ feedback speed & accuracy analysis pipeline</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>SUBMITTED RFQS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>42</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Estimations completed directly</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>RFQ VALUE YTD</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1D4ED8' }}>#52.6M</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Estimations completed directly</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '12px' }}>STATUS DISTRIBUTION VOLUME</div>
            {[
              { label: 'Pending Assessment', count: '1 RFQ', amount: '(#12M)', color: '#3B82F6' },
              { label: 'In Formulation', count: '2 RFQ', amount: '(#12M)', color: '#3B82F6' },
              { label: 'Under Review', count: '3 RFQ', amount: '(#12M)', color: '#3B82F6' },
              { label: 'Submitted & Active', count: '1 RFQ', amount: '(#12M)', color: '#3B82F6' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: '#334155', flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>{item.count}</span>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Pipeline Funnel */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>Commercial Conversion Pipeline Funnel</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Survival rates of opportunities from registration to close sign-off</p>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#1D4ED8', fontWeight: 500 }}>32 cases</span>
          </div>
          {[
            { label: 'Lead Intake (100%)', value: 32, color: '#1D4ED8', max: 32 },
            { label: 'Qualified (75%)', value: 24, color: '#8B5CF6', max: 32 },
            { label: 'Proposal Sent (45%)', value: 14, color: '#6366F1', max: 32 },
            { label: 'Negotiation (27%)', value: 9, color: '#F59E0B', max: 32 },
            { label: 'Won (16%)', value: 5, color: '#10B981', max: 32 },
            { label: 'Lost (2%)', value: 1, color: '#EF4444', max: 32 },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                <span style={{ color: '#334155' }}>{item.label}</span>
                <span style={{ color: '#0F172A', fontWeight: 600 }}>{item.value}</span>
              </div>
              <div style={{ height: '8px', width: '100%', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(item.value / item.max) * 100}%`, backgroundColor: item.color, borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Tender Outcome Analysis */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>Tender Outcome Analysis</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Win ratio breakdown & procurement bidding outcome metrics</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>OVERALL BIDS WON</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A' }}>4</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Out of 10 tracked</div>
            </div>
            <div>
              {[
                { label: 'Under Review (2)', value: '#20.6M', color: '#1D4ED8', w: '90%' },
                { label: 'Submitted (2)', value: '#59.0M', color: '#8B5CF6', w: '75%' },
                { label: 'Awaiting Decision (4)', value: '#10.8M', color: '#3B82F6', w: '50%' },
                { label: 'Awarded (2)', value: '#47.0M', color: '#10B981', w: '85%' },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                    <span style={{ color: '#334155' }}>{item.label}</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{item.value}</span>
                  </div>
                  <div style={{ height: '6px', width: '100%', backgroundColor: '#F1F5F9', borderRadius: '3px' }}>
                    <div style={{ height: '100%', width: item.w, backgroundColor: item.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>AWAITING DECISION</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>1</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Bids submitted</div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#334155' }}>
              <div>Lost (1) <span style={{ color: '#64748B' }}>#12.2M</span></div>
              <div style={{ height: '6px', width: '100%', backgroundColor: '#F1F5F9', borderRadius: '3px', marginTop: '4px' }}>
                <div style={{ height: '100%', width: '15%', backgroundColor: '#EF4444', borderRadius: '3px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
