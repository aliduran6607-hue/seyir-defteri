# ☁️ Seyir Defteri — Bulut Senkron Kurulum Rehberi

Bu rehberi takip ederek **ücretsiz** bir Firebase hesabı oluşturup, uygulamana gerçek bulut senkronu ekleyebilirsin. Toplam süre: ~5 dakika. Kredi kartı gerekmez.

---

## 1. Firebase Projesi Oluştur

1. [console.firebase.google.com](https://console.firebase.google.com) adresine git, Google hesabınla giriş yap.
2. **"Proje ekle" / "Add project"** butonuna bas.
3. Proje adı gir (örn. `seyir-defterim`), **İleri**'ye bas.
4. Google Analytics sorulursa **kapatabilirsin** (gerekli değil), **Proje oluştur**'a bas.
5. Proje hazır olunca **Devam**'a bas, ana panele gireceksin.

---

## 2. E-posta/Şifre Girişini Aç

1. Sol menüden **Build → Authentication**'a git.
2. **Get started** butonuna bas.
3. **Sign-in method** sekmesinde **Email/Password**'u seç, aç (Enable), **Save**.

---

## 3. Veritabanını (Firestore) Oluştur

1. Sol menüden **Build → Firestore Database**'e git.
2. **Create database**'e bas.
3. Konum olarak sana yakın bir bölge seç (örn. `eur3 (europe-west)`), **Next**.
4. **"Start in test mode"** seçeneğini işaretle (şimdilik en kolayı), **Create**.

> ⚠️ Test modu 30 gün sonra otomatik kapanır ve herkese açık hale gelebilir. Kalıcı kullanım için Adım 6'daki güvenlik kurallarını mutlaka ekle.

---

## 4. Uygulama Ayarlarını (Config) Al

1. Sol üstteki ⚙️ **Project settings**'e git.
2. Aşağı kaydır, **"Your apps"** bölümünde **`</>`** (Web) simgesine bas.
3. Bir takma ad gir (örn. `seyir-defteri-web`), **Register app**.
4. Karşına çıkan `firebaseConfig` kod bloğunu bul — şuna benzer:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "seyir-defterim-xxxxx.firebaseapp.com",
  projectId: "seyir-defterim-xxxxx",
  storageBucket: "seyir-defterim-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

5. **Bu bloğu kopyala.**

---

## 5. Kodu Uygulamaya Yapıştır

1. `index.html` dosyasını bir metin editörüyle aç (Not Defteri de olur).
2. İçinde şunu ara (Ctrl+F ile):
   ```
   const firebaseConfig = {
   ```
3. Bulduğun bu bloğu, Adım 4'te kopyaladığın **kendi** bilgilerinle değiştir.
4. Dosyayı kaydet.

---

## 6. Güvenlik Kurallarını Ayarla (Önemli!)

Test modu herkesin herkesin verisini görmesine izin verir. Bunu düzeltmek için:

1. Firebase konsolunda **Firestore Database → Rules** sekmesine git.
2. Aşağıdaki kuralı yapıştır:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /koleksiyonlar/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. **Publish**'e bas.

Bu kural, herkesin **sadece kendi** verisini okuyup yazabilmesini sağlar.

---

## 7. Netlify'a Yeniden Yükle

Daha önce yaptığın gibi güncellenmiş `index.html` (ve diğer dosyaları) [app.netlify.com/drop](https://app.netlify.com/drop) adresine sürükle-bırak yap. Aynı linki güncelleyebilir ya da yeni link alabilirsin.

---

## ✅ Test Et

1. Uygulamayı aç, sağ üstteki **"☁️ Hesapsız"** butonuna bas.
2. **Kayıt Ol**'a geç, bir e-posta + şifre gir.
3. Birkaç dizi ekle.
4. Başka bir cihazdan (veya tarayıcıdan) aynı linke gir, aynı hesapla giriş yap — verilerin orada da görünmeli! 🎉

---

## Sorun mu yaşıyorsun?

- **"Bulut senkronu henüz kurulmadı" mesajı çıkıyor** → `firebaseConfig` içindeki değerleri değiştirmeyi unutmuşsundur, Adım 5'i tekrar kontrol et.
- **Giriş yapamıyorum** → Adım 2'de Email/Password girişini açtığından emin ol.
- **Veriler görünmüyor** → Adım 6'daki kuralları `Publish` etmeyi unutmuş olabilirsin.
