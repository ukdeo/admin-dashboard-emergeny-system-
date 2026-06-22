import React from 'react';
import {
  AlertTriangle, CheckCircle2, Users, MapPin,
  ArrowUpRight, ArrowDownRight, Clock, Activity, Radio
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useAlerts, useOfficers, useUsers } from '../hooks/useAlerts';
import './Dashboard.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: '0.80rem' }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CRIME_COLORS = ['#f03e3e', '#f59f00', '#3b5bdb', '#2f9e44', '#7950f2', '#1971c2'];

export default function Dashboard() {
  const { alerts }   = useAlerts();
  const { officers } = useOfficers();
  const { users }    = useUsers();

  const activeCount   = alerts.filter(a => a.status !== 'resolved').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;
  const critical      = alerts.filter(a => a.status === 'critical');

  /* --- Crime breakdown --- */
  const crimeCounts = {};
  alerts.forEach(a => {
    const t = a.type || a.emergencyType || 'Other';
    crimeCounts[t] = (crimeCounts[t] || 0) + 1;
  });
  const crimeTypeData = Object.keys(crimeCounts).length
    ? Object.entries(crimeCounts).map(([name, value], i) => ({
        name, value, color: CRIME_COLORS[i % CRIME_COLORS.length],
      }))
    : [{ name: 'No Data', value: 1, color: 'var(--border)' }];

  /* --- Hourly activity --- */
  const hourlyData = Array.from({ length: 12 }, (_, i) => ({
    hour: `${String(i * 2).padStart(2, '0')}:00`,
    incidents: alerts.filter(a => {
      try {
        const d = new Date(a.time || (a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt));
        return d.getHours() >= i * 2 && d.getHours() < i * 2 + 2;
      } catch { return false; }
    }).length,
  }));

  const statCards = [
    {
      id: 'active-emergencies',
      title: 'Active Emergencies',
      value: activeCount,
      change: 'Live',
      up: false,
      icon: AlertTriangle,
      iconColor: '#f03e3e',
      iconBg: 'rgba(240,62,62,0.10)',
      sub: 'Currently open',
    },
    {
      id: 'resolved-cases',
      title: 'Resolved Cases',
      value: resolvedCount,
      change: 'Total',
      up: true,
      icon: CheckCircle2,
      iconColor: '#2f9e44',
      iconBg: 'rgba(47,158,68,0.10)',
      sub: 'All time',
    },
    {
      id: 'available-officers',
      title: 'Available Officers',
      value: officers.filter(o => o.status === 'available').length,
      change: 'Live',
      up: true,
      icon: Users,
      iconColor: '#3b5bdb',
      iconBg: 'rgba(59,91,219,0.10)',
      sub: `of ${officers.length} total`,
    },
    {
      id: 'registered-citizens',
      title: 'Registered Citizens',
      value: users.length,
      change: 'Live',
      up: true,
      icon: MapPin,
      iconColor: '#7950f2',
      iconBg: 'rgba(121,80,242,0.10)',
      sub: 'App users',
    },
  ];

  return (
    <div className="dashboard-page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Command Center</h1>
          <p className="page-sub">
            <span className="live-dot" />
            Live monitoring ·{' '}
            {new Date().toLocaleString('en-NP', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm">
            <Activity size={14} /> System: Online
          </button>
          <button className="btn btn-primary btn-sm">
            <Radio size={14} /> New Incident
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stat-grid">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={card.id}
              className="stat-card card animate-in"
              style={{ animationDelay: `${idx * 0.07}s` }}
            >
              <div className="stat-top">
                <div className="stat-icon" style={{ background: card.iconBg }}>
                  <Icon size={19} style={{ color: card.iconColor }} strokeWidth={2.2} />
                </div>
                <span className={`stat-change ${card.up ? 'up' : 'down'}`}>
                  {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {card.change}
                </span>
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-title">{card.title}</div>
              <div className="stat-sub">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Charts ── */}
      <div className="charts-grid">
        {/* Weekly Trend — placeholder with hourly since weekly isn't wired */}
        <div className="card chart-card animate-in" style={{ animationDelay: '0.32s' }}>
          <div className="card-header">
            <span className="section-title">Hourly Activity</span>
            <span className="badge badge-blue">Today</span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={hourlyData} margin={{ top: 8, right: 6, bottom: 0, left: -14 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b5bdb" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#3b5bdb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="incidents"
                name="Incidents"
                stroke="#3b5bdb"
                fill="url(#areaGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3b5bdb' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span><span className="legend-dot" style={{ background: '#3b5bdb' }} /> Incidents</span>
          </div>
        </div>

        {/* Incident Types Donut */}
        <div className="card chart-card animate-in" style={{ animationDelay: '0.40s' }}>
          <div className="card-header">
            <span className="section-title">Incident Types</span>
            <span className="badge badge-orange">All time</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={crimeTypeData}
                cx="50%" cy="50%"
                innerRadius={45} outerRadius={70}
                dataKey="value"
                paddingAngle={3}
              >
                {crimeTypeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="crime-legend">
            {crimeTypeData.map(d => (
              <div key={d.name} className="crime-legend-item">
                <span className="legend-dot" style={{ background: d.color }} />
                <span style={{ flex: 1 }}>{d.name}</span>
                <span style={{ fontWeight: 700 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart: bar per officer status */}
        <div className="card chart-card animate-in" style={{ animationDelay: '0.48s' }}>
          <div className="card-header">
            <span className="section-title">Officer Status</span>
            <span className="badge badge-green">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={[
                { label: 'Available', count: officers.filter(o => o.status === 'available').length, fill: '#2f9e44' },
                { label: 'On Duty',   count: officers.filter(o => o.status === 'on-duty').length,   fill: '#f59f00' },
                { label: 'Off Duty',  count: officers.filter(o => o.status === 'off-duty').length,  fill: '#adb5bd' },
                { label: 'Pending',   count: officers.filter(o => o.status === 'pending').length,   fill: '#3b5bdb' },
              ]}
              margin={{ top: 6, right: 6, bottom: 0, left: -14 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Officers" radius={[4, 4, 0, 0]}>
                {[
                  { fill: '#2f9e44' },
                  { fill: '#f59f00' },
                  { fill: '#adb5bd' },
                  { fill: '#3b5bdb' },
                ].map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="bottom-grid">
        {/* Critical Alerts */}
        <div className="card animate-in" style={{ animationDelay: '0.56s', padding: '20px' }}>
          <div className="card-header">
            <span className="section-title">Critical Alerts</span>
            <span className="badge badge-red">{critical.length} active</span>
          </div>
          <div className="alert-list">
            {critical.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={28} />
                <span>No critical alerts</span>
              </div>
            ) : critical.map(alert => (
              <div key={alert.id} className="alert-row">
                <span className="pulse-dot red" />
                <div className="alert-info">
                  <span className="alert-id mono">{(alert.id || '').substring(0, 8)}</span>
                  <span className="alert-citizen">
                    {alert.citizen || alert.name || 'Unknown'} · {alert.type || alert.emergencyType}
                  </span>
                </div>
                <div className="alert-meta">
                  <span className="alert-loc">{alert.location || 'Unknown'}</span>
                  <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={10} />
                    {(alert.time || alert.createdAt || '').toString().split(' ')[1] || 'Now'}
                  </span>
                </div>
                <button className="btn btn-danger btn-sm">Dispatch</button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats panel */}
        <div className="card animate-in" style={{ animationDelay: '0.62s', padding: '20px' }}>
          <div className="card-header">
            <span className="section-title">Quick Overview</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Response Rate',    value: resolvedCount + activeCount > 0 ? `${Math.round((resolvedCount / (resolvedCount + activeCount)) * 100)}%` : '—', color: 'var(--success)' },
              { label: 'Total Officers',   value: officers.length,                color: 'var(--brand-primary)' },
              { label: 'Registered Users', value: users.length,                   color: '#7950f2' },
              { label: 'Open Incidents',   value: activeCount,                    color: 'var(--danger)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: item.color }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
