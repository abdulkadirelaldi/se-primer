# Sınav tasarımı · “Sizinle uyumlanan” vize sorusu

**Fikir.** The Primer oyuncunun davranışına uyum sağlıyordu. Sınav da öğrencinin *ezberine* değil, *gerekçesine* uyum sağlamalı. Bunun için her öğrenci aynı senaryoyu alır, ama sayısal ayrıntılar öğrenci numarasından türetilir (kopya çekmek işe yaramaz). Puanın çoğu doğru terimi söylemekten değil, **neden** o kararı verdiğini açıklamaktan gelir.

---

### Soru (60 dk, kapalı kitap)

Bir hastanenin **insülin doz hesaplayıcısı** yıllardır Python'da (float64) çalışıyor ve hemşireler sonucu 0,5 ünite hassasiyetle okuyor. Ekip hesaplayıcıyı tablette çalışacak bir mobil uygulamaya (float32) taşıdı. Kaynak kodun yazarı ayrıldı; bazı hesaplamaların *neden* öyle yapıldığını kimse bilmiyor. Elinizde **N = 300 + (öğrenci no mod 50)** gerçek, anonimleştirilmiş girdi var.

**a) (20 p)** Eski Python kodunu **test kahini (oracle)** olarak kullanan bir **diferansiyel test** tasarlayın. Hangi çıktıları karşılaştırırsınız? **Hata toleransını** kaç alırsınız? Toleransı hem float32 hassasiyetinden hem de *hemşirenin okuduğu 0,5 ünite*den gerekçelendirin.

**b) (20 p)** Testi koştunuz: N girdinin **k = (öğrenci no mod 7) + 1** tanesinde fark toleransı aşıyor. Bu, mobil uygulamanın yanlış olduğunu kanıtlar mı? Kahinin kendisinin hatalı olabileceği bir senaryo yazın.

**c) (20 p)** Kimsenin anlamadığı eski davranışı korumak için bir **karakterizasyon testi** yazacaksınız. Bunun **regresyon testi**nden farkı nedir? Hangi davranışı karakterizasyon testine almazsınız?

**d) (25 p)** Bütün testler geçti. Bu, **doğrulama** (verification: “ürünü doğru mu yaptık?”) mı, **geçerleme** (validation: “doğru ürünü mü yaptık?”) mi? Geçerleme için en az bir somut ve testin dışında kalan etkinlik önerin.

**e) (15 p)** Yeni sürümü tüm hastanede birden açmak yerine nasıl devreye alırsınız? Geri alma (rollback) koşulunuz ne?

---

### Beklenen temel kavramlar

| Bölüm | Görmek istediğim | Çeldirici (puan kırar) |
|---|---|---|
| a | Kahin = güvenilen ikinci uygulama; mutlak/göreli tolerans; *klinik* tolerans < okuma hassasiyeti (ör. 0,05 ü) ama > float32 gürültüsü | “Fark 0 olmalı” (kayan noktayı bilmemek); toleransı gerekçesiz seçmek |
| b | Kahin de yazılımdır, hatalı olabilir; k farkın kök nedeni incelenmeden karar verilmez; sınır değerler (yuvarlama, 0,5 eşiği) | “Kahin her zaman doğrudur” |
| c | Karakterizasyon: *var olan* davranışı (doğru olsun olmasın) kayda alır; regresyon: *bilinen doğru* davranışın bozulmadığını denetler. Bilinen hata karakterize edilmez, düzeltilir | İkisini eş anlamlı saymak |
| d | Testler doğrulamadır; geçerleme kullanıcı/hekim ile (ör. gölge kullanım, hemşire gözlemi, klinik onay) | “Testler geçti, ürün geçerli” |
| e | Gölge (eski ve yeni sonucu birlikte hesapla, yalnız eskiyi göster) → kanarya (tek servis) → aşamalı geçiş; ölçülebilir geri alma koşulu | “Hafta sonu herkese açarız” |

### Neden bu soru?

- **Ezberi değil özü ölçer:** Tanımı ezberleyen öğrenci (a) ve (b)'de toleransı ve kahinin güvenilirliğini gerekçelendiremez.
- **Öğrenciye uyumludur:** N ve k öğrenciye özeldir, ama gerekçe herkes için aynı ölçütle değerlendirilir.
- **Bu ödevle bağlantılıdır:** SE Primer v2'de aynı şeyi yaptık. Python ONNX Runtime test kahiniydi, tarayıcı ve sunucu 1e-4 toleransla karşılaştırıldı (`tests/parite.json`). v1 testleri regresyon olarak değişmeden koştu. Taslak model gölge modda çalıştı.
