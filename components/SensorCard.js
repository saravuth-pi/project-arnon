// components/SensorCard.js
// V0.2.0.0.6 – กำหนด height ให้กราฟ ไม่ใช้ flex:1

import LiveSensorChart from './LiveSensorChart'; 

const COLOR_MAP = {
  'esp32-1': '#2ecc71',
  'esp32-2': '#8e44ad',
  'esp32-3': '#3498db'
};

export default function SensorCard({ deviceId, data }) {
  const color = COLOR_MAP[deviceId] || '#7f8c8d';

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      background: 'white',
      border: `3px solid ${color}`,
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: color,
        color: 'white',
        padding: '6px 10px',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        textAlign: 'left'
      }}>
        {deviceId.toUpperCase()}
      </div>

      {/* เนื้อหาในการ์ด */}
      <div style={{
        padding: '5px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'      /* เว้นระยะระหว่างบล็อก */
      }}>

        {/* --- กราฟ AQI --- */}
        <div style={{
          height: '50px',          // กำหนดความสูงตายตัว (ปรับได้ตามต้องการ)
          border: '1px solid #eee',
          borderRadius: 6,
          padding: '4px'
        }}>
          <div style={{
            fontSize: '0.6rem',
            fontWeight: 'bold',
            marginBottom: '0px'
          }}>
            AQI Trend
          </div>
          <LiveSensorChart
            deviceId={`${deviceId}-aqi`}
            newData={data && data.aqi25 != null ? data.aqi25 : null}
            timestamp={data ? data.ts : null}
          />
        </div>

        {/* --- สรุปค่า AQI --- */}
        <div style={{
          fontSize: '0.7rem',
          color: '#555',
          lineHeight: 1.0,
          marginTop: '5px'
        }}>
          <div><strong>Current AQI:</strong> - </div>
          <div><strong>Avg AQI:</strong>    - </div>
          <div><strong>Max AQI:</strong>    - </div>
        </div>

        {/* --- ข้อมูล Sensor Fields --- */}
        <div style={{
          fontSize: '1.0rem',
          lineHeight: 1.0,
          color: '#333'
        }}>
          <div>
            <strong>AQI₂.₅    :</strong> {data && data.aqi25 != null ? data.aqi25 : '-'}
          </div>
          <div>
            <strong>PM₂.₅     :</strong> {data && data.pm25 != null ? data.pm25 + ' µg/m³' : '-'}
          </div>
          <div>
            <strong>PM₁₀      :</strong> {data && data.pm10 != null ? data.pm10 + ' µg/m³' : '-'}
          </div>
          <div>
            <strong>CO₂       :</strong> {data && data.CO2 != null ? data.CO2 + ' ppm' : '-'}
          </div>
          <div>
            <strong>TVOC      :</strong> {data && data.TOC != null ? data.TOC + ' ppb' : '-'}
          </div>
          <div>
            <strong>Temp      :</strong> {data && data.temp != null ? data.temp + ' °C' : '-'}
          </div>
          <div>
            <strong>RH        :</strong> {data && data.RH != null ? data.RH + ' %' : '-'}
          </div>
        </div>

        {/* --- กราฟ Magnitude --- */}
        <div style={{
          height: '50px',          // กำหนดความสูงเท่ากับกราฟ AQI (หรือปรับตามชอบ)
          border: '1px solid #eee',
          borderRadius: 6,
          padding: '4px'
        }}>
          <div style={{
            fontSize: '0.5rem',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Magnitude Trend
          </div>
          <LiveSensorChart
            deviceId={`${deviceId}-mag`}
            newData={data ? data.shakeMag : null}
            timestamp={data ? data.ts : null}
          />
        </div>

        {/* --- สรุปค่า Magnitude --- */}
        <div style={{
          borderTop: '1px solid #ddd',
          paddingTop: '6px',
          fontSize: '0.7rem',
          color: '#555',
          lineHeight: 1.0
        }}>
          <div><strong>Current Magnitude:</strong> - </div>
          <div><strong>Avg Magnitude:</strong>     - </div>
          <div><strong>Max Magnitude:</strong>     - </div>
        </div>
      </div>
    </div>
  );
}
