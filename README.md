# SE Primer

> Kişiye uyum sağlayan kitap, bu kez yazılım mühendisi için: oyuncu karar verir, uygulama o kararın **teknik sonucunu** gösterir.

**“08:00, randevu sistemi çöktü. Nöbetçi sensin.”** Telefonda 5 dakikada oynanan bir oyun-kitap. Girişte 3 soru (seviye, rol, hedef) sorulur ve anlatı bu cevaplara uyar. Oyuncu 3 karar verir (mimari, test, KVKK) ve her karardan sonra *ne olduğunu* ve *neden olduğunu* görür. Oyun 2 farklı sondan biriyle biter. Takılan oyuncu, cevabı söylemeyen ama doğru soruyu soran bir AI tutor'a danışabilir.

YZM301 · 1 haftalık ödev · Google Stitch → Google AI Studio → Cypress

## Linkler

| | |
|---|---|
| 📱 Uygulama (AI Studio) | **https://ai.studio/apps/bf322592-890d-4264-8433-892593ab45b4?fullscreenApplet=true** |
| 🎬 Demo video (60 sn, Cypress koşusu) | **https://github.com/abdulkadirelaldi/se-primer/blob/main/demo/se-primer-demo.mp4** |
| 📦 Repo | **https://github.com/abdulkadirelaldi/se-primer** |

## Teslimler

| Teslim | Kanıt | Dosya |
|---|---|---|
| **spec.md** (20) | Problem, kapsam dışı, 5 kabul örneği (KÖ-1…KÖ-5), akış şeması + durum makinesi | [spec.md](spec.md) |
| **Tasarım** (15) | Stitch ekranları (giriş, sahne, son) + tasarım sistemi | [DESIGN.md](DESIGN.md) · [design/stitch/](design/stitch/) · [design/stitch-prompts.md](design/stitch-prompts.md) · uygulama ekranları [design/app-screens/](design/app-screens/) |
| **Çalışan uygulama** (20) | AI Studio linki; telefonda baştan sona oynanır | Yukarıdaki link · [design/ai-studio.md](design/ai-studio.md) |
| **Tutor eval** (25) | 20 cevap × 2 motor (gerçek Gemini + çevrimdışı), elle etiket, hata türleri, oran + örnek sayısı. Gemini: **1/20 sızıntı** (örtük yönlendirme, kök nedeni bulunup düzeltildi) | [eval/EVAL.md](eval/EVAL.md) (yöntem + bulgular) · [eval/REPORT.md](eval/REPORT.md) (tüm tablolar) · [labels-gemini.csv](eval/labels-gemini.csv) · [labels-offline.csv](eval/labels-offline.csv) |
| **Cypress demo** (10) | 8 yolun hepsi E2E, 25 test; 60 sn demo video | [cypress/e2e/](cypress/e2e/) · [demo/se-primer-demo.mp4](demo/se-primer-demo.mp4) |
| **Ürün kararı** (10) | Yapılmayan 3 özellik ve nedenleri | Aşağıda ↓ |

## Ürün kararı: yapmadığım 3 özellik

1. **Kullanıcı hesabı ve ilerleme kaydı:** 5 dakikalık tek bölümlük bir oyunda hesap açtırmak, oyuncuyu ilk karardan önce kaybetmenin en hızlı yoludur, üstelik saklamamız ve korumamız gereken kişisel veri yaratır.
2. **Puan ve liderlik tablosu:** Sıralama oyuncuyu “doğru şıkkı bulup geçmeye” iter ve tutor'un asıl amacını, yani kararın *nedenini* düşündürmeyi baltalar.
3. **Serbest komut yazılan terminal simülasyonu:** Oyuncunun gerçekten `git revert` ya da `kubectl rollout undo` yazması etkileyici olurdu, ama serbest metnin sonsuz durum uzayında bir haftada 8 yolun hepsini test edilebilir ve öğretici tutmak mümkün olmazdı.

## Nasıl çalışır

| Seviye | Deneyim |
|---|---|
| Yeni başladım | Her kararda Sokratik ipucu kartı |
| Biraz deneyimim var | İpucu yok, tutor isteğe bağlı |
| Deneyimliyim | Her karar için 60 sn. Süre dolarsa varsayılan (riskli) seçenek uygulanır |

- **Rol** (Backend / QA / DevOps), brifingi ve her kararın sonundaki “X olarak:” dersini değiştirir.
- **Hedef** (Mimari / Test / KVKK), ilgili kararda 🎯 rozeti ve “Hedefin için derinleş” notunu açar.
- **Son**, KVKK kararıyla belirlenir: maskeleyen oyuncu **Son A · “08:25 sistem ayakta, veri güvende”**, ham logu paylaşan oyuncu **Son B · “… sistem ayakta ama KVKK ihlali”** ile karşılaşır. Bitiş saatini ilk iki karar belirler.
- **AI tutor** sunucu tarafında Gemini ile çalışır (`server.ts` → `POST /api/tutor`; anahtar tarayıcıya hiç inmez). Her yanıt, oyuncuya ulaşmadan önce sunucuda sızıntı dedektöründen geçer; ham model yanıtı istemciye gönderilmez. Anahtar yoksa ya da Gemini hata verirse kural tabanlı Sokratik tutor devreye girer ve etiket bunu açıkça söyler (“çevrimdışı mod”). Oyun hiçbir koşulda kırılmaz.

Ayrıntılı davranış, durum makinesi ve kabul örnekleri için [spec.md](spec.md).

## Yerelde çalıştırma

Gereksinim: Node.js 20+

```bash
npm install
cp .env.local.example .env.local   # isteğe bağlı: GEMINI_API_KEY=... (yoksa tutor çevrimdışı modda çalışır)
npm run dev                        # http://localhost:3000 (Express + Vite) · telefondan aynı ağdaki IP:3000 ile açılabilir
```

| Komut | Ne yapar |
|---|---|
| `npm run test:e2e` | Sunucuyu başlatır, 3 spec / 25 testi koşar (8 yol, kişiselleştirme, tutor) |
| `npm run demo:video` | Yavaş tempolu demo koşusunu kaydeder → `cypress/videos/demo.cy.ts.mp4` |
| `npm run eval` | 20 öğrenci mesajını tutor'a verir (`.env.local`'da anahtar varsa uygulamanın sunucu koduyla Gemini) → `eval/labels-<motor>.csv` |
| `npm run eval:report` | Elle doldurulmuş etiketlerden `eval/REPORT.md` üretir |
| `npm run typecheck` | Uygulama + Cypress tip kontrolü |
| `npm run build` | Üretim derlemesi |

Demo videosu, Cypress kaydının ffmpeg ile 60 saniyeye sığdırılmış hâlidir:

```bash
ffmpeg -i cypress/videos/demo.cy.ts.mp4 -filter:v "setpts=(59.5/SÜRE)*PTS,scale=1280:-2" -an -c:v libx264 -pix_fmt yuv420p demo/se-primer-demo.mp4
```

> **Not:** VS Code'un içinden başlatılan bazı süreçlerde `ELECTRON_RUN_AS_NODE=1` tanımlı olur ve Cypress `bad option: --no-sandbox` hatası verir. Çözüm: `unset ELECTRON_RUN_AS_NODE`.

## Testler ↔ kabul örnekleri

| Kabul örneği | Spec dosyası | Test sayısı |
|---|---|---:|
| KÖ-1 Yeni başlayan her kararda ipucu görür | `personalization.cy.ts` | 2 |
| KÖ-2 Deneyimli 60 sn süre baskısı, süre dolunca B | `personalization.cy.ts` | 1 |
| KÖ-3 Rol ve hedef anlatıyı değiştirir | `personalization.cy.ts` | 4 |
| KÖ-4 Her yol: ne oldu/neden oldu, 2 son | `paths.cy.ts` | 10 (8 yol + en iyi yol + tekrar oyna) |
| KÖ-5 Tutor cevabı vermez (+ sunucu yolu ve 502 yedeği) | `tutor.cy.ts` | 8 |

## Proje yapısı

```
├── spec.md                 # spesifikasyon
├── DESIGN.md               # tasarım sistemi (Stitch)
├── index.html · index.tsx · App.tsx · index.css · metadata.json   # AI Studio uygulama düzeni
├── types.ts
├── game/
│   ├── story.ts            # senaryo, kararlar, sonuçlar, ipuçları, kişiselleştirme metinleri
│   └── machine.ts          # durum makinesi (saf fonksiyon) + sonuç hesabı
├── server.ts               # Express: oyunu sunar + POST /api/tutor (doğrulama, Gemini, sızıntı koruması)
├── services/tutor.ts       # paylaşılan: çevrimdışı Sokratik tutor, sızıntı dedektörü, sistem talimatı, istemci
├── services/tutor.server.ts# sunucu: Gemini çağrısı (model yedekli), eval de bunu kullanır
├── components/             # Intro, Profile, Scene, Feedback, Tutor, Countdown, Ending
├── cypress/e2e/            # paths, personalization, tutor, demo, screens
├── eval/                   # students.json, run-eval.ts, report.ts, labels-*.csv, EVAL.md, REPORT.md
├── design/                 # Stitch prompt'ları, Stitch ekranları, uygulama ekranları, diyagramlar
└── demo/se-primer-demo.mp4
```

## Kaynakça

1. Stephenson, N. (1995). *The Diamond Age: Or, A Young Lady's Illustrated Primer.* Bantam Spectra.
2. Y Combinator (2026). Requests for Startups, Güz 2026: “The Primer”.
3. GitHub (2025). Spec Kit: spec-driven development.
4. Google Labs. Stitch · Google AI Studio.
5. Cypress. E2E testing, screenshots and videos.
6. OpenAI (2025). Introducing study mode (Sokratik tutor davranışı).
7. 6698 sayılı Kişisel Verilerin Korunması Kanunu (2016), md. 6 ve 12. KVK Kurulu'nun 2019/10 sayılı kararı (ihlalin 72 saat içinde bildirimi).
8. Sommerville, I. (2016). *Software Engineering* (10. baskı), Bölüm 5: durum makineleri.

Senaryodaki tüm kişi adları ve kimlik numaraları kurgudur.
