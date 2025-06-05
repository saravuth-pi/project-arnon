// components/SensorCard.js
// V0.2.0.2.2 – ปรับให้สรุปค่า Magnitude แสดงเป็นทศนิยม 2 ตำแหน่ง

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

  // state เก็บประวัติ AQI และ Magnitude (ช่วง 10 นาทีล่าสุด)
  const [aqiHistory, setAqiHistory] = useState([]);
  const [magHistory, setMagHistory] = useState([]);

  // อัปเดต aqiHistory เมื่อมี data.aqi25 ใหม่
  useEffect(() => {
    if (!deviceId || data?.aqi25 == null || !data.ts) return;

    setAqiHistory(prev => {
      const arr = [...prev];
      arr.push({ ts: data.ts, value: data.aqi25 });

      // ตัดเฉพาะจุดข้อมูลในช่วง 10 นาทีล่าสุด
      const cutoff = new Date(data.ts).getTime() - TEN_MINUTES_MS;
      const filtered = arr.filter(item => {
        const itemTime = new Date(item.ts).getTime();
        return itemTime >= cutoff;
      });

      return filtered;
    });
  }, [deviceId, data?.aqi25, data?.ts]);

  // อัปเดต magHistory เมื่อมี data.shakeMag ใหม่
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

  // ฟังก์ชันคำนวณสถิติสำหรับ AQI (แสดงเป็นจำนวนเต็ม)
  const calcAqiStats = (historyArray) => {
    if (!historyArray || historyArray.length === 0) {
      return { current: '-', avg: '-', max: '-' };
    }
    const lastVal = historyArray[historyArray.length - 1].value;
    const current = Math.round(lastVal);

    const sum = historyArray.reduce((acc, item) => acc + item.value, 0);
    const avg = Math.round(sum / historyArray.length);

    const maxRaw = Math.max(...historyArray.map(item => item.value));
    const max = Math.round(maxRaw);

    return { current, avg, max };
  };

  // ฟังก์ชันคำนวณสถิติสำหรับ Magnitude (แสดงเป็นทศนิยม 2 ตำแหน่ง)
  const calcMagStats = (historyArray) => {
    if (!historyArray || historyArray.length === 0) {
      return { current: '-', avg: '-', max: '-' };
    }
    const lastVal = historyArray[historyArray.length - 1].value;
    const current = lastVal.toFixed(2);

    const sum = historyArray.reduce((acc, item) => acc + item.value, 0);
    const avg = (sum / historyArray.length).toFixed(2);

    const maxRaw = Math.max(...historyArray.map(item => item.value));
    const max = maxRaw.toFixed(2);

    return { current, avg, max };
  };

  // คำนวณสถิติ AQI และ Magnitude จากประวัติ
  const { current: currentAqi, avg: avgAqi, max: maxAqi } = calcAqiStats(aqiHistory);
  const { current: currentMag, avg: avgMag, max: maxMag } = calcMagStats(magHistory);

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

        {/* --- สรุปค่า AQI (แสดงเป็นจำนวนเต็ม) --- */}
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
          fontSize: '0.8rem',
          lineHeight: 0.9,
          color: '#333',
          
        }}>
          <div style={{display: 'flex'}}>
            <div style={{flex: '50%'}}>AQI₂.₅ </div><div style={{flex: '10%'}}> : </div><div style={{flex: '40%'}}><strong>{data && data.aqi25 != null ? data.aqi25 : '-'}</strong></div> 
          </div>
          <div>
            PM₂.₅     : <strong>{data && data.pm25 != null ? data.pm25 + ' µg/m³' : '-'}</strong>
          </div>
          <div>
            PM₁₀      : {<strong>data && data.pm10 != null ? data.pm10 + ' µg/m³' : '-'}</strong>
          </div>
          <div>
            CO₂       : <strong>{data && data.CO2 != null ? data.CO2 + ' ppm' : '-'}</strong>
          </div>
          <div>
            TVOC      : <strong>{data && data.TOC != null ? data.TOC + ' ppb' : '-'}</strong>
          </div>
          <div>
            Temp      : <strong>{data && data.temp != null ? data.temp + ' °C' : '-'}</strong>
          </div>
          <div>
            RH        : <strong>{data && data.RH != null ? data.RH + ' %' : '-'}</strong>
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

        {/* --- สรุปค่า Magnitude (แสดงเป็นทศนิยม 2 ตำแหน่ง) --- */}
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
