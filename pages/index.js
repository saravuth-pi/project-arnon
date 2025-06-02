// pages/index.js
// V1.0.1.0.0 - แก้ไขให้แสดง SensorCard ใหม่ทั้งหมด

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Ably from 'ably';

import SensorCard from '../components/SensorCard';
import LatestQuakes from '../components/LatestQuakes';
import AQIPanel from '../components/AQIPanel';

const MapPATOnly = dynamic(() => import('../components/MapPATOnly'), { ssr: false });

export default function Home() {
  // เก็บข้อมูล sensor แต่ละตัวไว้ในรูป object: { "esp32-1": {...}, "esp32-2": {...}, ... }
  const [allDataPoints, setAllDataPoints] = useState({});

  // เก็บข้อมูลแผ่นดินไหว (เดิมมีอยู่แล้ว)
  const [tmdQuakes, setTmdQuakes] = useState([]);
  const [usgsQuakes, setUsgsQuakes] = useState([]);

  // state สำหรับอัปเดตเวลาเพื่อ show ตอนมุมขวาบน
  const [now, setNow] = useState(new Date());

  // เมื่อ Component mount → subscribe ข้อมูลจาก Ably (channel เดิมที่คุณใช้อยู่)
  useEffect(() => {
    // 1) ตั้ง Timer เพื่ออัปเดตเวลาใน Header ทุก 1 วินาที
    const timer = setInterval(() => setNow(new Date()), 1000);

    // 2) เปิด Ably Realtime เพื่อ subscribe ข้อมูล sensor
    const realtime = new Ably.Realtime({ key: 'DYt11Q.G9DtiQ:TgnTC0ItL_AzsD4puAdytIVYMeArsFSn-qyAAuHbQLQ' });
    // ส่ง sensor data เข้า channel ชื่อ 'earthquake:raw'
    const channel = realtime.channels.get('earthquake:raw');
    channel.subscribe((msg) => {
      // msg.data เป็น JSON string ของโครงสร้าง sensor data format :
      // {
      //   device: "esp32-2",
      //   CO2: 0,
      //   TOC: 0,
      //   aqi10: 13,
      //   aqi25: 46,
      //   pm10: 14,
      //   pm25: 11,
      //   temp: 29,
      //   RH: 65,
      //   shakeMag: 0.074694,
      //   ts: "2025-06-02T19:14:23"
      // }

      try {
        const raw = typeof msg.data === 'string' ? msg.data : new TextDecoder().decode(msg.data);
        const data = JSON.parse(raw);
        // update ค่า sensor แต่ละตัว โดยใช้ device เป็น key
        setAllDataPoints((prev) => ({
          ...prev,
          [data.device]: data
        }));
      } catch (err) {
        console.error('Error parsing sensor data from Ably:', err);
      }
    });

    // (fetchInitialData คือฟังก์ชันดึงข้อมูล initial จาก DB, ใช้ในกรณีต้องการย้อนหลัง)
    async function fetchQuakes() {
      // ...fetch ข้อมูล TMD + USGS มาเก็บ setTmdQuakes / setUsgsQuakes ตามโค้ดเดิมของคุณ
    }
    fetchQuakes();
    return () => {
      clearInterval(timer);
      channel.unsubscribe();
      realtime.close();
    };
  }, []);

  // รายชื่อ Device ที่เราต้องการให้แสดงเป็นการ์ด (“esp32-3” ค้างไว้เพื่ออนาคต)
  const deviceList = ['esp32-1', 'esp32-2', 'esp32-3'];

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 10, background: '#f5f5f5' }}>
      {/* ============================== */}
      {/* 1. HEADER (Logo + Title + DateTime) */}
      {/* ============================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 0,
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="https://arnon.dgbkp.in.th/logo.jpg"
            height="130"
            style={{ verticalAlign: 'middle', marginRight: 12 }}
          />
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Project Ar-non: dashboard</h1>
        </div>
        <div style={{
          background: '#bde6ee',
          textAlign: 'right',
          padding: '12px 20px',
          borderRadius: 8
        }}>
          <div style={{ fontSize: '1rem' }}>
            {now.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div style={{ fontSize: '2.5rem', marginTop: 4 }}>
            {now.toLocaleTimeString('th-TH')}
          </div>
        </div>
      </div>

      {/* ============================== */}
      {/* 2. MAP (แสดง Sensor บน Port of Bangkok) */}
      {/* ============================== */}
      <div style={{ height: '30vh', width: '100vw', marginBottom: 20 }}>
        {/* ส่งข้อมูลทั้งหมด (allDataPoints) เข้าไปให้ MapPATOnly แสดงจุด */}
        <MapPATOnly latest={allDataPoints} />
      </div>

      {/* ============================== */}
      {/* 3. SENSOR CARDS */}
      {/* ============================== */}
      {/* วางแบบ 3 คอลัมน์ (Desktop) */} 
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1%',
        marginBottom: 20
      }}>
        {deviceList.map((deviceId) => (
          <SensorCard
            key={deviceId}
            deviceId={deviceId}
            data={allDataPoints[deviceId] || null}
          />
        ))}
      </div>

      {/* ============================== */}
      {/* 4. ส่วนล่าง: แผ่นดินไหว + AQI Panel */}
      {/* ============================== */}
      {/* 4.1 รายงานเหตุแผ่นดินไหวในภูมิภาค */}
      <div style={{
        background: 'white',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20
      }}>
        <h3 style={{ margin: '8px 0' }}>รายงานเหตุแผ่นดินไหวในภูมิภาค</h3>
        <LatestQuakes usgsQuakes={usgsQuakes} tmdQuakes={tmdQuakes} />
      </div>

      {/* 4.2 คุณภาพอากาศที่ท่าเรือกรุงเทพ */}
      <div style={{
        background: 'white',
        padding: 12,
        borderRadius: 8,
        marginBottom: 40
      }}>
        <h3 style={{ margin: '8px 0' }}>คุณภาพอากาศที่ท่าเรือกรุงเทพ (BETA)</h3>
        <AQIPanel />
      </div>
    </div>
  );
}
