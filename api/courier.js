export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { apiKey, secretKey, payload } = req.body;
  try {
    const response = await fetch('https://portal.steadfast.com.bd/api/v1/create_order', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    if (!text) return res.status(200).json({ status: 0, message: 'Empty response' });
    const data = JSON.parse(text);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ status: 0, message: error.message });
  }
}
