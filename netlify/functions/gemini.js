// Bu dosya SUNUCUDA çalışır. GEMINI_API_KEY buradan okunuyor, tarayıcıya asla gönderilmiyor.
// Kullanım: /.netlify/functions/gemini?konu=hapishane%20kaçışı
// Dönen veri: { diziler: ["isim1","isim2",...], filmler: ["isim1","isim2",...] }

exports.handler = async function (event) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GEMINI_API_KEY sunucuda tanımlı değil. Netlify > Environment variables kısmından ekle.' }),
    };
  }

  const params = event.queryStringParameters || {};
  const konu = (params.konu || '').trim();

  if (!konu) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: '"konu" parametresi gerekli' }) };
  }
  if (konu.length > 200) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Konu çok uzun' }) };
  }

  const prompt = `"${konu}" konulu 5 dizi ve 5 film öner.
Sadece isimleri virgülle ayırarak yaz, başka hiçbir açıklama, giriş cümlesi ya da yorum ekleme.
Tam olarak bu formatta yaz:
Diziler: isim1, isim2, isim3, isim4, isim5
Filmler: isim1, isim2, isim3, isim4, isim5`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
      }),
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({ error: 'Gemini isteği başarısız (kota dolmuş olabilir)' }),
      };
    }

    const data = await res.json();
    const metin =
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
        ? data.candidates[0].content.parts[0].text
        : '';

    // Sunucu tarafında ayrıştır, tarayıcıya temiz dizi olarak gönder
    const diziEslesme = metin.match(/Diziler:\s*(.+)/i);
    const filmEslesme = metin.match(/Filmler:\s*(.+)/i);
    const diziler = diziEslesme
      ? diziEslesme[1].split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5)
      : [];
    const filmler = filmEslesme
      ? filmEslesme[1].split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5)
      : [];

    return { statusCode: 200, headers, body: JSON.stringify({ diziler, filmler }) };
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Gemini isteği başarısız oldu' }) };
  }
};
