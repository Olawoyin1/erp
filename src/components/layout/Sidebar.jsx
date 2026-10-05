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
  FiX,
  FiArrowUp,
  FiBarChart2,
  FiShoppingCart,
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
        label: 'Procurement',
        icon: <FiShoppingCart size={17} />,
        path: '/procurement',
        collapsible: true,
        children: [
          { label: 'Purchase Requests', path: '/procurement/requests' },
          { label: 'Purchase Orders', path: '/procurement/orders' },
          { label: 'Vendor Management', path: '/procurement/vendors' },
          { label: 'Inventory & Store', path: '/procurement/inventory' },
          { label: 'Procurement Reports', path: '/procurement/reports' },
        ],
      },
      {
        label: 'Technical',
        icon: <FiTool size={17} />,
        path: '/technical',
        collapsible: true,
        children: [
          { label: 'Projects', path: '/technical/projects' },
          { label: 'Engineering Documents', path: '/technical/engineering-docs' },
          { label: 'Calibration Records', path: '/technical/calibration' },
          { label: 'Resource Allocation', path: '/technical/resources' },
          { label: 'Tasks', path: '/technical/tasks' },
          { label: 'Technical Reports', path: '/technical/reports' },
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
          { label: 'Off-Shore Travel Docs', path: '/hse/offshore-travel' },
          { label: 'Emergency Preparedness', path: '/hse/emergency' },
          { label: 'Tasks', path: '/hse/tasks' },
          { label: 'HSE Documents', path: '/hse/documents' },
          { label: 'Reports', path: '/hse/reports' },
        ],
      },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState({ '/hr': true });

  const toggleSection = (path) => {
    setOpenSections((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const isActive = (path) => location.pathname === path;
  const isChildActive = (children) => children.some((c) => location.pathname.startsWith(c.path));

  const handleItemClick = (item) => {
    if (item.collapsible) {
      toggleSection(item.path);
    } else {
      navigate(item.path);
      if (onMobileClose) onMobileClose();
    }
  };

  const handleChildClick = (path) => {
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onMobileClose} title="Close sidebar" />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-text">PGSL ERP</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="sidebar-collapse-btn desktop-only-btn" onClick={onToggle} title="Toggle sidebar">
              <FiMenu size={15} />
            </button>
            <button className="sidebar-collapse-btn mobile-only-btn" onClick={onMobileClose} title="Close sidebar">
              <FiX size={16} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navConfig.map((section) => (
            <div key={section.section}>
              <div className="sidebar-section-label">{section.section}</div>
              {section.items.map((item) => {
                const isItemActive = isActive(item.path) || (item.children?.length && isChildActive(item.children));
                const isOpen = !!openSections[item.path];

                return (
                  <div key={item.path}>
                    <div
                      className={`sidebar-item ${isItemActive ? 'active' : ''}`}
                      onClick={() => handleItemClick(item)}
                      title={collapsed ? item.label : ''}
                    >
                      <span className="sidebar-item-icon">{item.icon}</span>
                      <span className="sidebar-item-label">{item.label}</span>
                      {item.collapsible && (
                        <span className={`sidebar-chevron ${isOpen ? 'open' : ''}`}>
                          <FiChevronDown size={14} />
                        </span>
                      )}
                    </div>

                    {item.children?.length > 0 && (
                      <div className={`sidebar-sub ${isOpen ? 'open' : ''}`}>
                        <div className="sidebar-sub-content">
                          {item.children.map((child) => (
                            <div
                              key={child.path}
                              className={`sidebar-sub-item ${isActive(child.path) || location.pathname === child.path ? 'active' : ''}`}
                              onClick={() => handleChildClick(child.path)}
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

        <div className="sidebar-footer">
          <div className="sidebar-upgrade-btn">
            <FiArrowUp size={14} />
            <span>Upgrade Plan</span>
          </div>
        </div>
      </aside>
    </>
  );
}
