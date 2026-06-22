import React, { useState } from 'react';
import { Bell, AlertTriangle, Shield, Settings, Check, Trash2, UserCheck } from 'lucide-react';
import { useAlerts, usePendingOfficers } from '../hooks/useAlerts';
import './Notifications.css';

const typeIcon = {
  emergency:    { icon: AlertTriangle, color: '#e63946', bg: 'rgba(230,57,70,0.1)',   label: 'Emergency' },
  officer:      { icon: Shield,        color: '#2557a7', bg: 'rgba(37,87,167,0.1)',   label: 'Officer Update' },
  verification: { icon: UserCheck,     color: '#f59f00', bg: 'rgba(245,159,0,0.1)',   label: 'Verification Request' },
  system:       { icon: Settings,      color: '#2a9d8f', bg: 'rgba(42,157,143,0.1)',  label: 'System' },
};

// ── Persist read/removed sets in localStorage ─────────────────────────────
function loadSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
  catch { return new Set(); }
}
function saveSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export default function Notifications() {
  const { alerts } = useAlerts();
  const { pending: pendingOfficers } = usePendingOfficers();

  const [readIds,    setReadIds]    = useState(() => loadSet('sers-notif-read'));
  const [removedIds, setRemovedIds] = useState(() => loadSet('sers-notif-removed'));
  const [filter, setFilter] = useState('all');

  const markRead = (id) => {
    setReadIds(prev => {
      const next = new Set(prev).add(id);
      saveSet('sers-notif-read', next);
      return next;
    });
  };

  const markAll = () => {
    const allIds = [
      ...alerts.map(a => a.id),
      ...pendingOfficers.map(o => 'off-' + o.id),
    ];
    const next = new Set(allIds);
    setReadIds(next);
    saveSet('sers-notif-read', next);
  };

  const remove = (id) => {
    setRemovedIds(prev => {
      const next = new Set(prev).add(id);
      saveSet('sers-notif-removed', next);
      return next;
    });
    markRead(id);
  };

  // ── Officer verification request notifications ────────────────
  const officerNotifs = pendingOfficers
    .filter(o => !removedIds.has('off-' + o.id))
    .map(o => ({
      id:      'off-' + o.id,
      type:    'verification',
      message: `${o.name || o.fullName || 'An officer'} has requested verification and is awaiting your approval.`,
      time:    o.createdAt?.toDate
        ? o.createdAt.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : 'Recently',
      read:    readIds.has('off-' + o.id),
    }));

  // ── Incident notifications ────────────────────────────────────
  const incidentNotifs = alerts
    .filter(a => !removedIds.has(a.id))
    .map(a => {
      const citizen  = a.citizenName || a.citizen || a.fullName || a.name || 'Unknown Citizen';
      const etype    = a.type || a.emergencyType || 'Emergency';
      const location = a.location || (a.lat ? `GPS ${Number(a.lat).toFixed(4)}, ${Number(a.lng).toFixed(4)}` : null);
      const prefix   = a.status === 'critical' ? 'CRITICAL — ' : '';
      const officer  = a.assignedOfficerName || a.officerName || null;

      let message = location
        ? `${prefix}${etype} reported by ${citizen} at ${location}`
        : `${prefix}${etype} reported by ${citizen}`;
      if (officer) message += `. Officer ${officer} dispatched.`;

      const timeStr = a.time
        ? a.time
        : a.createdAt?.toDate
          ? a.createdAt.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : 'Just now';

      return {
        id:      a.id,
        type:    officer ? 'officer' : 'emergency',
        message,
        time:    timeStr.toString(),
        read:    readIds.has(a.id) || a.status === 'resolved',
      };
    });

  // Combine: verification requests on top, then incidents
  const notifs = [...officerNotifs, ...incidentNotifs];

  const filtered = notifs.filter(n => {
    if (filter === 'unread')       return !n.read;
    if (filter === 'emergency')    return n.type === 'emergency';
    if (filter === 'verification') return n.type === 'verification';
    if (filter === 'system')       return n.type === 'system';
    return true;
  });

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="notifs-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">{unread} unread alert{unread !== 1 ? 's' : ''}</p>
        </div>
        <div className="header-actions">
          {unread > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={markAll}>
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card alerts-toolbar" style={{ padding: '12px 16px' }}>
        <div className="filter-tabs">
          {[
            { key: 'all',          label: `All (${notifs.length})` },
            { key: 'unread',       label: `Unread (${unread})` },
            { key: 'verification', label: `Verifications (${officerNotifs.length})` },
            { key: 'emergency',    label: 'Emergencies' },
          ].map(f => (
            <button
              key={f.key}
              className={`filter-tab ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="notif-full-list">
        {filtered.length === 0 && (
          <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={40} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
            <p>{filter === 'unread' ? 'All caught up — no unread notifications.' : 'No notifications in this category.'}</p>
          </div>
        )}
        {filtered.map((n, idx) => {
          const meta = typeIcon[n.type] || typeIcon.system;
          const Icon = meta.icon;
          return (
            <div
              key={n.id}
              className={`card notif-card animate-in ${!n.read ? 'unread-card' : ''}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="notif-card-icon" style={{ background: meta.bg }}>
                <Icon size={18} style={{ color: meta.color }} />
              </div>
              <div className="notif-card-body">
                <div className="notif-card-top">
                  <span className="notif-card-type" style={{ color: meta.color }}>{meta.label}</span>
                  {!n.read && <span className="unread-pill">New</span>}
                  <span className="notif-card-time">{n.time}</span>
                </div>
                <p className="notif-card-msg">{n.message}</p>
              </div>
              <div className="notif-card-actions">
                {!n.read && (
                  <button className="icon-action" title="Mark as read" onClick={() => markRead(n.id)}>
                    <Check size={14} />
                  </button>
                )}
                <button className="icon-action danger" title="Delete" onClick={() => remove(n.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
