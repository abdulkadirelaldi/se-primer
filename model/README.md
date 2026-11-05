---
license: mit
library_name: onnx
tags: [tabular-classification, sklearn, onnx, education, se-primer]
language: [tr]
---

# SE Primer · Kötü sona gitme riski modeli (v2.0.0 · TASLAK)

Model kartı (Mitchell vd., 2019 yapısında). Kaynak kod ve veri: https://github.com/abdulkadirelaldi/se-primer

## Amaç
SE Primer, yazılım mühendisi adayları için telefonda oynanan bir oyun-kitap. Bu model her karar sahnesi açılırken
oyuncunun **o sahnede riskli seçeneği (B) seçme olasılığını** (`p`) önceki davranışından tahmin eder.
Yalnızca **Karar 2–3**'te çalışır: Karar 1'de oyuncu henüz gözlenmediği için tahmin yapılmaz (soğuk başlangıç).
`p ≥ 0.5` olduğunda oyun seçeneklerden önce bir “🧭 Dur ve düşün” Sokratik kartı gösterir.

## Kullanılmaması gereken durumlar
- Öğrenciyi **notlandırmak, sıralamak ya da yetkinlik ölçmek**: model bir eğilim tahmini yapar, bilgi ölçmez.
- Oyun dışındaki bir bağlamda (gerçek nöbet, işe alım, sınav) karar vermek.
- Bu 3 sahneden farklı bir senaryoya, yeniden eğitmeden uygulamak.

## Girdi sözleşmesi
ONNX girdisi `input`, float32 `[n, 7]` (sütun sırası aşağıdaki gibidir). Çıktı `probabilities` float32 `[n, 2]`, ikinci sütun `p(riskli)`.

| # | Özellik | Anlam | Birim |
|---|---|---|---|
| 1 | `sahne_no` | Sahne (karar) numarası | 2 ya da 3 |
| 2 | `seviye` | Beyan edilen seviye | 0 yeni · 1 orta · 2 deneyimli |
| 3 | `onceki_oyun_sayisi` | Bu cihazda daha önce tamamlanan oyun | adet |
| 4 | `onceki_riskli_sayisi` | Bu oturumda önceki riskli seçim | adet (0–2) |
| 5 | `onceki_karar_suresi_sn` | Önceki sahnede karar süresi | saniye |
| 6 | `onceki_okuma_suresi_sn` | Önceki geri bildirimi okuma süresi | saniye |
| 7 | `tutor_mesaj_sayisi` | O ana kadar tutor'a mesaj/ipucu isteği | adet |

## Veri
- `data/oturumlar.csv` · sha256 `13d47e333704db08…` · 1113 satır (her karar bir satır), modelde Karar 2–3'e ait 742 satır
- **Gerçek:** 0 oturum, 0 katılımcı, 0 satır (uygulamanın Veri Toplama Modu ile, kişisel veri olmadan)
- **Sentetik:** 1113 satır, tohum 42, üretici kuralı `data/hazirla.py` ve README'de
- Ayırma: katılımcı bazında gruplu (`GroupShuffleSplit`, test %25, tohum 42). Aynı kişi hem eğitimde hem testte yok.

## Metrikler (test kümesi, karar eşiği 0.5)

| Metrik | Tüm test | Yalnız gerçek test satırları |
|---|---|---|
| Satır | 192 | — |
| ROC-AUC | 0.8035 | — |
| Dengeli doğruluk | 0.7359 | — |
| Doğruluk | 0.7552 | — |
| Çoğunluk sınıfı tabanı | 0.6302 | — |
| Brier | 0.1759 | — |

**Kabul eşiği (eğitimden önce, spec.md §10):** ROC-AUC ≥ 0.75 · dengeli doğruluk ≥ 0.7 · ONNX↔sklearn fark ≤ 0.0001 · gerçek oturum ≥ 15.
**Sonuç:** ⚠️ taslak: gerçek oturum eşiği sağlanmadı, yayınlanmaz · ONNX↔sklearn maks fark 6.0e-08

## Katsayılar (standartlaştırılmış özellik başına, log-odds)
| Özellik | Katsayı |
|---|---|
| `sahne_no` | -0.343 |
| `seviye` | +0.152 |
| `onceki_oyun_sayisi` | -0.454 |
| `onceki_riskli_sayisi` | +0.483 |
| `onceki_karar_suresi_sn` | -0.544 |
| `onceki_okuma_suresi_sn` | -0.293 |
| `tutor_mesaj_sayisi` | -0.242 |
| `(sabit)` | -0.849 |

## Sınırlar
- **Gerçek veri küçük:** gerçek test satırı az olduğundan oradaki metriklerin güven aralığı çok geniş; “yalnız gerçek” sütunu bir gösterge, kanıt değil.
- **Sentetik veri baskın:** model, `data/hazirla.py`'deki varsayımları (aceleci oyuncu kısa okur ve risk alır) büyük ölçüde öğrenir. Gerçek oyuncular bu kalıba uymayabilir.
- **Soğuk başlangıç:** Karar 1'de model çalışmaz. İlk deneme (Karar 1–3) eval kapısında AUC 0,711 ile reddedildi; Karar 1'de AUC 0,574'tü (spec.md › Revizyon 1).
- **Geri besleme döngüsü:** kart gösterildiğinde oyuncu daha az risk alır; bu, sonraki sürümün etiketlerini etkiler. Bu yüzden veri toplama gölge modda (kart gösterilmeden) yapılır.
- **Model herkese açıktır** (tarayıcıda çalışır); gizli değildir. Hassas veriyle eğitilmediği için kabul edilebilir.

## Sürüm
`2.0.0` · sklearn 1.9.1 · skl2onnx 1.20.0 · Python 3.12.13
Tüketiciler modeli `main`'den değil, commit'e sabitlenmiş URL'den indirir:
`https://huggingface.co/<repo_id>/resolve/<commit>/model.onnx`
