import React, { useState } from 'react';
import {
  FiDownload, FiFilter, FiCalendar, FiPieChart, FiBarChart2, FiTrendingUp, FiDollarSign
} from 'react-icons/fi';
import { mockProcurementSummary } from '../../data/mockProcurement';

const fmt = n => '₦' + (n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : (n / 1_000).toFixed(0) + 'K');

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function ProcurementReports() {
  const [period, setPeriod] = useState('YTD'); // 'Month', 'QTR', 'YTD'
  
  const totalSpend = mockProcurementSummary.monthlySpend.reduce((acc, curr) => acc + curr.spend, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Procurement Reports & Analytics</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Overview of spending, category breakdown, and vendor performance</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
            {['Month', 'QTR', 'YTD'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                  backgroundColor: period === p ? '#fff' : 'transparent', color: period === p ? '#0F172A' : '#64748B',
                  boxShadow: period === p ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                {p}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
            <FiDownload size={14} /> Export Report
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiDollarSign size={20} />} label="Total Spend (YTD)" value={fmt(totalSpend)} sub="Up 12% vs last year" accent="#1D4ED8" />
        <StatCard icon={<FiPieChart size={20} />} label="Top Category" value="Tech Equip." sub="25% of total spend" accent="#7C3AED" />
        <StatCard icon={<FiTrendingUp size={20} />} label="Total POs" value="128" sub="Completed orders" accent="#16A34A" />
        <StatCard icon={<FiBarChart2 size={20} />} label="Avg. Order Value" value={fmt(totalSpend/128)} sub="Across all categories" accent="#0891B2" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Spend Trend Placeholder */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><FiBarChart2 color="#94A3B8"/> Monthly Spend Trend</h3>
          
          <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '16px', paddingTop: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
             {mockProcurementSummary.monthlySpend.map((m, i) => {
               const max = Math.max(...mockProcurementSummary.monthlySpend.map(s => s.spend));
               const heightPct = (m.spend / max) * 100;
               return (
                 <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                   <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{fmt(m.spend)}</div>
                   <div style={{ width: '100%', backgroundColor: '#DBEAFE', borderRadius: '4px 4px 0 0', height: `${heightPct}%`, minHeight: '10px', transition: 'height 0.5s ease', position: 'relative' }}>
                     <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1D4ED8', height: '60%', borderRadius: '0', opacity: 0.8 }} />
                   </div>
                   <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{m.month}</div>
                 </div>
               )
             })}
          </div>
        </div>

        {/* Spend by Category */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><FiPieChart color="#94A3B8"/> Spend by Category</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mockProcurementSummary.categorySpend.map((cat, i) => {
              const colors = ['#1D4ED8', '#7C3AED', '#0891B2', '#16A34A', '#D97706', '#94A3B8'];
              const color = colors[i % colors.length];
              return (
                <div key={cat.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{cat.category}</span>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>{cat.pct}% <span style={{ color: '#CBD5E1', margin: '0 4px' }}>|</span> {fmt(cat.amount)}</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cat.pct}%`, backgroundColor: color, borderRadius: '999px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      
      {/* Top Vendors Table */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: '20px' }}>Top Vendors by Spend</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Vendor Name</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Spend</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {mockProcurementSummary.topVendors.map((v, i) => (
              <tr key={v.name} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>{v.name}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: '#1D4ED8' }}>{fmt(v.amount)}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>{((v.amount / totalSpend) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
