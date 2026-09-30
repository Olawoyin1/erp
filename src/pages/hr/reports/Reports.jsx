import React from 'react';
import { FiUpload } from 'react-icons/fi';

export default function Reports() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Reports- Human Resources</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Track workforce trends, operational performance, and HR analytics
          </p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'TOTAL EMPLOYEES', value: '184', trend: '+12.4%', text: 'vs last year', bg: '#EFF6FF', pos: true },
          { title: 'RECRUITMENT SUCCESS', value: '61%', trend: '+4.2%', text: 'vs last year', bg: '#EEF2FF', pos: true },
          { title: 'ANNUAL TURNOVER', value: '5.8%', trend: '-5%', text: 'vs Q1 average', bg: '#FDF4FF', pos: false },
          { title: 'ACTIVE DEPARTMENTS', value: '9', trend: null, bg: '#F5F3FF' },
          { title: 'TRAINING COMPLIANCE', value: '87.4%', trend: '+12.4%', text: 'vs last year', bg: '#ECFDF5', pos: true },
          { title: 'ATTENDANCE RATE', value: '94.6%', trend: '+4.2%', text: 'vs last year', bg: '#FAF5FF', pos: true },
          { title: 'EXPIRING CERTS', value: '14', trend: '60 days', text: '', bg: '#FFF7ED', pos: false, isRedText: true },
          { title: 'HSE COMPLIANCE RATING', value: '100%', trend: null, bg: '#EFF6FF' }
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{stat.title}</span>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {/* Icon placeholder */}
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>{stat.value}</div>
            
            {stat.trend && (
               <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 {stat.isRedText ? (
                   <span style={{ color: '#DC2626' }}>{stat.trend}</span>
                 ) : (
                   <span style={{ color: stat.pos ? '#10B981' : '#DC2626', fontWeight: 500 }}>
                     {stat.pos ? '↗' : '↘'} {stat.trend}
                   </span>
                 )}
                 {stat.text && <span style={{ color: '#94A3B8' }}>{stat.text}</span>}
               </div>
            )}
            {!stat.trend && <div style={{ height: '18px' }} />}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Workforce Distribution Chart (Mock UI) */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>Workforce Distribution</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Rolling monthly headcounts (Jan-Jun 2025)</p>
          </div>
          <div style={{ position: 'relative', height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: '20px' }}>
            <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, borderTop: '1px dashed #E2E8F0' }} />
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed #E2E8F0' }} />
            <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, borderTop: '1px dashed #E2E8F0' }} />
            
            {/* SVG Line representation matching design approx */}
            <svg viewBox="0 0 400 150" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
               <path d="M 0,50 L 50,50 L 80,100 L 120,100 L 160,50 L 190,50 L 220,90 L 270,90 L 300,70 L 330,70 L 370,40 L 400,40" fill="none" stroke="#1D4ED8" strokeWidth="3" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: '#94A3B8', fontSize: '0.75rem' }}>
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
          </div>
        </div>

        {/* Regulatory Certification Compliance Index */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>Regulatory Certification Compliance Index</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Safety, clearance, and certification compliance against statutory requirements</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { label: 'STCW / NIMIS Compliance', value: 96, color: '#1D4ED8' },
              { label: 'COREN Engineering Registration', value: 92, color: '#8B5CF6' },
              { label: 'BOCIE Certification Compliance', value: 88, color: '#3B82F6' },
              { label: 'BOCIE Certification Compliance', value: 86, color: '#F59E0B' }
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#334155' }}>
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 600 }}>{item.value}%</span>
                </div>
                <div style={{ height: '8px', width: '100%', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.value}%`, backgroundColor: item.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
