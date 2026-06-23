import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, Map, Users, FileText,
  BarChart2, Bell, Settings, Shield, ChevronRight, LogOut
} from 'lucide-react';
import { useStation } from '../hooks/useStation';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/alerts', icon: AlertTriangle, label: 'Live Alerts', badge: true },
  { path: '/map', icon: Map, label: 'Map Monitor' },
  { path: '/officers', icon: Users, label: 'Officers' },
  { path: '/reports', icon: FileText, label: 'Case Reports' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { path: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const { station } = useStation();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon" style={{ overflow: 'hidden', borderRadius: '50%', background: 'transparent', width: '56px', height: '56px', minWidth: '56px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/sankatmochan-logo.jpg" alt="Sankatmochan Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {!collapsed && (
          <div className="logo-text">
            <span className="logo-title">Sankatmochan</span>
            <span className="logo-sub">SERS Command</span>
          </div>
        )}
      </div>

      {/* Station badge */}
      {!collapsed && (
        <div className="station-info">
          <div className="station-dot" />
          <span title={station.name}>{station.name}</span>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {!collapsed && <span className="nav-section-label">Main Menu</span>}

        {navItems.map(({ path, icon: Icon, label, badge }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? label : ''}
          >
            <Icon size={17} strokeWidth={2} />
            {!collapsed && <span>{label}</span>}
            {!collapsed && badge && <span className="nav-badge">•</span>}
            {!collapsed && <ChevronRight size={13} className="nav-chevron" />}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <button className="nav-item logout-btn" onClick={() => navigate('/login')}>
          <LogOut size={17} strokeWidth={2} />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight
            size={15}
            style={{
              transform: collapsed ? 'none' : 'rotate(180deg)',
              transition: 'transform 0.28s',
            }}
          />
        </button>
      </div>
    </aside>
  );
}
