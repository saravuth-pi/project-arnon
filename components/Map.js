// components/Map.js
// V0.8603 - Fix TMD timestamp (convert from UTC to Bangkok time)
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

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

function getColor(mag) {
  if (mag >= 6) return 'darkred';
  if (mag >= 5) return 'orangered';
  if (mag >= 4.5) return 'orange';
  if (mag >= 3) return 'yellow';
  return 'green';
}

function toBangkokTimeString(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleString('sv-SE', {
    timeZone: 'Asia/Bangkok'
  }).replace('T', ' ');
}

export default function Map({ latest, tmdQuakes = [] }) {
  const [quakes, setQuakes] = useState([]);
  const prev = useRef(null);
  const history = useRef([]);
  const [pat1Mag, setPat1Mag] = useState(0);
  const sentUSGSIds = useRef(new Set());

  useEffect(() => {
    fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson')
      .then(res => res.json())
      .then(data => {
        const filtered = data.features.filter(f => {
          const [lon, lat] = f.geometry.coordinates;
          const distance = haversine(PAT1_LAT, PAT1_LNG, lat, lon);
          return distance <= 10000;
        }).map(f => {
          const { mag, place, time } = f.properties;
          const [lon, lat] = f.geometry.coordinates;
          const distance = haversine(PAT1_LAT, PAT1_LNG, lat, lon);
          const id = f.id;

          if (!sentUSGSIds.current.has(id)) {
            sentUSGSIds.current.add(id);

            fetch("https://arnon.dgbkp.in.th/save_quake.php", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                magnitude: mag,
                place,
                latitude: lat,
                longitude: lon,
                distance,
                quake_time: toBangkokTimeString(time)
              })
            });
          }

          return { lat, lon, mag, place, time, distance };
        });

        setQuakes(filtered);
      });
  }, []);

  useEffect(() => {
    if (!latest) return;

    const { x, y, z } = latest;

    if (prev.current) {
      const dx = x - prev.current.x;
      const dy = y - prev.current.y;
      const dz = z - prev.current.z;
      const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const magnitude = Math.min(10, delta * 5);

      const now = Date.now();
      history.current.push({ mag: magnitude, ts: now });
      history.current = history.current.filter(d => now - d.ts <= 5000);

      const values = history.current.map(d => d.mag);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const maxMag = Math.max(...values);
      setPat1Mag(parseFloat(maxMag.toFixed(1)));

      if (avg > 1.5) {
        fetch("https://arnon.dgbkp.in.th/save_quake.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            magnitude: maxMag,
            place: "PAT1 - Bangkok",
            latitude: PAT1_LAT,
            longitude: PAT1_LNG,
            distance: 0,
            quake_time: toBangkokTimeString(new Date())
          })
        });
      }
    }

    prev.current = { x, y, z };
  }, [latest]);

  return (
    <MapContainer center={[PAT1_LAT, PAT1_LNG]} zoom={3} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />

      {/* จุด PAT1 */}
      <Marker
        position={[PAT1_LAT, PAT1_LNG]}
        icon={L.divIcon({
          className: 'sensor-marker',
          html: `<div style="
            background-color: ${getColor(pat1Mag)};
            width: 36px; height: 36px;
            border-radius: 50%;
            color: black;
            font-size: 11px;
            font-weight: bold;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 2px solid white;
            animation: ${pat1Mag > 4.5 ? 'pulse 1s infinite' : 'none'};
          ">${pat1Mag.toFixed(1)}</div>`
        })}
      >
        <Popup>
          <strong>Local Sensor Node: PAT1</strong><br />
          Lat: {PAT1_LAT}, Lng: {PAT1_LNG}<br />
          Magnitude: {pat1Mag.toFixed(1)}
        </Popup>
      </Marker>

      {/* จุด USGS */}
      {quakes.map((q, i) => (
        <Marker
          key={i}
          position={[q.lat, q.lon]}
          icon={L.divIcon({
            className: 'custom-marker',
            html: `<div style="
              background-color: ${getColor(q.mag)};
              width: 28px; height: 28px;
              border-radius: 50%;
              color: black;
              font-size: 12px;
              font-weight: bold;
              display: flex;
              justify-content: center;
              align-items: center;
              animation: ${q.mag > 4.5 ? 'pulse 1s infinite' : 'none'};
            ">${q.mag.toFixed(1)}</div>`
          })}
        >
          <Popup>
            <strong>Magnitude:</strong> {q.mag}<br />
            <strong>Location:</strong> {q.place}<br />
            <strong>Distance:</strong> {q.distance.toFixed(0)} km<br />
            <strong>Time:</strong> {new Date(q.time).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
          </Popup>
        </Marker>
      ))}

      {/* จุด TMD */}
      {Array.isArray(tmdQuakes) && tmdQuakes.map((q, i) => {
        const distance = haversine(PAT1_LAT, PAT1_LNG, q.lat, q.lon);
        const timeInBangkok = new Date(new Date(q.timestamp).getTime() + 7 * 60 * 60 * 1000);
        return (
          <Marker
            key={`tmd-${i}`}
            position={[q.lat, q.lon]}
            icon={L.divIcon({
              className: 'tmd-marker',
              html: `<div style="
                background-color: ${getColor(q.mag)};
                width: 28px; height: 28px;
                border-radius: 50%;
                color: white;
                font-size: 11px;
                font-weight: bold;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 2px solid white;
              ">${q.mag.toFixed(1)}</div>`
            })}
          >
            <Popup>
              <strong>Magnitude:</strong> {q.mag}<br />
              <strong>Title:</strong> {q.title}<br />
              <strong>Distance:</strong> {distance.toFixed(0)} km<br />
              <strong>Time:</strong> {timeInBangkok.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
