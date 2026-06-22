import { useState, useEffect } from 'react';

const STATION_KEY = 'sers-station-settings';

const defaultStation = {
  name:      'Hanuman Dhoka Headquarters',
  province:  'Bagmati Province',
  district:  'Kathmandu',
  area:      'Kathmandu Metropolitan',
  emergency: '100',
  address:   'Hanuman Dhoka, Kathmandu Metropolitan City, Ward No. 27, Kathmandu, Bagmati Province, Nepal',
  broadcasting: true,
  aiRisk:    true,
};

export function useStation() {
  const [station, setStation] = useState(() => {
    try {
      const saved = localStorage.getItem(STATION_KEY);
      return saved ? JSON.parse(saved) : defaultStation;
    } catch {
      return defaultStation;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(STATION_KEY);
        if (saved) setStation(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('stationUpdated', handleUpdate);
    return () => window.removeEventListener('stationUpdated', handleUpdate);
  }, []);

  const updateStation = (newStation) => {
    localStorage.setItem(STATION_KEY, JSON.stringify(newStation));
    setStation(newStation);
    window.dispatchEvent(new Event('stationUpdated'));
  };

  return { station, updateStation };
}
