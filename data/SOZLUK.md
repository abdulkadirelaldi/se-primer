# Veri sözlüğü · `data/oturumlar.csv`

**Bir satır = bir karar.** Her oturumda 3 karar olduğu için her oturum 3 satırdır. Model yalnızca `sahne_no` 2 ve 3 olan satırlarla eğitilir (soğuk başlangıç, `spec.md` › Revizyon 1). Sahne 1 satırları, sonraki sahnelerin “önceki” özelliklerini hesaplamak ve analiz için tutulur.

| Sütun | Tür | Birim / değerler | Anlamı | Modelde |
|---|---|---|---|---|
| `oturum_id` | metin | `o-` + 8 onaltılık (gerçek) · `s-` + 8 (sentetik) | Bir oyunun rastgele kimliği. Kişiyle eşleştirilemez. | — |
| `katilimci_id` | metin | `K-` + 4 onaltılık (gerçek) · `S-` + 4 (sentetik) | Aynı kişinin oturumlarını gruplamak için rastgele kimlik. Eğitim/test ayırması bu sütuna göre yapılır. | gruplama |
| `kaynak` | kategori | `gercek` \| `sentetik` | Satırın kaynağı. Zorunlu. | rapor |
| `seviye` | tamsayı | 0 = Yeni başladım · 1 = Biraz deneyimim var · 2 = Deneyimliyim | Oyuncunun girişte beyan ettiği seviye. | ✅ 2 |
| `rol` | kategori | `backend` \| `qa` \| `devops` | Girişte seçilen rol. | — |
| `hedef` | kategori | `architecture` \| `testing` \| `security` | Girişte seçilen öğrenme hedefi. | — |
| `sahne_no` | tamsayı | 1, 2, 3 | Karar numarası (1 Mimari, 2 Test, 3 KVKK). | ✅ 1 |
| `onceki_oyun_sayisi` | tamsayı | adet, ≥ 0 | Bu oturumdan önce aynı katılımcının tamamladığı oyun sayısı (veri modu). Normal modda bu cihazdaki sayı. | ✅ 3 |
| `onceki_riskli_sayisi` | tamsayı | adet, 0–2 | Bu oturumda bu karara kadar yapılan riskli (B) seçim sayısı. | ✅ 4 |
| `onceki_karar_suresi_sn` | ondalık | saniye, 0,1 hassasiyet | Bir önceki kararda sahnenin açılmasından seçime kadar geçen süre. Sahne 1'de 0. | ✅ 5 |
| `onceki_okuma_suresi_sn` | ondalık | saniye, 0,1 hassasiyet | Bir önceki kararın “Ne oldu / Neden oldu” ekranında, ekranın açılmasından “Sonraki”ye basılana kadar geçen süre. Sahne 1'de 0. | ✅ 6 |
| `tutor_mesaj_sayisi` | tamsayı | adet | Bu karara kadar tutor'a gönderilen mesaj + “İpucu iste” sayısı. **İçerik kaydedilmez.** | ✅ 7 |
| `karar_suresi_sn` | ondalık | saniye | Bu karardaki karar süresi. **Modelde kullanılmaz** (tahmin anında bilinmiyor; kullanmak hedef sızıntısı olur). Bir sonraki satırın `onceki_karar_suresi_sn` değeridir. | — |
| `okuma_suresi_sn` | ondalık | saniye | Bu kararın geri bildirim ekranındaki süre. Modelde kullanılmaz. | — |
| `secim` | kategori | `A` \| `B` | Yapılan seçim (A güvenli, B riskli). | — |
| `zaman_asimi` | 0/1 | | Deneyimli modda 60 sn dolduğu için B otomatik uygulandıysa 1. | — |
| `riskli_secim` | 0/1 | | **Hedef.** `secim = B` ise 1. | 🎯 |
| `model_p` | ondalık | 0–1, 6 basamak | Veri toplama sırasında **gölge modda** çalışan modelin bu karar için tahmini (oyuncuya gösterilmedi). Sahne 1'de ve sentetikte boş. | — |
| `model_surumu` | metin | ör. `2.0.0` | `model_p`'yi üreten model sürümü. | — |

✅ işaretli sütunlar ve yanlarındaki numara, `model/config.json › features` sırasıdır (ONNX girdi tensörünün sütun sırası).

## Toplanmayanlar (KVKK)

Ad, soyad, e-posta, telefon, IP adresi, cihaz kimliği, konum, tarih-saat damgası, tarayıcı bilgisi ve tutor'a yazılan metnin içeriği **toplanmaz**. Kimlikler `crypto.getRandomValues` ile üretilir. Veriler oynanan cihazın `localStorage`'ında durur ve yalnızca “CSV indir” ile, bilerek dışa aktarılır.

## Kaynaklar

- **Gerçek:** Uygulamanın Veri Toplama Modu (`?veri=1`) ile oynanan oturumlar. Dışa aktarılan dosyalar `data/gercek/*.csv` altına konur.
- **Sentetik:** `data/hazirla.py`, tohum 42. Üretici kuralı dosyanın başında ve `README.md`'de yazılı.
- `python data/hazirla.py` iki kaynağı birleştirir, şemayı ve `kaynak` sütununu doğrular, çift satırları atar ve `data/oturumlar.csv`'yi yazar.
