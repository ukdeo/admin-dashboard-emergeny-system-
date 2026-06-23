import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, AlertTriangle, Activity } from 'lucide-react';
import { useAlerts, useOfficers, useUsers } from '../hooks/useAlerts';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const { alerts } = useAlerts();
  const { officers } = useOfficers();
  const { users } = useUsers();

  const activeOfficers = officers.filter(o => o.status === 'available').length;
  const activeIncidents = alerts.filter(a => a.status !== 'resolved').length;

  return (
    <div className="landing-page">
      <div className="landing-bg">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />
        <div className="grid-overlay" />
      </div>

      <div className="landing-content">
        <div className="landing-brand">
          <div className="brand-logo" style={{ overflow: 'hidden', borderRadius: '50%', width: '140px', height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'transparent', margin: '0 auto 20px auto' }}>
            <img src="/sankatmochan-logo.jpg" alt="Sankatmochan Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <h1>Sankatmochan</h1>
          <p className="landing-subtitle">Smart Emergency Response System</p>
          <div className="brand-divider" />
          <p className="brand-tagline">
            Connecting responders with citizens when every second counts.
          </p>
        </div>

        {/* Live stat chips */}
        <div className="landing-stats-row">
          <div className="stat-chip">
            <div className="stat-chip-icon" style={{ background: 'rgba(59,91,219,0.2)' }}>
              <Users size={18} style={{ color: '#748ffc' }} />
            </div>
            <span>
              {activeOfficers > 0 ? activeOfficers : officers.length > 0 ? officers.length : '—'}
            </span>
            <small>Officers online</small>
          </div>
          <div className="stat-chip">
            <div className="stat-chip-icon" style={{ background: 'rgba(240,62,62,0.2)' }}>
              <AlertTriangle size={18} style={{ color: '#ff8787' }} />
            </div>
            <span>{alerts.length > 0 ? activeIncidents : '—'}</span>
            <small>Live incidents</small>
          </div>
          <div className="stat-chip">
            <div className="stat-chip-icon" style={{ background: 'rgba(47,158,68,0.2)' }}>
              <Activity size={18} style={{ color: '#69db7c' }} />
            </div>
            <span>{users.length > 0 ? users.length : '—'}</span>
            <small>Registered users</small>
          </div>
        </div>

        <button 
          onClick={() => navigate('/login')} 
          className="landing-login-btn"
        >
          Proceed to Admin Login
        </button>
      </div>
    </div>
  );
}
