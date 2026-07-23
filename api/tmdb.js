// Vercel Serverless Function. TMDB_API_KEY sunucuda kalır, tarayıcıya gitmez.
// Kullanım: /api/tmdb?endpoint=search/movie&query=Inception&language=tr-TR

module.exports = async (req, res) => {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB_API_KEY sunucuda tanımlı değil. Vercel > Settings > Environment Variables kısmından ekle.' });
  }

  const { endpoint, ...digerParametreler } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: '"endpoint" parametresi gerekli (örn: movie/popular)' });
  }
  if (!/^[a-zA-Z0-9/_]+$/.test(endpoint)) {
    return res.status(400).json({ error: 'Geçersiz endpoint' });
  }

  const queryString = new URLSearchParams({ ...digerParametreler, api_key: TMDB_API_KEY }).toString();
  const url = `https://api.themoviedb.org/3/${endpoint}?${queryString}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'TMDB isteği başarısız oldu' });
  }
};
