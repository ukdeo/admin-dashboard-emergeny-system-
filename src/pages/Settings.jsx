import React, { useState } from 'react';
import {
  User, Shield, Bell, Lock, Globe, Moon, Sun,
  ChevronRight, Save, LogOut, Camera, Check
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAdminProfile } from '../hooks/useAdmin';
import { useStation } from '../hooks/useStation';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import './Settings.css';

const tabs = [
  { key: 'profile',       label: 'Admin Profile',    icon: User   },
  { key: 'station',       label: 'Station Settings',  icon: Globe  },
  { key: 'notifications', label: 'Notifications',     icon: Bell   },
  { key: 'security',      label: 'Security',          icon: Lock   },
];

const NEPAL_DATA = {
  'Koshi Province': ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'],
  'Madhesh Province': ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
  'Bagmati Province': ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'],
  'Gandaki Province': ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun'],
  'Lumbini Province': ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Eastern Rukum', 'Gulmi', 'Kapilvastu', 'Parasi', 'Palpa', 'Pyuthan', 'Rolpa', 'Rupandehi'],
  'Karnali Province': ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Salyan', 'Surkhet', 'Western Rukum'],
  'Sudurpashchim Province': ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur']
};

const NEPAL_AREAS = {
  'Kathmandu': ['Kathmandu Metropolitan', 'Tokha', 'Tarakeshwar', 'Gokarneshwar', 'Budhanilkantha', 'Kirtipur', 'Dakshinkali', 'Chandragiri', 'Nagarjun', 'Kageshwari Manohara', 'Shankharapur'],
  'Lalitpur': ['Lalitpur Metropolitan', 'Godawari', 'Mahalaxmi', 'Konjyosom', 'Bagmati', 'Mahankal'],
  'Bhaktapur': ['Bhaktapur', 'Suryabinayak', 'Madhyapur Thimi', 'Changunarayan'],
  'Kaski': ['Pokhara Metropolitan', 'Annapurna', 'Machhapuchchhre', 'Madi', 'Rupa'],
  'Morang': ['Biratnagar Metropolitan', 'Belbari', 'Pathari Sanischare', 'Ratuwamai', 'Sunawarshi', 'Uralabari', 'Letang', 'Sundarharaicha'],
  'Jhapa': ['Birtamod', 'Damak', 'Mechinagar', 'Bhadrapur', 'Kankai', 'Shivasatakshi', 'Gauradaha', 'Arjundhara'],
  'Rupandehi': ['Butwal Sub-Metropolitan', 'Siddharthanagar', 'Lumbini Sanskritik', 'Devdaha', 'Sainamaina', 'Tilottama'],
  'Banke': ['Nepalgunj Sub-Metropolitan', 'Kohalpur', 'Khajura', 'Rapti Sonari', 'Baijanath', 'Narainapur', 'Duduwa'],
  'Kailali': ['Dhangadhi Sub-Metropolitan', 'Tikapur', 'Ghodaghodi', 'Lamki Chuha', 'Bhajani', 'Godawari', 'Gauriganga'],
  'Parsa': ['Birgunj Metropolitan', 'Bahudarmai', 'Parsagadhi', 'Pokhariya'],
  'Chitwan': ['Bharatpur Metropolitan', 'Ratnanagar', 'Rapti', 'Khairahani', 'Kalika', 'Madi', 'Ichchhakamana']
};

// Fallback generator for districts not explicitly listed above
const getAreasForDistrict = (district) => {
  if (NEPAL_AREAS[district]) return NEPAL_AREAS[district];
  if (!district) return [];
  return [`${district} Municipality`, `${district} Rural Municipality`, 'Area 1', 'Area 2', 'Area 3'];
};

// ── Persist notification settings in localStorage ──────────────
const NOTIF_KEY   = 'sers-notif-settings';

function loadNotifPrefs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY)); } catch { return null; }
}

const defaultNotifPrefs = {
  critical:    true,
  officer:     true,
  newCase:     false,
  aiRisk:      true,
  maintenance: false,
  dailySummary: true,
};

export default function Settings() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  // Profile — persisted via useAdminProfile (localStorage)
  const { profile, updateProfile } = useAdminProfile();
  const [form, setForm] = useState(profile);

  // Station — from global useStation hook
  const { station: globalStation, updateStation } = useStation();
  const [station, setStation] = useState(globalStation);
  
  // Sync if globalStation changes from outside
  React.useEffect(() => {
    setStation(globalStation);
  }, [globalStation]);

  // Sync local form state when global profile updates (like when Firebase loads or station changes)
  React.useEffect(() => {
    setForm(profile);
  }, [profile]);

  // Notification prefs — persisted in localStorage
  const [notifPrefs, setNotifPrefs] = useState(() => loadNotifPrefs() || defaultNotifPrefs);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const handlePasswordChange = async () => {
    setPwdError('');
    setPwdSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }

    setPwdLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in.');

      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      
      setPwdSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setPwdError('Incorrect current password.');
      } else {
        setPwdError('Failed to update password: ' + err.message);
      }
    }
    setPwdLoading(false);
  };

  const handleSave = () => {
    if (activeTab === 'profile') {
      updateProfile(form);
    }
    if (activeTab === 'station') {
      updateStation(station);
      // Also update admin profile station to match
      updateProfile({ ...form, station: station.name });
    }
    if (activeTab === 'notifications') {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notifPrefs));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleNotif = (key) =>
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const notifItems = [
    { key: 'critical',     label: 'Critical Emergency Alerts',   sub: 'Immediate notification for all critical incidents' },
    { key: 'officer',      label: 'Officer Status Updates',       sub: 'When officers are dispatched or complete a case' },
    { key: 'newCase',      label: 'New Case Reports Filed',       sub: 'When a new report is submitted to the system' },
    { key: 'aiRisk',       label: 'AI Risk Alerts',               sub: 'When AI detects a zone risk level change' },
    { key: 'maintenance',  label: 'System Maintenance Notices',   sub: 'Planned downtime and system updates' },
    { key: 'dailySummary', label: 'Daily Summary Report',         sub: 'Email digest at 06:00 every morning' },
  ];

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Manage your account, station, and system preferences</p>
        </div>
        <button
          className={`btn ${saved ? 'btn-success' : 'btn-primary'} btn-sm`}
          id="save-settings-btn"
          onClick={handleSave}
        >
          {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>

      <div className="settings-layout">
        {/* Sidebar Tabs */}
        <div className="card settings-tabs">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              id={`settings-tab-${key}`}
              className={`settings-tab-btn ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={16} />
              <span>{label}</span>
              <ChevronRight size={14} className="tab-chevron" />
            </button>
          ))}
          <div className="settings-tabs-divider" />
          <button className="settings-tab-btn danger" onClick={() => navigate('/login')}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="card settings-panel animate-in">
              <h2 className="settings-panel-title">Admin Profile</h2>
              <div className="profile-section">
                <div className="profile-avatar-wrap">
                  <div className="settings-avatar">
                    {form.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <button className="avatar-edit-btn"><Camera size={14} /></button>
                </div>
                <div className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Rank</label>
                      <input
                        type="text"
                        value={form.rank}
                        onChange={e => setForm({ ...form, rank: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Government Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Badge Number</label>
                      <input 
                        type="text" 
                        value={form.badge} 
                        onChange={e => setForm({ ...form, badge: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Assigned Station</label>
                      <input 
                        type="text" 
                        value={form.station} 
                        onChange={e => setForm({ ...form, station: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Station Tab ── */}
          {activeTab === 'station' && (
            <div className="card settings-panel animate-in">
              <h2 className="settings-panel-title">Station Settings</h2>
              <div className="settings-section">
                <div className="form-group">
                  <label>Station Name</label>
                  <input
                    type="text"
                    value={station.name}
                    onChange={e => setStation({ ...station, name: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Province</label>
                    <select
                      value={station.province}
                      onChange={e => {
                        const newProv = e.target.value;
                        const newDist = NEPAL_DATA[newProv]?.[0] || '';
                        const newArea = getAreasForDistrict(newDist)[0] || '';
                        const newAddress = `${station.name}, ${newArea}, ${newDist}, ${newProv}, Nepal`;
                        setStation({ ...station, province: newProv, district: newDist, area: newArea, address: newAddress });
                      }}
                    >
                      {Object.keys(NEPAL_DATA).map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>District</label>
                    <select
                      value={station.district}
                      onChange={e => {
                        const newDist = e.target.value;
                        const newArea = getAreasForDistrict(newDist)[0] || '';
                        const newAddress = `${station.name}, ${newArea}, ${newDist}, ${station.province}, Nepal`;
                        setStation({ ...station, district: newDist, area: newArea, address: newAddress });
                      }}
                    >
                      {NEPAL_DATA[station.province]?.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Area / Municipality</label>
                    <select
                      value={station.area || ''}
                      onChange={e => {
                        const newArea = e.target.value;
                        const newAddress = `${station.name}, ${newArea}, ${station.district}, ${station.province}, Nepal`;
                        setStation({ ...station, area: newArea, address: newAddress });
                      }}
                    >
                      {getAreasForDistrict(station.district).map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact Number</label>
                    <input
                      type="text"
                      value={station.emergency}
                      onChange={e => setStation({ ...station, emergency: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Station Address</label>
                  <textarea
                    rows={3}
                    value={station.address}
                    onChange={e => setStation({ ...station, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="settings-toggle-group">
                <div className="settings-toggle-row">
                  <div>
                    <p style={{ fontWeight: 600 }}>Enable Public Alert Broadcasting</p>
                    <p className="text-muted">Send alerts to citizens in the station area</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={station.broadcasting}
                      onChange={() => setStation({ ...station, broadcasting: !station.broadcasting })}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <p style={{ fontWeight: 600 }}>AI Risk Assessment</p>
                    <p className="text-muted">Enable AI-powered risk zone predictions</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={station.aiRisk}
                      onChange={() => setStation({ ...station, aiRisk: !station.aiRisk })}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}



          {/* ── Notifications Tab ── */}
          {activeTab === 'notifications' && (
            <div className="card settings-panel animate-in">
              <h2 className="settings-panel-title">Notification Preferences</h2>
              <div className="settings-toggle-group">
                {notifItems.map(item => (
                  <div key={item.key} className="settings-toggle-row">
                    <div>
                      <p style={{ fontWeight: 600 }}>{item.label}</p>
                      <p className="text-muted">{item.sub}</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifPrefs[item.key]}
                        onChange={() => toggleNotif(item.key)}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'security' && (
            <div className="card settings-panel animate-in">
              <h2 className="settings-panel-title">Security Settings</h2>
              <div className="settings-section">
                <div className="security-info-box">
                  <Lock size={16} />
                  <div>
                    <p style={{ fontWeight: 700 }}>Two-Factor Authentication</p>
                    <p className="text-muted">Your account is protected with 2FA via government OTP system</p>
                  </div>
                  <span className="badge badge-green">Active</span>
                </div>
                <h3 className="settings-sub-title">Change Password</h3>
                {pwdError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '10px' }}>{pwdError}</div>}
                {pwdSuccess && <div style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: '10px' }}>{pwdSuccess}</div>}
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" placeholder="Enter current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" placeholder="Minimum 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" placeholder="Repeat new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handlePasswordChange} disabled={pwdLoading}>
                  {pwdLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>

              <div className="settings-section" style={{ marginTop: 24 }}>
                <h3 className="settings-sub-title">Active Sessions</h3>
                {[
                  { 
                    device: (() => {
                      const ua = navigator.userAgent;
                      let browser = "Unknown Browser";
                      if (ua.includes("Firefox/")) browser = "Firefox";
                      else if (ua.includes("Edg/")) browser = "Edge";
                      else if (ua.includes("Chrome/")) browser = "Chrome";
                      else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
                      
                      let os = "Unknown OS";
                      if (ua.includes("Win")) os = "Windows";
                      else if (ua.includes("Mac")) os = "MacOS";
                      else if (ua.includes("X11")) os = "UNIX";
                      else if (ua.includes("Linux")) os = "Linux";
                      
                      return `${browser} on ${os}`;
                    })(),
                    location: station?.district ? `${station.district}, NP` : 'Nepal', 
                    time: 'Now (current)', 
                    active: true 
                  }
                ].map((s, i) => (
                  <div key={i} className="session-row">
                    <div className={`session-dot ${s.active ? 'active' : ''}`} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.device}</p>
                      <p className="text-muted">{s.location} · {s.time}</p>
                    </div>
                    {!s.active && <button className="btn btn-ghost btn-sm">Revoke</button>}
                  </div>
                ))}
              </div>

              {/* Theme */}
              <div className="settings-section" style={{ marginTop: 24 }}>
                <h3 className="settings-sub-title">Display Theme</h3>
                <div className="theme-selector">
                  <button
                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => theme !== 'dark' && toggle()}
                    id="theme-dark-btn"
                  >
                    <Moon size={16} /> Dark Mode
                  </button>
                  <button
                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => theme !== 'light' && toggle()}
                    id="theme-light-btn"
                  >
                    <Sun size={16} /> Light Mode
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
