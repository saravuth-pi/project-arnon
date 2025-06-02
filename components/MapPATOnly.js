// components/MapPATOnly.js
// V0.1.0.0.0 - Edited MapPATOnly component to display ESP32 devices on a map with CircleMarkers

import React, { useEffect, useState } from 'react';

export default function MapPATOnly({ latest }) {
  const [LeafletComponents, setLeafletComponents] = useState(null);

  useEffect(() => {
    // โหลดเฉพาะฝั่ง client (browser) เท่านั้น
    Promise.all([
      import('leaflet/dist/leaflet.css'),
      import('leaflet'),
      import('react-leaflet')
    ])
      .then(([leafletCSS, L, ReactLeaflet]) => {
        const { MapContainer, TileLayer, Marker } = ReactLeaflet;
        setLeafletComponents({
          L: L.default,
          MapContainer,
          TileLayer,
          Marker
        });
      })
      .catch((err) => console.error('Error loading Leaflet:', err));
  }, []);

  // หากยังไม่โหลดเสร็จ (หรือกำลัง SSR) ให้ return null ไม่ต้องแสดงอะไร
  if (!LeafletComponents) {
    return null;
  }

  const { L, MapContainer, TileLayer, Marker } = LeafletComponents;

  // ระบุตำแหน่ง (lat, lng) ของแต่ละ ESP32
  const DEVICE_LOCATION = {
    'esp32-1': { lat: 13.71321, lng: 100.56407 },
    'esp32-2': { lat: 13.70830, lng: 100.57225 },
    'esp32-3': { lat: 13.69775, lng: 100.58752 }
  };

  // ระบุสีพื้นของแต่ละกล่อง label
  const COLOR_MAP = {
    'esp32-1': '#2ecc71', // เขียวอ่อน
    'esp32-2': '#8e44ad', // ม่วง
    'esp32-3': '#3498db'  // น้ำเงิน
  };

  // ฟังก์ชันสร้าง DivIcon สำหรับแต่ละ device
  const createLabelIcon = (deviceId, data) => {
    const bgColor = COLOR_MAP[deviceId] || '#7f8c8d';
    const aqiValue = data && data.aqi25 != null ? data.aqi25 : '-';
    const magValue = data && data.shakeMag != null ? data.shakeMag.toFixed(2) : '-';

    // html ของกล่องข้อความ พร้อม inline style กำหนด border-top-color ให้ลูกศร
    const html = `
      <div class="sensor-label-box" style="background: ${bgColor};">
        <div class="sensor-label-title">${deviceId.toUpperCase()}</div>
        <div class="sensor-label-line">AQI : ${aqiValue}</div>
        <div class="sensor-label-line">Mag : ${magValue}</div>
        <div class="sensor-label-triangle" style="border-top-color: ${bgColor};"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'sensor-div-icon',
      iconSize: [80, 60],      // กว้างประมาณ 80px สูงประมาณ 60px (กล่อง + ลูกศร)
      iconAnchor: [40, 60]     // ให้จุดเชื่อมต่อเป็นกึ่งกลางล่าง (width/2, height)
    });
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[13.7000, 100.5300]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {Object.entries(latest).map(([deviceId, data]) => {
          const loc = DEVICE_LOCATION[deviceId];
          if (!loc) return null;

          const labelIcon = createLabelIcon(deviceId, data);

          return (
            <Marker
              key={deviceId}
              position={[loc.lat, loc.lng]}
              icon={labelIcon}
              interactive={false}
            />
          );
        })}
      </MapContainer>

      <style jsx>{`
        .sensor-div-icon {
          background: transparent;
          border: none;
        }
        .sensor-label-box {
          position: relative;
          display: inline-block;
          padding: 4px 6px;
          border-radius: 4px;
          color: white;
          font-size: 0.85rem;
          text-align: left;
          white-space: nowrap;
        }
        .sensor-label-title {
          font-weight: bold;
          margin-bottom: 2px;
        }
        .sensor-label-line {
          margin: 0;
          line-height: 1.2em;
        }
        .sensor-label-triangle {
          position: absolute;
          bottom: -6px;           
          left: 50%;              
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid; 
        }
      `}</style>
    </div>
  );
}
