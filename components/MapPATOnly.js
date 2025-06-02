// components/MapPATOnly.js
// V0.1.0.0.0 - Edited MapPATOnly component to display ESP32 devices on a map with CircleMarkers

import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// พิกัดของแต่ละ device (esp32-1, esp32-2, esp32-3)
const DEVICE_LOCATION = {
  'esp32-1': { lat: 13.7030, lng: 100.5340 },
  'esp32-2': { lat: 13.6985, lng: 100.5285 },
  'esp32-3': { lat: 13.7005, lng: 100.5320 } // สำรองไว้สำหรับอนาคต
};

// สีพื้นหลังของกล่องข้อความแต่ละ device
const COLOR_MAP = {
  'esp32-1': '#2ecc71', // เขียวอ่อน
  'esp32-2': '#8e44ad', // ม่วง
  'esp32-3': '#3498db'  // น้ำเงิน
};

export default function MapPATOnly({ latest }) {
  // latest คือ object ของค่า sensor, เช่น:
  // {
  //   "esp32-1": { aqi25: 33, shakeMag: 0.30, ts: "2025-06-02T19:14:23", … },
  //   "esp32-2": { aqi25: 31, shakeMag: 0.50, ts: "2025-06-02T19:15:01", … },
  //   …
  // }

  // สร้างฟังก์ชันช่วยสร้าง DivIcon สำหรับแต่ละ device
  const createLabelIcon = (deviceId, data) => {
    // เลือกสีพื้นหลังจาก COLOR_MAP
    const bgColor = COLOR_MAP[deviceId] || '#7f8c8d';
    // อ่านค่า AQI และ Magnitude (format เลขเป็น 2 ตำแหน่งทศนิยม)
    const aqiValue = data && data.aqi25 != null ? data.aqi25 : '-';
    const magValue = data && data.shakeMag != null ? data.shakeMag.toFixed(2) : '-';

    // สร้าง HTML ของกล่องข้อความ (Rectangle) แบบง่ายๆ
    // คุณสามารถปรับ CSS ใน <style> ด้านล่างให้สวยงามขึ้นได้อีก
    const html = `
      <div class="sensor-label-box" style="background:${bgColor};">
        <div class="sensor-label-title">${deviceId.toUpperCase()}</div>
        <div class="sensor-label-line">AQI : ${aqiValue}</div>
        <div class="sensor-label-line">Mag : ${magValue}</div>
        <div class="sensor-label-triangle"></div>
      </div>
    `;

    // กำหนด iconAnchor เพื่อให้จุดปลายลูกศร (triangle) ชี้ที่ตำแหน่ง lat/lng พอดี
    // สมมติว่าความสูงของกล่องทั้งหมด (title+lines+triangle) ≈ 60px, ความกว้าง ≈ 80px
    return L.divIcon({
      html,
      className: 'sensor-div-icon', // class หลักของ DivIcon
      iconSize: [80, 60],           // ไม่จำเป็นต้องตรงเป๊ะมาก แต่ควรกะให้พอประมาณ
      iconAnchor: [40, 60]          // [width/2, height] → ปลายล่างกลางชี้ที่พิกัด
    });
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[13.7000, 100.5300]} // พิกัดกึ่งกลางของ Port of Bangkok
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {/* วนลูปสร้าง Marker สำหรับทุก device ที่มีอยู่ใน latest */}
        {Object.entries(latest).map(([deviceId, data]) => {
          const loc = DEVICE_LOCATION[deviceId];
          if (!loc) return null; // ถ้าตำแหน่งไม่มี ไม่ต้องสร้าง

          const labelIcon = createLabelIcon(deviceId, data);

          return (
            <Marker
              key={deviceId}
              position={[loc.lat, loc.lng]}
              icon={labelIcon}
              interactive={false} // ถ้าไม่ต้องการให้คลิกได้
            />
          );
        })}
      </MapContainer>

      {/* CSS สำหรับปรับสไตล์กล่องให้เป็นสี่เหลี่ยม มีหัวลูกศรชี้ */}
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
        /* สามเหลี่ยมเล็กๆ ที่อยู่ปลายกล่อง เป็นลูกศรชี้จุด */
        .sensor-label-triangle {
          position: absolute;
          bottom: -6px;  /* พักลูกศรให้อยู่ใต้กล่อง */
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid currentColor; 
          /* currentColor คือสีของข้อความ (ในที่นี้ white) แต่เราต้องการให้ลูกศรมีสีเดียวกับพื้นกล่อง
             ก็สามารถ override ด้วย background-color ได้อีกที */
        }
        .sensor-label-box {
          /* กำหนดให้ลูกศรใช้สีเดียวกับพื้นของกล่อง */
          color: transparent; /* ปิดการใช้ currentColor */
        }
        .sensor-label-triangle {
          border-top-color: inherit; /* จะใช้สี background ของ .sensor-label-box */
        }
      `}</style>
    </div>
  );
}
