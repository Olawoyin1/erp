import React from 'react';
import { FiSearch, FiBell, FiChevronDown, FiPlus, FiMenu } from 'react-icons/fi';

export default function Header({ onMobileToggle }) {
  return (
    <header className="header">
      <button 
        className="header-mobile-toggle"
        onClick={onMobileToggle}
        title="Open navigation menu"
      >
        <FiMenu size={18} />
      </button>

      <div className="header-search">
        <span className="header-search-icon">
          <FiSearch size={15} />
        </span>
        <input type="text" placeholder="Search clients, RFQs, opportunity value, assignees..." />
      </div>

      <div className="header-actions">
        <button className="btn-quick-actions">
          <FiPlus size={14} />
          Quick Actions
          <FiChevronDown size={13} />
        </button>

        <button className="header-icon-btn">
          <FiBell size={18} />
          <span className="notif-badge">3</span>
        </button>

        <div className="header-divider" />

        <div className="header-user">
          <div className="header-avatar">CD</div>
          <div className="header-user-info">
            <span className="header-user-name">Chioma Davids</span>
            <span className="header-user-role">Super Admin</span>
          </div>
          <FiChevronDown size={13} style={{ color: '#94a3b8' }} />
        </div>
      </div>
    </header>
  );
}
