// components/LiveSensorChart.js
// V0.1.2.1.0 – preload 10 min history + live‐append

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts'

export default function LiveSensorChart({ deviceId, newData, timestamp }) {
  const [history, setHistory] = useState({})

  // Helper to split "DG-warehouse-aqi" → ["DG-warehouse","aqi"]
  function parseDeviceKey(key) {
    const idx = key.lastIndexOf('-')
    if (idx === -1) return [key, null]
    return [ key.slice(0, idx), key.slice(idx + 1) ]
  }

  // 1) on mount (or if deviceId changes) fetch your last-10-min JSON
  useEffect(() => {
    if (!deviceId) return
    const [rawDev, suffix] = parseDeviceKey(deviceId)
    // decide which field to pick
    const propName = suffix === 'aqi' ? 'AQI' : 'shakeMag'

    fetch('https://arnon.dgbkp.in.th/api/data_last_10min.php')
      .then(res => res.json())
      .then(json => {
        // filter to this device only, map to our {ts,value}
        const arr = (json || [])
          .filter(e => e.device === rawDev)
          .map(e => ({
            ts: e.timestamp,
            value: e[propName]
          }))
          .sort((a, b) => new Date(a.ts) - new Date(b.ts))
        setHistory(prev => ({ ...prev, [deviceId]: arr }))
      })
      .catch(err => {
        console.error('LiveSensorChart: failed to load history →', err)
      })
  }, [deviceId])


  // 2) every time a new datapoint arrives, append + trim to last 10 minutes
  useEffect(() => {
    if (!deviceId || newData == null || !timestamp) return

    setHistory(prev => {
      const old = prev[deviceId] || []
      const next = [...old, { ts: timestamp, value: newData }]

      const cutoff = new Date(timestamp).getTime() - 10 * 60 * 1000
      const filtered = next.filter(pt => new Date(pt.ts).getTime() >= cutoff)

      return { ...prev, [deviceId]: filtered }
    })
  }, [deviceId, newData, timestamp])


  // prepare for recharts
  const raw = history[deviceId] || []
  const data = raw.map(item => ({
    time: new Date(item.ts)
            .toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: item.value
  }))


  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="time" 
          hide={true} 
          interval="preserveStartEnd"
          tickFormatter={str => {
            const [h, m, s] = str.split(':')
            return `${m}:${s}`
          }}
        />
        <YAxis domain={[0, 'auto']} hide={true} />
        <Tooltip 
          labelFormatter={lbl => `Time: ${lbl}`}
          formatter={(v) => [v, 'Value']}
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
  )
}
