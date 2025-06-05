// components/SensorCard.js
// V0.2.0.4.1 – แก้ useEffect ให้ timeout เตือนค้าง 2 นาที หลังค่ากลับไปปกติ

import { useState, useEffect, useRef } from 'react';
import LiveSensorChart from './LiveSensorChart';

const COLOR_MAP = {
  'esp32-1': '#2ecc71',
  'esp32-2': '#8e44ad',
  'esp32-3': '#3498db'
};

// กำหนด Threshold
const AQI_THRESHOLD = 100;
const MAGNITUDE_THRESHOLD = 2.0;

export default function SensorCard({ deviceId, data }) {
  const color = COLOR_MAP[deviceId] || '#7f8c8d';
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  // เก็บประวัติ 10 นาทีของ AQI และ Magnitude
  const [aqiHistory, setAqiHistory] = useState([]);
  const [magHistory, setMagHistory] = useState([]);

  // สถานะและข้อความ Alert (empty แปลว่าปกติ)
  const [alertText, setAlertText] = useState('');
  // ref เก็บ timeout ID เพื่อเคลียร์ได้
  const clearTimeoutRef = useRef(null);
  // เก็บสถานะ isRawAlert ของรอบก่อนหน้า
  const prevRawAlertRef = useRef(false);
  // Flag ว่าเคยส่ง LINE Notify ไปแล้วหรือยัง
  const notifiedRef = useRef({ aqi: false, mag: false });

  // --- อัปเดต history ของ AQI ---
  useEffect(() => {
    if (!deviceId || data?.aqi25 == null || !data.ts) return;
    setAqiHistory(prev => {
      const arr = [...prev, { ts: data.ts, value: data.aqi25 }];
      const cutoff = new Date(data.ts).getTime() - TEN_MINUTES_MS;
      return arr.filter(item => new Date(item.ts).getTime() >= cutoff);
    });
  }, [deviceId, data?.aqi25, data?.ts]);

  // --- อัปเดต history ของ Magnitude ---
  useEffect(() => {
    if (!deviceId || data?.shakeMag == null || !data.ts) return;
    setMagHistory(prev => {
      const arr = [...prev, { ts: data.ts, value: data.shakeMag }];
      const cutoff = new Date(data.ts).getTime() - TEN_MINUTES_MS;
      return arr.filter(item => new Date(item.ts).getTime() >= cutoff);
    });
  }, [deviceId, data?.shakeMag, data?.ts]);

  // --- ฟังก์ชันคำนวณสถิติ AQI (จำนวนเต็ม) ---
  const calcAqiStats = historyArray => {
    if (!historyArray || historyArray.length === 0) {
      return { current: '-', avg: '-', max: '-' };
    }
    const lastVal = historyArray[historyArray.length - 1].value;
    const current = Math.round(lastVal);
    const sum = historyArray.reduce((a, b) => a + b.value, 0);
    const avg = Math.round(sum / historyArray.length);
    const maxRaw = Math.max(...historyArray.map(item => item.value));
    const max = Math.round(maxRaw);
    return { current, avg, max };
  };

  // --- ฟังก์ชันคำนวณสถิติ Magnitude (ทศนิยม 2 ตำแหน่ง) ---
  const calcMagStats = historyArray => {
    if (!historyArray || historyArray.length === 0) {
      return { current: '-', avg: '-', max: '-' };
    }
    const lastVal = historyArray[historyArray.length - 1].value;
    const current = lastVal.toFixed(2);
    const sum = historyArray.reduce((a, b) => a + b.value, 0);
    const avg = (sum / historyArray.length).toFixed(2);
    const maxRaw = Math.max(...historyArray.map(item => item.value));
    const max = maxRaw.toFixed(2);
    return { current, avg, max };
  };

  // --- ดึงสถิติ AQI และ Magnitude ---
  const { current: currentAqi, avg: avgAqi, max: maxAqi } = calcAqiStats(aqiHistory);
  const { current: currentMag, avg: avgMag, max: maxMag } = calcMagStats(magHistory);

  // แปลง currentMag ให้เป็นตัวเลข เพื่อตรวจ threshold
  const currentMagNum = typeof currentMag === 'string' ? parseFloat(currentMag) : null;

  // ตรวจเช็คว่าค่าเกิน Threshold หรือไม่
  const isAqiDanger = typeof currentAqi === 'number' && currentAqi >= AQI_THRESHOLD;
  const isMagDanger = typeof currentMagNum === 'number' && currentMagNum >= MAGNITUDE_THRESHOLD;
  const isRawAlert = isAqiDanger || isMagDanger;

  // สร้างข้อความ headerText ถ้าเกิด Alert
  let headerText = deviceId.toUpperCase();
  if (isRawAlert) {
    if (isAqiDanger && isMagDanger) {
      headerText = `AQI ${currentAqi}, Mag ${currentMag}`;
    } else if (isAqiDanger) {
      headerText = `AQI ${currentAqi}`;
    } else if (isMagDanger) {
      headerText = `Magnitude ${currentMag}`;
    }
  }

  // --- useEffect หลัก: จัดการ Alert state + LINE Notify + Timeout ล้าง ---
  useEffect(() => {
    const prevRaw = prevRawAlertRef.current;

    // 1) ถ้าเพิ่งเปลี่ยนจากปกติ → Alert (false → true)
    if (!prevRaw && isRawAlert) {
      // ถ้ามี timeout ค้างอยู่ ให้เคลียร์ (เพราะกำลังเข้าสู่ Alert ใหม่)
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }
      // ตั้ง alertText ให้เท่ากับ headerText
      setAlertText(headerText);

      // ส่ง LINE Notify สำหรับ AQI (ถ้ายังไม่เคยส่ง)
      if (isAqiDanger && !notifiedRef.current.aqi) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `[Alert] ${deviceId.toUpperCase()} AQI = ${currentAqi}`
          })
        }).catch(err => console.error('LINE Notify AQI error:', err));
        notifiedRef.current.aqi = true;
      }
      // ส่ง LINE Notify สำหรับ Magnitude (ถ้ายังไม่เคยส่ง)
      if (isMagDanger && !notifiedRef.current.mag) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `[Alert] ${deviceId.toUpperCase()} Magnitude = ${currentMag}`
          })
        }).catch(err => console.error('LINE Notify Mag error:', err));
        notifiedRef.current.mag = true;
      }
    }

    // 2) ถ้าเพิ่งเปลี่ยนจาก Alert → ปกติ (true → false)
    if (prevRaw && !isRawAlert) {
      // รีเซ็ต flag ของการส่ง LINE Notify
      notifiedRef.current.aqi = false;
      notifiedRef.current.mag = false;

      // ตั้ง timeout ให้ล้าง alertText ภายใน 2 นาที (120,000 ms)
      clearTimeoutRef.current = setTimeout(() => {
        setAlertText('');
        clearTimeoutRef.current = null;
      }, 2 * 60 * 1000);
    }

    // 3) ถ้ายังอยู่ในสถานะ Alert (prevRaw === true && isRawAlert === true)
    //    ให้เคลียร์ timeout เก่าออก (ไม่ต้องล้าง alertText ตอนนี้)
    if (isRawAlert && clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }

    // อัปเดต prevRawAlertRef สำหรับรอบถัดไป
    prevRawAlertRef.current = isRawAlert;

    // ล้าง timeout เมื่อ component unmount
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, [
    isRawAlert,
    headerText,
    isAqiDanger,
    isMagDanger,
    currentAqi,
    currentMag,
    deviceId
  ]);

  // สุดท้าย: isAlert = Boolean(alertText) (ถ้า alertText ไม่ว่าง ก็ถือเป็น alert)
  const isAlert = Boolean(alertText);
  // ข้อความ header ที่จะแสดง (ถ้า isAlert เวลานี้ ให้แสดง alertText เสมอ)
  const displayHeader = isAlert ? alertText : deviceId.toUpperCase();

  return (
    <div
      className={isAlert ? 'card alert' : 'card'}
      style={{
        flex: 1,
        minWidth: 0,
        background: 'white',
        border: `3px solid ${isAlert ? 'red' : color}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        className={isAlert ? 'header alert-text' : 'header'}
        style={{
          background: isAlert ? 'red' : color,
          color: 'white',
          padding: '6px 10px',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          textAlign: 'left'
        }}
      >
        {displayHeader}
      </div>

      {/* เนื้อหาในการ์ด */}
      <div
        style={{
          padding: '5px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {/* --- กราฟ AQI --- */}
        <div
          style={{
            height: '50px',
            border: '1px solid #eee',
            borderRadius: 6,
            padding: '4px'
          }}
        >
          <div
            style={{
              fontSize: '0.6rem',
              fontWeight: 'bold',
              marginBottom: '0px',
              color: '#777'
            }}
          >
            AQI Trend
          </div>
          <LiveSensorChart
            deviceId={`${deviceId}-aqi`}
            newData={data && data.aqi25 != null ? data.aqi25 : null}
            timestamp={data ? data.ts : null}
          />
        </div>

        {/* --- สรุปค่า AQI (จำนวนเต็ม) --- */}
        <div
          style={{
            fontSize: '0.7rem',
            color: '#555',
            lineHeight: 1.0,
            marginTop: '5px'
          }}
        >
          <div>
            <strong>Current AQI:</strong> {currentAqi}
          </div>
          <div>
            <strong>Avg AQI:</strong> {avgAqi}
          </div>
          <div>
            <strong>Max AQI:</strong> {maxAqi}
          </div>
        </div>

        {/* --- ข้อมูล Sensor Fields --- */}
        <div
          style={{
            fontSize: '0.8rem',
            lineHeight: 1.2,
            color: '#fff',
            background: color,
            padding: '4px',
            borderRadius: 4
          }}
        >
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 3 }}>AQI₂.₅&nbsp;</div>
            <div style={{ flex: 1 }}>:</div>
            <div style={{ flex: 6 }}>
              <strong>
                {data && data.aqi25 != null ? data.aqi25 : '-'}
              </strong>
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 3 }}>PM₂.₅&nbsp;</div>
            <div style={{ flex: 1 }}>:</div>
            <div style={{ flex: 6 }}>
              <strong>
                {data && data.pm25 != null ? data.pm25 + ' µg/m³' : '-'}
              </strong>
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 3 }}>PM₁₀&nbsp;</div>
            <div style={{ flex: 1 }}>:</div>
            <div style={{ flex: 6 }}>
              <strong>
                {data && data.pm10 != null ? data.pm10 + ' µg/m³' : '-'}
              </strong>
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 3 }}>CO₂&nbsp;</div>
            <div style={{ flex: 1 }}>:</div>
            <div style={{ flex: 6 }}>
              <strong>
                {data && data.CO2 != null ? data.CO2 + ' ppm' : '-'}
              </strong>
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 3 }}>TVOC&nbsp;</div>
            <div style={{ flex: 1 }}>:</div>
            <div style={{ flex: 6 }}>
              <strong>
                {data && data.TOC != null ? data.TOC + ' ppb' : '-'}
              </strong>
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 3 }}>Temp&nbsp;</div>
            <div style={{ flex: 1 }}>:</div>
            <div style={{ flex: 6 }}>
              <strong>
                {data && data.temp != null ? data.temp + ' °C' : '-'}
              </strong>
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 3 }}>RH&nbsp;</div>
            <div style={{ flex: 1 }}>:</div>
            <div style={{ flex: 6 }}>
              <strong>
                {data && data.RH != null ? data.RH + ' %' : '-'}
              </strong>
            </div>
          </div>
        </div>

        {/* --- กราฟ Magnitude --- */}
        <div
          style={{
            height: '50px',
            border: '1px solid #eee',
            borderRadius: 6,
            padding: '4px'
          }}
        >
          <div
            style={{
              fontSize: '0.6rem',
              fontWeight: 'bold',
              marginBottom: '0px',
              color: '#777'
            }}
          >
            Magnitude Trend
          </div>
          <LiveSensorChart
            deviceId={`${deviceId}-mag`}
            newData={data ? data.shakeMag : null}
            timestamp={data ? data.ts : null}
          />
        </div>

        {/* --- สรุปค่า Magnitude (ทศนิยม 2 ตำแหน่ง) --- */}
        <div
          style={{
            borderTop: '1px solid #ddd',
            paddingTop: '6px',
            fontSize: '0.7rem',
            color: '#555',
            lineHeight: 1.0
          }}
        >
          <div>
            <strong>Current Magnitude:</strong> {currentMag}
          </div>
          <div>
            <strong>Avg Magnitude:</strong> {avgMag}
          </div>
          <div>
            <strong>Max Magnitude:</strong> {maxMag}
          </div>
        </div>
      </div>

      {/* สไตล์สำหรับการ์ดกระพริบและหัวข้อกระพริบ */}
      <style jsx>{`
        /* ถ้าเป็นสถานะ alert ให้ background กระพริบ (ขาว ↔ แดง) */
        .card.alert {
          animation: flash-bg 1s infinite;
        }
        @keyframes flash-bg {
          0% {
            background-color: white;
          }
          50% {
            background-color: #ffe6e6;
          }
          100% {
            background-color: white;
          }
        }
        /* ถ้า header อยู่ในสถานะ alert ให้ตัวอักษรกระพริบ (opacity 0 ↔ 1) */
        .header.alert-text {
          animation: flash-text 0.8s infinite;
        }
        @keyframes flash-text {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
