import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiTrendingUp,
  FiUsers,
  FiSettings,
  FiDollarSign,
  FiTool,
  FiCheckCircle,
  FiAlertTriangle,
  FiChevronDown,
  FiMenu,
  FiArrowUp,
  FiBarChart2,
} from 'react-icons/fi';

const navConfig = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', icon: <FiGrid size={17} />, path: '/dashboard' },
      { label: 'Analytics', icon: <FiBarChart2 size={17} />, path: '/analytics' },
    ],
  },
  {
    section: 'Operations',
    items: [
      {
        label: 'Human Resources',
        icon: <FiUsers size={17} />,
        path: '/hr',
        collapsible: true,
        children: [
          { label: 'Employees', path: '/hr/employees' },
          { label: 'Recruitment', path: '/hr/recruitment' },
          { label: 'Onboarding', path: '/hr/onboarding' },
          { label: 'Deployment', path: '/hr/deployment' },
          { label: 'Training & Certifications', path: '/hr/certifications' },
          { label: 'Leave Management', path: '/hr/leave' },
          { label: 'Attendance & Timesheets', path: '/hr/attendance' },
          { label: 'Payroll Inputs', path: '/hr/payroll' },
          { label: 'Grievances & Discipline', path: '/hr/grievances' },
          { label: 'Requests', path: '/hr/requests' },
          { label: 'Tasks', path: '/hr/tasks' },
          { label: 'HR Documents', path: '/hr/documents' },
          { label: 'Reports', path: '/hr/reports' },
        ],
      },
      {
        label: 'Administration',
        icon: <FiSettings size={17} />,
        path: '/administration',
        collapsible: true,
        children: [
          { label: 'General Admin', path: '/admin/general' },
          { label: 'Facilities & Assets', path: '/admin/facilities' },
          { label: 'Company Fleet', path: '/admin/fleet' },
          { label: 'Visitor Logs', path: '/admin/visitors' },
        ],
      },
      {
        label: 'Accounts & Finance',
        icon: <FiDollarSign size={17} />,
        path: '/finance',
        collapsible: true,
        children: [
          { label: 'General Ledger', path: '/finance/ledger' },
          { label: 'Invoicing & Billing', path: '/finance/invoicing' },
          { label: 'Budgeting', path: '/finance/budget' },
          { label: 'Financial Reports', path: '/finance/reports' },
        ],
      },
      {
        label: 'Business Development',
        icon: <FiTrendingUp size={17} />,
        path: '/bizdev',
        collapsible: true,
        children: [
          { label: 'Client Pipeline', path: '/bizdev/pipeline' },
          { label: 'RFQs & Tenders', path: '/bizdev/tenders' },
          { label: 'Proposals', path: '/bizdev/proposals' },
          { label: 'CRM Contacts', path: '/bizdev/crm' },
        ],
      },
      {
        label: 'Technical',
        icon: <FiTool size={17} />,
        path: '/technical',
        collapsible: true,
        children: [
          { label: 'Engineering Projects', path: '/technical/projects' },
          { label: 'Maintenance Logs', path: '/technical/maintenance' },
          { label: 'Tooling & Equipment', path: '/technical/equipment' },
          { label: 'Work Orders', path: '/technical/work-orders' },
        ],
      },
    ],
  },
  {
    section: 'Compliance',
    items: [
      {
        label: 'Quality System',
        icon: <FiCheckCircle size={17} />,
        path: '/quality',
        collapsible: true,
        children: [
          { label: 'ISO Audits', path: '/quality/audits' },
          { label: 'Non-Conformance (NCR)', path: '/quality/ncr' },
          { label: 'Document Control', path: '/quality/doc-control' },
          { label: 'CAPA Logs', path: '/quality/capa' },
        ],
      },
      {
        label: 'HSE',
        icon: <FiAlertTriangle size={17} />,
        path: '/hse',
        collapsible: true,
        children: [
          { label: 'Incident Reporting', path: '/hse/incidents' },
          { label: 'Safety Audits', path: '/hse/audits' },
          { label: 'Permit to Work (PTW)', path: '/hse/ptw' },
          { label: 'HSE Metrics', path: '/hse/metrics' },
        ],
      },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState({ '/hr': true });

  const toggleSection = (path) => {
    setOpenSections((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const isActive = (path) => location.pathname === path;
  const isChildActive = (children) => children.some((c) => location.pathname.startsWith(c.path));

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-logo">
        {!collapsed && <span className="sidebar-logo-text">PGSL ERP</span>}
        <button className="sidebar-collapse-btn" onClick={onToggle} title="Toggle sidebar">
          <FiMenu size={15} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navConfig.map((section) => (
          <div key={section.section}>
            {!collapsed && <div className="sidebar-section-label">{section.section}</div>}
            {section.items.map((item) => {
              const isItemActive = isActive(item.path) || (item.children?.length && isChildActive(item.children));
              const isOpen = !!openSections[item.path];

              return (
                <div key={item.path}>
                  <div
                    className={`sidebar-item ${isItemActive ? 'active' : ''}`}
                    onClick={() => {
                      if (item.collapsible) {
                        toggleSection(item.path);
                      } else {
                        navigate(item.path);
                      }
                    }}
                    title={collapsed ? item.label : ''}
                  >
                    <span className="sidebar-item-icon">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="sidebar-item-label">{item.label}</span>
                        {item.collapsible && (
                          <span className={`sidebar-chevron ${isOpen ? 'open' : ''}`}>
                            <FiChevronDown size={14} />
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {!collapsed && item.children?.length > 0 && (
                    <div className={`sidebar-sub ${isOpen ? 'open' : ''}`}>
                      <div className="sidebar-sub-content">
                        {item.children.map((child) => (
                          <div
                            key={child.path}
                            className={`sidebar-sub-item ${isActive(child.path) || location.pathname === child.path ? 'active' : ''}`}
                            onClick={() => navigate(child.path)}
                          >
                            {child.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-upgrade-btn">
            <FiArrowUp size={14} />
            <span>Upgrade Plan</span>
          </div>
        </div>
      )}
    </aside>
  );
}
