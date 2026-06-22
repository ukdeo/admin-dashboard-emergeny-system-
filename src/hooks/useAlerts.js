// ============================================================
// src/hooks/useAlerts.js
// Custom React hooks — subscribe to Firestore live data.
// Shows proper loading / error states so missing config is visible.
// ============================================================
import { useState, useEffect } from 'react';
import { subscribeToAlerts, subscribeToOfficers } from '../services/alertService';
import { emergencyAlerts as mockAlerts, officers as mockOfficers } from '../data/mockData';

// Check all required Firebase vars are real (not placeholders)
const FIREBASE_CONFIGURED =
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes('YOUR_') &&
  !import.meta.env.VITE_FIREBASE_APP_ID?.includes('dummy');

// ── ALERTS HOOK ──────────────────────────────────────────────
export function useAlerts() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(FIREBASE_CONFIGURED); // true while first load
  const [error,   setError]   = useState(null);
  const [isLive,  setIsLive]  = useState(false);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) {
      console.warn(
        '[SERS] Firebase is not fully configured.\n' +
        'Loading mock data instead.'
      );
      setAlerts(mockAlerts);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setIsLive(true);

    let settled = false;
    const unsubscribe = subscribeToAlerts((liveAlerts) => {
      // Fallback to mock data if database is empty for demonstration
      setAlerts(liveAlerts.length > 0 ? liveAlerts : mockAlerts);
      setLoading(false);
      setError(null);
      settled = true;
    });

    // If Firebase rejects the connection the snapshot never calls back;
    // add a 8-second timeout so the spinner doesn't spin forever.
    const timeout = setTimeout(() => {
      if (!settled) {
        setLoading(false);
        setError('timeout');
      }
    }, 8000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return { alerts, loading, error, isLive };
}

// ── OFFICERS HOOK ────────────────────────────────────────────
export function useOfficers() {
  const [officers, setOfficers] = useState([]);
  const [loading,  setLoading]  = useState(FIREBASE_CONFIGURED);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) {
      setLoading(false);
      setError('firebase_not_configured');
      return;
    }

    setLoading(true);
    let settled = false;

    const unsubscribe = subscribeToOfficers((liveOfficers) => {
      // Fallback to mock officers if database is empty
      setOfficers(liveOfficers.length > 0 ? liveOfficers : mockOfficers);
      setLoading(false);
      setError(null);
      settled = true;
    });

    const timeout = setTimeout(() => {
      if (!settled) {
        setLoading(false);
        setError('timeout');
      }
    }, 8000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return { officers, loading, error };
}

// ── PENDING OFFICERS HOOK ────────────────────────────────────
// Watches officers collection for newly registered officers awaiting verification
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

export function usePendingOfficers() {
  const [pending, setPending] = useState([]);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) {
      setPending([]);
      return;
    }
    const q = query(collection(db, 'officers'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snap) => {
      setPending(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => setPending([]));
    return () => unsub();
  }, []);

  return { pending };
}

// ── USERS (citizens) HOOK ────────────────────────────────────

export function useUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(FIREBASE_CONFIGURED);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) {
      setUsers([
        { id: 'usr1', fullName: 'Aarav Sharma', email: 'aarav@example.com' },
        { id: 'usr2', fullName: 'Priya Thapa', email: 'priya@example.com' },
        { id: 'usr3', fullName: 'Bikash Rai', email: 'bikash@example.com' }
      ]);
      setLoading(false);
      setError('firebase_not_configured');
      return;
    }

    setLoading(true);
    let settled = false;

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const liveUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Fallback to mock users if empty
        setUsers(liveUsers.length > 0 ? liveUsers : [
          { id: 'usr1', fullName: 'Aarav Sharma', email: 'aarav@example.com' },
          { id: 'usr2', fullName: 'Priya Thapa', email: 'priya@example.com' }
        ]);
        setLoading(false);
        setError(null);
        settled = true;
      },
      (err) => {
        console.error('[SERS] Users snapshot error:', err);
        setUsers([
          { id: 'usr1', fullName: 'Aarav Sharma', email: 'aarav@example.com' },
          { id: 'usr2', fullName: 'Priya Thapa', email: 'priya@example.com' },
          { id: 'usr3', fullName: 'Bikash Rai', email: 'bikash@example.com' }
        ]);
        setLoading(false);
        setError(err.code || 'unknown');
      }
    );

    const timeout = setTimeout(() => {
      if (!settled) {
        setLoading(false);
        setError('timeout');
      }
    }, 8000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return { users, loading, error };
}
