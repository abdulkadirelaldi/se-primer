"""KÖ-6 · Eval kapısı ve tekrarlanabilir eğitim.   .venv/bin/python tests/test_egitim.py

1. Eşik yapay olarak yükseltildiğinde train.py çıkış kodu 1 ile durur ve çıktı klasörüne hiçbir şey yazmaz.
2. Aynı veriyle iki ayrı koşu byte düzeyinde aynı config.json ve model.onnx üretir (sabit tohum).
3. Depodaki model/ artefaktı, depodaki veriden yeniden üretilebilir (aynı metrikler).
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent


def egit(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, str(KOK / "train.py"), "--taslak", *args], capture_output=True, text=True)


def ozet(yol: Path) -> str:
    return hashlib.sha256(yol.read_bytes()).hexdigest()


def main() -> int:
    hatalar = []
    with tempfile.TemporaryDirectory() as t:
        t = Path(t)

        r = egit("--esik-auc", "0.99", "--cikti", str(t / "red"))
        if r.returncode != 1 or "EVAL KAPISI" not in r.stdout:
            hatalar.append(f"eşik altı model durmadı (çıkış {r.returncode})")
        if (t / "red").exists() and any((t / "red").iterdir()):
            hatalar.append("eşik altı koşu çıktı klasörüne dosya yazdı")
        else:
            print("✓ eşik altı: çıkış kodu 1, artefakt yazılmadı")

        # E0: sözleşme dışı ya da çelişkili veri eğitime girmez
        import pandas as pd
        bozuk = pd.read_csv(KOK / "data" / "oturumlar.csv")
        bozuk.loc[bozuk.index[4], "onceki_okuma_suresi_sn"] = -3          # aralık dışı
        bozuk.loc[bozuk.index[7], "secim"] = "A" if bozuk.loc[bozuk.index[7], "riskli_secim"] else "B"  # çelişki
        bozuk.to_csv(t / "bozuk.csv", index=False)
        r = egit("--veri", str(t / "bozuk.csv"), "--cikti", str(t / "bozuk"))
        if r.returncode != 1 or "E0" not in r.stdout or "çelişiyor" not in r.stdout or (t / "bozuk").exists():
            hatalar.append(f"bozuk veri yakalanmadı: {r.stdout[-300:]}")
        else:
            print("✓ veri doğrulama (E0): aralık dışı ve çelişkili satır yakalandı, eğitim başlamadı")

        a, b = egit("--cikti", str(t / "a")), egit("--cikti", str(t / "b"))
        if a.returncode or b.returncode:
            hatalar.append(f"normal eğitim başarısız: {a.stdout[-300:]}")
        else:
            ayni = all(ozet(t / "a" / f) == ozet(t / "b" / f) for f in ("config.json", "model.onnx"))
            if not ayni:
                hatalar.append("iki koşu farklı artefakt üretti")
            else:
                print("✓ tekrarlanabilir: iki koşuda config.json ve model.onnx byte düzeyinde aynı")

            depodaki = json.loads((KOK / "model" / "config.json").read_text(encoding="utf-8"))
            yeni = json.loads((t / "a" / "config.json").read_text(encoding="utf-8"))
            # ONNX↔sklearn farkı (≈1e-8) CPU'nun kayan nokta yoluna göre makineden makineye değişir; kapı ≤ 1e-4 olduğunu ayrıca denetler.
            # Model metrikleri ve veri özeti ise her ortamda birebir aynı olmalı.
            ayni_metrik = all(depodaki["metrics"][k] == yeni["metrics"][k] for k in ("test", "gercek_test", "kapi_gecti"))
            if not ayni_metrik or depodaki["data"]["sha256"] != yeni["data"]["sha256"] or depodaki["katsayilar"] != yeni["katsayilar"]:
                hatalar.append("model/config.json depodaki veriden yeniden üretilemiyor (önce train.py çalıştırın)")
            else:
                print(f"✓ model/ depodaki veriden yeniden üretilebiliyor (ROC-AUC {yeni['metrics']['test']['roc_auc']})")

    for h in hatalar:
        print(f"✗ {h}")
    return 1 if hatalar else 0


if __name__ == "__main__":
    sys.exit(main())
