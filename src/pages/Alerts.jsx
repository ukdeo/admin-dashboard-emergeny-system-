import React, { useState } from 'react';
import { AlertTriangle, Search, Eye, UserPlus, Clock, MapPin, Wifi, WifiOff, Loader, X, Brain, Sparkles } from 'lucide-react';
import { useAlerts, useOfficers } from '../hooks/useAlerts';
import { updateAlertStatus, assignOfficer, resolveAlert } from '../services/alertService';
import { aiService } from '../services/aiService';
import './Alerts.css';
import { useNavigate } from 'react-router-dom';

const statusLabel = { critical: 'Critical', medium: 'Medium', resolved: 'Resolved' };
const statusClass = { critical: 'badge-red', medium: 'badge-orange', resolved: 'badge-green' };

export default function Alerts() {
  const { alerts, loading, isLive } = useAlerts();
  const { officers } = useOfficers();
  const navigate = useNavigate();

  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [selected, setSelected]     = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]           = useState(null);
  const [suggestedOfficer, setSuggestedOfficer] = useState(null);
  const [suggesting, setSuggesting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = alerts.filter(a => {
    const matchStatus = filter === 'all' || a.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      (a.citizen || a.citizenName || '').toLowerCase().includes(q) ||
      (a.location || '').toLowerCase().includes(q) ||
      (a.type || a.emergencyType || '').toLowerCase().includes(q) ||
      (a.id || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleResolve = async (alertId) => {
    setActionLoading(true);
    try {
      await resolveAlert(alertId);
      showToast('Alert marked as resolved');
      setSelected(null);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
    setActionLoading(false);
  };

  const handleAiSuggest = async () => {
    setSuggesting(true);
    try {
      const id = await aiService.suggestNearestOfficer(assignModal, officers);
      if (id) setSuggestedOfficer(id);
      else alert('AI could not determine the best officer or API key is missing.');
    } catch (e) {
      alert("Error finding officer: " + e.message);
    }
    setSuggesting(false);
  };

  const handleAssign = async (alert, officer) => {
    setActionLoading(true);
    try {
      await assignOfficer(alert.id, officer);
      showToast(`Dispatched ${officer.name} to ${alert.id}`);
      setAssignModal(null);
      setSuggestedOfficer(null);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
    setActionLoading(false);
  };

  // Normalize field names — citizenName is what Flutter saves from account creation
  const getName = (a) => {
    const n = a.citizenName || a.citizen || a.name || a.userEmail || '';
    return n.trim() || '—';
  };
  const getType    = (a) => a.type || a.emergencyType || 'Emergency';
  const getLoc     = (a) => a.location || a.address || null;
  const getCoords  = (a) => (a.lat && a.lng) ? { lat: a.lat, lng: a.lng } : null;
  const getSubmissionDate = (a) => {
    try {
      if (a.createdAt?.toDate) return a.createdAt.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      if (typeof a.createdAt === 'number' || typeof a.createdAt === 'string') {
        const d = new Date(a.createdAt);
        if (!isNaN(d.getTime())) return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    return a.time || '—';
  };
  const getOfficer = (a) => a.assignedOfficerName || a.officerName || a.officer || (typeof a.assignedOfficer === 'string' && a.assignedOfficer.includes(' ') ? a.assignedOfficer : null) || null;

  return (
    <div className="alerts-page">
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Live Emergency Alerts</h1>
          <p className="page-sub">
            {isLive ? (
              <><Wifi size={13} style={{ color: '#2a9d8f' }} /> Connected to Firebase — Real-time feed</>
            ) : (
              <><WifiOff size={13} style={{ color: '#f4a261' }} /> Demo mode — Configure Firebase to go live</>
            )}
          </p>
        </div>
        <div className="header-actions">
          {loading && <Loader size={16} className="spin-icon" />}
          <span className="badge badge-red" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
            <AlertTriangle size={12} /> {alerts.filter(a => a.status === 'critical').length} Critical
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="card alerts-toolbar">
        <div className="search-wrap">
          <Search size={15} />
          <input
            id="alert-search"
            type="text"
            placeholder="Search by ID, citizen, location, type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {['all', 'critical', 'medium', 'resolved'].map(f => (
            <button
              key={f}
              id={`filter-${f}`}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? `All (${alerts.length})` : statusLabel[f]}
            </button>
          ))}
        </div>
        <span className="text-muted" style={{ marginLeft: 'auto' }}>{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="card table-card">
        <div className="table-wrap">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Citizen</th>
                <th>Location</th>
                <th>Submission Date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Officer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    {loading ? 'Loading live data…' : 'No alerts match this filter.'}
                  </td>
                </tr>
              )}
              {filtered.map(alert => (
                <tr key={alert.id} className={`table-row status-${alert.status}`}>
                  <td>
                    <span className="incident-id">{(alert.id || '').substring(0, 12)}</span>
                  </td>
                  <td>
                    <div className="citizen-cell">
                      <div className="avatar avatar-sm">
                        {getName(alert).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      {getName(alert)}
                    </div>
                  </td>
                  <td>
                    {/* Location button — shows citizen name, navigates to geo map */}
                    <button
                      className="btn btn-sm btn-ghost"
                      style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#2557a7', background: 'rgba(37,87,167,0.1)', fontWeight: 600 }}
                      onClick={() => navigate('/map', { state: { selectedAlertId: alert.id } })}
                    >
                      <MapPin size={13} /> {getName(alert)}
                    </button>
                    {/* Location sub-text: address or GPS link, never 'Unknown' */}
                    {getLoc(alert) ? (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 3 }}>
                        {getLoc(alert)}
                      </div>
                    ) : getCoords(alert) ? (
                      <a
                        href={`https://www.google.com/maps?q=${getCoords(alert).lat},${getCoords(alert).lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.74rem', color: '#2557a7', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}
                      >
                        <MapPin size={11} /> {Number(getCoords(alert).lat).toFixed(4)}, {Number(getCoords(alert).lng).toFixed(4)}
                      </a>
                    ) : (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 3 }}>—</div>
                    )}
                  </td>
                  <td>
                    <span className="time-cell"><Clock size={12} />
                      {getSubmissionDate(alert)}
                    </span>
                  </td>
                  <td><span className="type-chip">{getType(alert)}</span></td>
                  <td>
                    <span className={`badge ${statusClass[alert.status] || 'badge-gray'}`}>
                      {alert.status === 'critical' && (
                        <span className="pulse-dot red" style={{ marginRight: 4 }} />
                      )}
                      {statusLabel[alert.status] || alert.status}
                    </span>
                  </td>
                  <td>
                    {getOfficer(alert)
                      ? <span className="officer-chip">{getOfficer(alert)}</span>
                      : <span className="text-muted">Unassigned</span>
                    }
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelected(alert)}>
                        <Eye size={13} /> View
                      </button>
                      {alert.status !== 'resolved' && (
                        <button className="btn btn-primary btn-sm" onClick={() => setAssignModal(alert)}>
                          <UserPlus size={13} /> Assign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Incident Details</h3>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="modal-status-bar">
                <span className={`badge ${statusClass[selected.status] || 'badge-gray'}`}>
                  {statusLabel[selected.status] || selected.status}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{selected.id}</span>
              </div>
              <div className="detail-grid">
                <div><label>Citizen</label><p>{getName(selected)}</p></div>
                <div><label>Emergency Type</label><p>{getType(selected)}</p></div>
                <div><label>Location</label><p>{getLoc(selected)}</p></div>
                <div><label>Time Reported</label><p>{getSubmissionDate(selected)}</p></div>
                <div><label>Assigned Officer</label><p>{getOfficer(selected) || 'Not Assigned'}</p></div>
                {selected.phone && <div><label>Contact</label><p>{selected.phone}</p></div>}
                {selected.userEmail && <div><label>Email</label><p>{selected.userEmail}</p></div>}
                {(selected.lat || selected.latitude) && (
                  <div>
                    <label>GPS Coordinates</label>
                    <p>{selected.lat || selected.latitude}, {selected.lng || selected.longitude}</p>
                  </div>
                )}
                {selected.medicalInfo && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <label>Medical Info</label>
                    <p style={{ color: '#d9534f', fontWeight: 'bold' }}>{selected.medicalInfo}</p>
                  </div>
                )}
                {selected.description && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <label>Description</label>
                    <p>{selected.description}</p>
                  </div>
                )}
                {selected.voiceUrl && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <label>Voice Recording</label>
                    <audio controls src={selected.voiceUrl} style={{ width: '100%', marginTop: '5px' }} />
                  </div>
                )}
                {selected.photoUrl && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <label>Photo Attachment</label>
                    <img src={selected.photoUrl} alt="Emergency" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '5px', objectFit: 'contain', maxHeight: '300px' }} />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
              {selected.status !== 'resolved' && (
                <>
                  <button
                    className="btn btn-success btn-sm"
                    disabled={actionLoading}
                    onClick={() => handleResolve(selected.id)}
                  >
                    Mark Resolved
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => { setAssignModal(selected); setSelected(null); }}
                  >
                    <UserPlus size={14} /> Assign Officer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => { setAssignModal(null); setSuggestedOfficer(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dispatch Officer → {(assignModal.id || '').substring(0, 12)}</h3>
              <button className="modal-close" onClick={() => { setAssignModal(null); setSuggestedOfficer(null); }}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="modal-status-bar" style={{ marginBottom: 14 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={13} /> {getLoc(assignModal)} · {getType(assignModal)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p className="text-muted" style={{ margin: 0 }}>Select an available officer:</p>
                <button className="btn btn-ghost btn-sm" onClick={handleAiSuggest} disabled={suggesting}>
                  {suggesting ? <Loader size={12} className="spin-icon" /> : <Brain size={12} style={{ color: '#9b59b6' }} />} AI Suggest
                </button>
              </div>
              <div className="officer-pick-list">
                {officers.filter(o => o.status === 'available').map(o => {
                  const isSuggested = suggestedOfficer === o.id;
                  return (
                    <div
                      key={o.id}
                      className="officer-pick-row"
                      onClick={() => !actionLoading && handleAssign(assignModal, o)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', 
                        borderBottom: '1px solid var(--border)',
                        background: isSuggested ? 'rgba(155, 89, 182, 0.1)' : 'transparent',
                        borderLeft: isSuggested ? '3px solid #9b59b6' : '3px solid transparent'
                      }}
                    >
                      <div className="avatar">{o.avatar || (o.name || '').substring(0, 2).toUpperCase()}</div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0, color: isSuggested ? '#9b59b6' : 'inherit' }}>
                          {o.name} {isSuggested && <Sparkles size={12} style={{ marginLeft: 4 }} />}
                        </p>
                        <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>{o.rank} · {o.station} · {o.specialization}</p>
                      </div>
                      <span className={`badge ${isSuggested ? 'badge-blue' : 'badge-green'}`} style={{ marginLeft: 'auto' }}>
                        {isSuggested ? 'Recommended' : 'Available'}
                      </span>
                    </div>
                  );
                })}
                {officers.filter(o => o.status === 'available').length === 0 && (
                  <p className="text-muted" style={{ textAlign: 'center', padding: 24 }}>
                    No officers currently available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
