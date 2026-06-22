import React, { useState } from 'react';
import { Bell, Search, Sun, Moon, ChevronDown, User, Settings, AlertTriangle, Shield, UserCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAdminProfile } from '../hooks/useAdmin';
import { useAlerts, usePendingOfficers } from '../hooks/useAlerts';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

// Mirror the same localStorage keys used in Notifications.jsx
function loadReadSet() {
  try { return new Set(JSON.parse(localStorage.getItem('sers-notif-read') || '[]')); }
  catch { return new Set(); }
}
function loadRemovedSet() {
  try { return new Set(JSON.parse(localStorage.getItem('sers-notif-removed') || '[]')); }
  catch { return new Set(); }
}

// ── Strong multi-tone alarm ───────────────────────────────────────────────────
function playAlarmSound(type = 'emergency') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const tones = type === 'emergency'
      // Emergency: three rising urgent tones (like a siren)
      ? [
          { freq: 880,  start: 0.00, dur: 0.18 },
          { freq: 1046, start: 0.22, dur: 0.18 },
          { freq: 1318, start: 0.44, dur: 0.22 },
          { freq: 1046, start: 0.70, dur: 0.18 },
          { freq: 880,  start: 0.92, dur: 0.18 },
        ]
      // Officer: two calm rising notification tones
      : [
          { freq: 523, start: 0.00, dur: 0.16 },
          { freq: 784, start: 0.20, dur: 0.20 },
        ];

    tones.forEach(({ freq, start, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type === 'emergency' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.01);
    });
  } catch (e) {
    console.warn('Audio blocked:', e);
  }
}

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { profile } = useAdminProfile();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const { alerts } = useAlerts();
  const { pending: pendingOfficers } = usePendingOfficers();

  const [readIds]  = useState(() => loadReadSet());
  const removedIds = loadRemovedSet();

  // ── Build incident notifications ─────────────────────────────
  const incidentNotifs = alerts
    .filter(a => !removedIds.has(a.id))
    .map(a => {
      const citizen  = a.citizenName || a.citizen || a.fullName || a.name || 'Unknown Citizen';
      const etype    = a.type || a.emergencyType || 'Emergency';
      const location = a.location || (a.lat ? `GPS ${Number(a.lat).toFixed(3)}, ${Number(a.lng).toFixed(3)}` : null);
      const prefix   = a.status === 'critical' ? 'CRITICAL — ' : '';
      const officer  = a.assignedOfficerName || a.officerName || null;

      let message = location
        ? `${prefix}${etype} reported by ${citizen} at ${location}`
        : `${prefix}${etype} reported by ${citizen}`;
      if (officer) message += `. Officer ${officer} dispatched.`;

      return {
        id:      a.id,
        type:    officer ? 'officer' : 'emergency',
        message,
        time:    (a.time || a.createdAt?.toDate?.()?.toLocaleTimeString?.('en-US', { hour: '2-digit', minute: '2-digit' }) || 'Just now').toString(),
        read:    readIds.has(a.id) || a.status === 'resolved',
      };
    });

  // ── Build officer verification notifications ──────────────────
  const officerNotifs = pendingOfficers
    .filter(o => !removedIds.has('off-' + o.id))
    .map(o => ({
      id:      'off-' + o.id,
      type:    'verification',
      message: `${o.name || o.fullName || 'An officer'} has requested verification and is awaiting approval.`,
      time:    o.createdAt?.toDate
        ? o.createdAt.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : 'Recently',
      read:    readIds.has('off-' + o.id),
    }));

  const notifications = [...officerNotifs, ...incidentNotifs];
  const unread = notifications.filter(n => !n.read).length;

  // ── Toast for new incoming alerts ─────────────────────────────
  const [toast, setToast] = useState(null);
  const prevAlertsRef         = React.useRef(alerts.length);
  const prevPendingRef        = React.useRef(pendingOfficers.length);

  React.useEffect(() => {
    if (alerts.length > prevAlertsRef.current && prevAlertsRef.current > 0) {
      const a = alerts[0];
      if (a) {
        const citizen  = a.citizenName || a.citizen || a.name || 'Unknown Citizen';
        const etype    = a.type || a.emergencyType || 'Emergency';
        const location = a.location ? ` at ${a.location}` : '';
        setToast({ msg: `New Incident: ${etype} reported by ${citizen}${location}`, type: 'emergency' });
        playAlarmSound('emergency');
        setTimeout(() => setToast(null), 6000);
      }
    }
    prevAlertsRef.current = alerts.length;
  }, [alerts]);

  React.useEffect(() => {
    if (pendingOfficers.length > prevPendingRef.current && prevPendingRef.current > 0) {
      const o = pendingOfficers[pendingOfficers.length - 1];
      if (o) {
        setToast({ msg: `Officer Registration: ${o.name || o.fullName || 'New officer'} requested verification.`, type: 'officer' });
        playAlarmSound('officer');
        setTimeout(() => setToast(null), 6000);
      }
    }
    prevPendingRef.current = pendingOfficers.length;
  }, [pendingOfficers]);

  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const closeAll = () => { setShowNotif(false); setShowProfile(false); };

  return (
    <header className="navbar">
      {/* Search */}
      <div className="navbar-search">
        <Search size={15} />
        <input
          type="text"
          placeholder="Search incidents, officers, zones…"
          id="global-search"
        />
        <kbd>⌘ K</kbd>
      </div>

      <div className="navbar-right">
        {/* Theme toggle */}
        <button className="icon-btn" onClick={toggle} id="theme-toggle" title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div className="notif-wrapper">
          <button
            className="icon-btn"
            id="notif-btn"
            onClick={() => { setShowNotif(v => !v); setShowProfile(false); }}
            title="Notifications"
          >
            <Bell size={16} />
            {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
          </button>

          {showNotif && (
            <div className="dropdown notif-dropdown">
              <div className="dropdown-header">
                <span>Notifications</span>
                {unread > 0 && <span className="badge badge-red">{unread} new</span>}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No notifications yet
                  </div>
                ) : notifications.slice(0, 6).map(n => (
                  <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                    <div className={`notif-icon ${n.type === 'verification' ? 'officer' : n.type}`}>
                      {n.type === 'emergency'
                        ? <AlertTriangle size={13} />
                        : n.type === 'verification'
                          ? <UserCheck size={13} />
                          : <Shield size={13} />}
                    </div>
                    <div>
                      <p className="notif-msg">{n.message}</p>
                      <span className="notif-time">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="dropdown-footer"
                onClick={() => { navigate('/notifications'); closeAll(); }}
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="profile-wrapper">
          <button
            className="profile-btn"
            id="profile-btn"
            onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}
          >
            <div className="avatar">{initials}</div>
            <div className="profile-info">
              <span className="profile-name">{profile.name}</span>
              <span className="profile-role">Super Admin</span>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--text-muted)', marginLeft: 2 }} />
          </button>

          {showProfile && (
            <div className="dropdown profile-dropdown">
              <div className="dropdown-profile-head">
                <div className="avatar avatar-lg">{initials}</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {profile.name}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{profile.email}</p>
                </div>
              </div>
              <hr className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => { navigate('/settings'); closeAll(); }}>
                <User size={14} /> My Profile
              </button>
              <button className="dropdown-item" onClick={() => { navigate('/settings'); closeAll(); }}>
                <Settings size={14} /> Preferences
              </button>
              <hr className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={() => { navigate('/login'); closeAll(); }}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Toast */}
      {toast && (
        <div className={`global-toast animate-in ${toast.type === 'officer' ? 'toast-officer' : 'toast-emergency'}`}>
          {toast.type === 'officer' ? <UserCheck size={15} style={{ flexShrink: 0 }} /> : <AlertTriangle size={15} style={{ flexShrink: 0 }} />}
          {toast.msg}
        </div>
      )}
    </header>
  );
}
