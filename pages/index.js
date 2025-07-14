// pages/index.js
// V1.0.1.0.5 - แก้ไขให้แสดง SensorCard ใหม่ทั้งหมด

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Ably from 'ably';
import Head from 'next/head';

const MapWithNoSSR = dynamic(() => import('../components/MapPATOnly'), {
  ssr: false
});

// คอมโพเนนต์อื่น ๆ
import SensorCard from '../components/SensorCard';
import LatestQuakes from '../components/LatestQuakes';

export default function Home() {
  const [allDataPoints, setAllDataPoints] = useState({});
  const [tmdQuakes, setTmdQuakes] = useState([]);
  const [usgsQuakes, setUsgsQuakes] = useState([]);
  const [latestPayloadTime, setLatestPayloadTime] = useState(null);

  useEffect(() => {
    // เชื่อม Ably
    const realtime = new Ably.Realtime({ key: 'DYt11Q.G9DtiQ:TgnTC0ItL_AzsD4puAdytIVYMeArsFSn-qyAAuHbQLQ' });
    const channel = realtime.channels.get('earthquake:raw');

    channel.subscribe((msg) => {
      try {
        const raw = typeof msg.data === 'string' ? msg.data : new TextDecoder().decode(msg.data);
        const data = JSON.parse(raw);
        setAllDataPoints((prev) => ({ ...prev, [data.device]: data }));

        if (data.ts) {
          const newTimestamp = new Date(data.ts);
          // อัปเดตเฉพาะเมื่อเวลาใหม่กว่าของเดิม
          setLatestPayloadTime(prev => 
            (!prev || newTimestamp > prev) ? newTimestamp : prev
          );
        }
      } catch (err) {
        console.error('Error parsing sensor data from Ably:', err);
      }
    });

    // ฟังก์ชันดึง TMD + USGS (ของคุณ)
    async function fetchQuakes() {
      try {
        // ดึง TMD มาจาก API ภายใน /api/fetch-tmd
        const tmdRes = await fetch('/api/fetch-tmd');
        if (tmdRes.ok) {
          const tmdJson = await tmdRes.json();
          setTmdQuakes(Array.isArray(tmdJson) ? tmdJson : []);
        } else {
          setTmdQuakes([]);
        }

        // ดึง USGS มาจาก API ภายใน /api/send-usgs (GET)
        const usgsRes = await fetch('/api/send-usgs');
        if (usgsRes.ok) {
          const usgsJson = await usgsRes.json();
          setUsgsQuakes(Array.isArray(usgsJson) ? usgsJson : []);
        } else {
          setUsgsQuakes([]);
        }
      } catch (error) {
        console.error('Error fetching quake data:', error);
        setTmdQuakes([]);
        setUsgsQuakes([]);
      }
    }

    fetchQuakes();

    return () => {
      channel.unsubscribe();
      realtime.close();
    };
  }, []);

  const deviceList = ['PAT-Building-A', 'DG-warehouse', 'Terminal2'];

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 0, background: '#ffffff' }}>
    <Head>
        <title>Project Ar-non: dashboard</title>
        <meta name="description" content="Project Ar-non: Real-time pollution and earthquake monitoring dashboard." />
        <link rel="icon" href="https://arnon.dgbkp.in.th/logo.jpg" />
    </Head>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="https://arnon.dgbkp.in.th/logo.jpg"
            height="90"
            style={{ marginRight: 12, verticalAlign: 'middle' }}
            alt="Project Ar-non Logo"
          />
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Project Ar-non: dashboard</h1>
        </div>
        <div style={{ background: '#bde6ee', textAlign: 'right', padding: '10px 20px', borderRadius: 8, minWidth: '220px' }}>
          {latestPayloadTime ? (
            <>
              <div style={{ fontSize: '1rem' }}>
                {latestPayloadTime.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '2.5rem', marginTop: 4 }}>
                {latestPayloadTime.toLocaleTimeString('th-TH')}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '1.2rem', color: '#555', paddingTop: '12px' }}>Waiting for data...</div>
          )}
        </div>
      </div>

      {/* MAP (เฉพาะฝั่งไคลเอ็นต์) */}
      <div style={{ height: '40vh', width: '96vw', marginBottom: 3 }}>
        <MapWithNoSSR latest={allDataPoints} />
      </div>

      {/* SENSOR CARDS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1%', marginBottom: 3 }}>
        {deviceList.map((deviceId) => (
          <SensorCard key={deviceId} deviceId={deviceId} data={allDataPoints[deviceId] || null} />
        ))}
      </div>

      {/* รายงานเหตุแผ่นดินไหว */}
      <div style={{background: '#666', padding: 0, borderRadius: 8, marginBottom: 3 }}>
        <h3 style={{marginLeft: '10px', color: 'white' }}> รายงานเหตุแผ่นดินไหวในภูมิภาค</h3>
        <LatestQuakes tmdQuakes={tmdQuakes} usgsQuakes={usgsQuakes} />
      </div>

    </div>
    
  );
}
