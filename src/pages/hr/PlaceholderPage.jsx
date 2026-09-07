import React from 'react';
import Badge from '../../components/ui/Badge';

export function GenericHRPage({ title, description, category = 'Human Resources', stats = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-900)' }}>{title}</h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem', marginTop: '4px' }}>
            {category} &bull; {description}
          </p>
        </div>
        <button className="btn btn-primary">+ Create New Record</button>
      </div>

      {stats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {stats.map((s, i) => (
            <div key={i} className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy-dark)', marginTop: '8px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-emerald-600)', marginTop: '4px', fontWeight: 500 }}>
                {s.trend}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#EFF6FF',
            color: 'var(--color-navy-dark)',
            fontSize: '1.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          📋
        </div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
          {title} Module
        </h3>
        <p style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem', maxWidth: '450px', margin: '8px auto 20px auto' }}>
          Manage all {title.toLowerCase()} operational records, approvals, and workflow routines for PGSL ERP.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-secondary">Download Report</button>
          <button className="btn btn-primary">Configure Workflow</button>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  return (
    <GenericHRPage
      title="HR Overview & Analytics Dashboard"
      description="Real-time personnel metrics, headcount distribution, and active operations."
      stats={[
        { label: 'Total Personnel', value: '148 Staff', trend: '+4 this month' },
        { label: 'Active Deployments', value: '92 Field Staff', trend: 'Bonny, Lekki & Eket' },
        { label: 'Pending Leave Requests', value: '7 Requests', trend: 'Requires Approval' },
        { label: 'Expiring Certifications', value: '3 Certificates', trend: 'Next 30 Days' },
      ]}
    />
  );
}

export function RecruitmentPage() {
  return (
    <GenericHRPage
      title="Recruitment & Applicant Tracking"
      description="Manage open requisitions, candidate pipelines, and interview schedules."
      stats={[
        { label: 'Open Requisitions', value: '5 Positions', trend: 'Engineering & HSE' },
        { label: 'Active Candidates', value: '34 Applicants', trend: '12 Screened' },
      ]}
    />
  );
}

export function OnboardingPage() {
  return (
    <GenericHRPage
      title="Onboarding & Orientation"
      description="Track new hire onboarding tasks, document verification, and orientation status."
    />
  );
}

export function DeploymentPage() {
  return (
    <GenericHRPage
      title="Project Deployment & Logistics"
      description="Manage field deployment schedules, site clearings, and rotation rosters."
    />
  );
}

export function TrainingCertificationsPage() {
  return (
    <GenericHRPage
      title="Training & Certifications Management"
      description="Track BOSIET, Offshore Safety, and technical skill certifications compliance."
    />
  );
}

export function LeaveManagementPage() {
  return (
    <GenericHRPage
      title="Leave Management System"
      description="Review and approve annual, sick, and emergency leave requests across departments."
    />
  );
}

export function AttendanceTimesheetsPage() {
  return (
    <GenericHRPage
      title="Attendance & Offshore Timesheets"
      description="Monitor site check-ins, monthly timesheet approvals, and overtime logs."
    />
  );
}

export function PayrollInputsPage() {
  return (
    <GenericHRPage
      title="Payroll Inputs & Allowances"
      description="Process basic salary structures, site allowances, tax, and pension deductions."
    />
  );
}

export function GrievancesDisciplinePage() {
  return (
    <GenericHRPage
      title="Grievances & Disciplinary Actions"
      description="Record code of conduct incidents, formal inquiries, and resolution logs."
    />
  );
}

export function RequestsPage() {
  return (
    <GenericHRPage
      title="Staff Service Requests"
      description="Process ID card requests, salary advance applications, and travel allowances."
    />
  );
}

export function TasksPage() {
  return (
    <GenericHRPage
      title="HR Task Operations"
      description="Internal action items, performance review schedules, and compliance tasks."
    />
  );
}

export function HRDocumentsPage() {
  return (
    <GenericHRPage
      title="HR Document Repository"
      description="Standard operating procedures, company policies, and template contracts."
    />
  );
}

export function ReportsPage() {
  return (
    <GenericHRPage
      title="HR Executive Reports & Audits"
      description="Generate monthly turnover rate, headcount summary, and compliance reports."
    />
  );
}
