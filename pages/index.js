// /pages/index.js
// V0.8601 - Add MapPATOnly 
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import Ably from 'ably';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import { Line } from 'react-chartjs-2';
import LiveSensorChart from '../components/LiveSensorChart';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const Map = dynamic(() => import('../components/Map'), { ssr: false });

import MapPATOnly from '../components/MapPATOnly';
<MapPATOnly latest={dataPoint} />


export default function Home() {
  const [dataPoint, setDataPoint] = useState(null);
  const [initialData, setInitialData] = useState([]);
  const [tmdQuakes, setTmdQuakes] = useState([]);
  const dataRef = useRef([]);
  const lastAblyTimestamp = useRef(0);
  const lastDataPoint = useRef(null);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const res = await fetch('https://arnon.dgbkp.in.th/api/pat1_last_10min.php');
        const json = await res.json();
        if (Array.isArray(json)) {
          json.forEach((d) => {
            if (typeof d.ts === 'undefined' && typeof d.timestamp === 'string') {
              d.ts = Math.floor(new Date(d.timestamp.replace(' ', 'T')).getTime() / 1000);
            }
            d.dateObj = new Date(d.ts * 1000);
          });
          dataRef.current = json;
          if (json.length > 0) {
            lastAblyTimestamp.current = json[json.length - 1].ts;
            lastDataPoint.current = json[json.length - 1];
          }
          setInitialData([...dataRef.current]);
        }
      } catch (error) {
        console.error('❌ Error fetching initial data from API:', error);
      }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    const realtime = new Ably.Realtime({ key: 'DYt11Q.G9DtiQ:TgnTC0ItL_AzsD4puAdytIVYMeArsFSn-qyAAuHbQLQ' });
    const channel = realtime.channels.get('earthquake:raw');

    channel.subscribe((msg) => {
      try {
        const raw = typeof msg.data === 'string' ? msg.data : new TextDecoder().decode(msg.data);
        const data = JSON.parse(raw);

        const nowUtc = new Date();
        const nowBangkok = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000); // force +7h to UTC
        data.dateObj = nowBangkok;
        data.ts = Math.floor(nowBangkok.getTime() / 1000);
        data.timestamp = nowBangkok.toISOString().replace('T', ' ').substring(0, 19); // "YYYY-MM-DD HH:mm:ss"

        if (typeof data.x === 'number' && typeof data.y === 'number' && typeof data.z === 'number') {
          const existingIndex = dataRef.current.findIndex(d => d.ts === data.ts);

          if (existingIndex !== -1) {
            dataRef.current[existingIndex] = data;
          } else {
            if (lastDataPoint.current) {
              const dx = data.x - lastDataPoint.current.x;
              const dy = data.y - lastDataPoint.current.y;
              const dz = data.z - lastDataPoint.current.z;
              const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
              data.magnitude = Math.min(10, delta * 5);
            } else {
              data.magnitude = 0;
            }
            lastAblyTimestamp.current = data.ts;
            lastDataPoint.current = data;

            dataRef.current.push(data);

            if (dataRef.current.length > 300) {
              dataRef.current.shift();
            }
          }

          setDataPoint(data);
          setInitialData([...dataRef.current]);
        } else {
          console.warn('⚠️ Invalid or outdated sensor data:', data);
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    });

    return () => channel.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchTMD() {
      try {
        const res = await fetch('/api/fetch-tmd');
        const json = await res.json();
        if (Array.isArray(json)) {
          setTmdQuakes(json);
        }
      } catch (err) {
        console.error('❌ Failed to fetch TMD data', err);
      }
    }
    fetchTMD();
  }, []);

  const safeToFixed = (val) => (typeof val === 'number' ? val.toFixed(2) : '-');

  return (
    <div style={{ padding: 5 }}>
      <h1 style={{ color: 'darkred' }}><img src="https://upload.wikimedia.org/wikipedia/commons/8/88/Emblem_of_the_Port_Authority_of_Thailand.svg" height="50"/> Project Arnon - Dashboard</h1>
      <div style={{ height: '40vh' }}>
        <Map latest={dataPoint} tmdQuakes={tmdQuakes} />
      </div>

      <div style={{ marginTop: 5 }}>
        <h2>PAT1 Detector</h2>
        <LiveSensorChart dataPoint={dataPoint} initialData={initialData} />
      </div>
    </div>
  );
}
