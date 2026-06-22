// Mock Data for Nepal Police SERS Dashboard

export const emergencyAlerts = [
  { id: 'INC-2024-001', citizen: 'Aarav Sharma', location: 'Thamel, Kathmandu', lat: 27.7154, lng: 85.3123, time: '2026-05-30 10:42', type: 'Armed Robbery', status: 'critical', officer: null },
  { id: 'INC-2024-002', citizen: 'Priya Thapa', location: 'Patan Durbar Sq.', lat: 27.6710, lng: 85.3240, time: '2026-05-30 10:38', type: 'Medical Emergency', status: 'medium', officer: 'SI Ramesh KC' },
  { id: 'INC-2024-003', citizen: 'Bikash Rai', location: 'Bouddha, Kathmandu', lat: 27.7214, lng: 85.3617, time: '2026-05-30 10:15', type: 'Fire Accident', status: 'critical', officer: null },
  { id: 'INC-2024-004', citizen: 'Sunita Gurung', location: 'Lalitpur, Pulchowk', lat: 27.6788, lng: 85.3144, time: '2026-05-30 09:58', type: 'Traffic Accident', status: 'medium', officer: 'ASI Kabita Magar' },
  { id: 'INC-2024-005', citizen: 'Deepak Lama', location: 'Baneshwor, Ktm', lat: 27.6954, lng: 85.3386, time: '2026-05-30 09:30', type: 'Domestic Violence', status: 'resolved', officer: 'SI Anita Tamang' },
  { id: 'INC-2024-006', citizen: 'Meena Koirala', location: 'Balaju, Kathmandu', lat: 27.7351, lng: 85.2985, time: '2026-05-30 09:10', type: 'Theft', status: 'resolved', officer: 'Const. Hari Bhusal' },
  { id: 'INC-2024-007', citizen: 'Rajan Pokhrel', location: 'Chabahil, Ktm', lat: 27.7165, lng: 85.3516, time: '2026-05-30 08:45', type: 'Missing Person', status: 'medium', officer: null },
  { id: 'INC-2024-008', citizen: 'Gita Adhikari', location: 'Kalanki, Kathmandu', lat: 27.6957, lng: 85.2822, time: '2026-05-30 08:22', type: 'Assault', status: 'critical', officer: null },
];

export const officers = [
  { id: 'OFF-001', name: 'DSP Mohan Basnet', rank: 'DSP', badge: 'NP-4421', station: 'Hanuman Dhoka HQ', status: 'available', assigned: 0, phone: '+977-9841-234567', avatar: 'MB', specialization: 'Crime Investigation' },
  { id: 'OFF-002', name: 'SI Ramesh KC', rank: 'SI', badge: 'NP-5512', station: 'Thamel Station', status: 'on-duty', assigned: 2, phone: '+977-9841-345678', avatar: 'RK', specialization: 'Traffic Control' },
  { id: 'OFF-003', name: 'ASI Kabita Magar', rank: 'ASI', badge: 'NP-6678', station: 'Patan Station', status: 'on-duty', assigned: 1, phone: '+977-9841-456789', avatar: 'KM', specialization: 'Community Policing' },
  { id: 'OFF-004', name: 'SI Anita Tamang', rank: 'SI', badge: 'NP-7789', station: 'Baneshwor Station', status: 'available', assigned: 0, phone: '+977-9841-567890', avatar: 'AT', specialization: 'Cybercrime' },
  { id: 'OFF-005', name: 'Const. Hari Bhusal', rank: 'Constable', badge: 'NP-8890', station: 'Lalitpur Station', status: 'off-duty', assigned: 0, phone: '+977-9841-678901', avatar: 'HB', specialization: 'Patrol' },
  { id: 'OFF-006', name: 'ASI Suresh Pandey', rank: 'ASI', badge: 'NP-9901', station: 'Bouddha Station', status: 'available', assigned: 0, phone: '+977-9841-789012', avatar: 'SP', specialization: 'Anti-Narcotics' },
  { id: 'OFF-007', name: 'SI Devi Limbu', rank: 'SI', badge: 'NP-1102', station: 'Kalanki Station', status: 'on-duty', assigned: 3, phone: '+977-9841-890123', avatar: 'DL', specialization: 'Special Ops' },
  { id: 'OFF-008', name: 'Const. Binod Chaudhary', rank: 'Constable', badge: 'NP-2213', station: 'Chabahil Station', status: 'available', assigned: 0, phone: '+977-9841-901234', avatar: 'BC', specialization: 'Patrol' },
];

export const notifications = [
  { id: 1, type: 'emergency', message: 'CRITICAL: Armed robbery reported at Thamel — INC-2024-001', time: '2 min ago', read: false },
  { id: 2, type: 'emergency', message: 'Fire accident reported at Bouddha — INC-2024-003', time: '15 min ago', read: false },
  { id: 3, type: 'officer', message: 'SI Ramesh KC has been dispatched to Patan incident', time: '22 min ago', read: false },
  { id: 4, type: 'system', message: 'AI Risk Model updated — Thamel zone elevated to HIGH RISK', time: '1 hr ago', read: true },
  { id: 5, type: 'officer', message: 'INC-2024-005 marked as Resolved by SI Anita Tamang', time: '2 hrs ago', read: true },
  { id: 6, type: 'system', message: 'System health check: All nodes operational', time: '3 hrs ago', read: true },
];

export const weeklyTrends = [
  { day: 'Mon', incidents: 12, resolved: 10 },
  { day: 'Tue', incidents: 19, resolved: 15 },
  { day: 'Wed', incidents: 8, resolved: 8 },
  { day: 'Thu', incidents: 24, resolved: 18 },
  { day: 'Fri', incidents: 31, resolved: 22 },
  { day: 'Sat', incidents: 27, resolved: 20 },
  { day: 'Sun', incidents: 14, resolved: 13 },
];

export const crimeTypeData = [
  { name: 'Theft', value: 34, color: '#f4a261' },
  { name: 'Assault', value: 21, color: '#e63946' },
  { name: 'Traffic', value: 18, color: '#2557a7' },
  { name: 'Domestic Violence', value: 14, color: '#9b59b6' },
  { name: 'Medical', value: 9, color: '#2a9d8f' },
  { name: 'Other', value: 4, color: '#a8b8cc' },
];

export const riskZones = [
  { zone: 'Thamel', risk: 92, level: 'critical', lat: 27.7154, lng: 85.3123 },
  { zone: 'Bouddha', risk: 78, level: 'high', lat: 27.7214, lng: 85.3617 },
  { zone: 'Kalanki', risk: 71, level: 'high', lat: 27.6957, lng: 85.2822 },
  { zone: 'Baneshwor', risk: 55, level: 'medium', lat: 27.6954, lng: 85.3386 },
  { zone: 'Patan', risk: 42, level: 'medium', lat: 27.6710, lng: 85.3240 },
  { zone: 'Lalitpur', risk: 28, level: 'low', lat: 27.6788, lng: 85.3144 },
];

export const hourlyData = [
  { hour: '00', incidents: 2 }, { hour: '02', incidents: 1 }, { hour: '04', incidents: 0 },
  { hour: '06', incidents: 3 }, { hour: '08', incidents: 8 }, { hour: '10', incidents: 14 },
  { hour: '12', incidents: 11 }, { hour: '14', incidents: 9 }, { hour: '16', incidents: 13 },
  { hour: '18', incidents: 17 }, { hour: '20', incidents: 12 }, { hour: '22', incidents: 6 },
];

export const caseReports = [
  { id: 'RPT-2024-044', title: 'Armed Robbery — Thamel Market', type: 'Crime', officer: 'DSP Mohan Basnet', date: '2026-05-30', status: 'open', priority: 'high' },
  { id: 'RPT-2024-043', title: 'Vehicle Theft — Kalimati Area', type: 'Traffic', officer: 'SI Ramesh KC', date: '2026-05-29', status: 'investigating', priority: 'medium' },
  { id: 'RPT-2024-042', title: 'Domestic Violence — Balaju Ward 7', type: 'Domestic', officer: 'ASI Kabita Magar', date: '2026-05-29', status: 'closed', priority: 'high' },
  { id: 'RPT-2024-041', title: 'Drug Trafficking — Bouddha Road', type: 'Narcotics', officer: 'ASI Suresh Pandey', date: '2026-05-28', status: 'closed', priority: 'critical' },
  { id: 'RPT-2024-040', title: 'Missing Child — Patan Durbar', type: 'Missing', officer: 'SI Anita Tamang', date: '2026-05-28', status: 'resolved', priority: 'high' },
  { id: 'RPT-2024-039', title: 'Fire Incident — Old Baneshwor', type: 'Accident', officer: 'SI Devi Limbu', date: '2026-05-27', status: 'resolved', priority: 'medium' },
];
