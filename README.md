# SE Primer v2 · Davranıştan öğrenen uyum

> Yazılım mühendisi adayı için telefonda oynanan bir oyun-kitap: **“08:00, randevu sistemi çöktü. Nöbetçi sensin.”**
> v1'de uyum sabit kurallara dayanıyordu. v2'de oyuncunun **davranışından** öğrenen küçük, göreve özel bir model, oyuncunun riskli yolu seçmek üzere olduğunu sezince onu bir kez durduruyor.

YZM301 · 2. ödev (The Primer v2) · v1: [docs/v1-README.md](docs/v1-README.md) (git etiketi `v1.0`)

## Linkler

| | |
|---|---|
| 📱 **Canlı uygulama** (giriş gerekmez) | https://abdulkadirelaldi.github.io/se-primer/ · model laboratuvarı: [`?lab=1`](https://abdulkadirelaldi.github.io/se-primer/?lab=1) |
| 🤗 **Hugging Face modeli** (commit'e sabit) | bkz. [RELEASE.md › Yayın kaydı](RELEASE.md#yayın-kaydı-v200) · [`model/YAYIN.json`](model/YAYIN.json) |
| 🎬 **Demo video** (aynı sahne, iki oyuncu, iki karar) | [demo/se-primer-v2-demo.mp4](demo/se-primer-v2-demo.mp4) |
| 📦 **Repo** | https://github.com/abdulkadirelaldi/se-primer |

## Kurulum (3 komut)

```bash
npm install          # uygulama, Cypress, onnxruntime-web/-node
npm run py:kur       # Python 3.12 ortamı (uv): sklearn, skl2onnx, onnxruntime — sürümler sabit
npm run dev          # http://localhost:3000 · Express + Vite
```

| Komut | Ne yapar |
|---|---|
| `npm run veri` | `data/oturumlar.csv`'yi üretir: sentetik (tohum 42) + `data/gercek/*.csv` |
| `npm run egit` | **`train.py`** · eğit → ölç → eval kapısı → `model/` (eşik altıysa çıkış kodu 1, `model/` değişmez) |
| `npm run test:model` | KÖ-6 (kapı + tekrarlanabilirlik) ve test kahini paritesi (Python) |
| `npm run test:e2e` | Cypress: v1 regresyon (25) + model (6) + sunucu (2) |
| `.venv/bin/python yayinla.py` | Hugging Face'e yükle → etiketle → commit'e sabitli URL'den doğrula → tüketicileri sabitle |

## Ne yaptık: altı adım

| Adım | Ne | Nerede |
|---|---|---|
| **1 · Spec** | Model gereksinimi, eval metriği ve kabul eşiği (ROC-AUC ≥ 0,75, dengeli doğruluk ≥ 0,70, ONNX farkı ≤ 1e-4, ≥ 15 gerçek oturum), 3 yeni kabul örneği (KÖ-6/7/8). Eşikler **eğitimden önce** ayrı bir commit'te yazıldı (`9416295`). | [spec.md §8–12](spec.md#v2--davranıştan-öğrenen-uyum-kötü-sona-gitme-riski-modeli) |
| **2 · Veri** | Her karar bir satır. Gerçek oturumlar uygulamanın **Veri Toplama Modu** ile (`?veri=1`, kişisel veri yok), sentetik oturumlar tohumlu üreticiyle. `kaynak` sütunu zorunlu. | [data/oturumlar.csv](data/oturumlar.csv) · [data/SOZLUK.md](data/SOZLUK.md) · [data/hazirla.py](data/hazirla.py) |
| **3 · Eğit ve ölç** | `train.py` tek komut, `random_state=42`, katılımcıya göre gruplu ayırma. Metrikleri `config.json`'a yazar, eşik altında durur. İki koşuda ve Linux CI'da birebir aynı metrik. | [train.py](train.py) · [tests/test_egitim.py](tests/test_egitim.py) |
| **4 · Paketle** | `model.onnx` (573 bayt) + sözleşme `config.json` (özellik sırası, sınıflar, eşik, metrikler, veri sha256, sürümler) + model kartı | [model/](model/) |
| **5 · Yayınla** | Hugging Face public repo, commit'e sabitli URL, `RELEASE.md`: rollback, gölge/kanarya/aşamalı geçiş, ödünleşim matrisi | [RELEASE.md](RELEASE.md) · [yayinla.py](yayinla.py) |
| **6 · Tüket ve test et** | Tarayıcıda `onnxruntime-web` ile çıkarım; model kararı oyunu değiştiriyor. Diferansiyel test: tarayıcı ve sunucu, Python test kahiniyle 5 girdide < 1e-4. v1 E2E testleri değişmeden geçiyor. | [services/riskModel.ts](services/riskModel.ts) · [tests/parite.py](tests/parite.py) · [tests/parite.json](tests/parite.json) · [cypress/e2e/](cypress/e2e/) |
| **7 · Sınav tasarımı** | Öğrenciye uyumlanan, gerekçe ölçen 1 sayfalık vize sorusu | [SINAV_TASARIMI.md](SINAV_TASARIMI.md) |

## Model: “Kötü sona gitme riski”

**Soru:** Bu oyuncu, bu sahnede riskli seçeneği (test etmeden yayına almak, ham logu paylaşmak) seçecek mi?

**Neden bu hedef?** Başlangıç reposundaki “ipucu gerekiyor mu?” örneğini kopyalamak yerine, bir yazılım mühendisi adayı için en pahalı refleksi hedefledik: baskı altında “hızlı ama riskli” yolu seçmek. Netflix ve TikTok gibi uyarlamalı sistemler gibi model de içeriği değil, oyuncunun **ritmini** okuyor: ne kadar düşündü, geri bildirimi ne kadar okudu, tutor'a danıştı mı, kaçıncı kez oynuyor.

| Girdi (sıra = sözleşme) | Neden |
|---|---|
| `sahne_no`, `seviye` | Bağlam ve oyuncunun beyanı |
| `onceki_oyun_sayisi` | Tekrar oynadıkça öğrenme |
| `onceki_riskli_sayisi` | Oturum içindeki eğilim |
| `onceki_karar_suresi_sn` | Acele ya da tereddüt |
| `onceki_okuma_suresi_sn` | “Ne oldu / Neden oldu”yu okudu mu, geçti mi? |
| `tutor_mesaj_sayisi` | Yardım arama davranışı (içerik değil, sayı) |

**Oyun nasıl değişiyor?** Karar 2 ve 3 açılırken `p ≥ 0,5` ise seçeneklerden önce **“🧭 Dur ve düşün”** kartı açılıyor ve o kararın Sokratik sorusunu soruyor. Oyuncu engellenmiyor. Model yüklenemezse oyun v1 gibi sürüyor.

**Soğuk başlangıç (dürüst bir başarısızlık):** İlk eğitim (Karar 1–3) eval kapısında **reddedildi** (AUC 0,711 < 0,75). Analiz, Karar 1'de modelin yazı-tura düzeyinde (AUC 0,574) kaldığını gösterdi: oyuncu henüz hiç davranış göstermemişti. Eşiği düşürmek ya da veriyi değiştirmek yerine model yalnız oyuncu gözlendikten sonra (Karar 2–3) çalışacak şekilde sınırlandı. Bkz. [spec.md › Revizyon 1](spec.md).

**Metrikler ve sınırlar:** [model/README.md](model/README.md) (model kartı).

## Sentetik veri: üretici kuralı ve tohum

`data/hazirla.py`, **tohum 42**, 120 sanal katılımcı, katılımcı başına 1–5 oyun. Her katılımcının gizli bir “acelecilik” eğilimi vardır, `a ~ N(0, 1)`:

```
karar_suresi_sn = clip(exp(N(2.7 − 0.45a + 0.15·seviye, 0.35)), 1, 60)    # deneyimlide 60 = süre doldu → B
okuma_suresi_sn = clip(exp(N(2.4 − 0.55a, 0.40)), 0.5, 90)
tutor mesajı    ~ Poisson(max(0.05, 0.55 − 0.30a + 0.35·[seviye=0]))
logit P(B)      = −0.55 + 0.95a + 0.20·seviye − 0.50·oyun_no + 0.45·önceki_riskli + 0.35·[sahne=2] − 0.25·[sahne=3]
```

Model `a`'yı göremez, yalnızca davranışa yansıyan izlerini görür. Bu kural modelin öğreneceği ilişkiyi baştan belirlediği için sentetik veride iyi bir skor, gerçek oyuncular için kanıt değildir. Bu yüzden gerçek veri ayrı raporlanır.

## Testler ↔ kabul örnekleri

| Kabul örneği | Test | Ortam |
|---|---|---|
| KÖ-1…KÖ-5 (v1) | `paths`, `personalization`, `tutor` · **25 test, değiştirilmeden regresyon olarak** | Cypress |
| **KÖ-6** Eval kapısı, tekrarlanabilirlik | `tests/test_egitim.py` | Python (yerel + Linux CI) |
| **KÖ-7** İki oyuncu, iki karar; model yoksa v1 | `model.cy.ts` (cy.clock ile süreler kesin) | Cypress |
| **KÖ-8** Diferansiyel test < 1e-4 | `model.cy.ts` (tarayıcı) · `sunucu.cy.ts` (sunucu) · `tests/parite.py` (kahin, `--url` ile HF) | Cypress + Python |
| Veri Toplama Modu, gölge, KVKK | `model.cy.ts` | Cypress |

Hepsi her push'ta [CI](.github/workflows/ci.yml)'da koşar. Canlı site de aynı testlerle doğrulandı (`--config baseUrl=https://abdulkadirelaldi.github.io/se-primer`).

## Proje yapısı

```
├── spec.md · RELEASE.md · SINAV_TASARIMI.md · DESIGN.md
├── data/        oturumlar.csv · SOZLUK.md · hazirla.py · gercek/*.csv (Veri Toplama Modu çıktıları)
├── train.py     eğitim + eval kapısı + ONNX + config + model kartı
├── model/       model.onnx · config.json (sözleşme) · README.md (model kartı) · YAYIN.json
├── yayinla.py   Hugging Face yayını ve commit sabitleme
├── tests/       parite.py (test kahini) · parite.json · test_egitim.py
├── cypress/e2e/ paths · personalization · tutor (v1) · model · sunucu · demo-v2
├── services/    riskModel.ts (tarayıcı) · riskModel.server.ts (sunucu) · tutor*.ts
├── game/        story.ts · machine.ts · telemetry.ts (davranış ölçümü) · veri.ts (yerel kayıt)
├── server.ts    Express: /api/tutor, /api/risk
└── render.yaml  sunucu tüketicisini Render.com'a tek tıkla kurmak için
```

## Yapay zekâ araçlarının kullanımı (beyan)

- **Claude Code (Anthropic):** Kodun ve belgelerin büyük kısmını yazdı. Ödevi parçalara ayırdım, model hedefini (“kötü sona gitme riski”) ve eşikleri birlikte belirledik, her adımın çıktısını test ve ölçümle doğruladık.
- **Ajanın yanlışlarının yakalanıp düzeltildiği yerler:**
  - İlk model eval kapısından geçemedi. Eşiği düşürmek yerine soğuk başlangıç teşhisiyle kapsam daraltıldı.
  - Çok ortamlı CI'da ONNX farkının CPU'ya göre değiştiği görüldü; tekrarlanabilirlik testi buna göre düzeltildi.
  - `RELEASE.md`'de kanarya mekanizmasının “test edildiği” yazıyordu; test olmadığı için bu iddia çıkarıldı.
- **Google AI Studio (Gemini):** v1'de tutor'un sunucuya taşınması ve 20 mesajlık tutor eval'inin koşturulması. Gemini'nin eklediği kullanılmayan Live API ve doğrulamasız uç nokta incelenip kaldırıldı.
- **Google Stitch:** v1'in 3 mobil ekranı (`design/stitch/`).
- **Fikir kaynakları:** ONNX sözleşmesi, `onnx_aktar` eşdeğerlik kontrolü ve tüketici örüntüleri `seyyah/huggingface-hello-web`'den uyarlandı. Mimari tartışma kaynakları: [RELEASE.md › Kaynaklar](RELEASE.md#kaynaklar).
