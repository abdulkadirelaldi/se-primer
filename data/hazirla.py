"""data/oturumlar.csv'yi üretir: sentetik oturumlar (sabit tohum) + data/gercek/*.csv (Veri Toplama Modu dışa aktarımları).

    .venv/bin/python data/hazirla.py

Sentetik üretici kuralı (README'de de yazılı):
  Her sanal katılımcının gizli bir "acelecilik" eğilimi vardır: a ~ N(0, 1).
  Aceleci oyuncu (a büyük) daha kısa düşünür, geri bildirimi daha kısa okur, tutor'u daha az kullanır
  ve riskli seçeneği daha sık seçer. Oyuncu tekrar oynadıkça (onceki_oyun_sayisi) daha az risk alır.
    karar_suresi_sn  = clip(exp(N(2.7 - 0.45a + 0.15*seviye, 0.35)), 1, 60)      (deneyimlide 60 = süre doldu → B)
    okuma_suresi_sn  = clip(exp(N(2.4 - 0.55a, 0.40)), 0.5, 90)
    tutor mesajı     ~ Poisson(max(0.05, 0.55 - 0.30a + 0.35*[seviye=0]))
    logit P(B)       = -0.55 + 0.95a + 0.20*seviye - 0.50*oyun_no + 0.45*onceki_riskli + 0.35*[sahne=2] - 0.25*[sahne=3]
  Model, gizli a'yı göremez; yalnızca a'nın davranışa yansıyan izlerini (süreler, tutor, önceki seçimler) görür.
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

import numpy as np

KOK = Path(__file__).resolve().parent
TOHUM = 42
N_KATILIMCI = 120

SUTUNLAR = [
    "oturum_id", "katilimci_id", "kaynak", "seviye", "rol", "hedef", "sahne_no",
    "onceki_oyun_sayisi", "onceki_riskli_sayisi", "onceki_karar_suresi_sn", "onceki_okuma_suresi_sn",
    "tutor_mesaj_sayisi", "karar_suresi_sn", "okuma_suresi_sn", "secim", "zaman_asimi", "riskli_secim",
    "model_p", "model_surumu",
]
ROLLER = ["backend", "qa", "devops"]
HEDEFLER = ["architecture", "testing", "security"]


def _kimlik(rng: np.random.Generator, onek: str, n: int = 6) -> str:
    return onek + "".join(rng.choice(list("0123456789ABCDEF"), size=n))


def sentetik(rng: np.random.Generator) -> list[dict]:
    satirlar: list[dict] = []
    for _ in range(N_KATILIMCI):
        katilimci = _kimlik(rng, "S-", 4)
        a = rng.normal(0, 1)
        seviye = int(rng.choice([0, 1, 2], p=[0.4, 0.35, 0.25]))
        oyun_adedi = int(rng.integers(1, 6))
        for oyun_no in range(oyun_adedi):
            oturum = _kimlik(rng, "s-", 8)
            rol, hedef = str(rng.choice(ROLLER)), str(rng.choice(HEDEFLER))
            onceki_riskli, onceki_karar, onceki_okuma, tutor = 0, 0.0, 0.0, 0
            for sahne in (1, 2, 3):
                logit = (-0.55 + 0.95 * a + 0.20 * seviye - 0.50 * oyun_no + 0.45 * onceki_riskli
                         + 0.35 * (sahne == 2) - 0.25 * (sahne == 3))
                karar = float(np.clip(np.exp(rng.normal(2.7 - 0.45 * a + 0.15 * seviye, 0.35)), 1, 60))
                zaman_asimi = seviye == 2 and karar >= 60
                riskli = bool(zaman_asimi or rng.random() < 1 / (1 + np.exp(-logit)))
                okuma = float(np.clip(np.exp(rng.normal(2.4 - 0.55 * a, 0.40)), 0.5, 90))
                satirlar.append({
                    "oturum_id": oturum, "katilimci_id": katilimci, "kaynak": "sentetik",
                    "seviye": seviye, "rol": rol, "hedef": hedef, "sahne_no": sahne,
                    "onceki_oyun_sayisi": oyun_no, "onceki_riskli_sayisi": onceki_riskli,
                    "onceki_karar_suresi_sn": round(onceki_karar, 1), "onceki_okuma_suresi_sn": round(onceki_okuma, 1),
                    "tutor_mesaj_sayisi": tutor, "karar_suresi_sn": round(karar, 1), "okuma_suresi_sn": round(okuma, 1),
                    "secim": "B" if riskli else "A", "zaman_asimi": int(zaman_asimi), "riskli_secim": int(riskli),
                    "model_p": "", "model_surumu": "",
                })
                # Bir sonraki sahnenin "önceki" özellikleri; tutor bu sahnede kullanıldıysa sayaç artar.
                tutor += int(rng.poisson(max(0.05, 0.55 - 0.30 * a + 0.35 * (seviye == 0))))
                onceki_riskli += int(riskli)
                onceki_karar, onceki_okuma = karar, okuma
    return satirlar


def gercek() -> list[dict]:
    """data/gercek/*.csv: uygulamanın Veri Toplama Modu'ndan indirilen dosyalar."""
    satirlar: list[dict] = []
    gorulen: set[tuple[str, str]] = set()
    for yol in sorted((KOK / "gercek").glob("*.csv")):
        with yol.open(encoding="utf-8-sig") as f:
            okuyucu = csv.DictReader(f)
            fazla = set(okuyucu.fieldnames or []) - set(SUTUNLAR)
            eksik = set(SUTUNLAR) - set(okuyucu.fieldnames or [])
            if fazla or eksik:
                sys.exit(f"✗ {yol.name}: şema uyuşmuyor (fazla: {sorted(fazla)}, eksik: {sorted(eksik)})")
            for s in okuyucu:
                if s["kaynak"] != "gercek":
                    sys.exit(f"✗ {yol.name}: kaynak sütunu 'gercek' olmalı, '{s['kaynak']}' bulundu")
                anahtar = (s["oturum_id"], s["sahne_no"])
                if anahtar in gorulen:  # aynı dosya iki kez kopyalanırsa satırlar çiftlenmesin
                    continue
                gorulen.add(anahtar)
                satirlar.append(s)
    return satirlar


def main() -> None:
    rng = np.random.default_rng(TOHUM)
    s, g = sentetik(rng), gercek()
    with (KOK / "oturumlar.csv").open("w", newline="", encoding="utf-8") as f:
        yazici = csv.DictWriter(f, fieldnames=SUTUNLAR)
        yazici.writeheader()
        yazici.writerows(s + g)
    g_oturum = len({r["oturum_id"] for r in g})
    g_kisi = len({r["katilimci_id"] for r in g})
    print(f"✓ data/oturumlar.csv: {len(s)} sentetik satır, {len(g)} gerçek satır "
          f"({g_oturum} gerçek oturum, {g_kisi} gerçek katılımcı)")


if __name__ == "__main__":
    main()
