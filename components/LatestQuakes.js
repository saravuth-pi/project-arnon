// components/LatestQuakes.js
// V0.1.0.0.4 – เปลี่ยนเป็นแผนที่แสดงจุด USGS/TMD (เดิมเป็นตาราง)
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

function LatestQuakesContent({ tmdQuakes = [] }) {
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

  // 3) กรอง TMD (เดิม)
  tmdQuakes.forEach((q) => {
    const quakeTime = new Date(q.timestamp);
    const distance = haversine(PAT1_LAT, PAT1_LNG, q.lat, q.lon);
    const age = now - quakeTime.getTime();
    // แปลงเวลาจาก UTC → Bangkok
    const bangkokTime = new Date(quakeTime.getTime() + 7 * 3600 * 1000);
    if (distance <= 2000 && q.mag >= 3.0 && age <= 24 * 3600 * 1000) {
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

  // 2) กรอง USGS
  usgsQuakes.forEach((q) => {
    const distance = haversine(PAT1_LAT, PAT1_LNG, q.lat, q.lon);
    const age = now - q.time;
    if (distance <= 5000 && q.mag >= 4.5 && age <= 24 * 3600 * 1000) {
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

  return (
    <>
      {quakes.map((q, i) => (
        <Marker
          key={`${q.source}-${i}`}
          position={[q.lat, q.lon]}
          icon={L.divIcon({
            className: 'custom-quake-marker',
            html: `<div style="
              background-color: ${getColor(q.mag)};
              width: 20px;
              height: 20px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              color: black;
              font-weight: bold;
            ">${q.mag.toFixed(1)}</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })}
        >
          <Popup>
            <strong>Source:</strong> {q.source}<br />
            <strong>Magnitude:</strong> {q.mag.toFixed(1)}<br />
            <strong>Place:</strong> {q.place}<br />
            <strong>Time:</strong> {q.time}<br />
            <strong>Distance:</strong> {q.distance.toFixed(0)} km
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function getColor(mag) {
  const normalizedMag = Math.min(Math.max(mag, 3.0), 8.0);
  const fraction = (normalizedMag - 3.0) / 5.0;
  const hue = (1 - fraction) * 120;
  return `hsl(${hue}, 100%, 50%)`;
}

export default function LatestQuakes() {
  return (
    <div style={{ height: '300px', width: '100%' }}>
      <MapContainer
        center={[PAT1_LAT, PAT1_LNG]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <LatestQuakesContent />
      </MapContainer>

      <style jsx>{`
        .custom-quake-marker div {
          border: 1px solid #333;
          box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
