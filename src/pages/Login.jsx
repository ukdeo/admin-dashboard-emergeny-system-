import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@nepalpolice.gov.np');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) { setError('Please enter your password.'); return; }
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
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

      {/* ── Login Container ── */}
      <div className="login-container">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-shield-icon" style={{ overflow: 'hidden', borderRadius: '50%', width: '90px', height: '90px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'transparent', padding: 0, margin: '0 auto 15px auto' }}>
              <img src="/sankatmochan-logo.jpg" alt="Sankatmochan Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <h2>Admin Login</h2>
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
            <p className="login-disclaimer">
              Unauthorized access is a criminal offence under Nepal IT Act 2063.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
