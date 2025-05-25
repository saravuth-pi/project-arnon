// components/LatestQuakes.js
// V0.1100 - Show latest combined earthquakes from USGS + TMD

import React from 'react';

const PAT1_LAT = 13.713306;
const PAT1_LNG = 100.563899;

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LatestQuakes({ usgsQuakes = [], tmdQuakes = [] }) {
  const now = Date.now();
  const quakes = [];

  usgsQuakes.forEach((q) => {
    const distance = haversine(PAT1_LAT, PAT1_LNG, q.lat, q.lon);
    const age = now - new Date(q.time).getTime();
    if (distance <= 3000 && q.mag >= 2 && age <= 24 * 3600 * 1000) {
      quakes.push({
        source: 'USGS',
        mag: q.mag,
        place: q.place,
        time: new Date(q.time).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        distance,
      });
    }
  });

  tmdQuakes.forEach((q) => {
    const distance = haversine(PAT1_LAT, PAT1_LNG, q.lat, q.lon);
    const age = now - new Date(q.timestamp).getTime();
    if (distance <= 3000 && q.mag >= 2 && age <= 24 * 3600 * 1000) {
      quakes.push({
        source: 'TMD',
        mag: q.mag,
        place: q.title,
        time: new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Bangkok'}).format(new Date(q.timestamp.replace(' ', 'T') + '+07:00')),
        distance,
      });
    }
  });

  quakes.sort((a, b) => new Date(b.time) - new Date(a.time));
  const last10 = quakes.slice(0, 5);

  return (
    <div>
      <ul>
        {last10.map((q, i) => (
          <li key={i}>
            [{q.source}] M{q.mag.toFixed(1)} - {q.place} - {q.time} - {q.distance.toFixed(0)} km
          </li>
        ))}
      </ul>
    </div>
  );
}
