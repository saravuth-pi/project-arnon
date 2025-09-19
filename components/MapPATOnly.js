// components/MapPATOnly.js
// V0.1.0.0.0 - Edited MapPATOnly component to display ESP32 devices on a map with tooltips box
import React, { useEffect, useState } from 'react';

// (1) เราจะโหลด Leaflet/React-Leaflet แบบ dynamic แทน import ตรง ๆ
export default function MapPATOnly({ latest }) {
  const [LeafletModules, setLeafletModules] = useState(null);

  useEffect(() => {
    // โหลดเฉพาะฝั่ง client (browser) ทีละโมดูล
    Promise.all([
      import('leaflet/dist/leaflet.css'),
      import('react-leaflet'),
      import('leaflet')
    ])
      .then(([leafletCSS, ReactLeaflet, L]) => {
        const { MapContainer, TileLayer, CircleMarker, Tooltip } = ReactLeaflet;
        setLeafletModules({
          L: L.default,
          MapContainer,
          TileLayer,
          CircleMarker,
          Tooltip
        });
      })
      .catch((err) => console.error('Error loading Leaflet modules:', err));
  }, []);

  // (2) ถ้ายังไม่โหลดเสร็จ ให้ return null
  if (!LeafletModules) return null;

  const { L, MapContainer, TileLayer, CircleMarker, Tooltip } = LeafletModules;

  // (3) พิกัดและสีของแต่ละ Device
  const DEVICE_LOCATION = {
    'PAT-Building-A': { lat: 13.71321, lng: 100.56407 },
    'DG-warehouse': { lat: 13.70830, lng: 100.57225 },
    'Stevedore': { lat: 13.705961, lng: 100.572593 }
  };
  const COLOR_MAP = {
    'PAT-Building-A': '#2ecc71', // เขียวอ่อน
    'DG-warehouse': '#8e44ad', // ม่วง
    'Stevedore': '#3498db'  // น้ำเงิน
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[13.710387, 100.574588]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {Object.entries(latest).map(([deviceId, data]) => {
          const loc = DEVICE_LOCATION[deviceId];
          if (!loc) return null;

          const bgColor = COLOR_MAP[deviceId] || '#7f8c8d';
          // ค่าที่จะแสดง (เว้นว่างถ้า null)
          const aqiValue = data && data.aqi25 != null ? data.aqi25 : '-';
          const magValue = data && data.shakeMag != null ? data.shakeMag.toFixed(2) : '-';

          return (
            <CircleMarker
              key={deviceId}
              center={[loc.lat, loc.lng]}
              radius={4}
              pathOptions={{
                color: bgColor,
                fillColor: bgColor,
                fillOpacity: 0.85
              }}
            >
              {/* (4) ใช้ Tooltip permanent: จะวาดกล่อง+arrow ให้อัตโนมัติ */}
              <Tooltip
                permanent
                direction="top"
                offset={[0, -5]} // เลื่อนกล่องขึ้นเล็กน้อยเหนือจุด
                className="sensor-tooltip"
              >
                <div className="sensor-label" style={{ backgroundColor: bgColor }}>
                  <div className="sensor-label-line">Mag : {magValue}</div>
                  <div className="sensor-label-line">AQI : {aqiValue}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* (5) CSS สำหรับ styling Tooltip ให้เป็นกล่องสีพร้อม arrow เดิม ๆ ของ Leaflet */}
      <style jsx>{`
      
        /* .sensor-tooltip จะถูก applied ไปที่ <div class="leaflet-tooltip ..."> ที่ Leaflet สร้างให้ */
        .sensor-tooltip .leaflet-tooltip-content {
          background: transparent; /* เราจะเอา background จาก .sensor-label แทน */
          padding: 0;
          border: none;
        }
        .sensor-tooltip .leaflet-tooltip-arrow {
          /* ให้ arrow ของ tooltip ใช้สีเดียวกับ background ของ .sensor-label */
          color: transparent; /* ปิดการใช้ currentColor ให้ arrow ใส่สีแบบ custom */
        }

        .sensor-label {
          /* กล่องสี่เหลี่ยม (ตัดมาจาก <Tooltip>) */
          border-radius: 4px;
          color: white;
          padding: 6px 6px;
          font-size: 0.85rem;
          text-align: left;
          white-space: nowrap;
        }
        .sensor-label-title {
          font-weight: bold;
          margin-bottom: 1px;
        }
        .sensor-label-line {
          margin: 0;
          line-height: 1.0em;
        }

        /* กำหนด arrow ให้ใช้สีพื้นตัวเอง (bgColor) เพราะ Leaflet arrow เป็น pseudo-element */
        .sensor-tooltip.leaflet-tooltip-top .leaflet-tooltip-arrow::before {
          border-bottom-color: inherit; /* ให้ arrow ใช้สีจาก .sensor-label (แล้ว override ด้วย inherit) */
        }
      `}</style>
    </div>
  );
}
