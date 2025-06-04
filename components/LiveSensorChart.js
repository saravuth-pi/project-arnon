// components/LiveSensorChart.js
// V0.1.2.0.0 – ปรับให้กราฟเก็บ history ตามช่วงเวลา 10 นาทีล่าสุด

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';

export default function LiveSensorChart({ deviceId, newData, timestamp }) {
  /**
   * newData คือ ค่าปัจจุบัน (เช่น magnitude หรือ AQI) ของ deviceId
   * timestamp คือเวลาของ data ใหม่ (เช่น ISO string หรือ number)
   *
   * เราจะเก็บ history ของแต่ละ deviceId ในรูปแบบ:
   * {
   *   "esp32-1-aqi": [{ ts: "<ISO string>", value: 0.12 }, ...],
   *   "esp32-1-mag": [{ ts: "...", value: 0.05 }, ...],
   *   ...
   * }
   *
   * และทุกครั้งที่มีข้อมูลใหม่เข้ามา เราจะ:
   *  1. นำ data point ใหม่ push เข้าไปใน history[deviceId]
   *  2. ตัดทิ้ง data point ที่เก่ากว่า 10 นาที (600,000 ms) จาก timestamp ล่าสุด
   */

  const [history, setHistory] = useState({});

  useEffect(() => {
    // อย่าอัปเดตถ้าไม่มีข้อมูลหรือไม่มี deviceId
    if (!deviceId || newData == null || !timestamp) return;

    setHistory(prev => {
      // 1) เรียก array เก่า (ถ้ามี) หรือสร้างใหม่
      const prevArr = prev[deviceId] ? [...prev[deviceId]] : [];
      // 2) เพิ่มข้อมูลใหม่เข้าไป
      //    สมมติ timestamp เป็น ISO string หรือ number ที่ new Date() รับได้
      const newPoint = {
        ts: timestamp,
        value: newData
      };
      prevArr.push(newPoint);

      // 3) ตัดทิ้ง data point ที่เก่ากว่า 10 นาที (600000 ms)
      const tenMinutesAgo = new Date(timestamp).getTime() - 10 * 60 * 1000;
      const filtered = prevArr.filter(item => {
        const itemTime = new Date(item.ts).getTime();
        return itemTime >= tenMinutesAgo;
      });

      return {
        // clone object เดิม + อัปเดต history ของ deviceId นี้เป็น filtered
        ...prev,
        [deviceId]: filtered
      };
    });
  }, [deviceId, newData, timestamp]);


  // เตรียมข้อมูลให้ Recharts ใช้วาด:  
  //   - dataKey "time" คือฉลากแกน x (เวลาที่เก็บแบบ hh:mm:ss)
  //   - dataKey "value" คือค่าที่ plot (magnitude หรือ AQI)
  //
  // ถ้าอยากให้แกน X แสดงเฉพาะ นาที:วินาที ให้ใช้ toLocaleTimeString
  const raw = history[deviceId] || [];
  const data = raw.map(item => ({
    // แปลงให้เหลือแค่ H:M:S (24-hr) ด้วย Locale "th-TH"
    time: new Date(item.ts).toLocaleTimeString('th-TH', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    value: item.value
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        {/* แสดงแกน X เป็นเวลา แต่ถ้าอยากโชว์ tick เล็กๆ ก็เอา hide ออก */}
        <XAxis 
          dataKey="time" 
          hide={true}       // ถ้าอยากให้เห็น tick ให้ตั้งเป็น hide={false}
          interval="preserveStartEnd"
          tickFormatter={(str) => {
            // optional: ถ้าอยากแสดงแค่ "MM:SS" (เอา "HH:" ออก)
            const parts = str.split(':');
            return `${parts[1]}:${parts[2]}`;
          }}
        />
        {/* YAxis domain: [0, 'auto'] ปรับเป็น hide={true} ถ้าไม่ต้องการแสดงตัวเลขแกน Y */}
        <YAxis 
          domain={[0, 'auto']} 
          hide={true} 
        />
        <Tooltip 
          labelFormatter={(label) => `Time: ${label}`}
          formatter={(val) => [`${val}`, 'Value']} 
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#333"
          dot={false}
          isAnimationActive={false}
          strokeWidth={1.2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
