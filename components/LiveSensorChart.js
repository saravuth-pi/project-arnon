// components/LiveSensorChart.js
// Updated version: V0.9353
// This version removes API vs Graph table,
// and merges realtime Ably data from index.js context (already subscribed) into the graph (via props).

import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler);

const LiveSensorChart = ({ initialData, newData }) => {
  const chartRef = useRef(null);
  const history = useRef([]);

  // Append new realtime data
  useEffect(() => {
    if (!newData) return;

    // Extract current values
    const { x, y, z, timestamp } = newData;
    const t = new Date(timestamp).getTime();

    // Use previous values to calculate delta
    const prev = history.current[history.current.length - 1];
    if (prev) {
      const dx = x - prev.x;
      const dy = y - prev.y;
      const dz = z - prev.z;
      const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const magnitude = Math.min(10, delta * 5);
      history.current.push({ x, y, z, t, magnitude });
    } else {
      history.current.push({ x, y, z, t, magnitude: 0 });
    }

    // Trim to last 10 minutes
    const tenMinAgo = Date.now() - 10 * 60 * 1000;
    history.current = history.current.filter((d) => d.t >= tenMinAgo);
  }, [newData]);

  // Initialize with API data
  useEffect(() => {
    if (!initialData || !initialData.length) return;
    const formatted = [];
    let prev = null;
    initialData.forEach(({ x, y, z, timestamp }) => {
      const t = new Date(timestamp).getTime();
      if (prev) {
        const dx = x - prev.x;
        const dy = y - prev.y;
        const dz = z - prev.z;
        const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const magnitude = Math.min(10, delta * 5);
        formatted.push({ x, y, z, t, magnitude });
      } else {
        formatted.push({ x, y, z, t, magnitude: 0 });
      }
      prev = { x, y, z };
    });
    history.current = formatted;
  }, [initialData]);

  const data = {
    labels: history.current.map((d) => new Date(d.t)),
    datasets: [
      {
        label: 'Magnitude (Δ)',
        data: history.current.map((d) => d.magnitude),
        borderColor: 'purple',
        backgroundColor: 'rgba(128,0,128,0.2)',
        fill: true,
        pointRadius: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: { unit: 'minute', displayFormats: { minute: 'HH:mm:ss' } },
        title: { display: true, text: 'Time (HH:MM:SS)' },
      },
      y: {
        min: 0,
        max: 8,
        title: { display: true, text: 'Magnitude (Delta g)' },
      },
    },
    plugins: {
      legend: { display: true },
    },
  };

  return <Line ref={chartRef} data={data} options={options} />;
};

export default LiveSensorChart;
