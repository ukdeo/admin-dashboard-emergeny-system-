import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAlerts, useOfficers } from '../hooks/useAlerts';
import { assignOfficer } from '../services/alertService';
import { aiService } from '../services/aiService';
import { MapPin, X, AlertTriangle, Clock, User, Loader, Brain, Sparkles, Navigation } from 'lucide-react';
import './MapMonitor.css';

// ── Fix Leaflet's broken default icon paths in bundlers ──────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Colored teardrop icons ───────────────────────────────────────────────────
const makeIcon = (color, pulsing = false) =>
  L.divIcon({
    html: `
      <div style="position:relative;width:32px;height:38px;">
        ${pulsing ? `<div style="
          position:absolute;top:-4px;left:-4px;
          width:40px;height:40px;
          border-radius:50%;
          background:${color};
          opacity:0.25;
          animation:mapPulse 1.5s ease-out infinite;
        "></div>` : ''}
        <div style="
          width:28px;height:28px;
          background:${color};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid rgba(255,255,255,0.9);
          box-shadow:0 4px 14px ${color}99,0 2px 6px rgba(0,0,0,0.3);
          position:absolute;top:4px;left:2px;
        "></div>
        <div style="
          width:6px;height:6px;
          background:rgba(0,0,0,0.25);
          border-radius:50%;
          filter:blur(2px);
          position:absolute;bottom:0;left:13px;
        "></div>
      </div>`,
    className: '',
    iconSize:    [32, 38],
    iconAnchor:  [16, 38],
    popupAnchor: [0, -40],
  });

const ICONS = {
  critical: makeIcon('#e63946', true),
  medium:   makeIcon('#f4a261', false),
  resolved: makeIcon('#2a9d8f', false),
};

// ── Fly-to helper component ──────────────────────────────────────────────────
function FlyTo({ alert }) {
  const map = useMap();
  useEffect(() => {
    if (!alert) return;
    const lat = parseFloat(alert.lat || alert.latitude)  || 27.7;
    const lng = parseFloat(alert.lng || alert.longitude) || 85.32;
    map.flyTo([lat, lng], 15, { duration: 1.2 });
  }, [alert, map]);
  return null;
}

// ── Main component ───────────────────────────────────────────────────────────
const RISK_COLORS = { critical: '#e63946', high: '#f4a261', medium: '#2557a7', low: '#2a9d8f' };

import { riskZones } from '../data/mockData';
export default function MapMonitor() {
  const { alerts } = useAlerts();
  const { officers } = useOfficers();

  const [selectedAlert,   setSelectedAlert]   = useState(null);
  const [flyTarget,       setFlyTarget]       = useState(null);
  const [assignModal,     setAssignModal]     = useState(null);
  const [actionLoading,   setActionLoading]   = useState(false);
  const [showRisk,        setShowRisk]        = useState(true);
  const [showAlerts,      setShowAlerts]      = useState(true);
  const [suggestedOfficer, setSuggestedOfficer] = useState(null);
  const [suggesting,      setSuggesting]      = useState(false);

  const getTime = (a) => {
    if (a.time) return a.time;
    if (a.createdAt) {
      if (typeof a.createdAt.toDate === 'function')
        return a.createdAt.toDate().toLocaleTimeString();
      return new Date(a.createdAt).toLocaleTimeString();
    }
    return '—';
  };

  // Name: prioritize citizenName (what Flutter stores from account creation)
  const getName = (a) => {
    const n = a.citizenName || a.citizen || a.name || a.userEmail || '';
    return n.trim() || '—';
  };

  // Location: address string, or null (we handle null in render)
  const getLoc = (a) => a.location || a.address || null;

  const handleSelect = (alert) => {
    setSelectedAlert(alert);
    setFlyTarget(alert);
  };

  const handleAssign = async (alert, officer) => {
    setActionLoading(true);
    try {
      await assignOfficer(alert.id, officer);
      setAssignModal(null);
      setSelectedAlert(prev => ({ ...prev, status: 'medium', assignedOfficer: officer.name }));
    } catch (e) { console.error('Error assigning officer', e); }
    setActionLoading(false);
  };

  const handleAiSuggest = async () => {
    setSuggesting(true);
    const id = await aiService.suggestNearestOfficer(assignModal, officers);
    if (id) setSuggestedOfficer(id);
    else alert('AI could not determine the best officer or API key is missing.');
    setSuggesting(false);
  };

  return (
    <div className="map-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Map Monitoring</h1>
          <p className="page-sub"><span className="live-dot" /> Live incident map — Kathmandu Valley</p>
        </div>
        <div className="header-actions map-toggles">
          <div className="toggle-wrapper" onClick={() => setShowRisk(v => !v)}>
            <span className="toggle-label">Risk Zones</span>
            <div className={`switch ${showRisk ? 'active primary' : ''}`}>
              <div className="switch-thumb" />
            </div>
          </div>
          
          <div className="toggle-wrapper" onClick={() => setShowAlerts(v => !v)}>
            <span className="toggle-label">Alerts</span>
            <div className={`switch ${showAlerts ? 'active danger' : ''}`}>
              <div className="switch-thumb" />
            </div>
          </div>
        </div>
      </div>

      <div className="map-layout">
        {/* ── Map ── */}
        <div className="card map-container">
          <MapContainer
            center={[27.7, 85.32]}
            zoom={13}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            zoomControl={true}
          >
            {/* Fly animation when selecting from the side list */}
            <FlyTo alert={flyTarget} />

            {/* Dark-styled OpenStreetMap tiles (no API key required) */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              maxZoom={19}
            />

            {/* Risk Zone Circles */}
            {showRisk && riskZones.map(z => (
              <Circle
                key={z.zone}
                center={[z.lat, z.lng]}
                radius={z.risk * 20}
                pathOptions={{
                  color:       RISK_COLORS[z.level],
                  fillColor:   RISK_COLORS[z.level],
                  fillOpacity: 0.12,
                  weight:      1.5,
                  dashArray:   '6 4',
                }}
              />
            ))}

            {/* Alert Markers */}
            {showAlerts && alerts.map((alert, idx) => {
              const lat = parseFloat(alert.lat || alert.latitude)  || (27.7  + (idx * 0.005 % 0.04) - 0.02);
              const lng = parseFloat(alert.lng || alert.longitude) || (85.32 + (idx * 0.003 % 0.04) - 0.02);
              const icon = ICONS[alert.status] || ICONS.medium;

              return (
                <Marker
                  key={alert.id}
                  position={[lat, lng]}
                  icon={icon}
                  eventHandlers={{ click: () => handleSelect(alert) }}
                >
                  <Popup className="custom-popup">
                      <div className="map-popup-inner">
                        <div className="map-popup-id">{(alert.id || '').substring(0, 10)}</div>
                        <div className="map-popup-type">{alert.type || alert.emergencyType || 'Emergency'}</div>
                        <div className="map-popup-row"><User size={11} /> {alert.citizen || alert.citizenName || alert.name || 'Unknown'}</div>
                        <div className="map-popup-row"><MapPin size={11} /> {alert.location || 'Unknown location'}</div>
                        <div className="map-popup-row"><Clock size={11} /> {getTime(alert)}</div>
                        <span className={`map-popup-badge badge-status-${alert.status}`}>
                          {alert.status?.toUpperCase()}
                        </span>
                      </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Legend */}
          <div className="map-legend">
            <span className="legend-title">Legend</span>
            <div className="legend-item"><span className="legend-pin critical" />Critical</div>
            <div className="legend-item"><span className="legend-pin medium" />Medium</div>
            <div className="legend-item"><span className="legend-pin resolved" />Resolved</div>
          </div>
        </div>

        {/* ── Side Panel ── */}
        <div className="map-side">

          {/* Incident Detail Card */}
          {selectedAlert ? (
            <div className="card incident-panel animate-in">
              <div className="incident-panel-header">
                <span className="section-title">Incident Details</span>
                <button className="modal-close" onClick={() => setSelectedAlert(null)}><X size={14} /></button>
              </div>
              <div className={`incident-status-badge status-${selectedAlert.status}`}>
                <AlertTriangle size={13} />
                {selectedAlert.status?.toUpperCase()}
              </div>
              <div className="incident-details">
                <div className="detail-row">
                  <span className="detail-label">Incident ID</span>
                  <span className="detail-val mono">{selectedAlert.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Citizen</span>
                  <span className="detail-val">{selectedAlert.citizen || selectedAlert.citizenName || selectedAlert.name || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type</span>
                  <span className="detail-val">{selectedAlert.type || selectedAlert.emergencyType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label"><MapPin size={11} /> Location</span>
                  <span className="detail-val">{selectedAlert.location || 'Unknown'}</span>
                </div>
                {(selectedAlert.lat || selectedAlert.latitude) && (
                  <div className="detail-row">
                    <span className="detail-label">GPS Coordinates</span>
                    <span className="detail-val mono" style={{ fontSize: '0.78rem' }}>
                      {Number(selectedAlert.lat || selectedAlert.latitude).toFixed(5)},&nbsp;
                      {Number(selectedAlert.lng || selectedAlert.longitude).toFixed(5)}
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label"><Clock size={11} /> Time</span>
                  <span className="detail-val">{getTime(selectedAlert)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label"><User size={11} /> Officer</span>
                  <span className="detail-val">{selectedAlert.assignedOfficerName || selectedAlert.officerName || selectedAlert.officer || selectedAlert.assignedOfficer || 'Unassigned'}</span>
                </div>
                {selectedAlert.userEmail && (
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-val">{selectedAlert.userEmail}</span>
                  </div>
                )}
                {selectedAlert.medicalInfo && (
                  <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <span className="detail-label" style={{ color: '#d9534f' }}>Medical Info</span>
                    <span className="detail-val" style={{ fontWeight: 'bold' }}>{selectedAlert.medicalInfo}</span>
                  </div>
                )}
                {selectedAlert.voiceUrl && (
                  <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <span className="detail-label">Voice Recording</span>
                    <audio controls src={selectedAlert.voiceUrl} style={{ width: '100%', height: '32px' }} />
                  </div>
                )}
                {selectedAlert.photoUrl && (
                  <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <span className="detail-label">Photo Attachment</span>
                    <img src={selectedAlert.photoUrl} alt="Emergency" style={{ width: '100%', borderRadius: '8px', objectFit: 'contain' }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {selectedAlert.status !== 'resolved' && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setAssignModal(selectedAlert)}
                  >
                    Dispatch Officer
                  </button>
                )}
                {(selectedAlert.lat || selectedAlert.latitude) && (
                  <a
                    href={`https://www.google.com/maps?q=${selectedAlert.lat || selectedAlert.latitude},${selectedAlert.lng || selectedAlert.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Navigation size={13} /> Google Maps
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="card incident-panel" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
              <MapPin size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>Click a map marker to view incident details</p>
            </div>
          )}

          {/* Active Incidents List */}
          <div className="card map-alerts-list">
            <div className="card-header">
              <span className="section-title">Active Incidents</span>
              <span className="badge badge-red">{alerts.filter(a => a.status !== 'resolved').length}</span>
            </div>
            {alerts.filter(a => a.status !== 'resolved').length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem', padding: '16px 0' }}>
                No active incidents
              </p>
            )}
            {alerts.filter(a => a.status !== 'resolved').map(alert => (
              <div
                key={alert.id}
                className={`map-alert-row ${selectedAlert?.id === alert.id ? 'selected' : ''}`}
                onClick={() => handleSelect(alert)}
              >
                <span className={`pulse-dot ${alert.status === 'critical' ? 'red' : 'orange'}`} />
                <div style={{ flex: 1 }}>
                  <p className="map-alert-type">{alert.type || alert.emergencyType}</p>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {alert.citizen || alert.citizenName || alert.name || 'Unknown'} · {alert.location}
                  </p>
                </div>
                <span className={`badge ${alert.status === 'critical' ? 'badge-red' : 'badge-orange'}`}>
                  {alert.status}
                </span>
              </div>
            ))}
          </div>

          {/* Risk Zones */}
          {riskZones.length > 0 && (
            <div className="card map-risk-list">
              <div className="card-header" style={{ marginBottom: 12 }}>
                <span className="section-title">Risk Zones</span>
              </div>
              {riskZones.map(z => (
                <div key={z.zone} className="risk-row">
                  <div className="risk-info">
                    <span className="risk-zone">{z.zone}</span>
                    <span className={`badge badge-${z.level === 'critical' ? 'red' : z.level === 'high' ? 'orange' : z.level === 'medium' ? 'blue' : 'green'}`}>
                      {z.risk}%
                    </span>
                  </div>
                  <div className="risk-bar-wrap">
                    <div className="risk-bar">
                      <div className="risk-fill" style={{ width: `${z.risk}%`, background: RISK_COLORS[z.level] }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Assign Officer Modal ── */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => { setAssignModal(null); setSuggestedOfficer(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dispatch Officer → {(assignModal.id || '').substring(0, 12)}</h3>
              <button className="modal-close" onClick={() => { setAssignModal(null); setSuggestedOfficer(null); }}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p className="text-muted" style={{ margin: 0 }}>
                  Select an available officer for {assignModal.location || 'this incident'}:
                </p>
                <button className="btn btn-ghost btn-sm" onClick={handleAiSuggest} disabled={suggesting}>
                  {suggesting ? <Loader size={12} className="spin-icon" /> : <Brain size={12} style={{ color: '#9b59b6' }} />}
                  AI Suggest
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
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px', cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        background:   isSuggested ? 'rgba(155,89,182,0.1)' : 'transparent',
                        borderLeft:   isSuggested ? '3px solid #9b59b6' : '3px solid transparent',
                      }}
                    >
                      <div className="avatar">{o.avatar || (o.name || '').substring(0, 2).toUpperCase()}</div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0, color: isSuggested ? '#9b59b6' : 'inherit' }}>
                          {o.name} {isSuggested && <Sparkles size={12} style={{ marginLeft: 4 }} />}
                        </p>
                        <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                          {o.rank} · {o.station} · {o.specialization}
                        </p>
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
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setAssignModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
