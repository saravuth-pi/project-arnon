// components/LatestQuakes.js
// V0.1100 - Show last 10 USGS+TMD quakes within 10,000km and M>=2.0 (last 24h)
import React from 'react';

const PAT1_LAT = 13.713306;
const PAT1_LNG = 100.563899;

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTime(timeStr) {
  const date = new Date(timeStr);
  return date.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
}

export default function LatestQuakes({ usgsQuakes = [], tmdQuakes = [] }) {
  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;

  const normalized = [
    ...usgsQuakes.map(q => ({
      source: 'USGS',
      mag: q.mag,
      lat: q.lat,
      lon: q.lon,
      place: q.place,
      time: new Date(q.time).getTime()
    })),
    ...tmdQuakes.map(q => ({
      source: 'TMD',
      mag: q.mag,
      lat: q.lat,
      lon: q.lon,
      place: q.place || q.title,
      time: new Date(q.timestamp).getTime()
    }))
  ].filter(q => q.mag >= 2.0 && q.time >= cutoff && haversine(PAT1_LAT, PAT1_LNG, q.lat, q.lon) <= 10000);

  const sorted = normalized.sort((a, b) => b.time - a.time).slice(0, 10);

  return (
    <div style={{ marginTop: 10 }}>
      <h2>Latest Earthquakes (M≥2.0, ≤10,000km, last 24h)</h2>
      <table style={{ width: '100%', fontSize: '0.9em' }}>
        <thead>
          <tr style={{ background: '#ddd' }}>
            <th>Time</th>
            <th>Mag</th>
            <th>Location</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((q, i) => (
            <tr key={i}>
              <td>{formatTime(q.time)}</td>
              <td>{q.mag.toFixed(1)}</td>
              <td>{q.place}</td>
              <td>{q.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
