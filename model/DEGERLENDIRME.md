# Değerlendirme raporu · v2.0.0 (taslak)

_Üretildi: `python tests/eval_raporu.py` · veri sha256 `b104b0fa5c1e…` · eşikleri ya da modeli değiştirmez._

## 1. Spec protokolü (eval kapısı, `train.py`)

Tek ayırma, tohum 42: ROC-AUC **0.7632** (eşik 0.75) · dengeli doğruluk **0.7032** (eşik 0.7) · ONNX↔sklearn fark 1.2e-07 · gerçek oturum 5 (eşik 15) → **taslak (E4 sağlanmadı)**

## 2. ML basit bir kuraldan iyi mi? · 30 gruplu ayırma

Aynı 30 katılımcı-gruplu ayırmada (test %25), ortalama (min–maks):

| Aday | ROC-AUC | Dengeli doğruluk (eşik 0,5) | E2'yi geçen ayırma |
|---|---|---|---|
| **Model** (LR, `class_weight=balanced`, 7 özellik) | 0.771 (0.678–0.820) | 0.698 (0.620–0.765) | 16/30 |
| LR, ağırlıksız (Deneme 2) | 0.772 (0.679–0.820) | 0.688 (0.614–0.745) | 12/30 |
| Yalnız beyan: LR(`seviye`, `sahne_no`) | 0.555 (0.484–0.632) | 0.528 (0.443–0.627) | 0/30 |
| Elle kural: önceki riskli ≥ 1 ya da okuma < 3 sn | 0.637 (0.572–0.710) | 0.637 (0.572–0.710) | 2/30 |
| Çoğunluk sınıfı (hep “güvenli”) | 0.500 (0.500–0.500) | 0.500 (0.500–0.500) | 0/30 |

**Okuma:**
- **Model ile elle kural** karşılaştırması, ML'nin buradaki gerçek katkısını gösteriyor: davranış sinyallerini birlikte tartmak.
- **Yalnız beyan** modeli, oyuncunun kendi söylediği seviyenin riski ne kadar az açıkladığını gösteriyor; v2'nin varlık nedeni bu.
- **Model eşik sınırında:** Ortalama dengeli doğruluk eşiğe çok yakın. Spec ayırmasında kapıyı geçmesi, kısmen hangi katılımcıların teste düştüğüne bağlı (`spec.md` › Revizyon 2).

## 3. Spec ayırmasında ayrıntı (yayınlanan modelin test kümesi)

**Karışıklık matrisi** (eşik 0,5, n = 178):

| | Tahmin: güvenli | Tahmin: riskli |
|---|---:|---:|
| **Gerçek: güvenli** | 84 | 33 (gereksiz kart) |
| **Gerçek: riskli** | 19 (kaçırılan) | 42 |

Yanlış pozitifin maliyeti düşük (oyuncu fazladan bir soru görür). Yanlış negatifte v1 davranışına düşülür. Sınıf ağırlıklandırma bu yüzden duyarlılığı (riskli oyuncuyu yakalamayı) öne çıkarır.

**Sahne bazında:**

| Sahne | n | Riskli oranı | ROC-AUC | Dengeli doğruluk |
|---|---:|---:|---:|---:|
| Karar 2 | 89 | 0.38 | 0.773 | 0.695 |
| Karar 3 | 89 | 0.30 | 0.745 | 0.702 |

**Kalibrasyon** (Brier 0.198): `class_weight` olasılıkları bilerek yukarı kaydırır. Bu yüzden `p` bir “risk puanı” olarak okunmalı, gerçek olasılık olarak değil. Kartta gösterilen yüzde de bu nedenle “eğilim” diye sunuluyor.

| Tahmin aralığı | n | Ortalama p | Gözlenen riskli oranı |
|---|---:|---:|---:|
| 0.0–0.2 | 36 | 0.10 | 0.11 |
| 0.2–0.4 | 37 | 0.30 | 0.19 |
| 0.4–0.6 | 50 | 0.49 | 0.30 |
| 0.6–0.8 | 36 | 0.68 | 0.64 |
| 0.8–1.0 | 19 | 0.85 | 0.63 |

## 4. Gerçek ve sentetik: dağılım kayması ve gölge dağıtım

| | Sentetik | Gerçek (5 oturum) |
|---|---:|---:|
| Karar süresi, medyan (sn) | 17.3 | 0.8 |
| Geri bildirim okuma süresi, medyan (sn) | 11.2 | 0.9 |
| Riskli seçim oranı (tüm kararlar) | 0.33 | 0.53 |
| Tutor kullanılan oturum oranı | 0.71 | 0.00 |

**Gölge dağıtım:** 10 karar (5 oturum) · gölge modelin (`2.0.0`) kartı **göstereceği** karar oranı 1.00, gerçekte riskli seçim oranı 0.80, eşik 0,5'te isabet 0.80. n çok küçük; bu bir gösterge, kanıt değil.

**Bulgu:** Gerçek oyuncular sentetik varsayımdan çok daha hızlı karar veriyor ve geri bildirimi çok daha kısa okuyor. Sentetik üretici “aceleci oyuncu” profilini gerçekten daha yavaş varsaymış. Bu bir **dağılım kayması** (Amershi vd., 2019): sentetik veride öğrenilen eşikler gerçek kullanıcıda kartı çok sık açabilir. Gerçek veri arttıkça yapılacaklar: (1) sentetik üreticinin süre dağılımını gerçek medyanlara göre yeniden ayarlamak (yeni sürüm, yeni spec), (2) gölge modda kart gösterme oranını izlemek.
