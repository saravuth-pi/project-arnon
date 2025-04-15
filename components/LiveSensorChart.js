import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import Ably from 'ably';

function LiveSensorChart() {
  const [data, setData] = useState([]);
  const [latest, setLatest] = useState(null);
  const prev = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    // Load 10-minute history on initial render
    fetch('https://arnon.dgbkp.in.th/api/pat1_last_10min.php')
      .then(res => res.json())
      .then(items => {
        const magnitudes = [];
        items.forEach((item, idx) => {
          const dx = item.x - prev.current.x;
          const dy = item.y - prev.current.y;
          const dz = item.z - prev.current.z;
          const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);
          magnitudes.push({
            ts: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            magnitude: magnitude
          });
          prev.current = item;
        });
        setData(magnitudes);
      });

    const ably = new Ably.Realtime('DYt11Q.G9DtiQ:TgnTC0ItL_AzsD4puAdytIVYMeArsFSn-qyAAuHbQLQ');
    const channel = ably.channels.get('earthquake:raw');
    channel.subscribe((msg) => {
      const { x, y, z, ts } = msg.data;
      const dx = x - prev.current.x;
      const dy = y - prev.current.y;
      const dz = z - prev.current.z;
      const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);
      prev.current = { x, y, z };

      const point = {
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        magnitude
      };
      setLatest({ x, y, z, ts });
      setData(prevData => [...prevData.slice(-599), point]);
    });

    return () => channel.unsubscribe();
  }, []);

  const max = Math.max(...data.map(d => d.magnitude), 0);
  const avg = data.length ? (data.reduce((sum, d) => sum + d.magnitude, 0) / data.length).toFixed(2) : 0;

  return (
    <div>
      <h3>PAT1 Detector (Magnitude)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis
            dataKey="ts"
            tickFormatter={(value, index) => (index % 60 === 0 ? value : '')}
            interval={0}
            minTickGap={20}
            label={{ value: 'Time (HH:MM)', position: 'bottom', offset: 10 }}
          />
          <YAxis
            type="number"
            domain={['auto', 'auto']}
            label={{ value: 'Magnitude (Delta g)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Legend formatter={() => `Magnitude (∆) — Avg: ${avg}, Max: ${max}`} />
          <ReferenceLine y={3.5} stroke="red" strokeDasharray="5 5" label="Threshold 3.5" />
          <Line type="monotone" dataKey="magnitude" stroke="purple" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      {latest && (
        <p>
          <strong>X:</strong> {latest.x.toFixed(2)} g — <strong>Y:</strong> {latest.y.toFixed(2)} g —{' '}
          <strong>Z:</strong> {latest.z.toFixed(2)} g — <strong>Timestamp:</strong> {latest.ts}
        </p>
      )}
    </div>
  );
}

export default LiveSensorChart;
