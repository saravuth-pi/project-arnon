// components/LiveSensorChart.js
import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

export default function LiveSensorChart({ dataPoint }) {
  const history = useRef([]); // delta
  const timestamps = useRef([]); // ms timestamp
  const prev = useRef(null);
  const [avg, setAvg] = useState(0);
  const [max, setMax] = useState(0);
  const [ready, setReady] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // ✅ โหลดย้อนหลัง 10 นาที
  useEffect(() => {
    fetch('https://arnon.dgbkp.in.th/api/pat1_last_10min.php')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const deltas = [];
          const times = [];

          for (let i = 1; i < data.length; i++) {
            const prev = data[i - 1];
            const curr = data[i];
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            const dz = curr.z - prev.z;
            const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
            deltas.push(delta);
            times.push(new Date(curr.timestamp * 1000).getTime());
          }

          history.current = deltas;
          timestamps.current = times;

          if (data.length > 0) {
            const last = data[data.length - 1];
            prev.current = { x: last.x, y: last.y, z: last.z };
          }

          const avgVal = deltas.reduce((a, b) => a + b, 0) / deltas.length;
          const maxVal = Math.max(...deltas);
          setAvg(avgVal.toFixed(2));
          setMax(maxVal.toFixed(2));
          setReady(true);
          setInitialLoaded(true);
        }
      });
  }, []);

  // ✅ รับข้อมูล real-time จาก dataPoint
  useEffect(() => {
    if (!dataPoint || !ready || !initialLoaded) return;

    const { x, y, z } = dataPoint;
    if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') return;

    let delta = 0;
    if (prev.current) {
      const dx = x - prev.current.x;
      const dy = y - prev.current.y;
      const dz = z - prev.current.z;
      delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    prev.current = { x, y, z };

    const now = Date.now();
    history.current.push(delta);
    timestamps.current.push(now);

    const cutoff = now - 10 * 60 * 1000;
    while (timestamps.current.length && timestamps.current[0] < cutoff) {
      timestamps.current.shift();
      history.current.shift();
    }

    const values = history.current;
    const avgVal = values.reduce((a, b) => a + b, 0) / values.length;
    const maxVal = Math.max(...values);
    setAvg(avgVal.toFixed(2));
    setMax(maxVal.toFixed(2));
  }, [dataPoint, ready, initialLoaded]);

  const timeLabels = timestamps.current.map((t, i) => {
    const d = new Date(t);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');
    return i % Math.floor(timestamps.current.length / 10) === 0 ? `${h}:${m}:${s}` : '';
  });

  const data = {
    labels: timeLabels,
    datasets: [
      {
        label: `Magnitude (Δ) — Avg: ${avg}, Max: ${max}`,
        data: history.current,
        borderColor: 'purple',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Threshold 3.5',
        data: Array(history.current.length).fill(3.5),
        borderColor: 'red',
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    animation: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(2) ?? '-'}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
        },
        title: {
          display: true,
          text: 'Time (HH:MM:SS)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Magnitude (Delta g)',
        },
        ticks: {
          precision: 2,
        },
      },
    },
  };

  return (
    <div style={{ marginTop: 20 }}>
      <Line data={data} options={options} />
    </div>
  );
}
