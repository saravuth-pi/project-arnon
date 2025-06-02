// pages/index.js
// V1.0.1.0.0 - แก้ไขให้แสดง SensorCard ใหม่ทั้งหมด

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Ably from 'ably';

// import คอมโพเนนต์ที่ปรับไว้แล้ว
import MapPATOnly from '../components/MapPATOnly';
import SensorCard from '../components/SensorCard';
import LatestQuakes from '../components/LatestQuakes';
import AQIPanel from '../components/AQIPanel';

// หาก MapPATOnly ใช้ Leaflet และไม่รองรับ SSR ให้โหลดด้วย dynamic พร้อมปิด ssr
const MapWithNoSSR = dynamic(() => import('../components/MapPATOnly'), {
  ssr: false
});

export default function Home() {
  // -----------------------------------------------------------------
  // 1. สเตทสำหรับเก็บข้อมูล Sensor (ESP32)
  //    โครงสร้าง: { "esp32-1": { CO2, TOC, aqi10, aqi25, pm10, pm25, temp, RH, shakeMag, ts }, ... }
  // -----------------------------------------------------------------
  const [allDataPoints, setAllDataPoints] = useState({});

  // -----------------------------------------------------------------
  // 2. สเตทสำหรับเก็บข้อมูลแผ่นดินไหวจาก TMD และ USGS
  //    - tmdQuakes: array ของเหตุการณ์จาก TMD
  //    - usgsQuakes: array ของเหตุการณ์จาก USGS
  // -----------------------------------------------------------------
  const [tmdQuakes, setTmdQuakes] = useState([]);
  const [usgsQuakes, setUsgsQuakes] = useState([]);

  // -----------------------------------------------------------------
  // 3. สเตทสำหรับเวลา (ใช้แสดงตรงมุมบนขวา)
  // -----------------------------------------------------------------
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // ----------------------------------------------------
    // 3.1 อัปเดตเวลาทุก 1 วินาที เพื่อให้ Header แสดงผลถูกต้อง
    // ----------------------------------------------------
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    // ----------------------------------------------------
    // 3.2 เชื่อมต่อ Ably Realtime เพื่อรับข้อมูล Sensor (ESP32)
    // ----------------------------------------------------
    const realtime = new Ably.Realtime({
      // ใส่ Ably API Key ของคุณลงไป
      key: 'DYt11Q.G9DtiQ:TgnTC0ItL_AzsD4puAdytIVYMeArsFSn-qyAAuHbQLQ'
    });
    const channel = realtime.channels.get('earthquake:raw');

    channel.subscribe((msg) => {
      try {
        // msg.data อาจเป็น string หรือ ArrayBuffer
        const raw =
          typeof msg.data === 'string'
            ? msg.data
            : new TextDecoder().decode(msg.data);
        const data = JSON.parse(raw);

        // ตัวอย่างโครงสร้าง JSON ที่ได้รับ:
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

        // เก็บลงสเตท เพื่อนำไปแสดงใน Map + SensorCard
        setAllDataPoints((prev) => ({
          ...prev,
          [data.device]: data
        }));
      } catch (err) {
        console.error('Error parsing sensor data from Ably:', err);
      }
    });

    // ----------------------------------------------------
    // 3.3 เมื่อคอมโพเนนต์ mount → เรียกฟังก์ชันดึงข้อมูลแผ่นดินไหว (TMD + USGS)
    // ----------------------------------------------------
    async function fetchQuakes() {
      try {
        // -----------------------
        // 3.3.1 ดึงข้อมูลจาก API ภายในของคุณ: /api/fetch-tmd
        // -----------------------
        // API นี้จะ fetch RSS XML จาก TMD แล้ว parse ออกมาเป็น JSON array
        const tmdRes = await fetch('/api/fetch-tmd');
        if (tmdRes.ok) {
          const tmdJson = await tmdRes.json();
          // สมมติว่า tmdJson เป็น array ของ object แต่ละเหตุการณ์ เช่น:
          // [ { id, mag, lat, lon, place, timestamp, ... }, ... ]
          setTmdQuakes(Array.isArray(tmdJson) ? tmdJson : []);
        } else {
          console.warn('TMD API returned status', tmdRes.status);
          setTmdQuakes([]);
        }

        // -----------------------
        // 3.3.2 ดึงข้อมูลจาก API ภายในของคุณ: /api/send-usgs
        //        (ในกรณีนี้จะถือว่า handler ยอมรับ GET แล้วส่งกลับ USGS feed เป็น JSON)
        // -----------------------
        const usgsRes = await fetch('/api/send-usgs');
        if (usgsRes.ok) {
          const usgsJson = await usgsRes.json();
          // สมมติว่า usgsJson เป็น array ของ object แต่ละเหตุการณ์ USGS เช่น:
          // [ { id, mag, place, time, url }, ... ]
          setUsgsQuakes(Array.isArray(usgsJson) ? usgsJson : []);
        } else {
          console.warn('USGS API returned status', usgsRes.status);
          setUsgsQuakes([]);
        }
      } catch (error) {
        console.error('Error fetching quake data (TMD/USGS):', error);
        setTmdQuakes([]);
        setUsgsQuakes([]);
      }
    }

    // เรียกฟังก์ชันดึงข้อมูลแผ่นดินไหวทันที
    fetchQuakes();

    // ----------------------------------------------------
    // 3.4 Cleanup เมื่อ component ถูก unmount
    // ----------------------------------------------------
    return () => {
      clearInterval(timer);
      channel.unsubscribe();
      realtime.close();
    };
  }, []); // รันครั้งเดียวตอน mount เท่านั้น

  // -----------------------------------------------------------------
  // 4. รายชื่อ Device ที่เราต้องการสร้าง SensorCard (เตรียม esp32-3 ไว้ล่วงหน้า)
  // -----------------------------------------------------------------
  const deviceList = ['esp32-1', 'esp32-2', 'esp32-3'];

  // -----------------------------------------------------------------
  // 5. Render หน้าจอหลัก (Header → Map → Sensor Cards → Quake + AQI)
  // -----------------------------------------------------------------
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 10, background: '#f5f5f5' }}>
      {/* ============================ */}
      {/* 5.1 HEADER: โลโก้ + โปรเจ็คต์ชื่อ + วันที่-เวลา */}
      {/* ============================ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="https://arnon.dgbkp.in.th/logo.jpg"
            height="130"
            style={{ marginRight: 12, verticalAlign: 'middle' }}
            alt="Project Ar-non Logo"
          />
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Project Ar-non: dashboard</h1>
        </div>
        <div
          style={{
            background: '#bde6ee',
            textAlign: 'right',
            padding: '12px 20px',
            borderRadius: 8
          }}
        >
          <div style={{ fontSize: '1rem' }}>
            {now.toLocaleDateString('th-TH', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </div>
          <div style={{ fontSize: '2.5rem', marginTop: 4 }}>
            {now.toLocaleTimeString('th-TH')}
          </div>
        </div>
      </div>

      {/* ============================ */}
      {/* 5.2 MAP: แสดง Sensor ทุกจุด (ESP32) บน Port of Bangkok */}
      {/* ============================ */}
      <div style={{ height: '30vh', width: '100vw', marginBottom: 20 }}>
        <MapWithNoSSR latest={allDataPoints} />
      </div>

      {/* ============================ */}
      {/* 5.3 SENSOR CARDS: การ์ดสรุปค่าแต่ละ ESP32 (3 อัน) */}
      {/* ============================ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1%',
          marginBottom: 20
        }}
      >
        {deviceList.map((deviceId) => (
          <SensorCard
            key={deviceId}
            deviceId={deviceId}
            data={allDataPoints[deviceId] || null}
          />
        ))}
      </div>

      {/* ============================ */}
      {/* 5.4 รายงานเหตุแผ่นดินไหว (TMD + USGS) */}
      {/* ============================ */}
      <div
        style={{
          background: 'white',
          padding: 12,
          borderRadius: 8,
          marginBottom: 20
        }}
      >
        <h3 style={{ margin: '8px 0' }}>รายงานเหตุแผ่นดินไหวในภูมิภาค</h3>
        {/* ส่ง tmdQuakes และ usgsQuakes ให้คอมโพเนนต์ LatestQuakes จัดการแสดงผล */}
        <LatestQuakes tmdQuakes={tmdQuakes} usgsQuakes={usgsQuakes} />
      </div>

      {/* ============================ */}
      {/* 5.5 AQI Panel ของท่าเรือกรุงเทพ */}
      {/* ============================ */}
      <div
        style={{
          background: 'white',
          padding: 12,
          borderRadius: 8,
          marginBottom: 40
        }}
      >
        <h3 style={{ margin: '8px 0' }}>
          คุณภาพอากาศที่ท่าเรือกรุงเทพ (BETA)
        </h3>
        <AQIPanel />
      </div>
    </div>
  );
}
