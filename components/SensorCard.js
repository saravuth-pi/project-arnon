// components/SensorCard.js
// V0.2.0.0.0 - เพิ่มกราฟ AQI และ Magnitude ในการ์ดเดียวกัน

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

        {/*
          1) กราฟ “AQI”
             – ใช้ข้อมูล data.aqi25
             – ปรับขนาด (height) ให้เหมาะกับพื้นที่ภายในการ์ด
        */}
        <div style={{
          flex: 1,
          minHeight: '100px',
          marginBottom: '8px',
          border: '1px solid #eee',
          borderRadius: 6,
          padding: '4px'
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '4px' }}>
            AQI Trend
          </div>
          {/* LiveSensorChart จะรับ props เหมือนเดิม แต่เราส่ง `data.aqi25` เข้าไป */}
          <LiveSensorChart
            deviceId={`${deviceId}-aqi`}
            newData={data && data.aqi25 != null ? data.aqi25 : null}
            timestamp={data ? data.ts : null}
          />
        </div>
          <div>
            <strong>AQI current:</strong> {/* ถ้ามี callback จาก LiveSensorChart เรื่อง AQI ก็ใส่ตรงนี้ */} - 
          </div
          <div>
            <strong>Avg AQI:</strong> {/* ถ้ามี callback จาก LiveSensorChart เรื่อง AQI ก็ใส่ตรงนี้ */} - 
          </div>
          <div>
            <strong>Max AQI:</strong> {/* ถ้ามี callback */} - 
          </div>
        {/*
          2) ค่าตัวเลขต่าง ๆ
             – แสดงรายละเอียด sensor field เหมือนเดิม
        */}
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


        {/*
          3) กราฟ “Magnitude”
             – ใช้ข้อมูล data.shakeMag
             – ปรับขนาด (height) ให้เหมาะกับพื้นที่ภายในการ์ด
        */}
        <div style={{
          flex: 1,
          minHeight: '100px',
          marginBottom: '8px',
          border: '1px solid #eee',
          borderRadius: 6,
          padding: '4px'
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '4px' }}>
            Magnitude Trend
          </div>
          <LiveSensorChart
            deviceId={`${deviceId}-mag`}
            newData={data ? data.shakeMag : null}
            timestamp={data ? data.ts : null}
          />
        </div>

        {/*
          4) สรุปค่าเฉลี่ยและค่าสูงสุด (สมมติให้ LiveSensorChart ส่ง callback คืนค่า avg/max ได้ในอนาคต)
             – ปล. ถ้ายังไม่ได้ implement callback ใน LiveSensorChart ให้แก้ทีหลัง
        */}
        <div style={{
          borderTop: '1px solid #ddd',
          paddingTop: '6px',
          fontSize: '0.9rem',
          color: '#555'
        }}>
          
          <div>
            <strong>Current Magnitude:</strong> {/* ถ้ามี callback จาก LiveSensorChart เรื่อง Magnitude */} - 
          </div>
          <div>
            <strong>Avg Magnitude:</strong> {/* ถ้ามี callback จาก LiveSensorChart เรื่อง Magnitude */} - 
          </div>
          <div>
            <strong>Max Magnitude:</strong> {/* ถ้ามี callback */} - 
          </div>
        </div>
      </div>
    </div>
  );
}
