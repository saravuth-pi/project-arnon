// components/LatestQuakes.js
// V0.1.0.0.2 - Show latest combined earthquakes from USGS + TMD

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
    if (distance <= 8000 && q.mag >= 3.5 && age <= 24 * 3600 * 1000) {
      quakes.push({
        source: 'USGS',
        mag: q.mag,
        place: q.place,
        time: new Date(q.time).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        distance,
      });
    }
  });

  tmdQuakes.forEach(q => {
    let ts = q.timestamp;
    const quakeTime = new Date(ts);
    const distance = haversine(PAT1_LAT, PAT1_LNG, q.lat, q.lon);
    const age = now - quakeTime.getTime();
    const timeInBangkok = new Date(new Date(q.timestamp).getTime() + 7 * 60 * 60 * 1000);
    // console.log(timeInBangkok);
    if (distance <= 3000 && q.mag >= 2.5 && age <= 24 * 3600 * 1000) {
      quakes.push({
        source: 'TMD',
        mag: q.mag,
        place: q.title,
        time: timeInBangkok.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Bangkok', }),
        distance,
      });
    }
  });

  
  quakes.sort((a, b) => new Date(b.time) - new Date(a.time));
  const last10 = quakes.slice(0, 10);

  return (
    <div style={{fontSize: '0.8rem', color: '#eee'}}>
        {last10.map((q, i) => (
          <div style={{fontSize: '0.8rem', color: '#eee', marginLeft: '30px'}}>
            {i+1}) {q.distance.toFixed(0)} km  - {q.time} - M{q.mag.toFixed(1)} - {q.place}  [{q.source}]
          </div>
        ))}
    </div>
  );
}
