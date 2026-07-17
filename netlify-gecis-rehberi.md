# 🔒 Netlify'a Geçiş + TMDB Anahtarını Gizleme Rehberi

Bu rehber, siteyi GitHub Pages'ten Netlify'a taşıyıp TMDB anahtarını tarayıcıdan tamamen gizleyecek. Bilgisayardan yapman öneriliyor (Netlify hesabı + GitHub bağlantısı kurma adımı telefonda da mümkün ama bilgisayarda daha kolay).

---

## 1. Netlify Hesabı Aç ve GitHub'a Bağla

1. [app.netlify.com](https://app.netlify.com) adresine git.
2. **"Sign up"** → **"Sign up with GitHub"** seç (aynı GitHub hesabınla giriş yap, ayrı şifre uğraşı olmaz).
3. Netlify'ın GitHub hesabına erişim izni istemesini onayla.

## 2. Siteyi Netlify'a Bağla

1. Netlify panelinde **"Add new site" → "Import an existing project"**.
2. **"Deploy with GitHub"** seç.
3. `seyir-defteri` repo'nu listede bul ve seç.
4. Ayarlar ekranında hiçbir şeyi değiştirme (build command boş kalabilir, publish directory `.` olsun — `netlify.toml` zaten bunu otomatik ayarlıyor).
5. **"Deploy site"**'a bas.

Birkaç saniye içinde Netlify sana `https://rastgele-isim-12345.netlify.app` gibi bir link verecek. Siten artık hem GitHub Pages'te hem Netlify'da yayında olacak — ikisi de çalışır, ama bundan sonra **Netlify linkini** kullanacağız çünkü TMDB proxy'si sadece orada çalışır.

> 💡 İstersen Netlify panelinde **Site settings → Change site name** ile linki `seyir-defteri.netlify.app` gibi daha akılda kalır bir isme çevirebilirsin.

## 3. TMDB Anahtarını Netlify'a Gizlice Ekle

1. Netlify panelinde sitene tıkla → **Site configuration → Environment variables**.
2. **"Add a variable"** → **"Add a single variable"**.
3. Şunu gir:
   - **Key:** `TMDB_API_KEY`
   - **Value:** `29cf6a9ad69e74275dbd9279b1cf3013` (senin TMDB anahtarın)
4. **Save**.
5. Değişikliğin geçerli olması için: **Deploys** sekmesi → **Trigger deploy → Deploy site** (siteyi bu ayarla yeniden yayınlar).

Bu adımdan sonra anahtar **sadece Netlify'ın sunucusunda** duruyor, tarayıcıya hiç gönderilmiyor — sayfa kaynağına bakan biri artık göremez.

## 4. Test Et

1. Netlify linkini aç (`https://senin-siten.netlify.app`).
2. Arama yap, bir film ara — sonuçlar geliyorsa proxy çalışıyor demektir.
3. Tarayıcıda **sağ tık → "Sayfa kaynağını görüntüle"** yap, `Ctrl+F` ile "29cf6a" ara — **hiçbir sonuç çıkmamalı**. Çıkmıyorsa anahtar başarıyla gizlenmiş demektir.

---

## Bundan Sonra Nasıl Güncelleme Yapacağız?

Artık iki seçeneğin var:
- **Eskisi gibi:** Ben sana güncellenmiş dosyaları veririm, sen GitHub'a "Upload files" ile yüklersin. Netlify, GitHub'a bağlı olduğu için **otomatik olarak** yeni sürümü yayınlar — Netlify'a ayrıca bir şey yapmana gerek kalmaz.
- Yani iş akışın hiç değişmiyor, sadece kullandığın site linki değişiyor (GitHub Pages linki yerine Netlify linki).

## GitHub Pages'i Kapatmalı mıyım?

Zorunlu değil, ikisi paralel çalışabilir. Ama GitHub Pages sürümünde TMDB anahtarı hâlâ (yeni kodda artık kullanılmıyor ama) eski sürümlerde açıkta kalabilir. İstersen zamanla sadece Netlify linkini kullanmaya geçebiliriz.
