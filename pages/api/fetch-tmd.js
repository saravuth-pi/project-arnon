// /pages/api/fetch-tmd.js
// Proxy endpoint to fetch and parse RSS from TMD
import { XMLParser } from 'fast-xml-parser';

export default async function handler(req, res) {
  try {
    const response = await fetch('https://earthquake.tmd.go.th/feed/rss_tmd.xml');
    const xml = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);

    const items = parsed.rss.channel.item;
    const results = items.map((item) => {
      const title = item.title;
      const description = item.description;

      const match = description.match(/แมกนิจูด\s*(\d+\.\d+).*?ละติจูด\s*(\d+\.\d+).*?ลองจิจูด\s*(\d+\.\d+)/);
      const timeMatch = description.match(/เวลาที่เกิดเหตุ\s*(\d{2}:\d{2})\s*น\.[ ]*วันที่\s*(\d{1,2})\s*(\w+)\s*(\d{4})/);

      let mag = null, lat = null, lon = null, timestamp = null;
      if (match) {
        mag = parseFloat(match[1]);
        lat = parseFloat(match[2]);
        lon = parseFloat(match[3]);
      }

      if (timeMatch) {
        const [_, time, day, thaiMonth, year] = timeMatch;
        const monthMap = {
          'มกราคม': 1, 'กุมภาพันธ์': 2, 'มีนาคม': 3, 'เมษายน': 4, 'พฤษภาคม': 5,
          'มิถุนายน': 6, 'กรกฎาคม': 7, 'สิงหาคม': 8, 'กันยายน': 9, 'ตุลาคม': 10, 'พฤศจิกายน': 11, 'ธันวาคม': 12
        };
        const m = monthMap[thaiMonth] || 1;
        const iso = `${year}-${m.toString().padStart(2, '0')}-${day.padStart(2, '0')}T${time}:00+07:00`;
        timestamp = new Date(iso).toISOString();
      }

      return { title, mag, lat, lon, timestamp };
    }).filter(d => d.mag && d.lat && d.lon);

    res.status(200).json(results);
  } catch (err) {
    console.error('❌ Error fetching/parsing TMD RSS:', err);
    res.status(500).json({ error: 'Failed to load TMD RSS' });
  }
}
