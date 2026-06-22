// ============================================================
// src/services/alertService.js
// All Firestore operations for emergency alerts
// Flutter writes to: /emergencies/{docId}
// This dashboard reads, updates, and listens in real-time
// ============================================================
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, limit, serverTimestamp,
  onSnapshot, where, getDocs
} from 'firebase/firestore';
import { db } from './firebase';

const ALERTS_COL = 'emergencies';
const OFFICERS_COL = 'officers';

// ── REAL-TIME LISTENER ────────────────────────────────────────
// Call this once; pass a callback that receives the live alert array.
// Returns an unsubscribe function — call it on component unmount.
export function subscribeToAlerts(callback) {
  const q = query(
    collection(db, ALERTS_COL),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, async (snapshot) => {
    const raw = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      // Normalize Firestore Timestamp → JS Date string
      time: d.data().createdAt?.toDate?.()
        ? d.data().createdAt.toDate().toLocaleString('en-NP')
        : d.data().time ?? '',
      // Normalize lat/lng keys (Flutter uses latitude/longitude)
      lat: d.data().lat ?? d.data().latitude ?? null,
      lng: d.data().lng ?? d.data().longitude ?? null,
    }));

    // Enrich with full name from /users/{userId} if citizenName is missing
    const enriched = await Promise.all(raw.map(async (alert) => {
      if (alert.citizenName) return alert;           // already has name
      if (!alert.userId)     return alert;           // no userId to look up
      try {
        const userSnap = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', alert.userId))
        );
        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data();
          return { ...alert, citizenName: userData.fullName || userData.displayName || '' };
        }
      } catch (_) { /* ignore — show what we have */ }
      return alert;
    }));

    callback(enriched);
  });
}


// ── SUBSCRIBE ONLY CRITICAL / ACTIVE ─────────────────────────
export function subscribeToCritical(callback) {
  const q = query(
    collection(db, ALERTS_COL),
    where('status', '==', 'critical'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── UPDATE STATUS ─────────────────────────────────────────────
// Called when dashboard admin changes alert status
export async function updateAlertStatus(alertId, status, officerName = null) {
  const ref = doc(db, ALERTS_COL, alertId);
  const payload = { status, updatedAt: serverTimestamp() };
  if (officerName) payload.assignedOfficer = officerName;
  await updateDoc(ref, payload);
}

// ── ASSIGN OFFICER ────────────────────────────────────────────
export async function assignOfficer(alertId, officerData) {
  const ref = doc(db, ALERTS_COL, alertId);
  await updateDoc(ref, {
    assignedOfficer: officerData.id, assignedOfficerName: officerData.name,
    officerId: officerData.id,
    status: 'dispatched',           // promote from unassigned to in-progress
    dispatchedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ── RESOLVE ALERT ─────────────────────────────────────────────
export async function resolveAlert(alertId) {
  await updateDoc(doc(db, ALERTS_COL, alertId), {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ── ADD NOTE / COMMENT ────────────────────────────────────────
export async function addAlertNote(alertId, note, adminName) {
  const ref = doc(db, ALERTS_COL, alertId);
  await updateDoc(ref, {
    notes: note,
    noteBy: adminName,
    noteAt: serverTimestamp(),
  });
}

// ── FETCH ONCE (for exports / reports) ───────────────────────
export async function fetchAllAlerts() {
  const q = query(collection(db, ALERTS_COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── OFFICER OPERATIONS ────────────────────────────────────────
export function subscribeToOfficers(callback) {
  return onSnapshot(collection(db, OFFICERS_COL), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function updateOfficerStatus(officerId, status) {
  await updateDoc(doc(db, OFFICERS_COL, officerId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function addOfficer(officerData) {
  const colRef = collection(db, OFFICERS_COL);
  await addDoc(colRef, {
    ...officerData,
    createdAt: serverTimestamp(),
  });
}

export async function registerOfficer(officerData) {
  const colRef = collection(db, OFFICERS_COL);
  await addDoc(colRef, {
    ...officerData,
    status: 'pending', // Requires admin verification
    createdAt: serverTimestamp(),
  });
}

export async function verifyOfficer(officerId) {
  // Update officer status in dashboard
  await updateDoc(doc(db, OFFICERS_COL, officerId), {
    status: 'available',
    updatedAt: serverTimestamp(),
  });
  // Update role in users collection to grant mobile app access
  await updateDoc(doc(db, 'users', officerId), {
    role: 'officer',
  });
}

export async function deleteOfficer(officerId) {
  await deleteDoc(doc(db, OFFICERS_COL, officerId));
}

export async function acceptTask(alertId) {
  await updateDoc(doc(db, ALERTS_COL, alertId), {
    officerAccepted: true,
    status: 'accepted', // officer has actively accepted it
    updatedAt: serverTimestamp(),
  });
}

export async function addReport(reportData) {
  const colRef = collection(db, ALERTS_COL);
  await addDoc(colRef, {
    ...reportData,
    createdAt: serverTimestamp(),
  });
}
