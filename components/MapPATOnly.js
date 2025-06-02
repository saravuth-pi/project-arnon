// components/MapPATOnly.js
// V0.1.0.0.0 - Edited MapPATOnly component to display ESP32 devices on a map with CircleMarkers

import React, { useEffect, useState } from 'react';

// เตรียมตัวแปรสำหรับโหลดโค้ด Leaflet เฉพาะฝั่งไคลเอ็นต์
export default function MapPATOnly({ latest }) {
  const [LeafletComponents, setLeafletComponents] = useState(null);

  useEffect(() => {
    // ถ้าอยู่ฝั่งไคลเอ็นต์ (browser) จึงโหลดโมดูล Leaflet/React-Leaflet
    Promise.all([
      import('leaflet/dist/leaflet.css'),
      import('leaflet'),
      import('react-leaflet')
    ])
      .then(([leafletCSS, L, ReactLeaflet]) => {
        // ดึง MapContainer, TileLayer, Marker จาก react-leaflet
        const { MapContainer, TileLayer, Marker } = ReactLeaflet;
        setLeafletComponents({
          L: L.default,
          MapContainer,
          TileLayer,
          Marker
        });
      })
      .catch((err) => console.error('Error loading Leaflet client-only:', err));
  }, []);

  // กำหนดตำแหน่งของแต่ละ device ตามจริง
  const DEVICE_LOCATION = {
    'esp32-1': { lat: 13.71321, lng: 100.56407 },
    'esp32-2': { lat: 13.70830, lng: 100.57225 },
    'esp32-3': { lat: 13.69775, lng: 100.58752 }
  };
  const COLOR_MAP = {
    'esp32-1': '#2ecc71',
    'esp32-2': '#8e44ad',
    'esp32-3': '#3498db'
  };

  // หากยังไม่ได้โหลด Leaflet Components (SSR หรือระหว่างรอดาวน์โหลด) → คืน placeholder ว่าง
  if (!LeafletComponents) {
    return null;
  }

  const { L, MapContainer, TileLayer, Marker } = LeafletComponents;

  // ฟังก์ชันสร้าง DivIcon สำหรับข้อความสี่เหลี่ยม
  const createLabelIcon = (deviceId, data) => {
    const bgColor = COLOR_MAP[deviceId] || '#7f8c8d';
    const aqiValue = data && data.aqi25 != null ? data.aqi25 : '-';
    const magValue = data && data.shakeMag != null ? data.shakeMag.toFixed(2) : '-';

    const html = `
      <div class="sensor-label-box" style="background:${bgColor};">
        <div class="sensor-label-title">${deviceId.toUpperCase()}</div>
        <div class="sensor-label-line">AQI : ${aqiValue}</div>
        <div class="sensor-label-line">Mag : ${magValue}</div>
        <div class="sensor-label-triangle"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'sensor-div-icon',
      iconSize: [70, 60],
      iconAnchor: [35, 70]
    });
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[13.70516, 100.57292]} // ตำแหน่งกลางของแผนที่
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
          background: currentColor;
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
          border-top: 6px solid inherit;
        }
        .sensor-label-box {
          color: currentColor;
        }
        .sensor-label-triangle {
          border-top-color: inherit;
        }
      `}</style>
    </div>
  );
}
