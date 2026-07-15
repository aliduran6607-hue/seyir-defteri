# 🎬 TMDB Film Desteği — Kurulum Rehberi

TMDB (The Movie Database) ücretsiz API'si ile uygulamana **gerçek film arama ve poster desteği** ekleyebilirsin. Süre: ~3 dakika.

---

## 1. Hesap Oluştur

1. [themoviedb.org](https://www.themoviedb.org/signup) adresine git, ücretsiz hesap oluştur.
2. E-postanı doğrula.

## 2. API Anahtarı Al

1. Giriş yaptıktan sonra [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) adresine git.
2. **"Request an API Key"** butonuna bas.
3. **"Developer"** seçeneğini seç.
4. Kısa bir form çıkacak (uygulama adı: "Seyir Defteri", kullanım amacı: "Personal watchlist app" gibi yazabilirsin). Onaylayınca anahtar hemen verilir — inceleme/onay beklemek gerekmez.
5. Karşına çıkan **"API Key (v3 auth)"** değerini kopyala (uzun bir harf-rakam dizisi).

## 3. Koda Yapıştır

1. `index.html` dosyasını bir metin editörüyle aç.
2. Şunu ara (Ctrl+F):
   ```
   const tmdbApiKey = "SENIN_TMDB_ANAHTARIN";
   ```
3. `"SENIN_TMDB_ANAHTARIN"` yazan kısmı kendi API anahtarınla değiştir:
   ```javascript
   const tmdbApiKey = "buraya_kendi_anahtarin";
   ```
4. Kaydet.

## 4. Netlify'a Yeniden Yükle

Güncellenmiş dosyayı her zamanki gibi [app.netlify.com/drop](https://app.netlify.com/drop) adresine sürükle-bırak yap.

---

## ✅ Test Et

Arama kutusuna bir film adı yaz (örn. "Inception"). Sonuçlarda 🎬 rozeti ile film çıkmalı, 📺 rozetiyle diziler çıkmalı. Eklediğinde koleksiyonunda otomatik olarak "Film" kategorisinde görünür.

## Notlar

- TMDB anahtarını girmezsen uygulama sorunsuz çalışmaya devam eder — sadece dizi araması (TVMaze) aktif kalır.
- TMDB ücretsiz katmanı kişisel kullanım için sınırsız denecek kadar geniştir, ekstra bir maliyet çıkmaz.
