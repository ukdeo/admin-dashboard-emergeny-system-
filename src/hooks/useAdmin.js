import { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const defaultProfile = {
  name: 'SP Kumar Thapa',
  email: 'sser.admin@nepal.gov.np',
  phone: '+977-9841-123456',
  rank: 'Superintendent of Police',
  station: 'Hanuman Dhoka HQ',
  badge: 'NP-0001',
};

export function useAdminProfile() {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('adminProfile');
    let parsed = saved ? JSON.parse(saved) : defaultProfile;
    // Attempt to merge with real auth data if available synchronously
    if (auth.currentUser) {
      parsed.email = auth.currentUser.email || parsed.email;
      if (auth.currentUser.displayName) parsed.name = auth.currentUser.displayName;
    }
    return parsed;
  });

  useEffect(() => {
    // Listen for auth state changes to get real email
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setProfile(prev => {
          const updated = {
            ...prev,
            email: user.email || prev.email,
            name: user.displayName || prev.name
          };
          localStorage.setItem('adminProfile', JSON.stringify(updated));
          return updated;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('adminProfile');
      if (saved) setProfile(JSON.parse(saved));
    };
    window.addEventListener('adminProfileUpdated', handleUpdate);
    return () => window.removeEventListener('adminProfileUpdated', handleUpdate);
  }, []);

  const updateProfile = (newProfile) => {
    localStorage.setItem('adminProfile', JSON.stringify(newProfile));
    setProfile(newProfile);
    window.dispatchEvent(new Event('adminProfileUpdated'));
  };

  return { profile, updateProfile };
}
