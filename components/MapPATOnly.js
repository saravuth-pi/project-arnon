// components/MapPATOnly.js
// V0.1.0.0.0 - Edited MapPATOnly component to display ESP32 devices on a map with CircleMarkers
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';

// ตรียม mapping ตำแหน่งจริงของแต่ละ ESP32 อยู่แล้ว
const DEVICE_LOCATION = {
  'esp32-1': { lat: 13.7030, lng: 100.5340 },
  'esp32-2': { lat: 13.6985, lng: 100.5285 },
  'esp32-3': { lat: 13.7005, lng: 100.5320 } // สมมติตำแหน่งไว้ก่อน
};

const COLOR_MAP = {
  'esp32-1': '#2ecc71', // เขียวอ่อน
  'esp32-2': '#8e44ad', // ม่วง
  'esp32-3': '#3498db'  // น้ำเงิน
};

export default function MapPATOnly({ latest }) {
  // latest คือ allDataPoints จาก index.js ซึ่งเป็น object e.g. { "esp32-1": {...}, "esp32-2": {...} }
  // เราจะวน loop key ของ latest เพื่อสร้าง Marker

  return (
    <MapContainer
      center={[13.7000, 100.5300]} // จุดกึ่งกลางของ Port of Bangkok (ปรับพิกัดตามจริง)
      zoom={14}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {Object.entries(latest).map(([deviceId, data]) => {
        const loc = DEVICE_LOCATION[deviceId];
        if (!loc) return null;

        // หาก data.shakeMag หรือ data.aqi25 มีค่ามา ก็สามารถปรับขนาดหรือลักษณะ marker ได้
        const color = COLOR_MAP[deviceId] || '#7f8c8d';

        return (
          <CircleMarker
            key={deviceId}
            center={[loc.lat, loc.lng]}
            radius={12}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.6
            }}
          >
            <Popup>
              <div style={{ minWidth: 160, lineHeight: '1.4em' }}>
                <strong>{deviceId.toUpperCase()}</strong><br />
                AQI₂.₅: {data.aqi25 != null ? data.aqi25 : '-'}<br />
                Mag: {data.shakeMag != null ? data.shakeMag.toFixed(2) : '-'}<br />
                Timestamp: {data.ts ? new Date(data.ts).toLocaleTimeString('th-TH') : '-'}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
