import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useAlerts, useOfficers } from '../hooks/useAlerts';
import { aiService } from '../services/aiService';
import { Brain, TrendingUp, AlertTriangle, Target, RefreshCw, Loader } from 'lucide-react';
import './Analytics.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { alerts } = useAlerts();
  const { officers } = useOfficers();
  const [predictions, setPredictions] = React.useState([]);
  const [loadingPreds, setLoadingPreds] = React.useState(false);
  const [predKey, setPredKey] = React.useState(0); // used to manually re-trigger

  // ── Derived real-data metrics ─────────────────────────────────────────────
  const totalAlerts      = alerts.length;
  const criticalAlerts   = alerts.filter(a => a.status === 'critical').length;
  const resolvedAlerts   = alerts.filter(a => a.status === 'resolved').length;
  const resolutionRate   = totalAlerts ? Math.round((resolvedAlerts / totalAlerts) * 100) : 0;

  // Highest-incident zone (by location field)
  const locationCounts = {};
  alerts.forEach(a => {
    const loc = (a.location || 'Unknown').split(',')[0].trim();
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });
  const topZone = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  // Weekly trend: last 7 days
  const weeklyTrends = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = d.toLocaleDateString('en-NP', { weekday: 'short' });
    const incidents = alerts.filter(a => {
      try {
        const ad = new Date(a.time || (a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt));
        return ad.toDateString() === d.toDateString();
      } catch { return false; }
    });
    return {
      day: dayLabel,
      incidents: incidents.length,
      resolved:  incidents.filter(a => a.status === 'resolved').length,
    };
  });

  // Hourly pattern (today, 2h buckets)
  const hourlyData = Array.from({ length: 12 }, (_, i) => ({
    hour: `${i * 2}`.padStart(2, '0') + 'h',
    incidents: alerts.filter(a => {
      try {
        const d = new Date(a.time || (a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt));
        return d.getHours() >= i * 2 && d.getHours() < (i * 2) + 2;
      } catch { return false; }
    }).length,
  }));

  // Crime type radar — from live data
  const typeCounts = {};
  alerts.forEach(a => {
    const t = (a.type || a.emergencyType || 'Other').trim();
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const radarData = Object.entries(typeCounts).map(([subject, A]) => ({ subject, A }));
  // fallback if no data
  const radarDisplay = radarData.length
    ? radarData
    : [{ subject: 'No Data', A: 0 }];

  // ── AI predictions (auto-run when alerts change, or manual refresh) ───────
  React.useEffect(() => {
    let mounted = true;
    async function loadPredictions() {
      if (!alerts.length) return;
      setLoadingPreds(true);
      try {
        const preds = await aiService.predictRiskZones(alerts);
        if (mounted) setPredictions(preds);
      } catch (e) {
        console.error('AI prediction error', e);
      } finally {
        if (mounted) setLoadingPreds(false);
      }
    }
    loadPredictions();
    return () => { mounted = false; };
  }, [alerts, predKey]);

  // ── Computed insight cards (all real data) ────────────────────────────────
  const lastWeekCount = weeklyTrends.slice(0, 6).reduce((s, d) => s + d.incidents, 0);
  const thisWeekCount = weeklyTrends.reduce((s, d) => s + d.incidents, 0);
  const trendPct = lastWeekCount
    ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
    : 0;
  const trendLabel = trendPct >= 0 ? `+${trendPct}% vs last week` : `${trendPct}% vs last week`;

  const insightCards = [
    {
      icon: AlertTriangle,
      label: 'Active Critical Incidents',
      value: criticalAlerts,
      color: '#e63946',
      bg: 'rgba(230,57,70,0.08)',
    },
    {
      icon: Target,
      label: 'Highest Risk Zone',
      value: topZone,
      color: '#f4a261',
      bg: 'rgba(244,162,97,0.08)',
    },
    {
      icon: TrendingUp,
      label: 'Incident Trend (7 days)',
      value: trendLabel,
      color: trendPct >= 0 ? '#e63946' : '#2a9d8f',
      bg: trendPct >= 0 ? 'rgba(230,57,70,0.08)' : 'rgba(42,157,143,0.08)',
    },
    {
      icon: Brain,
      label: 'Resolution Rate',
      value: `${resolutionRate}%`,
      color: '#2a9d8f',
      bg: 'rgba(42,157,143,0.08)',
    },
  ];

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Analytics &amp; Risk Prediction</h1>
          <p className="page-sub">
            <Brain size={13} /> Powered by Gemini AI &mdash; analysing {totalAlerts} live incident{totalAlerts !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPredKey(k => k + 1)}
            disabled={loadingPreds || !alerts.length}
            title="Re-run AI predictions with latest data"
          >
            {loadingPreds ? <Loader size={14} className="spin-icon" /> : <RefreshCw size={14} />}
            {loadingPreds ? 'Analysing…' : 'Refresh AI'}
          </button>
          <span className="badge badge-green" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
            <span className="pulse-dot green" style={{ marginRight: 6 }} />AI Model Online
          </span>
        </div>
      </div>

      {/* Insight Cards — all real data */}
      <div className="ai-insight-grid">
        {insightCards.map((c, i) => (
          <div key={i} className="card ai-insight-card animate-in" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="ai-icon" style={{ background: c.bg }}>
              <c.icon size={20} style={{ color: c.color }} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="analytics-charts">
        {/* Weekly Trend — real data */}
        <div className="card chart-card animate-in" style={{ animationDelay: '0.32s' }}>
          <div className="card-header">
            <span className="section-title">7-Day Incident Trend</span>
            <span className="badge badge-blue">Live Data</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyTrends} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e63946" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#e63946" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2a9d8f" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2a9d8f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="incidents" name="Incidents" stroke="#e63946" fill="url(#incG)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="resolved"  name="Resolved"  stroke="#2a9d8f" fill="url(#resG)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Crime Type Radar — real data */}
        <div className="card chart-card animate-in" style={{ animationDelay: '0.4s' }}>
          <div className="card-header">
            <span className="section-title">Incident Type Breakdown</span>
            <span className="badge badge-orange">Live Data</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarDisplay}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Radar name="Count" dataKey="A" stroke="#2557a7" fill="#2557a7" fillOpacity={0.25} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Pattern — real data */}
        <div className="card chart-card animate-in" style={{ animationDelay: '0.48s' }}>
          <div className="card-header">
            <span className="section-title">Hourly Pattern (Today)</span>
            <span className="badge badge-green">Live Data</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="incidents" name="Incidents" radius={[4, 4, 0, 0]}>
                {hourlyData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.incidents > 5 ? '#e63946' : entry.incidents > 2 ? '#f4a261' : '#2557a7'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Risk Prediction Table */}
      <div className="card animate-in" style={{ animationDelay: '0.56s' }}>
        <div className="card-header" style={{ padding: '20px 20px 0' }}>
          <span className="section-title">Zone Risk Prediction — Next 24h</span>
          <span className="badge badge-blue">AI Powered · {totalAlerts} records analysed</span>
        </div>
        <div className="table-wrap">
          <table className="alerts-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Zone</th>
                <th>Today's Risk</th>
                <th>Predicted Tomorrow</th>
                <th>Trend</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingPreds && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <Loader size={16} className="spin-icon" />
                      Generating live AI predictions from {totalAlerts} incidents…
                    </div>
                  </td>
                </tr>
              )}
              {!loadingPreds && predictions.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                    {alerts.length === 0
                      ? 'No incident data available for AI analysis.'
                      : 'Add VITE_GEMINI_API_KEY to .env to enable AI predictions.'}
                  </td>
                </tr>
              )}
              {!loadingPreds && predictions.map((p, i) => (
                <tr key={p.zone || i} className="table-row">
                  <td style={{ fontWeight: 700 }}>{p.zone}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${p.today}%`, borderRadius: 99,
                          background: p.today > 80 ? '#e63946' : p.today > 60 ? '#f4a261' : '#2557a7',
                        }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', width: 36 }}>{p.today}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: p.trend === 'up' ? '#e63946' : '#2a9d8f' }}>
                      {p.tomorrow}%
                    </span>
                  </td>
                  <td>
                    <span style={{ color: p.trend === 'up' ? '#e63946' : '#2a9d8f', fontWeight: 700 }}>
                      {p.trend === 'up' ? '↑ Rising' : '↓ Declining'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.today > 80 ? 'badge-red' : p.today > 60 ? 'badge-orange' : 'badge-blue'}`}>
                      {p.action || (p.today > 80 ? 'Increase Patrol' : p.today > 60 ? 'Monitor Closely' : 'Standard Patrol')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
