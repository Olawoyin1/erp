import React, { useState } from 'react';
import {
  FiDownload, FiCalendar, FiFilter, FiPrinter, FiTrendingUp,
  FiTrendingDown, FiDollarSign, FiPieChart, FiFileText
} from 'react-icons/fi';
import Toast, { useToast } from '../../components/ui/Toast';

const fmt = (n) => '₦' + Number(n).toLocaleString();

export default function FinanceReports() {
  const [activeTab, setActiveTab] = useState('pnl'); // 'pnl' | 'balance' | 'cashflow' | 'aging'
  const [period, setPeriod] = useState('Q2 2026');
  const [currency, setCurrency] = useState('NGN');
  const { toast, showToast, hideToast } = useToast();

  const handleExport = (type) => {
    showToast(`Generating ${activeTab.toUpperCase()} report in ${type} format...`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Financial Reports & Statements
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Comprehensive IFRS-compliant accounting statements, trial balances, and cash flow forecasts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => handleExport('Excel')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FiDownload size={14} /> Export Excel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleExport('PDF')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, border: 'none'
            }}
          >
            <FiPrinter size={14} /> Print / PDF
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'CONTRACT REVENUE', value: '₦18.45B', trend: '+14.2%', text: 'vs prior year', pos: true },
          { title: 'COST OF SALES', value: '₦11.24B', trend: '60.9%', text: 'burn ratio', pos: false },
          { title: 'GROSS PROFIT', value: '₦7.21B', trend: '39.1%', text: 'gross margin', pos: true },
          { title: 'NET OPERATING PROFIT', value: '₦4.85B', trend: '+14.1%', text: 'vs Q1', pos: true }
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em', marginBottom: '8px' }}>
              {stat.title}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: stat.pos ? '#10B981' : '#DC2626', fontWeight: 600 }}>
                {stat.pos ? '↗' : '↘'} {stat.trend}
              </span>
              <span style={{ color: '#94A3B8' }}>{stat.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Statement Card */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Toolbar & Selectors */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'pnl', label: 'Profit & Loss (P&L)' },
              { id: 'balance', label: 'Balance Sheet' },
              { id: 'cashflow', label: 'Cash Flow' },
              { id: 'aging', label: 'Aging Analysis' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: activeTab === t.id ? '1px solid #1D4ED8' : '1px solid #E2E8F0',
                  background: activeTab === t.id ? '#EFF6FF' : '#FFFFFF',
                  color: activeTab === t.id ? '#1D4ED8' : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.813rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem', background: '#FFF' }}
            >
              <option value="June 2026">June 2026</option>
              <option value="Q2 2026">Q2 2026</option>
              <option value="H1 2026">H1 2026</option>
              <option value="FY 2026">FY 2026</option>
            </select>

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem', background: '#FFF' }}
            >
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>

        {/* P&L Statement Table */}
        {activeTab === 'pnl' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                STATEMENT OF COMPREHENSIVE INCOME (P&L)
              </h3>
              <div style={{ fontSize: '0.813rem', color: '#64748B', marginTop: '4px' }}>
                For the period ending {period} • Currency: {currency}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 600 }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>LINE ITEM</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>CURRENT PERIOD ({period})</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>PRIOR PERIOD</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>VARIANCE</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>EPC Contract Billings</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>{fmt(14500000000)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(12800000000)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16A34A', fontWeight: 600 }}>+13.2%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>Marine Logistics & Vessel Charter</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>{fmt(3950000000)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(3350000000)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16A34A', fontWeight: 600 }}>+17.9%</td>
                </tr>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontWeight: 700 }}>
                  <td style={{ padding: '10px 14px' }}>TOTAL REVENUE</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(18450000000)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(16150000000)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16A34A' }}>+14.2%</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 14px', color: '#64748B' }}>Less: Direct Material Procurement</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>({fmt(6200000000)})</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>({fmt(5400000000)})</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>+14.8%</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 14px', color: '#64748B' }}>Less: Direct Subcontractor & Fabrication</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>({fmt(3840000000)})</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>({fmt(3200000000)})</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>+20.0%</td>
                </tr>
                <tr style={{ background: '#F0FDF4', borderBottom: '1px solid #DCFCE7', fontWeight: 700, color: '#16A34A' }}>
                  <td style={{ padding: '10px 14px' }}>GROSS PROFIT</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(7210000000)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(6450000000)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>+11.8%</td>
                </tr>
                <tr style={{ background: '#EFF6FF', borderTop: '2px solid #BFDBFE', fontWeight: 700, color: '#1D4ED8' }}>
                  <td style={{ padding: '12px 14px' }}>NET OPERATING INCOME BEFORE TAX</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>{fmt(4850000000)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>{fmt(4250000000)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>+14.1%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Balance Sheet Table */}
        {activeTab === 'balance' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', borderBottom: '2px solid #1D4ED8', paddingBottom: '6px', margin: '0 0 10px 0' }}>
                ASSETS
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 0', color: '#64748B' }}>Cash and Bank Balances</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{fmt(4050000000)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 0', color: '#64748B' }}>Trade Accounts Receivable</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{fmt(6820000000)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 0', color: '#64748B' }}>Property, Plant & Equipment (Vessels & Cranes)</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{fmt(24500000000)}</td>
                  </tr>
                  <tr style={{ fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8' }}>
                    <td style={{ padding: '10px 8px' }}>TOTAL ASSETS</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmt(38800000000)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', borderBottom: '2px solid #7C3AED', paddingBottom: '6px', margin: '0 0 10px 0' }}>
                LIABILITIES & EQUITY
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 0', color: '#64748B' }}>Trade Accounts Payable</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{fmt(3420000000)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 0', color: '#64748B' }}>Long-Term Project Financing</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{fmt(8500000000)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 0', color: '#64748B' }}>Share Capital & Retained Earnings</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{fmt(24595000000)}</td>
                  </tr>
                  <tr style={{ fontWeight: 700, background: '#F5F3FF', color: '#6D28D9' }}>
                    <td style={{ padding: '10px 8px' }}>TOTAL LIABILITIES & EQUITY</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmt(38800000000)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cash Flow Statement */}
        {activeTab === 'cashflow' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 600 }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>ACTIVITY</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>NET AMOUNT ({currency})</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>Net Cash from Operating Activities</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16A34A', fontWeight: 600 }}>{fmt(4900000000)}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>Net Cash used in Investing Activities (Vessels & Cranes)</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>({fmt(2200000000)})</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>Net Cash used in Financing Activities (Loan Repayments)</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>({fmt(950000000)})</td>
              </tr>
              <tr style={{ background: '#EFF6FF', borderTop: '2px solid #BFDBFE', fontWeight: 700, color: '#1D4ED8' }}>
                <td style={{ padding: '12px 14px' }}>NET SURPLUS IN CASH AND CASH EQUIVALENTS</td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>{fmt(1750000000)}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Aging Analysis */}
        {activeTab === 'aging' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 600 }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>ACCOUNT / COUNTERPARTY</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>0-30 DAYS</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>31-60 DAYS</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>61-90 DAYS</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>90+ DAYS</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>NNPC Ltd (Client Receivable)</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(1200000000)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(450000000)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(150000000)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#DC2626' }}>₦0</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>{fmt(1800000000)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>Shell Nigeria (Client Receivable)</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(2100000000)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(680000000)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>{fmt(220000000)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#DC2626' }}>{fmt(140000000)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>{fmt(3140000000)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>NigerDock Fabrication (Vendor Payable)</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>({fmt(650000000)})</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>({fmt(180000000)})</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>₦0</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>₦0</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>({fmt(830000000)})</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
