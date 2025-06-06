import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';
import Ably from 'ably';
import LiveSensorChart from '../components/LiveSensorChart';
import LatestQuakes from '../components/LatestQuakes';
import AQIPanel from '../components/AQIPanel';

const Map = dynamic(() => import('../components/Map'), { ssr: false });
const MapPATOnly = dynamic(() => import('../components/MapPATOnly'), { ssr: false });

function getColor(mag) {
  if (mag >= 6) return 'darkred';
  if (mag >= 5) return 'orangered';
  if (mag >= 4.5) return 'orange';
  if (mag >= 3) return 'yellow';
  return 'green';
}

export default function Home() {
  const [allDataPoints, setAllDataPoints] = useState({});
  const [dataPoint, setDataPoint] = useState(null); // เพิ่ม state สำหรับ dataPoint
  const [initialData, setInitialData] = useState([]);
  const [tmdQuakes, setTmdQuakes] = useState([]);
  const [usgsQuakes, setUsgsQuakes] = useState([]);
  const [now, setNow] = useState(new Date());
  const dataRef = useRef([]);
  const lastAblyTimestamp = useRef(0);
  const lastDataPoint = useRef(null);
  const [stats, setStats] = useState({ avg: '-', max: '-' });

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

      setDataPoint(data); // อัปเดต dataPoint
      setAllDataPoints(prev => ({
        ...prev,
        [data.device]: data
      }));
    });
    return () => channel.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchTMD() {
      const res = await fetch('/api/fetch-tmd');
      const json = await res.json();
      if (Array.isArray(json)) setTmdQuakes(json);
    }
    fetchTMD();
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
        <img src="https://arnon.dgbkp.in.th/logo.jpg" height="130" style={{ verticalAlign: 'middle' }} />
        <h1 style={{ margin: 0, textAlign: 'left' }}> Project Ar-non: dashboard</h1>
        <div style={{ margin: 20, background: '#bde6ee', textAlign: 'right', padding: 20, borderRadius: 8 }}>
          <div>{now.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div style={{ fontSize: 36 }}>{now.toLocaleTimeString('th-TH')}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
        <div>
          <div style={{ height: '30vh', width: '100vw' }}>
            <MapPATOnly latest={allDataPoints} />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginTop: 20 }}>
        <div style={{ height: '20vh', width: '20vw' }}>
          <h3>แรงสั่นสะเทือน</h3>
          <div style={{ backgroundColor: '#eeeeee', display: 'flex', justifyContent: 'center', gap: 10, marginTop: 1 }}>
            <div style={{ backgroundColor: getColor(+stats.avg), color: 'white', padding: 4, borderRadius: 4 }}>
              เฉลี่ย : {stats.avg}
            </div>
            <div style={{ backgroundColor: getColor(+stats.max), color: 'white', padding: 4, borderRadius: 4 }}>
              สูงสุด : {stats.max}
            </div>
          </div>
          <LiveSensorChart
            dataPoint={dataPoint} // ส่ง dataPoint ที่แก้ไขแล้ว
            initialData={initialData}
            newData={dataPoint}
            onStatsChange={setStats}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
        <div style={{ height: '20vh', width: '100vw' }}>
          <h3>รายงานเหตุแผ่นดินไหวในภูมิภาค</h3>
          <LatestQuakes usgsQuakes={usgsQuakes} tmdQuakes={tmdQuakes} />
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <h3>คุณภาพอากาศที่ท่าเรือกรุงเทพ (BETA)</h3>
        <AQIPanel />
      </div>
    </div>
  );
}