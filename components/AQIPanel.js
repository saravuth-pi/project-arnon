// components/AQIPanel.js
// V0.1000 - Simple AQI panel 
// Simple AQI panel that fetches Bangkok AQI and displays the index and condition

import { useEffect, useState } from 'react';

export default function AQIPanel() {
  const [aqi, setAqi] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function fetchAQI() {
      try {
        const res = await fetch('https://api.waqi.info/feed/bangkok/?token=0272d7ffbc1e1ebe1e004bb5b0eba196d0757fbe');
        const json = await res.json();
        if (json.status === 'ok') {
          const value = json.data.aqi;
          setAqi(value);
          setStatus(getAqiStatus(value));
        }
      } catch (err) {
        console.error('Failed to fetch AQI:', err);
      }
    }
    fetchAQI();
    const interval = setInterval(fetchAQI, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  console.log = (aqi);
  
  function getAqiStatus(val) {
    if (val <= 50) return 'Good';
    if (val <= 100) return 'Moderate';
    if (val <= 150) return 'Unhealthy for Sensitive Groups';
    if (val <= 200) return 'Unhealthy';
    if (val <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  return (
    <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
      <h3>Bangkok AQI</h3>
      {aqi !== null ? (
        <div>
          <p><strong>Index:</strong> {aqi}</p>
          <p><strong>Condition:</strong> {status}</p>
        </div>
      ) : (
        <p>Loading AQI...</p>
      )}
    </div>
  );
}
