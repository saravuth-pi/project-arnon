// components/LatestQuakes.js
// V0.1100 - Show latest 10 nearby events from USGS + TMD (M>=2.0, 24h, <10,000km)
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

export default function LatestQuakes({ usgsQuakes = [], tmdQuakes = [] }) {
  const now = Date.now();
  const filtered = [...usgsQuakes, ...tmdQuakes].filter(q => {
    const t = new Date(q.time || q.timestamp).getTime();
    const age = now - t;
    const dist = haversine(PAT1_LAT, PAT1_LNG, q.lat, q.lon);
    return q.mag >= 2 && age < 24 * 60 * 60 * 1000 && dist <= 10000;
  });

  const sorted = filtered.sort((a, b) => {
    const ta = new Date(a.time || a.timestamp).getTime();
    const tb = new Date(b.time || b.timestamp).getTime();
    return tb - ta;
  }).slice(0, 10);

  return (
    <div>
      <h3>แสดงเหตุแผ่นดินไหว 10 ครั้งสุด</h3>
      <ul style={{ paddingLeft: 20 }}>
        {sorted.length === 0 && <li>ไม่พบเหตุใดใน 24 ชั่วโมง</li>}
        {sorted.map((q, i) => (
          <li key={i}>
            <strong>{q.mag.toFixed(1)}</strong> | {q.place || q.title || 'Unknown'}<br />
            เวลา: {new Date(q.time || q.timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
          </li>
        ))}
      </ul>
    </div>
  );
}
