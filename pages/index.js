// /pages/index.js
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Ably from 'ably';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import { Line } from 'react-chartjs-2';
import LiveSensorChart from '../components/LiveSensorChart';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  const [dataPoint, setDataPoint] = useState(null);

  useEffect(() => {
    const realtime = new Ably.Realtime({ key: 'DYt11Q.G9DtiQ:TgnTC0ItL_AzsD4puAdytIVYMeArsFSn-qyAAuHbQLQ' });
    const channel = realtime.channels.get('earthquake:raw');

    channel.subscribe((msg) => {
      try {
        const raw = typeof msg.data === 'string'
          ? msg.data
          : new TextDecoder().decode(msg.data);
        console.log('📥 Raw payload from Ably:', raw);
        const data = JSON.parse(raw);

        // ตรวจสอบความถูกต้องก่อน set
        if (
          typeof data.x === 'number' &&
          typeof data.y === 'number' &&
          typeof data.z === 'number'
        ) {
          setDataPoint(data);
        } else {
          console.warn('⚠️ Invalid sensor data:', data);
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    });

    return () => channel.unsubscribe();
  }, []);

  const safeToFixed = (val) => (typeof val === 'number' ? val.toFixed(2) : '-');

  return (
    <div style={{ padding: 5 }}>
      <h1 style={{ color: 'darkred' }}>📡 Project Arnon - Dashboard</h1>
      <div style={{ height: '40vh' }}>
        <Map latest={dataPoint} />
      </div>

      <div style={{ marginTop: 5 }}>
        <h2>PAT1 Detector (Magnitude)</h2>
        {dataPoint ? (
          <>
            <LiveSensorChart dataPoint={dataPoint} />
            <ul>
              X: {safeToFixed(dataPoint.x)} g –{' '}
              Y: {safeToFixed(dataPoint.y)} g –{' '}
              Z: {safeToFixed(dataPoint.z)} g –{' '}
              Timestamp: {dataPoint.ts ?? '-'}
            </ul>
          </>
        ) : (
          <p>Waiting for data...</p>
        )}
      </div>
    </div>
  );
}
