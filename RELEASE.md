# RELEASE · SE Primer

## Sürüm geçmişi

| Sürüm | Ne | Model | Nerede |
|---|---|---|---|
| **v1.0** (git etiketi `v1.0`) | Kural tabanlı uyum: girişteki 3 soruya göre ipucu ve süre baskısı | Yok | GitHub, AI Studio |
| **v2.0.0-taslak** | Model yalnızca sentetik veriyle eğitildi; E4 (≥ 15 gerçek oturum) sağlanmadı | `model/` (taslak) | Yalnızca uygulamayla birlikte paketli, **gölge modda**: tahmin eder, kaydeder, oyunu değiştirmez. Hugging Face'e **yüklenmedi**. |
| **v2.0.0** | Gerçek + sentetik veriyle eğitildi; E1–E4 geçildi | Hugging Face, commit'e sabitli | Bkz. aşağıdaki yayın kaydı |

## v2.0'da ne değişti

- **Davranıştan öğrenen uyum.** Karar 2 ve 3 açılırken küçük bir lojistik regresyon modeli (`model.onnx`, 573 bayt), oyuncunun riskli seçeneği seçme olasılığını önceki davranışından tahmin eder. `p ≥ 0,5` ise seçeneklerden önce “🧭 Dur ve düşün” Sokratik kartı açılır (`spec.md` §8–12).
- **Eklemeli değişiklik.** v1'in hiçbir öğesi kaldırılmadı. v1'in 25 E2E testi tek satırı değişmeden geçiyor (regresyon).
- **Davranış ölçümü ve Veri Toplama Modu** (`?veri=1`). Kişisel veri yok; `data/SOZLUK.md`.
- **Üç tüketici, tek sözleşme.** Tarayıcı (`onnxruntime-web`), sunucu (`POST /api/risk`, `onnxruntime-node`) ve test kahini (Python `onnxruntime`), `tests/parite.json`'daki 5 girdide < 1e-4 farkla aynı sonucu verir.
- **Eval kapısı.** `train.py` eşik altında çıkış kodu 1 ile durur. İlk deneme (Karar 1–3, AUC 0,711) bu kapıda reddedildi (`spec.md` › Revizyon 1).

## Yayın kaydı (v2.0.0)

> Bu bölüm `yayinla.py` çıktısından doldurulur. Kesin değerler `model/YAYIN.json` dosyasındadır.

| | |
|---|---|
| Hugging Face reposu | `YAYIN_REPO` |
| Commit (sabit) | `YAYIN_COMMIT` |
| Etiket | `v2.0.0` |
| Tüketicilerin indirdiği URL | `YAYIN_BASE` + `model.onnx` / `config.json` |
| Model sha256 | `YAYIN_SHA` |
| Veri sha256 | `model/config.json › data.sha256` |

**Neden `main` değil, commit?** `main` hareketli bir işaretçidir. Biri HF'ye yeni bir model yüklediği anda, sabitlenmemiş bütün tüketiciler sessizce yeni modele geçer. Oysa yeni modelin ne eval'i ne paritesi bu uygulama için yapılmıştır. Commit'e sabitlenen URL'nin içeriği değişmez (Sommerville Bl. 25: konfigürasyon yönetimi, temel çizgi/baseline). Bu, Shankar vd. (2022)'nin üç V'sinden **Versioning** sorununun somut karşılığıdır: kod (`git`), veri (`config.json › data.sha256`) ve model (HF commit) birlikte sürümlenir.

## Geri alma (rollback)

Sorun tanımı (geri alma tetikleyicileri):
- Tarayıcı ya da sunucu tüketicisinde parite testi başarısız (|fark| ≥ 1e-4).
- Model yüklenemiyor (HF erişilemiyor, dosya bozuk). Uygulama zaten v1'e düşer, ama sürekli düşüyorsa geri alınır.
- Gölge ya da kanarya ölçümünde kartın gösterildiği oyuncularda tamamlama oranı belirgin biçimde düşüyor (kart sinir bozucu).

| Düzey | Ne yapılır | Süre | Etki |
|---|---|---|---|
| **0 · Tek kullanıcı** | URL'ye `?model=kapali` | Anında | O oyuncu v1 davranışına döner. Destek ve hata ayıklama içindir. |
| **1 · Model kapalı (kill switch)** | `services/riskModel.ts` › `YAYILIM_YUZDESI = 0` → push → Pages iş akışı | ~2 dk | Model herkes için gölgeye geçer; oyun v1 gibi davranır, tahminler kaydedilmeye devam eder. |
| **2 · Önceki modele dön** | `HF_MODEL_BASE`'i bir önceki sürümün commit URL'sine çevir, `tests/parite.json`'u o sürüme göre üret (`parite.py --url … --yaz`) → push | ~5 dk | v2.0.0 ilk model olduğu için “önceki sürüm” düzey 1'dir (v1 davranışı). v2.1'den itibaren v2.0.0 commit'i geri dönüş noktasıdır. |
| **3 · Kodu geri al** | `git revert <commit>` ya da `git checkout v1.0` → push | ~5 dk | Uygulama tamamen v1'e döner. |

Hugging Face'teki eski commit'ler silinmez. Bu yüzden geri alma her zaman yeni bir yükleme yapmadan, yalnızca **işaretçiyi değiştirerek** yapılır.

## Yeni sürümü güvenle devreye alma

### 1 · Gölge dağıtım (Shadow): **yapıldı**
Veri toplama boyunca v2.0.0-taslak modeli gerçek oyunlarda **sessizce** çalıştı. Her karar için tahminini (`model_p`) kaydetti ama oyunu değiştirmedi; oyuncu kartı hiç görmedi. Böylece modelin kararları gerçek davranışla, oyuncuyu etkilemeden kıyaslanabildi. Ölçüm, gerçek oturumlardaki Karar 2–3 satırlarında `model_p` ile gerçek `riskli_secim` arasındaki uyumdur (bkz. model kartı ve aşağıdaki tablo). Gölge modun ikinci faydası, eğitim verisinin modelin kendi etkisiyle kirlenmemesidir (geri besleme döngüsü).

### 2 · Kanarya (Canary): %5
Her cihaz ilk açılışta rastgele bir kova alır (0–99, `localStorage`, kişisel veri değil). `YAYILIM_YUZDESI = 5` iken yalnızca 0–4 kovasındaki cihazlarda kart gösterilir; diğer %95'te model gölgede çalışır. Bir hafta boyunca karşılaştırılacaklar:
- kanarya grubunda oyun tamamlama oranı ≥ gölge grubu − 5 puan,
- kanarya grubunda Karar 2–3'te riskli seçim oranı gölge grubundan düşük (ürünün asıl amacı),
- model yükleme hatası < %1.

### 3 · Aşamalı geçiş (Progressive rollout): %25 → %50 → %100
Kanarya ölçütleri tutarsa `YAYILIM_YUZDESI` sırayla 25, 50 ve 100'e çıkarılır. Her adım en az 2 gün sürer ve aynı ölçütlerle izlenir. Herhangi bir adımda ölçüt tutmazsa düzey 1 geri alma uygulanır.

> **Dürüst not:** Bu bir ders projesi; kanarya ve aşamalı geçiş adımlarını ölçecek kadar kullanıcı yok. Kova mekanizması kodda var (`services/riskModel.ts` › `kanaryadaMi`), ama yukarıdaki ölçütler henüz bir plandır. Gölge dağıtım ise gerçekten uygulandı.

## Mimari dağıtım kararı ve ödünleşim matrisi

| | **Tarayıcı** (`onnxruntime-web`) ✅ seçildi | **Cihaz içi mobil** (Expo + `onnxruntime-react-native`, gömülü) | **Kendi sunucumuz** (Express + `onnxruntime-node`, `POST /api/risk`; Render.com) |
|---|---|---|---|
| **1 · İnternet zorunlu mu, gecikme?** | İlk açılışta model (573 B) + çalışma zamanı (wasm, ~3,9 MB gzip) iner. Yerelde ölçülen yükleme 353 ms; mobil ağda saniyeler sürebilir. Sonra **her tahmin ~0,5 ms ve ağsız**. | Model uygulamaya gömülü: **tamamen internetsiz**, gecikme yok. Ama uygulama mağaza/APK ile dağıtılır, güncellemesi yavaştır. | **Her tahminde ağ turu** gerekir (onlarca–yüzlerce ms). Render ücretsiz katmanında uykudan uyanma 30 sn'yi aşabilir. İnternet yoksa çalışmaz. |
| **2 · Veri cihazdan çıkar mı?** (KVKK) | **Hayır.** Davranış verisi tarayıcıda kalır; sunucuya hiçbir şey gitmez. Veri minimizasyonu ilkesine en uygun seçenek. | **Hayır.** | **Evet.** Her tahminde oyuncunun davranış özellikleri sunucuya gider. Anonim olsa da aktarım, kayıt ve saklama politikası gerektirir. |
| **3 · Model gizli kalır mı?** | **Hayır.** `model.onnx` herkesin indirebileceği bir dosyadır; katsayılar okunabilir. | **Hayır.** APK açılıp model çıkarılabilir. | **Evet**, dosya sunucuda kalır. Ama istek-yanıt üzerinden çok sayıda sorguyla model taklit edilebilir (tersine mühendislik / model çıkarma, REA). Hız sınırı gerekir. |
| Maliyet | Sıfır (GitHub Pages + HF Hub) | Sıfır (ama mağaza ve derleme zahmeti) | Ücretsiz katman, uyuma ve kota sınırlarıyla |
| Güncelleme | `HF_MODEL_BASE` değişir, Pages yeniden yayınlanır (~2 dk) | Yeni APK/OTA | Sunucuda `MODEL_BASE` değişir |

**Karar: tarayıcı.**
- (1) Oyun zaten tarayıcıda oynanıyor ve tahmin her sahne başında yapılıyor. İlk yüklemeden sonra ağsız ve 1 ms'nin altında çalışması, sahne geçişini hiç geciktirmiyor.
- (2) KVKK açısından en iyi seçenek: oyuncunun davranışı cihazdan çıkmıyor. Sunucu seçeneğinde, yalnızca bir kart göstermek için veri aktarımı gerekirdi.
- (3) Modelin gizli olmaması bilinçli olarak kabul edildi: model yalnızca anonim oyun davranışıyla eğitildi, ticari sır değil ve şeffaflık (model kartı + katsayılar) eğitim amacına hizmet ediyor.

**Neden sunucu yine var?** Sunucu tüketicisi (`/api/risk`) bonus olarak ve üçüncü bağımsız ortamda parite kanıtı için tutuldu (Sommerville Bl. 17–18: dağıtık ve servis odaklı mimari). Model gizli olsaydı (ör. hasta verisiyle eğitilseydi) tek doğru seçenek bu olurdu. Başlangıç reposundaki “Bilinen kısıtlar” notu da aynı ilkeyi söyler.

## Kaynaklar

- Amershi, S. vd. (2019). *Software Engineering for Machine Learning: A Case Study.* ICSE-SEIP. Yaşayan ML yaşam döngüsü; bu projede veri toplama → eğitim → eval kapısı → gölge → yayın döngüsü.
- Shankar, S. vd. (2022). *Operationalizing Machine Learning: An Interview Study.* Velocity, Validation, Versioning. Validation = eval kapısı ve parite testi; Versioning = git + veri sha256 + HF commit.
- Breck, E. vd. (2017). *The ML Test Score.* “Model spec'i kodda gözden geçirilir”, “eğitim tekrarlanabilir”, “model kalitesi yayından önce doğrulanır”, “servis edilen model ile eğitilen model aynı skoru verir” (bkz. `tests/test_egitim.py`, `tests/parite.py`).
- Mitchell, M. vd. (2019). *Model Cards for Model Reporting.* `model/README.md`.
- Sommerville, I. (2016). *Software Engineering*, 10. baskı: Bl. 8 (V&V; diferansiyel test ve test kahini), Bl. 17–18 (dağıtık/servis mimarisi), Bl. 25 (konfigürasyon yönetimi).
- `seyyah/huggingface-hello-web`: ONNX sözleşmesi, `onnx_aktar` eşdeğerlik kontrolü ve tüketici örnekleri buradan uyarlandı.
- Hugging Face Hub belgeleri (`resolve/<revision>`), ONNX Runtime (`onnxruntime-web`, `onnxruntime-node`), `skl2onnx`.
