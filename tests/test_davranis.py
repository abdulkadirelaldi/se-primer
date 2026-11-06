"""Davranışsal (metamorfik) testler · model alan beklentisine uyuyor mu?   .venv/bin/python tests/test_davranis.py

Parite testi DOĞRULAMADIR (verification): “iki ortam aynı modeli aynı mı hesaplıyor?”
Bu dosya GEÇERLEMEYE (validation) yakındır: “model, spec'teki hipotezle tutarlı mı davranıyor?”
Yöntem Ribeiro vd. (2020) CheckList: yön beklentisi (DIR), değişmezlik (INV) ve minimum işlevsellik (MFT).

Bir yön testi kalırsa bu bir kod hatası değil, bir BULGUDUR: model veride hipotezin tersini öğrenmiştir.
Çıktı bulgu listesi olarak raporlanır; sözleşme ve sağlamlık testleri (INV, MFT) ise kesin geçmelidir.

Döngüsellik uyarısı: sentetik veri (data/hazirla.py) bu hipotezlerle üretildi. Sentetik veri baskınken yön
testlerinin geçmesi beklenir ve tek başına kanıt değildir. Asıl değeri, gerçek veri arttıkça hâlâ geçip
geçmediğini izlemektir: bir yön testi gerçek veriyle kalırsa, ya hipotez ya da sentetik üretici yanlıştır.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort

KOK = Path(__file__).resolve().parent.parent
config = json.loads((KOK / "model" / "config.json").read_text(encoding="utf-8"))
oturum = ort.InferenceSession(str(KOK / "model" / "model.onnx"), providers=["CPUExecutionProvider"])
ADLAR = [f["name"] for f in config["features"]]
ESIK = config["karar_esigi"]


def p(*satirlar: dict) -> np.ndarray:
    X = np.array([[s[a] for a in ADLAR] for s in satirlar], dtype=np.float32)
    return oturum.run(["probabilities"], {"input": X})[0][:, 1]


# Tipik oyuncular: Karar 2 ve 3, her seviye
TABANLAR = [
    {"sahne_no": sahne, "seviye": sev, "onceki_oyun_sayisi": 1, "onceki_riskli_sayisi": 0,
     "onceki_karar_suresi_sn": 8.0, "onceki_okuma_suresi_sn": 6.0, "tutor_mesaj_sayisi": 1}
    for sahne in (2, 3) for sev in (0, 1, 2)
]

# DIR · spec.md §9 hipotezi: aceleci ve risk alan oyuncu daha riskli; dikkatli, deneyim kazanan ve yardım isteyen daha az
YON = [
    ("onceki_okuma_suresi_sn", [1, 3, 6, 12, 30, 60], "azalmalı", "Geri bildirimi daha uzun okuyan daha az risk alır"),
    ("onceki_karar_suresi_sn", [1, 3, 6, 12, 30, 60], "azalmalı", "Daha uzun düşünen daha az risk alır"),
    ("onceki_riskli_sayisi", [0, 1, 2], "artmalı", "Önceki riskli seçimler eğilimi gösterir"),
    ("onceki_oyun_sayisi", [0, 1, 2, 4, 8], "azalmalı", "Tekrar oynayan öğrenir"),
    ("tutor_mesaj_sayisi", [0, 1, 2, 4], "azalmalı", "Tutor'a danışan daha dikkatlidir"),
]


def main() -> int:
    kesin_hata, bulgular, gecen = [], [], 0

    # MFT · minimum işlevsellik: olasılık [0,1], iki sınıfın toplamı 1, tipik aceleci ve dikkatli ayrışır
    X = np.array([[s[a] for a in ADLAR] for s in TABANLAR], dtype=np.float32)
    olas = oturum.run(["probabilities"], {"input": X})[0]
    if not (np.all((olas >= 0) & (olas <= 1)) and np.allclose(olas.sum(axis=1), 1, atol=1e-6)):
        kesin_hata.append("MFT: olasılıklar [0,1] aralığında değil ya da toplamı 1 değil")
    aceleci = {"sahne_no": 2, "seviye": 0, "onceki_oyun_sayisi": 0, "onceki_riskli_sayisi": 1,
               "onceki_karar_suresi_sn": 2, "onceki_okuma_suresi_sn": 1, "tutor_mesaj_sayisi": 0}
    dikkatli = {"sahne_no": 2, "seviye": 1, "onceki_oyun_sayisi": 3, "onceki_riskli_sayisi": 0,
                "onceki_karar_suresi_sn": 25, "onceki_okuma_suresi_sn": 20, "tutor_mesaj_sayisi": 2}
    pa, pd_ = p(aceleci, dikkatli)
    if not (pa >= ESIK > pd_):
        kesin_hata.append(f"MFT: aceleci ({pa:.3f}) eşik üstü, dikkatli ({pd_:.3f}) eşik altı olmalı")
    else:
        gecen += 1
        print(f"✓ MFT  aceleci p={pa:.3f} ≥ {ESIK} > dikkatli p={pd_:.3f}")

    # INV · değişmezlik: toplu (batch) ile tek tek çalıştırma aynı; satır sırası sonucu değiştirmez; deterministik
    tek = np.array([p(s)[0] for s in TABANLAR])
    toplu = p(*TABANLAR)
    ters = p(*reversed(TABANLAR))[::-1]
    if np.abs(tek - toplu).max() > 1e-6 or np.abs(toplu - ters).max() > 1e-6 or np.abs(p(*TABANLAR) - toplu).max() > 0:
        kesin_hata.append("INV: toplu/tek/ters sıra/tekrar çalıştırma sonuçları farklı")
    else:
        gecen += 1
        print("✓ INV  toplu = tek tek = ters sıra = tekrar (deterministik)")

    # DIR · yön beklentileri: her tipik oyuncu için tek özelliği değiştir, p'nin yönüne bak
    for ozellik, degerler, yon, gerekce in YON:
        ihlal = 0
        for taban in TABANLAR:
            seri = p(*[{**taban, ozellik: v} for v in degerler])
            fark = np.diff(seri)
            if (yon == "azalmalı" and np.any(fark > 1e-7)) or (yon == "artmalı" and np.any(fark < -1e-7)):
                ihlal += 1
        if ihlal:
            bulgular.append(f"DIR  {ozellik}: {yon} beklendi, {ihlal}/{len(TABANLAR)} tipik oyuncuda tersi · “{gerekce}”")
        else:
            gecen += 1
            fiil = {"azalmalı": "azalıyor", "artmalı": "artıyor"}[yon]
            print(f"✓ DIR  {ozellik} ↑ → p {fiil} ({len(TABANLAR)}/{len(TABANLAR)} tipik oyuncu) · {gerekce}")

    for b in bulgular:
        print(f"! BULGU {b}")
    for h in kesin_hata:
        print(f"✗ {h}")
    print(f"\n{gecen} test geçti · {len(bulgular)} bulgu (model hipotezin tersini öğrenmiş) · {len(kesin_hata)} hata")
    print("Not: sentetik veri bu hipotezlerle üretildiği için DIR testleri şu an büyük ölçüde beklenen sonuçtur (bkz. dosya başı).")
    return 1 if kesin_hata else 0


if __name__ == "__main__":
    sys.exit(main())
