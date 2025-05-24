// components/LatestQuakes.js
// V.0.1000 - Show lastest quake
import React from 'react';

export default function LatestQuakes({ quakes = [] }) {
  return (
    <div style={{ marginTop: '10px' }}>
      <h3>แสดงเหตุแผ่นดินไหวต่างๆ</h3>
      <ul style={{ paddingLeft: '20px' }}>
        {quakes.length === 0 && <li>ไม่พบเหตุ</li>}
        {quakes.map((q, i) => (
          <li key={i}>
            <strong>Mag:</strong> {q.mag.toFixed(1)} | <strong>Place:</strong> {q.place || q.title} | <strong>Time:</strong> {new Date(q.time || q.timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
          </li>
        ))}
      </ul>
    </div>
  );
}
