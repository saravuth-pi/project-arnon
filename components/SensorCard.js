// components/SensorCard.js
// V0.2.0.1.0 – เก็บประวัติ AQI/Magnitude แบบ 10 นาที ล่าสุด แล้วสรุปค่า Current/Avg/Max

import { useState, useEffect } from 'react';
import LiveSensorChart from './LiveSensorChart';

const COLOR_MAP = {
  'esp32-1': '#2ecc71',
  'esp32-2': '#8e44ad',
  'esp32-3': '#3498db'
};

export default function SensorCard({ deviceId, data }) {
  const color = COLOR_MAP[deviceId] || '#7f8c8d';
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  // สร้าง state เก็บประวัติ AQI และ Magnitude ของ deviceId นี้
  // รูปแบบแต่ละอันจะเป็น [{ ts: "<ISO หรือ timestamp>", value: <number> }, ...]
  const [aqiHistory, setAqiHistory] = useState([]);
  const [magHistory, setMagHistory] = useState([]);

  // เมื่อ data.aqi25 หรือ data.ts เปลี่ยน เก็บค่า AQI ใหม่ใน aqiHistory
  useEffect(() => {
    if (!deviceId || data?.aqi25 == null || !data.ts) return;

    setAqiHistory(prev => {
      // คัดลอก Array เก่า
      const arr = [...prev];
      // เพิ่มจุดข้อมูลใหม่
      arr.push({ ts: data.ts, value: data.aqi25 });

      // ตัดเฉพาะข้อมูลที่ไม่เก่ากว่า 10 นาที (เทียบกับ data.ts ล่าสุด)
      const cutoff = new Date(data.ts).getTime() - TEN_MINUTES_MS;
      const filtered = arr.filter(item => {
        const itemTime = new Date(item.ts).getTime();
        return itemTime >= cutoff;
      });

      return filtered;
    });
  }, [deviceId, data?.aqi25, data?.ts]);

  // เมื่อ data.shakeMag หรือ data.ts เปลี่ยน เก็บค่า Magnitude ใหม่ใน magHistory
  useEffect(() => {
    if (!deviceId || data?.shakeMag == null || !data.ts) return;

    setMagHistory(prev => {
      const arr = [...prev];
      arr.push({ ts: data.ts, value: data.shakeMag });

      const cutoff = new Date(data.ts).getTime() - TEN_MINUTES_MS;
      const filtered = arr.filter(item => {
        const itemTime = new Date(item.ts).getTime();
        return itemTime >= cutoff;
      });

      return filtered;
    });
  }, [deviceId, data?.shakeMag, data?.ts]);

  // ฟังก์ชันช่วยคำนวณ Current / Avg / Max จาก History Array (value)
  const calcStats = (historyArray) => {
    if (!historyArray || historyArray.length === 0) {
      return { current: '-', avg: '-', max: '-' };
    }
    // ค่า Current = ค่า value ของจุดสุดท้าย
    const current = historyArray[historyArray.length - 1].value;

    // ค่า avg = ผลรวมทั้งหมด / จำนวน
    const sum = historyArray.reduce((acc, item) => acc + item.value, 0);
    const avg = (sum / historyArray.length).toFixed(2); // ปัดทศนิยม 2 ตำแหน่ง

    // ค่า max = ค่ามากที่สุด
    const max = Math.max(...historyArray.map(item => item.value));

    return {
      current: current.toFixed(2),
      avg: avg,
      max: max.toFixed(2)
    };
  };

  // คำนวณสถิติค่า AQI และ Magnitude
  const { current: currentAqi, avg: avgAqi, max: maxAqi } = calcStats(aqiHistory);
  const { current: currentMag, avg: avgMag, max: maxMag } = calcStats(magHistory);

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
      {/* Header */}
      <div style={{
        background: color,
        color: 'white',
        padding: '6px 10px',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        textAlign: 'left'
      }}>
        {deviceId.toUpperCase()}
      </div>

      {/* เนื้อหาในการ์ด */}
      <div style={{
        padding: '5px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>

        {/* --- กราฟ AQI --- */}
        <div style={{
          height: '50px',
          border: '1px solid #eee',
          borderRadius: 6,
          padding: '4px'
        }}>
          <div style={{
            fontSize: '0.6rem',
            fontWeight: 'bold',
            marginBottom: '0px',
            color: '#777'
          }}>
            AQI Trend
          </div>
          <LiveSensorChart
            deviceId={`${deviceId}-aqi`}
            newData={data && data.aqi25 != null ? data.aqi25 : null}
            timestamp={data ? data.ts : null}
          />
        </div>

        {/* --- สรุปค่า AQI --- */}
        <div style={{
          fontSize: '0.7rem',
          color: '#555',
          lineHeight: 1.0,
          marginTop: '5px'
        }}>
          <div><strong>Current AQI:</strong> {currentAqi} </div>
          <div><strong>Avg AQI:</strong>    {avgAqi} </div>
          <div><strong>Max AQI:</strong>    {maxAqi} </div>
        </div>

        {/* --- ข้อมูล Sensor Fields --- */}
        <div style={{
          fontSize: '1.0rem',
          lineHeight: 1.0,
          color: '#333'
        }}>
          <div>
            <strong>AQI₂.₅    :</strong> {data && data.aqi25 != null ? data.aqi25 : '-'}
          </div>
          <div>
            <strong>PM₂.₅     :</strong> {data && data.pm25 != null ? data.pm25 + ' µg/m³' : '-'}
          </div>
          <div>
            <strong>PM₁₀      :</strong> {data && data.pm10 != null ? data.pm10 + ' µg/m³' : '-'}
          </div>
          <div>
            <strong>CO₂       :</strong> {data && data.CO2 != null ? data.CO2 + ' ppm' : '-'}
          </div>
          <div>
            <strong>TVOC      :</strong> {data && data.TOC != null ? data.TOC + ' ppb' : '-'}
          </div>
          <div>
            <strong>Temp      :</strong> {data && data.temp != null ? data.temp + ' °C' : '-'}
          </div>
          <div>
            <strong>RH        :</strong> {data && data.RH != null ? data.RH + ' %' : '-'}
          </div>
        </div>

        {/* --- กราฟ Magnitude --- */}
        <div style={{
          height: '50px',
          border: '1px solid #eee',
          borderRadius: 6,
          padding: '4px'
        }}>
          <div style={{
            fontSize: '0.6rem',
            fontWeight: 'bold',
            marginBottom: '0px',
            color: '#777'
          }}>
            Magnitude Trend
          </div>
          <LiveSensorChart
            deviceId={`${deviceId}-mag`}
            newData={data ? data.shakeMag : null}
            timestamp={data ? data.ts : null}
          />
        </div>

        {/* --- สรุปค่า Magnitude --- */}
        <div style={{
          borderTop: '1px solid #ddd',
          paddingTop: '6px',
          fontSize: '0.7rem',
          color: '#555',
          lineHeight: 1.0
        }}>
          <div><strong>Current Magnitude:</strong> {currentMag} </div>
          <div><strong>Avg Magnitude:</strong>     {avgMag} </div>
          <div><strong>Max Magnitude:</strong>     {maxMag} </div>
        </div>
      </div>
    </div>
  );
}
