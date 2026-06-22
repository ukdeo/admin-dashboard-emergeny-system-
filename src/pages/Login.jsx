import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle, Users, AlertTriangle, Activity } from 'lucide-react';
import { useAlerts, useOfficers, useUsers } from '../hooks/useAlerts';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('admin@nepalpolice.gov.np');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const { alerts }   = useAlerts();
  const { officers } = useOfficers();
  const { users }    = useUsers();

  const activeOfficers  = officers.filter(o => o.status === 'available').length;
  const activeIncidents = alerts.filter(a => a.status !== 'resolved').length;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) { setError('Please enter your password.'); return; }
    setError('');
    setLoading(true);

    try {
      // 1. Try to log in
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      // 2. If user doesn't exist (or invalid credential in newer Firebase SDKs), try to create it
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          setLoading(false);
          navigate('/dashboard');
        } catch (createErr) {
          setLoading(false);
          if (createErr.code === 'auth/email-already-in-use') {
            setError('Incorrect password for this admin account.');
          } else {
            setError('Auth error: Ensure Email/Password sign-in is enabled in Firebase Console.');
          }
        }
      } else {
        setLoading(false);
        setError('Login failed: ' + err.message);
      }
    }
  };

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-bg">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />
        <div className="grid-overlay" />
      </div>

      {/* ── Left panel ── */}
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-logo">
            <Shield size={34} strokeWidth={1.8} />
          </div>
          <h1>Nepal Police</h1>
          <p>Smart Emergency Response System</p>
          <div className="brand-divider" />
          <p className="brand-tagline">
            Connecting responders with citizens<br />when every second counts.
          </p>
        </div>

        {/* Live stat chips */}
        <div className="login-stats-row">
          <div className="stat-chip">
            <div className="stat-chip-icon" style={{ background: 'rgba(59,91,219,0.2)' }}>
              <Users size={15} style={{ color: '#748ffc' }} />
            </div>
            <span>
              {activeOfficers > 0
                ? activeOfficers
                : officers.length > 0 ? officers.length : '—'}
            </span>
            <small>Officers online</small>
          </div>
          <div className="stat-chip">
            <div className="stat-chip-icon" style={{ background: 'rgba(240,62,62,0.2)' }}>
              <AlertTriangle size={15} style={{ color: '#ff8787' }} />
            </div>
            <span>
              {alerts.length > 0 ? activeIncidents : '—'}
            </span>
            <small>Live incidents</small>
          </div>
          <div className="stat-chip">
            <div className="stat-chip-icon" style={{ background: 'rgba(47,158,68,0.2)' }}>
              <Activity size={15} style={{ color: '#69db7c' }} />
            </div>
            <span>{users.length > 0 ? users.length : '—'}</span>
            <small>Registered users</small>
          </div>
        </div>
      </div>

      {/* ── Right panel — login card ── */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-shield-icon">
              <Shield size={22} strokeWidth={2} />
            </div>
            <h2>Welcome back</h2>
            <p>Sign in to SERS Command Center</p>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="login-email">Government Email</label>
              <div className="input-wrap">
                <Mail size={15} className="input-icon-left" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="officer@nepalpolice.gov.np"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrap">
                <Lock size={15} className="input-icon-left" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me" htmlFor="remember">
                <input type="checkbox" id="remember" defaultChecked />
                <span>Keep me signed in</span>
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="login-btn" id="login-submit" disabled={loading}>
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  <Shield size={15} />
                  Sign in to Dashboard
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <div className="security-badge">
              <Lock size={11} />
              <span>256-bit TLS encrypted · Government grade</span>
            </div>
            <p className="login-disclaimer">
              Unauthorized access is a criminal offence under Nepal IT Act 2063.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
