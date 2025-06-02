import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

// กำหนด sensor ที่ต้องการแสดง
const SENSORS = [
  { id: 'PAT1', lat: 13.713306, lng: 100.563899 },
  { id: 'PAT2', lat: 13.70847, lng: 100.57219 },
  // เพิ่ม sensor อื่นๆ
];

function getColor(mag) {
  if (mag >= 6) return 'darkred';
  if (mag >= 5) return 'orangered';
  if (mag >= 4.5) return 'orange';
  if (mag >= 3) return 'yellow';
  return 'green';
}

export default function MapPATOnly({ latest = {} }) {
  // ใช้ useRef และ useState เป็น object ตาม sensor id
  const prev = useRef({});
  const history = useRef({});
  const [sensorMags, setSensorMags] = useState({});

  useEffect(() => {
    SENSORS.forEach(sensor => {
      const data = latest[sensor.id];
      if (!data) return;

      if (!history.current[sensor.id]) history.current[sensor.id] = [];
      if (prev.current[sensor.id]) {
        const dx = data.x - prev.current[sensor.id].x;
        const dy = data.y - prev.current[sensor.id].y;
        const dz = data.z - prev.current[sensor.id].z;
        const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const magnitude = Math.min(10, delta * 5);

        const now = Date.now();
        history.current[sensor.id].push({ mag: magnitude, ts: now });
        history.current[sensor.id] = history.current[sensor.id].filter(d => now - d.ts <= 5000);

        const values = history.current[sensor.id].map(d => d.mag);
        const maxMag = Math.max(...values);
        setSensorMags(mags => ({
          ...mags,
          [sensor.id]: parseFloat(maxMag.toFixed(1))
        }));
      }
      prev.current[sensor.id] = { x: data.x, y: data.y, z: data.z };
    });
  }, [latest]);

  return (
    <MapContainer center={[13.70479, 100.57489]} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {SENSORS.map(sensor => {
        const mag = sensorMags[sensor.id] || 0;
        const data = latest[sensor.id] || {};
        return (
          <Marker
            key={sensor.id}
            position={[sensor.lat, sensor.lng]}
            icon={L.divIcon({
              className: 'sensor-marker',
              html: `<div style="
                background-color: ${getColor(mag)};
                width: 25px; height: 25px;
                border-radius: 100%;
                color: black;
                font-size: 11px;
                font-weight: bold;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 1px solid white;
                animation: ${mag > 4.5 ? 'pulse 1s infinite' : 'none'};
              ">${mag.toFixed(1)}</div>`
            })}
          >
            <Popup>
              <strong>Sensor Node: {sensor.id}</strong><br />
              Lat: {sensor.lat}, Lng: {sensor.lng}<br />
              Magnitude: {mag.toFixed(1)}<br />
              {data.pm25 !== undefined && <>PM2.5: {data.pm25}<br /></>}
              {data.co2 !== undefined && <>CO2: {data.co2}<br /></>}
              {/* เพิ่มข้อมูลอื่นๆ ได้ */}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}