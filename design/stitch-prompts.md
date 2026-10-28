# Google Stitch prompt'ları

[stitch.withgoogle.com](https://stitch.withgoogle.com) → **Mobile** modu → önce aşağıdaki **tema prompt'unu**, sonra her ekran için kendi prompt'unu ver. Üretilen ekranları PNG olarak dışa aktar ve `design/stitch/` klasörüne `1-giris.png`, `2-sahne.png`, `3-son.png` adlarıyla koy. Stitch'in ürettiği DESIGN.md, kökteki [DESIGN.md](../DESIGN.md) ile karşılaştırılır. Uygulamanın gerçek ekranları `design/app-screens/` klasöründedir.

## Tema (ilk mesaj)

```
Mobile app called "SE Primer": an interactive book that teaches software engineering through a hospital IT crisis. Language: Turkish.
Mood: "a glowing book opened during a night shift" — calm but urgent.
Colors: navy #13203B (dark surfaces), navy-2 #1D2C4E (cards on dark), orange #F0A35E (accents on dark), rust #A84F1B (accents and primary buttons on light), cream #F6F4EF (page background), paper #FFFDF8 (cards), ink #1A2238 (text), muted #5B6275.
Typography: headings and story text in "Source Serif 4" (serif, lining numerals); UI in "Inter". Eyebrow labels: 12px bold uppercase, letter-spacing 0.08em.
Layout: single column, 16px margins, 14px card radius, 12px button radius, touch targets at least 44px, full-width primary buttons at the bottom.
Important rule: options A and B must look identical — never color or mark one as recommended.
```

## Ekran 1 · Giriş

```
Screen 1 "Giriş" (onboarding). Full navy background.
- Eyebrow (orange): "YZM301 · OYNANAN BİR KİTAP"
- Big serif title (white, 48px): "SE Primer"
- Lead text: "Kişiye uyum sağlayan kitap, bu kez yazılım mühendisi için: sen karar verirsin, uygulama o kararın teknik sonucunu gösterir." — the words "teknik sonucunu" in orange.
- A navy-2 card with eyebrow "BÖLÜM 1 · SAĞLIK", serif quote "“08:00, randevu sistemi çöktü. Nöbetçi sensin.”" and 3 bullets: "3 soru: seviye, rol, hedef", "3 karar, 2 farklı son", "Cevabı söylemeyen, soru soran AI tutor".
- Full-width orange button with navy text: "Nöbeti devral".
- Tiny gray note: "Senaryodaki tüm hasta bilgileri kurgudur."
Also show the next state of this screen: cream background, step "1 / 3" top right, 3-segment progress bar (first segment rust), eyebrow "SENİ TANIYALIM", serif question "Seviyen ne?", and 3 stacked option cards: "Yeni başladım — Her kararda ipucu kartı görürsün.", "Biraz deneyimim var — İpucunu sen istersin, süre baskısı yok.", "Deneyimliyim — Her karar için 60 saniyen var."
```

## Ekran 2 · Sahne

```
Screen 2 "Sahne" (decision scene).
- Navy header: left eyebrow "KARAR 1 · MİMARİ" (orange) and serif title "İlk hamle" (white); right a clock badge "08:00" (orange tabular numbers in a navy-2 rounded box). Under it a 3-segment progress bar.
- Cream body. A white "BRİFİNG" card with 3 short paragraphs about the crashed hospital appointment system and 300 waiting patients.
- A pill badge with orange outline: "🎯 Hedefinle ilgili karar: Mimari kararlar".
- Serif story text (20px): "Loglar, hatanın gece çıkan v2.4 ile başladığını gösteriyor. Hastalar şu an randevu alamıyor. İlk hamlen ne?"
- A pale yellow hint card: eyebrow "💡 İPUCU", text "Geri dönmeden önce veritabanı şemasının değişip değişmediğini nasıl anlarsın?"
- Two identical choice cards, each with a navy square containing an orange letter on the left: "A — Eski sürüme geri dön — Rollback: bilinen sağlam sürüm v2.3'ü geri yükle, kök nedeni sonra ara." and "B — Canlıda yama yap — Hotfix: hatayı canlı sistemde bulup doğrudan düzelt."
- An outlined full-width button "💬 AI tutor'a danış".
Also show the AI tutor panel open: navy card titled "AI tutor", subtitle "İpucu verir, cevabı vermez", a right-aligned orange student bubble "Cevap ne?" and a left-aligned navy-2 tutor bubble "Cevabı ben söylersem karar senin olmaz. Şunu düşün: Geri dönmeden önce veritabanı şemasının değişip değişmediğini nasıl anlarsın?", a text input and an orange "Gönder" button.
Also show the after-choice state: "Seçimin: A) Eski sürüme geri dön", two cards "Ne oldu?" and "Neden oldu?", navy concept chips "Rollback", "MTTR", "Geriye uyumlu migration", and a rust full-width button "Sonraki karar →". Clock now shows "08:15".
```

## Ekran 3 · Son

```
Screen 3 "Son" (ending). Cream background.
- Hero card, light blue #E3EEF9 with blue #2F6DB5 border: eyebrow "SON A · İYİ" (#275D9C), serif headline "08:25 sistem ayakta, veri güvende", one paragraph.
- Three small stat cards in a row: "Bitiş 08:25", "Olay süresi 25 dk", "Hasta verisi Güvende".
- A card "Kararların" listing 3 rows: eyebrow "KARAR 1 · MİMARİ · 🎯", bold "A) Eski sürüme geri dön", small gray concepts; same for "KARAR 2 · TEST" and "KARAR 3 · KVKK".
- A navy card: eyebrow "AI TUTOR SON SORUYU SORUYOR", text "“Bu olayın bir daha yaşanmaması için yayın hattına hangi otomatik kontrolü eklerdin?”"
- Full-width rust button "Tekrar oyna".
Also show the bad-ending variant: peach #FBE8DB hero with orange border, eyebrow "SON B · KÖTÜ", headline "08:50 sistem ayakta ama KVKK ihlali", stat "Hasta verisi İhlal".
```
