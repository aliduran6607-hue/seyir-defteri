// Vercel Serverless Function. GEMINI_API_KEY sunucuda kalır, tarayıcıya gitmez.
// Kullanım: /api/gemini?konu=hapishane%20kaçışı

module.exports = async (req, res) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY sunucuda tanımlı değil. Vercel > Settings > Environment Variables kısmından ekle.' });
  }

  const konu = ((req.query.konu) || '').trim();
  if (!konu) {
    return res.status(400).json({ error: '"konu" parametresi gerekli' });
  }
  if (konu.length > 200) {
    return res.status(400).json({ error: 'Konu çok uzun' });
  }

  const prompt = `"${konu}" konulu 5 dizi ve 5 film öner.
Sadece isimleri virgülle ayırarak yaz, başka hiçbir açıklama, giriş cümlesi ya da yorum ekleme.
Tam olarak bu formatta yaz:
Diziler: isim1, isim2, isim3, isim4, isim5
Filmler: isim1, isim2, isim3, isim4, isim5`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
      }),
    });

    if (!r.ok) {
      return res.status(r.status).json({ error: 'Gemini isteği başarısız (kota dolmuş olabilir)' });
    }

    const data = await r.json();
    const metin =
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
        ? data.candidates[0].content.parts[0].text
        : '';

    const diziEslesme = metin.match(/Diziler:\s*(.+)/i);
    const filmEslesme = metin.match(/Filmler:\s*(.+)/i);
    const diziler = diziEslesme ? diziEslesme[1].split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5) : [];
    const filmler = filmEslesme ? filmEslesme[1].split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5) : [];

    return res.status(200).json({ diziler, filmler });
  } catch (e) {
    return res.status(502).json({ error: 'Gemini isteği başarısız oldu' });
  }
};
