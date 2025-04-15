// pages/api/send-usgs.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const quake = JSON.parse(req.body);

  const formData = new URLSearchParams();
  formData.append("magnitude", quake.mag);
  formData.append("place", quake.place);
  formData.append("latitude", quake.lat);
  formData.append("longitude", quake.lon);
  formData.append("distance", quake.distance);
  formData.append("quake_time", quake.time); // format: YYYY-MM-DD HH:MM:SS

  try {
    const resp = await fetch("https://arnon.dgbkp.in.th/save_quake.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    const text = await resp.text();
    res.status(200).json({ status: text });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
}
