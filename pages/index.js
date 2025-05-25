// pages/index.js
// V1.001 - Full Dashboard Template with Dynamic Box Colors -debug
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import Ably from 'ably';
import LiveSensorChart from '../components/LiveSensorChart';
import LatestQuakes from '../components/LatestQuakes';
import AQIPanel from '../components/AQIPanel';

const Map = dynamic(() => import('../components/Map'), { ssr: false });
const MapPATOnly = dynamic(() => import('../components/MapPATOnly'), { ssr: false });

// Utility to pick color based on magnitude
function getColor(mag) {
  if (mag >= 6) return 'darkred';
  if (mag >= 5) return 'orangered';
  if (mag >= 4.5) return 'orange';
  if (mag >= 3) return 'yellow';
  return 'green';
}

export default function Home() {
  const [dataPoint, setDataPoint] = useState(null);
  const [initialData, setInitialData] = useState([]);
  const [tmdQuakes, setTmdQuakes] = useState([]);
  const [usgsQuakes, setUsgsQuakes] = useState([]);
  const [now, setNow] = useState(new Date());
  const dataRef = useRef([]);
  const lastAblyTimestamp = useRef(0);
  const lastDataPoint = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchInitialData() {
      const res = await fetch('https://arnon.dgbkp.in.th/api/pat1_last_10min.php');
      const json = await res.json();
      if (Array.isArray(json)) {
        json.forEach((d) => {
          if (!d.ts && d.timestamp) d.ts = Math.floor(new Date(d.timestamp.replace(' ', 'T')).getTime() / 1000);
          d.dateObj = new Date(d.ts * 1000);
        });
        dataRef.current = json;
        if (json.length > 0) lastDataPoint.current = json[json.length - 1];
        setInitialData([...dataRef.current]);
      }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    const realtime = new Ably.Realtime({ key: 'DYt11Q.G9DtiQ:TgnTC0ItL_AzsD4puAdytIVYMeArsFSn-qyAAuHbQLQ' });
    const channel = realtime.channels.get('earthquake:raw');
    channel.subscribe((msg) => {
      const raw = typeof msg.data === 'string' ? msg.data : new TextDecoder().decode(msg.data);
      const data = JSON.parse(raw);

      const nowBangkok = new Date(Date.now() + 7 * 3600 * 1000);
      data.dateObj = nowBangkok;
      data.ts = Math.floor(nowBangkok.getTime() / 1000);
      data.timestamp = nowBangkok.toISOString().replace('T', ' ').substring(0, 19);

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
          lastDataPoint.current = data;
          dataRef.current.push(data);
          if (dataRef.current.length > 300) dataRef.current.shift();
        }
        setDataPoint(data);
        setInitialData([...dataRef.current]);
      }
    });
    return () => channel.unsubscribe();
  }, []);

 useEffect(() => {
    const onUsgsLoaded = (list) => setUsgsQuakes(list);
    // pass callback to Map component
    return onUsgsLoaded;
  }, []);

  useEffect(() => {
    async function fetchTMD() {
      const res = await fetch('/api/fetch-tmd');
      const json = await res.json();
      if (Array.isArray(json)) setTmdQuakes(json);
    }
    fetchTMD();
  }, []);
 
  const [stats, setStats] = useState({ avg: '-', max: '-' });

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
        <img src="https://arnon.dgbkp.in.th/logo.jpg" height="150" style={{ verticalAlign: 'middle' }} /> <h1 style={{margin: 0, textAlign: 'left' }}> Project Ar-non: dashboard</h1>
        <div style={{ margin: 20 ,background: '#bde6ee', textAlign: 'right', padding: 20, borderRadius: 8 }}>
          <div>{now.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div style={{ fontSize: 36 }}>{now.toLocaleTimeString('th-TH')}</div>
        </div>
      </div>

  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginTop: 1 }}>
        <div>
          <h3>แรงสั่นสะเทือนในพื้นที่ กทท. (Real-time)</h3>
          <div style={{ height: '40vh', width: '50vw' }}><MapPATOnly latest={dataPoint} /></div>
        </div>
  
        <div style={{ height: '30vh', width: '50vw' }}>
          <h3>แรงสั่นสะเทือนย้อนหลัง 10 นาที</h3>
               <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 1 }}>
                  <div style={{ backgroundColor: getColor(+stats.avg), color: 'white', padding: 10, borderRadius: 8 }}><h2>เฉลี่ย : {stats.avg}</h2></div>
                  <div style={{ backgroundColor: getColor(+stats.max), color: 'white', padding: 10, borderRadius: 8 }}><h2>สูงสุด : {stats.max}</h2></div>
                </div> 
          <LiveSensorChart dataPoint={dataPoint} initialData={initialData} newData={dataPoint} onStatsChange={setStats} />
        </div>
      </div>
  
  <div style={{ marginTop: 20 }}>

          <h3>แผ่นดินไหวในภูมิภาค (ย้อนหลัง 24 ชั่วโมง)</h3>
          <div style={{ height: '30vh' }}><Map latest={dataPoint} tmdQuakes={tmdQuakes}  onUsgsLoaded={setUsgsQuakes} /></div>  
          <h3>รายงานเหตุแผ่นดินไหวในภูมิภาค</h3>
          <LatestQuakes usgsQuakes={usgsQuakes} tmdQuakes={tmdQuakes} /> 
  </div>
  
      <div style={{ marginTop: 20 }}>
        <h3>คุณภาพอากาศที่ท่าเรือกรุงเทพ (BETA)</h3>
        <AQIPanel />
      </div>
    </div>
  );
}
