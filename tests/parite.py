"""Diferansiyel test · test kahini (oracle): aynı model.onnx'i Python ONNX Runtime ile çalıştırır.

    .venv/bin/python tests/parite.py --yaz            # tests/parite.json (5 referans) + tests/parite300.json (300 girdi) üret
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
PARITE300 = KOK / "tests" / "parite300.json"
TOLERANS = 1e-4
TOHUM_300 = 2026
TAMSAYI = {"sahne_no", "seviye", "onceki_oyun_sayisi", "onceki_riskli_sayisi", "tutor_mesaj_sayisi"}

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


def yukle(kaynak: str):
    config = json.loads(oku(kaynak, "config.json"))
    model = oku(kaynak, "model.onnx")
    return config, ort.InferenceSession(model, providers=["CPUExecutionProvider"]), hashlib.sha256(model).hexdigest()


def calistir(config, oturum, girdiler: list[dict]) -> list[float]:
    adlar = [f["name"] for f in config["features"]]
    X = np.array([[r[a] for a in adlar] for r in girdiler], dtype=np.float32)
    return [float(v) for v in oturum.run(["probabilities"], {config["onnx"]["input"]: X})[0][:, 1]]


def olasiliklar(kaynak: str) -> tuple[list[float], dict, str]:
    config, oturum, ozet = yukle(kaynak)
    return calistir(config, oturum, REFERANS), config, ozet


def girdiler_300(config: dict, oturum) -> list[tuple[str, dict]]:
    """Ders provasındaki gibi 300 girdi, üç katman:
    - 10 köşe: tüm-min, tüm-max, her özellik tek başına uçta, tipik değer
    - 120 sözleşme aralığının tamamından tohumlu rastgele (sağlamlık)
    - 140 gerçekçi aralıktan rastgele (süre 0,5–60 sn, oyun 0–6, tutor 0–5)
    - 30 eşik çevresi: p ≈ karar eşiği olacak şekilde ikiye bölmeyle bulunan girdiler. Bir tüketicideki
      küçük bir sayısal fark kararı yalnızca burada tersine çevirebilir; tolerans en çok burada önemlidir.
    """
    rng = np.random.default_rng(TOHUM_300)
    F = config["features"]
    orta = {f["name"]: f["example"] for f in F}
    out: list[tuple[str, dict]] = [("kose", {f["name"]: f["min"] for f in F}), ("kose", {f["name"]: f["max"] for f in F})]
    out += [("kose", {**orta, f["name"]: f["max"]}) for f in F]
    out.append(("kose", dict(orta)))

    def ornek(gercekci: bool) -> dict:
        r = {}
        for f in F:
            hi = f["max"]
            if gercekci:
                hi = {"onceki_oyun_sayisi": 6, "tutor_mesaj_sayisi": 5}.get(f["name"], min(hi, 60))
            if f["name"] in TAMSAYI:
                r[f["name"]] = int(rng.integers(f["min"], hi + 1))
            else:
                lo = 0.5 if gercekci else 0.1
                r[f["name"]] = round(float(np.exp(rng.uniform(np.log(lo), np.log(hi)))), 1)
        return r

    out += [("rastgele", ornek(False)) for _ in range(120)]
    out += [("gercekci", ornek(True)) for _ in range(140)]

    esik = config["karar_esigi"]
    while len(out) < 300:  # okuma süresini ikiye bölerek p ≈ eşik noktasını bul
        r = ornek(True)
        lo, hi = 0.0, 600.0
        p_lo = calistir(config, oturum, [{**r, "onceki_okuma_suresi_sn": lo}])[0]
        p_hi = calistir(config, oturum, [{**r, "onceki_okuma_suresi_sn": hi}])[0]
        if not (p_hi < esik < p_lo):
            continue
        for _ in range(40):
            orta_t = (lo + hi) / 2
            if calistir(config, oturum, [{**r, "onceki_okuma_suresi_sn": orta_t}])[0] >= esik:
                lo = orta_t
            else:
                hi = orta_t
        out.append(("esik", {**r, "onceki_okuma_suresi_sn": round(lo, 3)}))
    return out


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
        cfg, oturum, _ = yukle(args.url)
        katmanli = girdiler_300(cfg, oturum)
        g300 = [g for _, g in katmanli]
        p300 = calistir(cfg, oturum, g300)
        PARITE300.write_text(json.dumps({
            "aciklama": "300 girdilik diferansiyel test (290 tohumlu rastgele + 10 köşe). Test kahini: Python onnxruntime.",
            "tolerans": TOLERANS, "tohum": TOHUM_300, "model_surumu": config["version"], "model_sha256": ozet,
            "ozellikler": [f["name"] for f in cfg["features"]],
            "katman": [k for k, _ in katmanli],
            "girdiler": [[g[f["name"]] for f in cfg["features"]] for g in g300],
            "p_beklenen": [round(v, 8) for v in p300],
        }, ensure_ascii=False) + "\n", encoding="utf-8")
        yakin = sum(abs(v - config["karar_esigi"]) < 1e-3 for v in p300)
        print(f"✓ {PARITE300.relative_to(KOK)} yazıldı (300 girdi, p {min(p300):.4f}–{max(p300):.4f}, "
              f"{sum(v >= config['karar_esigi'] for v in p300)} eşik üstü, {yakin} tanesi eşiğin ±0,001 içinde)")
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
    b300 = json.loads(PARITE300.read_text(encoding="utf-8"))
    cfg, oturum, _ = yukle(args.url)
    p300 = calistir(cfg, oturum, [dict(zip(b300["ozellikler"], g)) for g in b300["girdiler"]])
    maks300 = max(abs(a - b) for a, b in zip(p300, b300["p_beklenen"]))
    print(f"{'✓' if maks300 < TOLERANS else '✗'} {args.url} · 300 girdi · maks |fark| {maks300:.2e}")
    return 0 if maks < beklenen["tolerans"] and maks300 < TOLERANS else 1


if __name__ == "__main__":
    sys.exit(main())
