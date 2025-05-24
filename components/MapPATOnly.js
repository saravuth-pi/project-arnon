// components/MapPATOnly.js
// V0.1000 - Zoomed map focused on PAT1 only

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

const PAT1_LAT = 13.713306;
const PAT1_LNG = 100.563899;

function getColor(mag) {
  if (mag >= 6) return 'darkred';
  if (mag >= 5) return 'orangered';
  if (mag >= 4.5) return 'orange';
  if (mag >= 3) return 'yellow';
  return 'green';
}

export default function MapPATOnly({ latest }) {
  const prev = useRef(null);
  const history = useRef([]);
  const [pat1Mag, setPat1Mag] = useState(0);

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
      const maxMag = Math.max(...values);
      setPat1Mag(parseFloat(maxMag.toFixed(1)));
    }

    prev.current = { x, y, z };
  }, [latest]);

  return (
    <MapContainer center={[PAT1_LAT, PAT1_LNG]} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <Marker
        position={[PAT1_LAT, PAT1_LNG]}
        icon={L.divIcon({
          className: 'sensor-marker',
          html: `<div style="
            background-color: ${getColor(pat1Mag)};
            width: 15px; height: 10px;
            border-radius: 10%;
            color: black;
            font-size: 11px;
            font-weight: bold;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 1px solid white;
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
    </MapContainer>
  );
}
