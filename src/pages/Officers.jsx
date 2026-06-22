import React, { useState } from 'react';
import { Users, Plus, Phone, Shield, Briefcase, Search, X, Loader, CheckCircle2 } from 'lucide-react';
import { useOfficers } from '../hooks/useAlerts';
import { addOfficer, verifyOfficer, deleteOfficer } from '../services/alertService';
import './Officers.css';

const STATUS_COLOR = {
  available: 'badge-green',
  'on-duty': 'badge-orange',
  'off-duty': 'badge-gray',
  pending: 'badge-blue',
};
const STATUS_LABEL = {
  available: 'Available',
  'on-duty': 'On Duty',
  'off-duty': 'Off Duty',
  pending: 'Pending',
};

export default function Officers() {
  const { officers } = useOfficers();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [loading, setLoading] = useState(false);

  const [newOfficer, setNewOfficer] = useState({
    name: '', rank: 'DSP', badge: '', station: '', phone: '', specialization: 'Patrol',
  });

  const handleAddOfficer = async () => {
    if (!newOfficer.name || !newOfficer.badge) {
      alert('Name and badge number are required.');
      return;
    }
    setLoading(true);
    try {
      await addOfficer({
        ...newOfficer,
        status: 'available',
        assigned: 0,
        avatar: newOfficer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      });
      setShowAddModal(false);
      setNewOfficer({ name: '', rank: 'DSP', badge: '', station: '', phone: '', specialization: 'Patrol' });
    } catch (e) {
      alert('Could not add officer: ' + e.message);
    }
    setLoading(false);
  };

  const filtered = officers.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      (o.name || '').toLowerCase().includes(q) ||
      (o.station || '').toLowerCase().includes(q) ||
      (o.rank || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const statStrip = [
    { label: 'Total', value: officers.length, color: 'var(--brand-primary)' },
    { label: 'Available', value: officers.filter(o => o.status === 'available').length, color: 'var(--success)' },
    { label: 'On Duty', value: officers.filter(o => o.status === 'on-duty').length, color: 'var(--warning)' },
    { label: 'Pending', value: officers.filter(o => o.status === 'pending').length, color: '#7950f2' },
  ];

  return (
    <div className="officers-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Officers</h1>
          <p className="page-sub">
            {officers.length} registered ·{' '}
            {officers.filter(o => o.status === 'available').length} available right now
          </p>
        </div>
        <button className="btn btn-primary" id="add-officer-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={15} /> Add Officer
        </button>
      </div>

      {/* Stat strip */}
      <div className="officer-stats">
        {statStrip.map(s => (
          <div key={s.label} className="card officer-stat-card">
            <div className="officer-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="officer-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card alerts-toolbar">
        <div className="search-wrap" style={{ maxWidth: 320 }}>
          <Search size={14} />
          <input
            id="officer-search"
            type="text"
            placeholder="Search by name, rank, station…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              onClick={() => setSearch('')}
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="filter-tabs">
          {['all', 'pending', 'available', 'on-duty', 'off-duty'].map(f => (
            <button
              key={f}
              id={`officer-filter-${f}`}
              className={`filter-tab ${filterStatus === f ? 'active' : ''}`}
              onClick={() => setFilterStatus(f)}
            >
              {f === 'all' ? 'All' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="officers-grid">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <Users size={32} />
            <span>No officers match your filter</span>
          </div>
        ) : filtered.map((officer, idx) => (
          <div
            key={officer.id}
            className="card officer-card animate-in"
            style={{ animationDelay: `${idx * 0.05}s` }}
            onClick={() => setSelectedOfficer(officer)}
            id={`officer-card-${officer.id}`}
          >
            <div className="officer-card-top">
              <div className="officer-avatar">{officer.avatar || '??'}</div>
              <span className={`badge ${STATUS_COLOR[officer.status] || 'badge-gray'}`}>
                {STATUS_LABEL[officer.status] || officer.status}
              </span>
            </div>
            <h3 className="officer-name">{officer.name}</h3>
            <p className="officer-rank">
              <Shield size={11} strokeWidth={2.2} /> {officer.rank}
            </p>
            <p className="officer-station">
              <Briefcase size={11} strokeWidth={2.2} /> {officer.station}
            </p>
            <div className="officer-divider" />
            <div className="officer-footer">
              <div className="officer-stat">
                <span>{officer.assigned ?? 0}</span>
                <small>Cases</small>
              </div>
              <div className="officer-stat">
                <span style={{ fontSize: '0.78rem', letterSpacing: 0 }}>{officer.badge}</span>
                <small>Badge</small>
              </div>
              <button
                className="btn btn-ghost btn-xs"
                onClick={e => e.stopPropagation()}
                title="Call officer"
              >
                <Phone size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Officer detail modal ── */}
      {selectedOfficer && (
        <div className="modal-overlay" onClick={() => setSelectedOfficer(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Officer Profile</h3>
              <button className="modal-close" onClick={() => setSelectedOfficer(null)}>
                <X size={13} />
              </button>
            </div>
            <div className="modal-body">
              <div className="officer-profile-head">
                <div className="officer-avatar lg">{selectedOfficer.avatar}</div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{selectedOfficer.name}</h3>
                  <p className="text-muted" style={{ marginTop: 2 }}>
                    {selectedOfficer.rank} · Badge #{selectedOfficer.badge}
                  </p>
                  <span
                    className={`badge ${STATUS_COLOR[selectedOfficer.status]}`}
                    style={{ marginTop: 8, display: 'inline-flex' }}
                  >
                    {STATUS_LABEL[selectedOfficer.status]}
                  </span>
                </div>
              </div>
              <div className="detail-grid" style={{ marginTop: 6 }}>
                <div>
                  <label>Station</label>
                  <p>{selectedOfficer.station || '—'}</p>
                </div>
                <div>
                  <label>Specialization</label>
                  <p>{selectedOfficer.specialization || '—'}</p>
                </div>
                <div>
                  <label>Phone</label>
                  <p>{selectedOfficer.phone || '—'}</p>
                </div>
                <div>
                  <label>Assigned Cases</label>
                  <p>{selectedOfficer.assigned ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <div>
                {selectedOfficer.status === 'pending' ? (
                  <button
                    className="btn btn-success"
                    onClick={async () => {
                      await verifyOfficer(selectedOfficer.id);
                      setSelectedOfficer({ ...selectedOfficer, status: 'available' });
                    }}
                  >
                    <CheckCircle2 size={14} /> Verify & Approve
                  </button>
                ) : (
                  <span className="text-muted" style={{ fontSize: '0.76rem' }}>
                    Status controlled by officer's app
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className="btn btn-danger" 
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this officer?')) {
                      await deleteOfficer(selectedOfficer.id);
                      setSelectedOfficer(null);
                    }
                  }}
                >
                  Delete
                </button>
                <button className="btn btn-ghost" onClick={() => setSelectedOfficer(null)}>Close</button>
                <button className="btn btn-primary"><Phone size={14} /> Contact</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add officer modal ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Officer</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={13} />
              </button>
            </div>
            <div className="modal-body">
              <div className="add-form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. DSP Ram Bahadur Thapa"
                    value={newOfficer.name}
                    onChange={e => setNewOfficer({ ...newOfficer, name: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Rank</label>
                    <select value={newOfficer.rank} onChange={e => setNewOfficer({ ...newOfficer, rank: e.target.value })}>
                      <option>DSP</option>
                      <option>SI</option>
                      <option>ASI</option>
                      <option>Constable</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Badge Number *</label>
                    <input
                      type="text"
                      placeholder="NP-XXXX"
                      value={newOfficer.badge}
                      onChange={e => setNewOfficer({ ...newOfficer, badge: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Station</label>
                  <input
                    type="text"
                    placeholder="Station name"
                    value={newOfficer.station}
                    onChange={e => setNewOfficer({ ...newOfficer, station: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+977-98XX-XXXXXX"
                    value={newOfficer.phone}
                    onChange={e => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Specialization</label>
                  <select
                    value={newOfficer.specialization}
                    onChange={e => setNewOfficer({ ...newOfficer, specialization: e.target.value })}
                  >
                    <option>Patrol</option>
                    <option>Crime Investigation</option>
                    <option>Traffic Control</option>
                    <option>Community Policing</option>
                    <option>Cybercrime</option>
                    <option>Anti-Narcotics</option>
                    <option>Special Ops</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddOfficer} disabled={loading}>
                {loading ? <Loader size={14} className="spin-icon" /> : <Plus size={14} />}
                {loading ? 'Adding…' : 'Add Officer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
