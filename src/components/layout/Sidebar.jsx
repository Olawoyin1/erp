import { useEffect, useMemo, useState } from 'react';
import { settingsService } from '../../services/settings.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { usePermissions } from '../../hooks/usePermission';
import { NAV, filterNav } from './navConfig';

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermissions();

  // Only what the signed-in user may open: no entries, and no empty module sections, for the rest.
  const menu = useMemo(() => filterNav(NAV, can), [can]);

  const [openSections, setOpenSections] = useState({});
  const [branding, setBranding] = useState({ name: 'PGSL ERP', logoUrl: null });

  useEffect(() => {
    let live = true;
    const load = () => {
      settingsService.getBranding().then((res) => {
        const data = res.data?.data;
        if (live && data) setBranding({ name: data.organisationDisplayName || data.organisationName || 'PGSL ERP', logoUrl: data.logoUrl || null });
      }).catch(() => {});
    };
    load();
    window.addEventListener('branding-changed', load);
    return () => { live = false; window.removeEventListener('branding-changed', load); };
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isGroupActive = (item) => item.children?.some((child) => isActive(child.path));
  const isSectionOpen = (item) => openSections[item.path] ?? !!isGroupActive(item);

  const toggleSection = (item) => {
    setOpenSections((prev) => ({ ...prev, [item.path]: !isSectionOpen(item) }));
  };

  const goTo = (path) => {
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  const handleItemClick = (item) => {
    const hasChildren = !!item.children?.length;
    if (collapsed) {
      onToggle();
      if (hasChildren) setOpenSections((prev) => ({ ...prev, [item.path]: true }));
      else goTo(item.path);
      return;
    }
    if (hasChildren) toggleSection(item);
    else goTo(item.path);
  };

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onMobileClose} title="Close sidebar" />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-text" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {branding.logoUrl && <img src={branding.logoUrl} alt="" style={{ height: 26, width: 'auto', maxWidth: 90, objectFit: 'contain' }} />}
            {branding.name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="sidebar-collapse-btn desktop-only-btn" onClick={onToggle} title="Toggle sidebar">
              {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
            </button>
            <button className="sidebar-collapse-btn mobile-only-btn" onClick={onMobileClose} title="Close sidebar">
              <FiX size={16} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menu.map((section) => (
            <div key={section.section}>
              <div className="sidebar-section-label">{section.section}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = !!item.children?.length;
                const itemActive = hasChildren ? isGroupActive(item) : isActive(item.path);
                const open = hasChildren && isSectionOpen(item);

                return (
                  <div key={item.path}>
                    <div
                      className={`sidebar-item ${itemActive ? 'active' : ''}`}
                      onClick={() => handleItemClick(item)}
                      title={collapsed ? item.label : ''}
                    >
                      <span className="sidebar-item-icon"><Icon size={17} /></span>
                      <span className="sidebar-item-label">{item.label}</span>
                      {hasChildren && (
                        <span className={`sidebar-chevron ${open ? 'open' : ''}`}>
                          <FiChevronDown size={14} />
                        </span>
                      )}
                    </div>

                    {hasChildren && (
                      <div className={`sidebar-sub ${open ? 'open' : ''}`}>
                        <div className="sidebar-sub-content">
                          {item.children.map((child) => (
                            <div
                              key={child.path}
                              className={`sidebar-sub-item ${isActive(child.path) ? 'active' : ''}`}
                              onClick={() => goTo(child.path)}
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
      </aside>
    </>
  );
}
