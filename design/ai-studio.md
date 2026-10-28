# Google AI Studio

**Uygulama linki:** https://ai.studio/apps/bf322592-890d-4264-8433-892593ab45b4?fullscreenApplet=true (linki olan herkes açabilir, varsayılan olarak tam ekran)

## Nasıl kuruldu

1. **İçe aktarma.** Test edilmiş repo, AI Studio **Build** → *Upload Files* ile zip olarak yüklendi ve “dosyaları değiştirmeden al” talimatı verildi. Dışa aktarılan projeyle repo karşılaştırıldı: arayüz ve oyun dosyalarının hepsi birebir aynıydı.
2. **AI Studio'nun yakaladığı sorun.** Önizlemede tutor'a ilk mesaj gönderildiğinde AI Studio şu hatayı verdi: `PROXY_GENERATION_DISABLED: generateContent is not supported`. AI Studio, tarayıcıdan `process.env.API_KEY` ile Gemini çağırmayı (eski yapılandırma) artık desteklemiyor. Oyun bozulmadı, tutor çevrimdışı moda geçti. Spec'teki yedek davranış gerçek bir arızada işini yaptı.
3. **Sunucuya taşıma.** AI Studio'nun “Update app” önerisiyle Gemini çağrısı sunucuya (`server.ts`, Express) taşındı. Böylece API anahtarı tarayıcıya hiç inmiyor.
4. **İnceleme ve sadeleştirme.** AI Studio'nun ürettiği sunucu kodu okundu. Üç sorun düzeltildi ve dosyalar AI Studio'ya geri yüklendi:
   - Kullanılmayan SSE akış uç noktası ve sesli Gemini Live WebSocket'i kaldırıldı. Uygulama bunları çağırmıyordu, ama herkese açık bir sunucuda ücretli modele açık kapı bırakıyorlardı.
   - Sistem talimatı artık yalnızca sunucudaki karar listesinden kuruluyor. Önceden tanınmayan bir karar gelirse istemcinin gönderdiği nesne kullanılıyordu, bu da prompt enjeksiyonuna açıktı.
   - Mesaj uzunluğu (400), geçmiş (20 mesaj), profil ve seçim doğrulaması eklendi. Sızıntı koruması sunucuya alındı ve ham model yanıtı istemciye gönderilmiyor.
   - Bu değişiklikler 2 yeni Cypress testiyle (sunucu yanıtı, 502 → çevrimdışı yedek) ve `curl` ile (geçersiz istek → 400) doğrulandı.
5. **Paylaşım.** Share → *Public: Anyone with the link can view*, *Default to fullscreen* açık, *Gemini chat history* kapalı.

> “Publish” (Cloud Run) kullanılmadı: Google Cloud faturalandırma hesabı istiyor. Ödevin istediği “AI Studio linki” Share ile ücretsiz sağlanıyor.

## Yeniden kurmak için

AI Studio Build → *Upload Files* → repodaki uygulama dosyalarını (`index.html`, `index.tsx`, `index.css`, `App.tsx`, `types.ts`, `metadata.json`, `package.json`, `tsconfig.json`, `vite.config.ts`, `server.ts`, `game/`, `services/`, `components/`) zip'leyip yükle ve “dosyaları değiştirmeden al” de. Anahtar AI Studio tarafından sunucuya `GEMINI_API_KEY` olarak verilir.

## Ödevdeki akışla üretmek (Stitch ekranları + spec)

Ödevin 3. adımındaki “ekranları gönder, spec'i ver” akışını göstermek için kullanılabilecek prompt:

```
Ekteki 3 Stitch ekranını (giriş, sahne, son) ve spec.md'yi kullanarak mobil öncelikli bir React + TypeScript uygulaması yap.
- Spec'teki durum makinesine birebir uy: intro → 3 profil sorusu → 3 karar (her birinden sonra "Ne oldu?" / "Neden oldu?") → Son A ya da Son B.
- Karar tablosundaki metinleri, dakikaları ve 08:00'den başlayan saati aynen kullan. Son, Karar 3'e göre belirlenir.
- Kişiselleştirme: "Yeni başladım" her kararda ipucu kartı görür; "Deneyimliyim" 60 sn sayaçla karar verir, süre dolarsa B uygulanır ve "Süre doldu" yazılır.
- AI tutor sunucu tarafında Gemini ile çalışsın, sistem talimatı spec §4.4'teki 6 kurala uysun: cevabı asla söylemesin, tahmini onaylamasın, soruyla bitirsin.
- Her etkileşimli öğeye spec'te geçen data-cy adlarını ver.
- Tasarımda DESIGN.md'deki renk belirteçlerini kullan.
```
