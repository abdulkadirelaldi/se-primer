# Google AI Studio'ya yükleme

Bu repo, AI Studio **Build** uygulamalarının dosya düzenini birebir kullanır (`index.html` + importmap, `index.tsx`, `App.tsx`, `metadata.json`). Bu yüzden kod AI Studio'da değişiklik yapılmadan çalışır. Anahtar AI Studio tarafından `process.env.API_KEY` olarak sağlanır.

## Yol 1 · Kodu yükle (önerilen: test edilen kodun aynısı yayına çıkar)

1. [aistudio.google.com](https://aistudio.google.com) → **Build** → yeni boş uygulama.
2. Kod düzenleyicide (Code sekmesi) şu dosyaları repodaki içerikle oluştur veya değiştir. Klasör yapısı aynı kalmalı:
   `index.html`, `index.tsx`, `index.css`, `App.tsx`, `types.ts`, `metadata.json`,
   `game/story.ts`, `game/machine.ts`, `services/tutor.ts`,
   `components/IntroScreen.tsx`, `components/ProfileScreen.tsx`, `components/SceneScreen.tsx`,
   `components/FeedbackCard.tsx`, `components/TutorPanel.tsx`, `components/Countdown.tsx`, `components/EndingScreen.tsx`
3. Önizlemede tutor panelinin alt yazısı **“Gemini”** göstermeli. “çevrimdışı mod” görünüyorsa anahtar bağlanmamıştır, ama oyun yine de çalışır.
4. **Share / Deploy** → uygulama linkini al. Telefonda aç ve baştan sona bir kez oyna.
5. Linki README'deki “Linkler” tablosuna yapıştır.

## Yol 2 · Ödevdeki akışla üret (Stitch ekranları + spec)

Ödevin 3. adımı “ekranları gönder, spec'i ver, uygulamayı çalıştır” der. Bu akışı belgelemek için AI Studio Build'e şu mesajı yaz ve `design/stitch/*.png` dosyalarını ile `spec.md` dosyasını ekle:

```
Ekteki 3 Stitch ekranını (giriş, sahne, son) ve spec.md'yi kullanarak mobil öncelikli bir React + TypeScript uygulaması yap.
- Spec'teki durum makinesine birebir uy: intro → 3 profil sorusu → 3 karar (her birinden sonra "Ne oldu?" / "Neden oldu?") → Son A ya da Son B.
- Karar tablosundaki metinleri, dakikaları ve 08:00'den başlayan saati aynen kullan. Son, Karar 3'e göre belirlenir.
- Kişiselleştirme: "Yeni başladım" her kararda ipucu kartı görür; "Deneyimliyim" 60 sn sayaçla karar verir, süre dolarsa B uygulanır ve "Süre doldu" yazılır.
- AI tutor @google/genai ile çalışsın, sistem talimatı spec §4.4'teki 6 kurala uysun: cevabı asla söylemesin, tahmini onaylamasın, soruyla bitirsin.
- Her etkileşimli öğeye spec'te geçen data-cy adlarını ver (start-btn, opt-level-beginner, choice-A, feedback, next-btn, ending-headline, tutor-input ...).
- Tasarımda DESIGN.md'deki renk belirteçlerini kullan.
```

Üretilen uygulama farklı çıkarsa, repodaki test edilmiş dosyaları (Yol 1) yükle. Cypress testleri bu repodaki koda karşı yazılmıştır.
