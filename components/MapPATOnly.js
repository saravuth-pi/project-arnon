// /components/MapPATOnly.js
// V0.500 - แสดงแผนที่พร้อม marker ของ sensor ที่มีข้อมูลล่าสุด

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// กำหนด sensor ที่ต้องการแสดง
const SENSORS = [
  { id: 'esp32-1', lat: 13.713306, lng: 100.563899 },
  { id: 'esp32-2', lat: 13.70847, lng: 100.57219 },
  // เพิ่ม sensor อื่นๆ ได้ในอนาคต
];

// ฟังก์ชันกำหนดสีตาม magnitude
function getColor(mag) {
  if (mag >= 6) return 'darkred';
  if (mag >= 5) return 'orangered';
  if (mag >= 4.5) return 'orange';
  if (mag >= 3) return 'yellow';
  return 'green';
}

export default function MapPATOnly({ latest = {} }) {
  const [sensorMags, setSensorMags] = useState({});

  useEffect(() => {
    console.log('latest prop in MapPATOnly:', latest);

    // อัปเดตค่า magnitude ของแต่ละเซ็นเซอร์
    const updatedMags = {};
    SENSORS.forEach(sensor => {
      const data = latest[sensor.id];
      if (data && data.shakeMag !== undefined) {
        updatedMags[sensor.id] = Math.min(10, data.shakeMag); // จำกัดค่า magnitude ไม่เกิน 10
      }
    });
    setSensorMags(updatedMags);
  }, [latest]);

  return (
    <MapContainer center={[13.70479, 100.57489]} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {SENSORS.map(sensor => {
        const mag = sensorMags[sensor.id] || 0; // ค่า magnitude ของเซ็นเซอร์
        const data = latest[sensor.id] || {}; // ข้อมูลของเซ็นเซอร์

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
              <strong>Node: {sensor.id}</strong><br />
              Magnitude: {mag.toFixed(1)}<br />
              {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                  {key}: {value}
                </div>
              ))}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

/* 
import { useEffect } from 'react';

export default function MapPATOnly({ latest }) {
  useEffect(() => {
    console.log('latest prop in MapPATOnly:', latest);
  }, [latest]);

  // latest เป็น object ที่ key คือ device, value คือข้อมูล sensor
  const sensorKeys = latest ? Object.keys(latest) : [];

  return (
    <div>
      <h3>Debug: ดู console.log ข้อมูลล่าสุด</h3>
      <pre style={{ fontSize: 12, color: 'red' }}>
        {JSON.stringify(latest, null, 2)}
      </pre>
      {sensorKeys.length === 0 && <div>ไม่พบข้อมูล sensor</div>}
      {sensorKeys.map(key => {
        const data = latest[key];
        return (
          <div key={key} style={{ marginTop: 16, border: '1px solid #ccc', padding: 8, borderRadius: 6 }}>
            <div>Device: {data.device}</div>
            <div>Shake Magnitude: {data.shakeMag}</div>
            <div>PM2.5: {data.pm25}</div>
            <div>PM10: {data.pm10}</div>
            <div>AQI25: {data.aqi25}</div>
            <div>AQI10: {data.aqi10}</div>
            <div>CO2: {data.CO2}</div>
            <div>TOC: {data.TOC}</div>
            <div>Timestamp: {data.ts}</div>
          </div>
        );
      })}
    </div>
  );
}


  */