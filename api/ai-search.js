module.exports = async (req, res) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY tanımlı değil' });
  }

  const konu = ((req.query.konu) || '').trim();
  if (!konu) {
    return res.status(400).json({ error: '"konu" gerekli' });
  }
  if (konu.length > 200) {
    return res.status(400).json({ error: 'Konu çok uzun' });
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Sen bir film ve dizi uzmanısın. Sadece gerçekten var olan, bilinen yapımların isimlerini ver. Uydurma isim yazma. Sadece isim listesi, açıklama yok.'
          },
          {
            role: 'user',
            content: `"${konu}" konusunda 8 dizi ve 8 film öner. Sadece isimleri virgülle ayır, başka hiçbir şey yazma.\nDiziler: isim1, isim2, isim3, isim4, isim5, isim6, isim7, isim8\nFilmler: isim1, isim2, isim3, isim4, isim5, isim6, isim7, isim8`
          }
        ],
        temperature: 0.3,
        max_tokens: 400
      })
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('Groq hatası:', err);
      return res.status(r.status).json({ error: 'Groq isteği başarısız' });
    }

    const data = await r.json();
    const metin = data.choices?.[0]?.message?.content || '';

    const diziMatch = metin.match(/Diziler:\s*(.+)/i);
    const filmMatch = metin.match(/Filmler:\s*(.+)/i);

    const diziler = diziMatch ? diziMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [];
    const filmler = filmMatch ? filmMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [];

    return res.status(200).json({ diziler, filmler });

  } catch (e) {
    console.error('Hata:', e);
    return res.status(502).json({ error: 'Arama başarısız oldu' });
  }
};
