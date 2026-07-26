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
    
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const veriler = userData.veriler || [];
      
      const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
      if (!tokenDoc.exists) continue;
      const fcmToken = tokenDoc.data().token;
      if (!fcmToken) continue;
      
      for (const item of veriler) {
        // Dizi: hem İzleniyor hem İzlendi yapılanlar
        if ((item.durum === 'İzleniyor' || item.durum === 'İzlendi') && item.tvId) {
          await checkDizi(userId, item, fcmToken, simdi);
        }
        // Film: sadece İzlendi yapılanlar
        if (item.durum === 'İzlendi' && item.tmdbId) {
          await checkFilm(userId, item, fcmToken, simdi);
        }
      }
    }
    
    res.status(200).json({ success: true, checkedAt: simdi.toISOString() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

async function checkDizi(userId, item, fcmToken, simdi) {
  try {
    const res = await fetch(`https://api.tvmaze.com/shows/${item.tvId}?embed=nextepisode`);
    if (!res.ok) return;
    const data = await res.json();
    
    const nextEp = data._embedded?.nextepisode;
    if (!nextEp || !nextEp.airstamp) return;
    
    const airDate = new Date(nextEp.airstamp);
    const fark = (airDate - simdi) / (1000 * 60 * 60 * 24);
    
    if (fark <= 7 && fark >= -1) {
      const bildirimId = `dizi_${item.tvId}_${nextEp.id}`;
      const gecmis = await db.collection('bildirimGecmisi').doc(userId).get();
      if (gecmis.exists && gecmis.data()[bildirimId]) return;
      
      await sendNotification(fcmToken, {
        title: `📺 ${item.isim}`,
        body: `Yeni bölüm (${nextEp.season}x${nextEp.number}) ${airDate.toLocaleDateString('tr-TR')}'de!`
      });
      
      await db.collection('bildirimGecmisi').doc(userId).set({ [bildirimId]: true }, { merge: true });
    }
  } catch (e) {}
}

async function checkFilm(userId, item, fcmToken, simdi) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${item.tmdbId}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return;
    const data = await res.json();
    
    const collectionId = data.belongs_to_collection?.id;
    if (!collectionId) return;
    
    const colRes = await fetch(`https://api.themoviedb.org/3/collection/${collectionId}?api_key=${TMDB_API_KEY}&language=tr-TR`);
    if (!colRes.ok) return;
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
        
        await sendNotification(fcmToken, {
          title: `🎬 ${item.isim}`,
          body: `Devam filmi "${film.title}" ${releaseDate.getFullYear()}'de geliyor!`
        });
        
        await db.collection('bildirimGecmisi').doc(userId).set({ [bildirimId]: true }, { merge: true });
      }
    }
  } catch (e) {}
}

async function sendNotification(token, payload) {
  await admin.messaging().send({
    token,
    notification: {
      title: payload.title,
      body: payload.body
    }
  });
}
