// Bu dosya SUNUCUDA çalışır (tarayıcıda değil). TMDB_API_KEY buradan okunuyor,
// tarayıcıya asla gönderilmiyor — sayfa kaynağında görünmez.
//
// Kullanım: /.netlify/functions/tmdb?endpoint=search/movie&query=Inception&language=tr-TR
// "endpoint" parametresi TMDB'nin kendi API yolu (örn: movie/popular, movie/12345, search/movie).

exports.handler = async function (event) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (!TMDB_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'TMDB_API_KEY sunucuda tanımlı değil. Netlify > Site settings > Environment variables kısmından ekle.' }),
    };
  }

  const params = event.queryStringParameters || {};
  const { endpoint, ...digerParametreler } = params;

  if (!endpoint) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: '"endpoint" parametresi gerekli (örn: movie/popular)' }),
    };
  }

  // Güvenlik: endpoint sadece harf/rakam/slash içerebilir, başka bir şeye istek atılmasın
  if (!/^[a-zA-Z0-9/_]+$/.test(endpoint)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Geçersiz endpoint' }) };
  }

  const queryString = new URLSearchParams({ ...digerParametreler, api_key: TMDB_API_KEY }).toString();
  const url = `https://api.themoviedb.org/3/${endpoint}?${queryString}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return {
      statusCode: res.status,
      headers,
      body: JSON.stringify(data),
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: 'TMDB isteği başarısız oldu' }),
    };
  }
};
