module.exports = async (req, res) => {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB_API_KEY tanımlı değil' });
  }

  const konu = ((req.query.konu) || '').trim();
  if (!konu) {
    return res.status(400).json({ error: '"konu" parametresi gerekli' });
  }
  if (konu.length > 200) {
    return res.status(400).json({ error: 'Konu çok uzun (max 200 karakter)' });
  }

  try {
    let filmler = [];
    let diziler = [];

    const konuMap = {
      'hapishane': 'prison', 'kaçış': 'escape', 'kaçis': 'escape', 'firar': 'escape',
      'savaş': 'war', 'savas': 'war', 'askeri': 'military', 'ordu': 'army',
      'aldatma': 'adultery', 'ihanet': 'betrayal', 'intikam': 'revenge',
      'zaman yolculuğu': 'time travel', 'zaman yolculugu': 'time travel',
      'uzay': 'space', 'uzaylı': 'alien', 'uzayli': 'alien', 'yapay zeka': 'artificial intelligence',
      'polisiye': 'police', 'dedektif': 'detective', 'cinayet': 'murder', 'katil': 'killer',
      'mafya': 'mafia', 'gangster': 'gangster', 'suç': 'crime', 'suc': 'crime',
      'okul': 'school', 'gençlik': 'teenager', 'genc': 'teenager', 'aşk': 'love', 'ask': 'love',
      'tarih': 'history', 'dönem': 'period', 'donem': 'period', 'ortaçağ': 'medieval', 'ortacag': 'medieval',
      'korku': 'horror', 'gerilim': 'thriller', 'hayatta kalma': 'survival',
      'spor': 'sport', 'futbol': 'football', 'basketbol': 'basketball',
      'bilim kurgu': 'science fiction', 'bilimkurgu': 'science fiction',
      'fantastik': 'fantasy', 'sihir': 'magic', 'ejderha': 'dragon',
      'psikolojik': 'psychological', 'akıl hastanesi': 'mental illness',
      'soygun': 'heist', 'banka soygunu': 'bank robbery', 'hırsızlık': 'robbery',
      'aile': 'family', 'çocuk': 'children', 'cocuk': 'children',
      'süper kahraman': 'superhero', 'super kahraman': 'superhero',
      'zombi': 'zombie', 'vampir': 'vampire', 'kurtadam': 'werewolf',
      'doğa': 'nature', 'doga': 'nature', 'hayvan': 'animal',
      'müzik': 'music', 'muzik': 'music', 'dans': 'dance',
      'politik': 'politics', 'siyasi': 'politics', 'devlet': 'government',
      'para': 'money', 'zengin': 'rich', 'fakir': 'poor',
      'ölüm': 'death', 'olum': 'death', 'hayat': 'life',
      'dostluk': 'friendship', 'arkadaş': 'friend', 'arkadas': 'friend',
      'yalnız': 'loneliness', 'yalniz': 'loneliness', 'izole': 'isolation'
    };

    let aramaTerimleri = [konu];
    const konuKucuk = konu.toLowerCase();

    Object.entries(konuMap).forEach(([tr, en]) => {
      if (konuKucuk.includes(tr) && !aramaTerimleri.includes(en)) {
        aramaTerimleri.push(en);
      }
    });

    const keywordIds = new Set();
    await Promise.all(
      aramaTerimleri.map(async (terim) => {
        try {
          const resp = await fetch(
            `https://api.themoviedb.org/3/search/keyword?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(terim)}`
          );
          if (!resp.ok) return;
          const data = await resp.json();
          (data.results || []).slice(0, 2).forEach(k => keywordIds.add(k.id));
        } catch (e) {}
      })
    );

    if (keywordIds.size > 0) {
      const qs = Array.from(keywordIds).join(',');
      const [movieResp, tvResp] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_keywords=${qs}&language=tr-TR&sort_by=popularity.desc`),
        fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_keywords=${qs}&language=tr-TR&sort_by=popularity.desc`)
      ]);

      if (movieResp.ok) {
        const mData = await movieResp.json();
        filmler = (mData.results || []).slice(0, 6).map(m => m.title);
      }
      if (tvResp.ok) {
        const tData = await tvResp.json();
        diziler = (tData.results || []).slice(0, 6).map(t => t.name);
      }
    }

    const yetersizSonuc = filmler.length < 3 || diziler.length < 3;

    if (GROQ_API_KEY && yetersizSonuc) {
      try {
        const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: 'Sen bir film ve dizi uzmanısın. Sadece gerçekten var olan, bilinen yapımların isimlerini ver. Uydurma veya var olmayan isim yazma. Sadece isim listesi, açıklama yok.'
              },
              {
                role: 'user',
                content: `"${konu}" konusunda 5 dizi ve 5 film öner. Sadece isimleri virgülle ayır, başka hiçbir şey yazma.\nDiziler: isim1, isim2, isim3, isim4, isim5\nFilmler: isim1, isim2, isim3, isim4, isim5`
              }
            ],
            temperature: 0.2,
            max_tokens: 300
          })
        });

        if (!groqResp.ok) throw new Error('Groq hatası');

        const groqData = await groqResp.json();
        const metin = groqData.choices?.[0]?.message?.content || '';

        const diziMatch = metin.match(/Diziler:\s*(.+)/i);
        const filmMatch = metin.match(/Filmler:\s*(.+)/i);

        const llmDiziler = diziMatch ? diziMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [];
        const llmFilmler = filmMatch ? filmMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [];

        const dogrulanmisFilmler = await Promise.all(
          llmFilmler.map(async (isim) => {
            try {
              const resp = await fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(isim)}`
              );
              if (!resp.ok) return null;
              const data = await resp.json();
              return (data.results || []).length > 0 ? isim : null;
            } catch (e) { return null; }
          })
        );

        const dogrulanmisDiziler = await Promise.all(
          llmDiziler.map(async (isim) => {
            try {
              const resp = await fetch(
                `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(isim)}`
              );
              if (!resp.ok) return null;
              const data = await resp.json();
              return (data.results || []).length > 0 ? isim : null;
            } catch (e) { return null; }
          })
        );

        const mevcut = new Set([...filmler, ...diziler].map(i => i.toLowerCase()));

        dogrulanmisFilmler.filter(Boolean).forEach(f => {
          if (!mevcut.has(f.toLowerCase())) filmler.push(f);
        });
        dogrulanmisDiziler.filter(Boolean).forEach(d => {
          if (!mevcut.has(d.toLowerCase())) diziler.push(d);
        });

      } catch (e) {}
    }

    return res.status(200).json({
      diziler: diziler.slice(0, 8),
      filmler: filmler.slice(0, 8)
    });

  } catch (e) {
    return res.status(502).json({ error: 'Arama başarısız oldu' });
  }
};
