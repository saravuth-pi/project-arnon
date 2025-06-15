// components/LatestQuakes.js
// V0.1.0.0.3 – Fetch USGS ภายใน component และรวมกับ TMD

import React, { useState, useEffect } from 'react';

const PAT1_LAT = 13.713306;
const PAT1_LNG = 100.563899;

// ฟังก์ชันคำนวณระยะทาง (กิโลเมตร) โดย Haversine
function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // รัศมีโลก
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LatestQuakes({ tmdQuakes = [] }) {
  const [usgsQuakes, setUsgsQuakes] = useState([]);

  // 1) fetch USGS feed ทุกครั้งที่ component mount
  useEffect(() => {
    const url =
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        // แปลง features → array ของ { lat, lon, mag, place, time }
        const list = (json.features || []).map((f) => ({
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          mag: f.properties.mag,
          place: f.properties.place,
          time: f.properties.time, // timestamp (ms since epoch)
        }));
        setUsgsQuakes(list);
      })
      .catch((err) => {
        console.error('Failed to fetch USGS quakes:', err);
        setUsgsQuakes([]);
      });
  }, []);

  const now = Date.now();
  const quakes = [];

  // 2) กรอง USGS
  usgsQuakes.forEach((q) => {
    const distance = haversine(PAT1_LAT, PAT1_LNG, q.lat, q.lon);
    const age = now - q.time;
    if (distance <= 8000 && q.mag >= 3.5 && age <= 24 * 3600 * 1000) {
      quakes.push({
        source: 'USGS',
        mag: q.mag,
        place: q.place,
        time: new Date(q.time).toLocaleString('th-TH', {
          timeZone: 'Asia/Bangkok',
        }),
        distance,
      });
    }
  });

  // 3) กรอง TMD (เดิม)
  tmdQuakes.forEach((q) => {
    const quakeTime = new Date(q.timestamp);
    const distance = haversine(PAT1_LAT, PAT1_LNG, q.lat, q.lon);
    const age = now - quakeTime.getTime();
    // แปลงเวลาจาก UTC → Bangkok
    const bangkokTime = new Date(quakeTime.getTime() + 7 * 3600 * 1000);
    if (distance <= 3000 && q.mag >= 2.5 && age <= 24 * 3600 * 1000) {
      quakes.push({
        source: 'TMD',
        mag: q.mag,
        place: q.title,
        time: bangkokTime.toLocaleString('th-TH', {
          dateStyle: 'short',
          timeStyle: 'medium',
          timeZone: 'Asia/Bangkok',
        }),
        distance,
      });
    }
  });

  // 4) sort & slice
  quakes.sort((a, b) => new Date(b.time) - new Date(a.time));
  const last10 = quakes.slice(0, 10);

  return (
    <div style={{ fontSize: '0.8rem', color: '#eee' }}>
      {last10.map((q, i) => (
        <div
          key={`${q.source}-${i}`}
          style={{ fontSize: '0.8rem', color: '#eee', marginLeft: '30px' }}
        >
          {i + 1}) {q.distance.toFixed(0)} km – {q.time} – M
          {q.mag.toFixed(1)} – {q.place} [{q.source}]
        </div>
      ))}
    </div>
  );
}
