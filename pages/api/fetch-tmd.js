// /pages/api/fetch-tmd.js
// V0.1003 - Add place + keep timestamp from Bangkok directly
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
      const comments = item.comments || '';
      const timestamp = timeStr?.replace(' UTC', '+07:00') || null;

      return {
        title,
        mag,
        lat,
        lon,
        place: comments,
        timestamp
      };
    }).filter(d => d.mag && d.lat && d.lon && d.timestamp);

    res.status(200).json(results);
  } catch (err) {
    console.error('❌ Error fetching/parsing TMD RSS:', err);
    res.status(500).json({ error: 'Failed to load TMD RSS' });
  }
}
