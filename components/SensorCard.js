// components/SensorCard.js
// V0.1.0.0.0 - added SensorCard component to display sensor data in a card format

import { useState, useEffect } from 'react';
import LiveSensorChart from './LiveSensorChart'; 

// กำหนดสีหลัก (border + header background) ของแต่ละ device
const COLOR_MAP = {
  'esp32-1': '#2ecc71', // เขียวอ่อน
  'esp32-2': '#8e44ad', // ม่วง
  'esp32-3': '#3498db'  // น้ำเงิน
};

export default function SensorCard({ deviceId, data }) {
  // data คือ object เช่น { device: "esp32-2", pm25: 11, pm10: 14, aqi25: 46, aqi10:13, CO2:0, TOC:0, temp:29, RH:65, shakeMag:0.07, ts:"..." }
  // หรืออาจเป็น null (ถ้ายังไม่มีข้อมูลจาก Ably)
  const color = COLOR_MAP[deviceId] || '#7f8c8d'; // gray ถ้าไม่มีใน map

  // เราต้องการส่งข้อมูล "data.shakeMag" ไปให้ LiveSensorChart วาดกราฟ
  // สมมติว่า LiveSensorChart รับ props ว่า { deviceId, newData } เพื่อนำไป plot
  // (อาจต้องแก้ไข LiveSensorChart เล็กน้อยให้รองรับ device-specific data)

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      background: 'white',
      border: `3px solid ${color}`,
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* ชื่อ Device (Header ของ Card) */}
      <div style={{
        background: color,
        color: 'white',
        padding: '6px 10px',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        textAlign: 'center'
      }}>
        {deviceId.toUpperCase()}
      </div>

      {/* ======= ส่วนเนื้อหาด้านใน ======= */}
      <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 1) กราฟ “Magnitude” */}
        <div style={{ flex: 1, minHeight: '100px', marginBottom: '8px' }}>
          {/* LiveSensorChart ต้องถูกดัดแปลงให้รับ props deviceId, data.shakeMag, timestamp */}
          <LiveSensorChart
            deviceId={deviceId}
            newData={data ? data.shakeMag : null}
            timestamp={data ? data.ts : null}
          />
        </div>

        {/* 2) ค่าตัวเลขของแต่ละ Field */}
        <div style={{ fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '8px' }}>
          <div>
            <strong>AQI₂.₅:</strong> {data && data.aqi25 != null ? data.aqi25 : '-'}
          </div>
          <div>
            <strong>PM₂.₅:</strong> {data && data.pm25 != null ? data.pm25 + ' µg/m³' : '-'}
          </div>
          <div>
            <strong>PM₁₀:</strong> {data && data.pm10 != null ? data.pm10 + ' µg/m³' : '-'}
          </div>
          <div>
            <strong>CO₂:</strong> {data && data.CO2 != null ? data.CO2 + ' ppm' : '-'}
          </div>
          <div>
            <strong>TVOC:</strong> {data && data.TOC != null ? data.TOC + ' µg/m³' : '-'}
          </div>
          <div>
            <strong>Temp:</strong> {data && data.temp != null ? data.temp + ' °C' : '-'}
          </div>
          <div>
            <strong>RH:</strong> {data && data.RH != null ? data.RH + ' %' : '-'}
          </div>
        </div>

        {/* 3) สรุปค่าเฉลี่ยและค่าสูงสุดของ Shake Magnitude (สมมติให้ LiveSensorChart ส่ง callback คืนค่าได้) */}
        <div style={{
          borderTop: '1px solid #ddd',
          paddingTop: '6px',
          fontSize: '0.9rem',
          color: '#555'
        }}>
          <div><strong>Avg Magnitude:</strong> {/* สมมติ LiveSensorChart ส่ง callback ให้ได้ avg */} - </div>
          <div><strong>Max Magnitude:</strong> {/* สมมติ LiveSensorChart ส่ง callback ให้ได้ max */} - </div>
        </div>
      </div>
    </div>
  );
}
