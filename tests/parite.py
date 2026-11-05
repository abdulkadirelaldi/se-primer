"""Diferansiyel test · test kahini (oracle): aynı model.onnx'i Python ONNX Runtime ile çalıştırır.

    .venv/bin/python tests/parite.py --yaz            # tests/parite.json'u yerel model/ ile (yeniden) üret
    .venv/bin/python tests/parite.py                  # parite.json'daki beklenen olasılıkları yerel model/ ile doğrula
    .venv/bin/python tests/parite.py --url <HF_BASE>  # aynı doğrulamayı commit'e sabitli Hugging Face dosyasıyla yap

Diğer tüketiciler (tarayıcı: cypress/e2e/model.cy.ts, sunucu: POST /api/risk) aynı JSON'a karşı < 1e-4 toleransla test edilir.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

import numpy as np
import onnxruntime as ort

KOK = Path(__file__).resolve().parent.parent
PARITE = KOK / "tests" / "parite.json"
TOLERANS = 1e-4

# 5 referans girdi: düşük/yüksek risk, iki sahne, uç değerler (eşik çevresi dahil).
REFERANS = [
    {"ad": "aceleci yeni başlayan, Karar 2", "sahne_no": 2, "seviye": 0, "onceki_oyun_sayisi": 0, "onceki_riskli_sayisi": 1,
     "onceki_karar_suresi_sn": 4, "onceki_okuma_suresi_sn": 2, "tutor_mesaj_sayisi": 0},
    {"ad": "dikkatli deneyimli, 4. oyun, Karar 2", "sahne_no": 2, "seviye": 2, "onceki_oyun_sayisi": 3, "onceki_riskli_sayisi": 0,
     "onceki_karar_suresi_sn": 25, "onceki_okuma_suresi_sn": 20, "tutor_mesaj_sayisi": 2},
    {"ad": "iki riskli seçim sonrası, Karar 3", "sahne_no": 3, "seviye": 1, "onceki_oyun_sayisi": 0, "onceki_riskli_sayisi": 2,
     "onceki_karar_suresi_sn": 3.5, "onceki_okuma_suresi_sn": 1.2, "tutor_mesaj_sayisi": 0},
    {"ad": "ortalama oyuncu, Karar 3", "sahne_no": 3, "seviye": 1, "onceki_oyun_sayisi": 1, "onceki_riskli_sayisi": 1,
     "onceki_karar_suresi_sn": 12.4, "onceki_okuma_suresi_sn": 9.7, "tutor_mesaj_sayisi": 1},
    {"ad": "uç değerler: çok uzun okuma, çok tutor", "sahne_no": 2, "seviye": 0, "onceki_oyun_sayisi": 10, "onceki_riskli_sayisi": 0,
     "onceki_karar_suresi_sn": 59.9, "onceki_okuma_suresi_sn": 120, "tutor_mesaj_sayisi": 8},
]


def oku(kaynak: str, ad: str) -> bytes:
    if kaynak.startswith("http"):
        with urllib.request.urlopen(kaynak.rstrip("/") + "/" + ad, timeout=30) as r:
            return r.read()
    return (Path(kaynak) / ad).read_bytes()


def olasiliklar(kaynak: str) -> tuple[list[float], dict, str]:
    config = json.loads(oku(kaynak, "config.json"))
    model = oku(kaynak, "model.onnx")
    oturum = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
    adlar = [f["name"] for f in config["features"]]
    X = np.array([[r[a] for a in adlar] for r in REFERANS], dtype=np.float32)
    p = oturum.run(["probabilities"], {config["onnx"]["input"]: X})[0][:, 1]
    return [float(v) for v in p], config, hashlib.sha256(model).hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--yaz", action="store_true")
    ap.add_argument("--url", default=str(KOK / "model"))
    args = ap.parse_args()

    p, config, ozet = olasiliklar(args.url)
    if args.yaz:
        veri = {
            "aciklama": "Test kahini: Python onnxruntime. Diğer tüketiciler |p - p_beklenen| < tolerans sağlamalı.",
            "tolerans": TOLERANS,
            "model_surumu": config["version"],
            "model_sha256": ozet,
            "karar_esigi": config["karar_esigi"],
            "girdiler": [{**r, "p_beklenen": round(v, 8)} for r, v in zip(REFERANS, p)],
        }
        PARITE.write_text(json.dumps(veri, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        for r, v in zip(REFERANS, p):
            print(f"  {v:.6f}  {'≥' if v >= config['karar_esigi'] else '<'} eşik  · {r['ad']}")
        print(f"✓ {PARITE.relative_to(KOK)} yazıldı (model sha256 {ozet[:12]}…)")
        return 0

    beklenen = json.loads(PARITE.read_text(encoding="utf-8"))
    if beklenen["model_sha256"] != ozet:
        print(f"✗ model dosyası farklı: beklenen {beklenen['model_sha256'][:12]}…, bulunan {ozet[:12]}… (parite.json'u --yaz ile yenileyin)")
        return 1
    maks = max(abs(a - g["p_beklenen"]) for a, g in zip(p, beklenen["girdiler"]))
    durum = "✓" if maks < beklenen["tolerans"] else "✗"
    print(f"{durum} {args.url} · 5 girdi · maks |fark| {maks:.2e} (tolerans {beklenen['tolerans']})")
    return 0 if maks < beklenen["tolerans"] else 1


if __name__ == "__main__":
    sys.exit(main())
