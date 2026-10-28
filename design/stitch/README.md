# Stitch ekranları

Google Stitch'te ([stitch-prompts.md](../stitch-prompts.md) prompt'uyla, App modu) üretildi ve `.zip` olarak dışa aktarıldı.

| Ekran | Görsel | Stitch HTML |
|---|---|---|
| 1 · Giriş | [1-giris.png](1-giris.png) | [code/1-giris.html](code/1-giris.html) |
| 2 · Sahne | [2-sahne.png](2-sahne.png) | [code/2-sahne.html](code/2-sahne.html) |
| 3 · Son | [3-son.png](3-son.png) | [code/3-son.html](code/3-son.html) |

Stitch'in ürettiği tasarım sistemi (“Nocturne Incident”): [DESIGN.stitch.md](DESIGN.stitch.md). Kökteki [DESIGN.md](../../DESIGN.md), bunun uygulamada kullanılan ve sadeleştirilmiş hâlidir.

## Stitch → uygulama: bilinçli farklar

| Stitch önerisi | Uygulamada | Neden |
|---|---|---|
| Girişte sunucu odası fotoğrafı, “Gecikme süresi <140ms” satırı | Yok | Telefonda ilk yüklemeyi hafif tutmak ve süs bilgiyle karışmasın diye. |
| Sahnede `503 SERVICE FAIL` log satırı | Yok (metin anlatıyor) | Güzel bir dokunuş ama tek karar ekranında dikkati seçeneklerden çalıyor. Bir sonraki sürüme aday. |
| Son ekranında “3 / 3 İsabetli” ve her kararda ✓ | Yok | Oyun “doğru şık” mantığıyla değil, sonuç ve gerekçeyle öğretir. Puan göstermek tutor'un Sokratik amacıyla çelişir (bkz. README › Ürün kararı #2). |
| Son ekranında “Telemetri Triage Özeti”, tutor sorusunun altında 2 hazır cevap | Yok | Tutor'un son sorusu açık uçlu kalmalı. Hazır cevap vermek cevabı ele vermek olur. |
| Üst barda “Active Incident Chapter”, yer imi ve profil ikonu | Yok | Hesap ve kayıt kapsam dışı. İşlevsiz ikon koymadık. |
| Renkler, tipografi, kart yapısı, A/B kartlarının aynı görünmesi | **Aynen uygulandı** | `index.css` belirteçleri Stitch paletiyle aynı (`#A84F1B`, `#F0A35E`, `#13203B`, `#E3EEF9`). |
