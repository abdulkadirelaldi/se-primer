# DESIGN.md · SE Primer

Bu dosya SE Primer'ın tasarım sistemidir. Google Stitch'te üretilen 3 mobil ekran (giriş, sahne, son) bu kurallarla tasarlandı. Uygulamadaki `index.css` aynı belirteçleri kullanır. Stitch'e verilen prompt'lar: [design/stitch-prompts.md](design/stitch-prompts.md).

## 1. Atmosfer

**“Gece nöbetinde açılan, ışıklı bir kitap.”** Lacivert, gecenin ve kriz anının ciddiyetini taşır. Turuncu, kitabın sayfasından yükselen ışıktır ve dikkat çekilmesi gereken her şey (karar, saat, kavram) bu renktedir. Krem sayfalar okumayı rahatlatır. Görsel dil ödev kapağındaki *Young Lady's Illustrated Primer* yorumundan gelir: eski bir kitap ile canlı bir sistem panosunun birleşimi.

- Ton: sakin ama acil. Panik değil, odak.
- Metin yoğun bir oyun olduğu için okunabilirlik her süslemenin önündedir.
- Tek elle, başparmakla oynanır: bütün kararlar ekranın alt yarısındadır.

## 2. Renkler

| Belirteç | Hex | Rol |
|---|---|---|
| `--navy` | `#13203B` | Ana koyu yüzey: giriş arka planı, sahne başlığı, tutor paneli, kavram etiketleri |
| `--navy-2` | `#1D2C4E` | Koyu yüzey üstündeki kart, saat kutusu, tutor balonu |
| `--orange` | `#F0A35E` | Koyu zemin üstünde vurgu: saat, eyebrow, birincil buton (koyu ekranda) |
| `--rust` | `#A84F1B` | Açık zemin üstünde vurgu: birincil buton, seçili seçenek, eyebrow |
| `--cream` | `#F6F4EF` | Sayfa arka planı |
| `--paper` | `#FFFDF8` | Kart ve seçenek yüzeyi |
| `--ink` | `#1A2238` | Gövde metni |
| `--muted` | `#5B6275` | İkincil metin, açıklamalar |
| `--line` | `#DDD8CC` | Kenarlıklar, ayırıcılar |
| `--good-bg` / `--good-line` / `--good-ink` | `#E3EEF9` / `#2F6DB5` / `#275D9C` | Son A · İyi (zemin / çerçeve / etiket metni) |
| `--bad-bg` / `--bad-line` / `--bad-ink` | `#FBE8DB` / `#C2622A` / `#9A4415` | Son B · Kötü, süre doldu uyarısı (zemin / çerçeve / etiket metni) |

**Kontrast (WCAG 2.1, hesaplanmış):** `--ink`/`--cream` 14,37:1 · `--orange`/`--navy` 7,79:1 · beyaz/`--rust` 5,53:1 · `--rust`/`--cream` 5,03:1 · `--muted`/`--paper` 5,99:1 · `--good-ink`/`--good-bg` 5,70:1 · `--bad-ink`/`--bad-bg` 5,50:1. Bütün metin çiftleri AA (4,5:1) eşiğini geçer. Çerçeve renkleri (`--good-line`, `--bad-line`) yalnızca kenarlıkta kullanılır ve metin için kullanılmaz.

**Kural:** İyi/kötü son renkleri yalnızca son ekranında kullanılır. Oyun sırasında seçenekler renkle “doğru/yanlış” ima etmez. A ve B aynı görünür, aksi halde tasarım cevabı ele verir.

## 3. Tipografi

| Rol | Yazı tipi | Boyut / ağırlık |
|---|---|---|
| Başlık (H1, sahne başlığı, sahne metni) | **Source Serif 4** (yedek: Georgia) | 48 / 28 / 24 / 20 px, 600–700 |
| Gövde, buton, form | **Inter** (yedek: system-ui) | 16 px, 400–600, satır yüksekliği 1,55 |
| Eyebrow (KARAR 1 · MİMARİ) | Inter | 12 px, 700, büyük harf, +0,08em |
| Saat, sayaç, istatistik | Inter, `tabular-nums` | 17–20 px, 700 |

Serif, “kitap” hissini taşır ve yalnızca anlatıda kullanılır. Arayüz öğeleri sans-serif'tir. Rakamlar her yerde düz (lining) çizilir.

## 4. Yerleşim

- Mobil öncelikli, tek sütun, en fazla **480 px** genişlik. Masaüstünde ortalanır.
- Kenar boşluğu 16 px, bileşenler arası 12–16 px.
- Köşe yarıçapı: kart 14 px, buton 12 px, etiket tam yuvarlak.
- Dokunma hedefi en az **44 × 44 px**. Seçenek kartları 72 px'ten başlar.
- `100dvh` ve `env(safe-area-inset-bottom)` ile çentikli telefonlarda alt buton kesilmez.

## 5. Bileşenler

| Bileşen | Görünüm | Davranış |
|---|---|---|
| **Birincil buton** | Rust zemin, beyaz metin (koyu ekranda turuncu zemin, lacivert metin), tam genişlik | Basınca %98 ölçek |
| **Seçenek kartı (profil)** | Kâğıt zemin, 1,5 px çizgi, başlık + açıklama | Seçilince rust çerçeve, `aria-checked` |
| **Karar kartı** | Sol tarafta lacivert kare içinde turuncu harf (A/B), sağda etiket + teknik açıklama | Dokununca geri bildirim açılır, karar kilitlenir |
| **Saat rozeti** | Sahne başlığının sağında, lacivert kutuda turuncu `08:15` | Her seçimden sonra dakika eklenir |
| **İlerleme çubuğu** | 3 parça; tamamlanan turuncu, aktif açık gri | Profilde 3 soru, sahnede 3 karar |
| **İpucu kartı** | Açık sarı zemin, 💡 eyebrow, soru cümlesi | Yalnızca “Yeni başladım” seviyesinde |
| **Sayaç** | Lacivert şerit, “Kalan süre 42 sn”, altta azalan turuncu çubuk | Yalnızca “Deneyimliyim”de. Son 10 sn mercan rengi |
| **Hedef rozeti** | Tam yuvarlak, turuncu çerçeve, “🎯 Hedefinle ilgili karar” | Hedefle eşleşen kararda |
| **Geri bildirim** | “Ne oldu?” ve “Neden oldu?” iki ayrı kart, altta rol dersi, kavram etiketleri | `aria-live="polite"`, otomatik kaydırma |
| **Kavram etiketi** | Lacivert hap, turuncu metin | Salt bilgi |
| **Tutor paneli** | Lacivert kart; öğrenci balonu sağda turuncu, tutor balonu solda lacivert | “İpucu iste” hızlı düğmesi, kararlar arasında sıfırlanır |
| **Son kahramanı** | İyi: mavi zemin/çizgi · Kötü: şeftali zemin/turuncu çizgi; serif başlık “08:25 sistem ayakta, veri güvende” | Altında 3'lü istatistik ve karar özeti |

## 6. Ekranlar

### 6.1 Giriş
Lacivert tam ekran. Eyebrow “YZM301 · Oynanan bir kitap”, büyük serif “SE Primer”, tek cümlelik vaat (“teknik sonucunu” turuncu). Senaryo kartında alıntı “08:00, randevu sistemi çöktü. Nöbetçi sensin.” ve 3 madde. Altta turuncu “Nöbeti devral” butonu. Ardından 3 profil sorusu tek tek gelir (1/3, 2/3, 3/3) ve her seçim bir sonraki soruya geçirir, ayrı bir “devam” adımı yoktur.

### 6.2 Sahne
Lacivert başlık şeridi: solda “KARAR 1 · MİMARİ” ve serif başlık, sağda saat rozeti, altında 3'lü ilerleme. Krem gövdede ilk kararda brifing kartı, serif sahne metni, seviyeye göre ipucu kartı ya da sayaç, iki karar kartı ve “💬 AI tutor'a danış” butonu. Seçimden sonra aynı ekranda geri bildirim açılır.

### 6.3 Son
Üstte sonun renginde kahraman kartı (“SON A · İYİ” / “SON B · KÖTÜ”), 3'lü istatistik (Bitiş, Olay süresi, Hasta verisi), karar özeti (hedef kararı 🎯), lacivert “AI tutor son soruyu soruyor” kartı ve “Tekrar oyna”.

## 7. Yapılmaması gerekenler

- A/B kartlarını farklı renklendirmek ya da birini “önerilen” diye işaretlemek. Bu, cevabı ele vermek olur.
- Kırmızı/yeşil ikilisini tek başına anlam taşıyıcı yapmak. Son ekranında renk her zaman metin etiketiyle birlikte kullanılır.
- Gerçek kişi adı ya da gerçek TC numarası kullanmak. Örnek veri “Ayşe Yılmaz, 12345678901” gibi açıkça kurgudur.
- 16 px'ten küçük form yazısı (iOS'ta zorla yakınlaştırmaya yol açar).
