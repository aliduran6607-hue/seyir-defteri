const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const TMDB_API_KEY = process.env.TMDB_API_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const usersSnap = await db.collection('koleksiyonlar').get();
    const simdi = new Date();
    let gonderilen = 0;
    let hatali = 0;
    
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const veriler = userData.veriler || [];
      
      const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
      if (!tokenDoc.exists) {
        console.log(`[${userId}] Token yok, atlanıyor`);
        continue;
      }
      const fcmToken = tokenDoc.data().token;
      if (!fcmToken) {
        console.log(`[${userId}] Token boş, atlanıyor`);
        continue;
      }
      
      console.log(`[${userId}] ${veriler.length} içerik kontrol ediliyor`);
      
      for (const item of veriler) {
        // Sadece İzleniyor veya İzlendi durumundaki diziler
        if ((item.durum === 'İzleniyor' || item.durum === 'İzlendi') && item.tur === 'Dizi') {
          console.log(`[${userId}] Dizi kontrol: ${item.isim}`);
          
          let tvId = item.tvId || null;
          
          // tvId yoksa, tmdbId varsa TMDB'den isim alıp TVMaze'de ara
          if (!tvId && item.tmdbId) {
            console.log(`[${userId}] ${item.isim}: tmdbId var, TVMaze ID aranıyor...`);
            tvId = await tmdbIdToTvMazeId(item.tmdbId);
          }
          
          // Hâlâ tvId yoksa, doğrudan isimle TVMaze'de ara
          if (!tvId && item.isim) {
            console.log(`[${userId}] ${item.isim}: İsimle TVMaze'de aranıyor...`);
            tvId = await isimleTvMazeAra(item.isim);
          }
          
          if (tvId) {
            console.log(`[${userId}] ${item.isim}: tvId=${tvId}, bölüm kontrolü yapılıyor`);
            const sonuc = await checkDizi(userId, { ...item, tvId }, fcmToken, simdi);
            if (sonuc.sent) gonderilen++;
            if (sonuc.error) hatali++;
          } else {
            console.log(`[${userId}] ${item.isim}: TVMaze ID bulunamadı, atlanıyor`);
          }
        }
        
        // Film kontrolü (sadece İzlendi)
        if (item.durum === 'İzlendi' && item.tmdbId) {
          console.log(`[${userId}] Film kontrol: ${item.isim}`);
          const sonuc = await checkFilm(userId, item, fcmToken, simdi);
          if (sonuc.sent) gonderilen++;
          if (sonuc.error) hatali++;
        }
      }
    }
    
    console.log(`Toplam: ${gonderilen} bildirim gönderildi, ${hatali} hata`);
    res.status(200).json({ success: true, checkedAt: simdi.toISOString(), sent: gonderilen, errors: hatali });
  } catch (e) {
    console.error('[FATAL]', e);
    res.status(500).json({ error: e.message });
  }
};

async function isimleTvMazeAra(isim) {
  try {
    const res = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(isim)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.id || null;
  } catch (e) {
    console.log('İsimle TVMaze arama hatası:', e.message);
    return null;
  }
}

async function tmdbIdToTvMazeId(tmdbId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=tr-TR`);
    if (!res.ok) return null;
    const data = await res.json();
    const isim = data.name;
    if (!isim) return null;
    return await isimleTvMazeAra(isim);
  } catch (e) {
    console.log('TMDB→TVMaze dönüşüm hatası:', e.message);
    return null;
  }
}

async function checkDizi(userId, item, fcmToken, simdi) {
  try {
    const res = await fetch(`https://api.tvmaze.com/shows/${item.tvId}?embed=nextepisode`);
    if (!res.ok) {
      console.log(`[${userId}] TVMaze hata ${res.status} for ${item.isim}`);
      return { sent: false };
    }
    const data = await res.json();
    
    const nextEp = data._embedded?.nextepisode;
    if (!nextEp || !nextEp.airstamp) {
      console.log(`[${userId}] ${item.isim}: Yakın bölüm yok`);
      return { sent: false };
    }
    
    const airDate = new Date(nextEp.airstamp);
    const fark = (airDate - simdi) / (1000 * 60 * 60 * 24);
    console.log(`[${userId}] ${item.isim}: Sonraki bölüm ${fark.toFixed(1)} gün sonra (${airDate.toISOString()})`);
    
    if (fark <= 7 && fark >= -1) {
      const bildirimId = `dizi_${item.tvId}_${nextEp.id}`;
      const gecmis = await db.collection('bildirimGecmisi').doc(userId).get();
      if (gecmis.exists && gecmis.data()[bildirimId]) {
        console.log(`[${userId}] ${item.isim}: Bildirim daha önce gönderilmiş`);
        return { sent: false };
      }
      
      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: `📺 ${item.isim}`,
            body: `Yeni bölüm (${nextEp.season}x${nextEp.number}) ${airDate.toLocaleDateString('tr-TR')}'de!`
          }
        });
        console.log(`[${userId}] ${item.isim}: BİLDİRİM GÖNDERİLDİ`);
        
        await db.collection('bildirimGecmisi').doc(userId).set({ [bildirimId]: true }, { merge: true });
        return { sent: true };
      } catch (sendErr) {
        console.error(`[${userId}] ${item.isim}: FCM hata -`, sendErr.code, sendErr.message);
        // Geçersiz token'ı sil
        if (sendErr.code === 'messaging/registration-token-not-registered') {
          console.log(`[${userId}] Geçersiz token siliniyor`);
          await db.collection('fcmTokens').doc(userId).delete();
        }
        return { sent: false, error: true };
      }
    }
    return { sent: false };
  } catch (e) {
    console.error(`[${userId}] ${item.isim}: Genel hata -`, e.message);
    return { sent: false, error: true };
  }
}

async function checkFilm(userId, item, fcmToken, simdi) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${item.tmdbId}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return { sent: false };
    const data = await res.json();
    
    const collectionId = data.belongs_to_collection?.id;
    if (!collectionId) return { sent: false };
    
    const colRes = await fetch(`https://api.themoviedb.org/3/collection/${collectionId}?api_key=${TMDB_API_KEY}&language=tr-TR`);
    if (!colRes.ok) return { sent: false };
    const colData = await colRes.json();
    
    for (const film of colData.parts || []) {
      if (film.id === item.tmdbId) continue;
      
      const releaseDate = film.release_date ? new Date(film.release_date) : null;
      if (!releaseDate) continue;
      
      const fark = (releaseDate - simdi) / (1000 * 60 * 60 * 24);
      
      if (fark <= 30 && fark >= -1) {
        const bildirimId = `film_${item.tmdbId}_${film.id}`;
        const gecmis = await db.collection('bildirimGecmisi').doc(userId).get();
        if (gecmis.exists && gecmis.data()[bildirimId]) continue;
        
        try {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: `🎬 ${item.isim}`,
              body: `Devam filmi "${film.title}" ${releaseDate.getFullYear()}'de geliyor!`
            }
          });
          await db.collection('bildirimGecmisi').doc(userId).set({ [bildirimId]: true }, { merge: true });
          return { sent: true };
        } catch (sendErr) {
          console.error(`[${userId}] ${item.isim}: FCM hata -`, sendErr.code, sendErr.message);
          if (sendErr.code === 'messaging/registration-token-not-registered') {
            console.log(`[${userId}] Geçersiz token siliniyor`);
            await db.collection('fcmTokens').doc(userId).delete();
          }
          return { sent: false, error: true };
        }
      }
    }
    return { sent: false };
  } catch (e) {
    return { sent: false, error: true };
  }
}
