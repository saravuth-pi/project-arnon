// pages/index.js
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

      const data = JSON.parse(raw);
      setDataPoint(data);
    } catch (e) {
      console.error('Parse error:', e);
    }
  });
<<<<<<< HEAD

  return () => channel.unsubscribe();
}, []);

=======
  
  return () => channel.unsubscribe();
}, []);
>>>>>>> f1b3208527d1112c7e819c1af7905c111b597eb5

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
               X: {dataPoint.x.toFixed(2)} g - 
               Y: {dataPoint.y.toFixed(2)} g - 
               Z: {dataPoint.z.toFixed(2)} g - 
               Timestamp: {dataPoint.ts}
             </ul>
          </>
        ) : (
          <p>Waiting for data...</p>
        )}
      </div>

    </div>
  );
}
