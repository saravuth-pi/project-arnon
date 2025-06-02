// components/LiveSensorChart.js
// V0.1.0.0.0 - edited LiveSensorChart component to display live sensor data in a line chart
import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';

export default function LiveSensorChart({ deviceId, newData, timestamp }) {
  // newData คือ data.shakeMag ของ deviceId ที่ส่งเข้ามาล่าสุด
  // timestamp คือ data.ts
  // เราจะเก็บ history ของแต่ละ deviceId ใน object เช่น:
  const [history, setHistory] = useState({}); // { "esp32-1": [{ts, mag}, ...], "esp32-2": [...] }

  useEffect(() => {
    if (!deviceId || newData == null || timestamp == null) return;

    setHistory(prev => {
      const arr = prev[deviceId] ? [...prev[deviceId]] : [];
      // เก็บแค่ 60 จุดล่าสุด (สมมติเก็บ 60 ค่าล่าสุด)
      if (arr.length >= 60) arr.shift();
      arr.push({ ts: timestamp, mag: newData });
      return {
        ...prev,
        [deviceId]: arr
      };
    });
  }, [deviceId, newData, timestamp]);

  // เตรียมข้อมูลสำหรับ Recharts
  const data = (history[deviceId] || []).map(item => ({
    timestamp: new Date(item.ts).toLocaleTimeString('th-TH', { hour12: false }),
    magnitude: item.mag
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" hide />
        <YAxis domain={[0, 'auto']} hide />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="magnitude"
          stroke="#333"
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
