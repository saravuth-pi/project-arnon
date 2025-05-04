// /pages/api/fetch-tmd.js
// V0.1002 - Fixed: parse TMD XML using geo/magnitude fields
import { XMLParser } from 'fast-xml-parser';

export default async function handler(req, res) {
  try {
    const response = await fetch('https://earthquake.tmd.go.th/feed/rss_tmd.xml');
    const xml = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);

    const items = parsed?.rss?.channel?.item;
    if (!Array.isArray(items)) {
      return res.status(200).json([]);
    }

    const results = items.map((item) => {
      const title = item.title || '';
      const mag = parseFloat(item['tmd:magnitude']) || null;
      const lat = parseFloat(item['geo:lat']) || null;
      const lon = parseFloat(item['geo:long']) || null;
      const timeStr = item['tmd:time'];
      let timestamp = null;

      if (timeStr) {
        // timeStr: "2025-05-04 12:30:01 UTC" -> convert to ISO Bangkok
        const dt = new Date(timeStr.replace(' UTC', 'Z'));
        const bangkok = new Date(dt.getTime() + 7 * 60 * 60 * 1000);
        timestamp = bangkok.toISOString();
      }

      return { title, mag, lat, lon, timestamp };
    }).filter(d => d.mag && d.lat && d.lon && d.timestamp);

    res.status(200).json(results);
  } catch (err) {
    console.error('❌ Error fetching/parsing TMD RSS:', err);
    res.status(500).json({ error: 'Failed to load TMD RSS' });
  }
}
