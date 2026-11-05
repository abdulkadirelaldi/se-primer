"""SE Primer v2 · "Kötü sona gitme riski" modeli: eğit → ölç → eval kapısı → ONNX + config.json + model kartı.

    .venv/bin/python train.py                  # yayın adayı: E1–E4 (spec.md §10) sağlanmazsa çıkış kodu 1, model/ değişmez
    .venv/bin/python train.py --taslak         # gerçek oturum < 15 iken geliştirme için; config'e "taslak" yazılır
    .venv/bin/python train.py --esik-auc 0.99  # kapının çalıştığını göstermek için eşiği yapay olarak yükselt (KÖ-6)

Eşikler spec.md §10'da eğitimden önce yazıldı; burada yalnızca okunur.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import platform
import shutil
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd

KOK = Path(__file__).resolve().parent
VERI = KOK / "data" / "oturumlar.csv"
MODEL_DIR = KOK / "model"
TOHUM = 42
SURUM = "2.0.0"

# spec.md §10 — altın standart (eğitimden önce sabitlendi)
ESIK_AUC = 0.75
ESIK_BACC = 0.70
ESIK_ONNX_FARK = 1e-4
ESIK_GERCEK_OTURUM = 15
KARAR_ESIGI = 0.5
# Revizyon 1 (spec.md): Karar 1'de davranış gözlenmediği için model yalnız Karar 2–3'te çalışır (soğuk başlangıç).
MODEL_SAHNELERI = (2, 3)

# Sözleşme: sıra = ONNX girdi tensörünün sütun sırası. Değiştirmek yeni bir major sürümdür.
OZELLIKLER = [
    {"name": "sahne_no", "label": "Sahne (karar) numarası", "unit": "2 ya da 3", "min": 2, "max": 3, "example": 2},
    {"name": "seviye", "label": "Beyan edilen seviye", "unit": "0 yeni · 1 orta · 2 deneyimli", "min": 0, "max": 2, "example": 0},
    {"name": "onceki_oyun_sayisi", "label": "Bu cihazda daha önce tamamlanan oyun", "unit": "adet", "min": 0, "max": 50, "example": 0},
    {"name": "onceki_riskli_sayisi", "label": "Bu oturumda önceki riskli seçim", "unit": "adet (0–2)", "min": 0, "max": 2, "example": 1},
    {"name": "onceki_karar_suresi_sn", "label": "Önceki sahnede karar süresi", "unit": "saniye", "min": 0, "max": 600, "example": 4},
    {"name": "onceki_okuma_suresi_sn", "label": "Önceki geri bildirimi okuma süresi", "unit": "saniye", "min": 0, "max": 600, "example": 2},
    {"name": "tutor_mesaj_sayisi", "label": "O ana kadar tutor'a mesaj/ipucu isteği", "unit": "adet", "min": 0, "max": 50, "example": 0},
]
HEDEF = "riskli_secim"


def sha256(yol: Path) -> str:
    return hashlib.sha256(yol.read_bytes()).hexdigest()


def metrikler(y, p) -> dict:
    from sklearn.metrics import accuracy_score, balanced_accuracy_score, brier_score_loss, roc_auc_score

    tahmin = (p >= KARAR_ESIGI).astype(int)
    iki_sinif = len(np.unique(y)) == 2
    return {
        "n": int(len(y)),
        "pozitif_orani": round(float(np.mean(y)), 4),
        "roc_auc": round(float(roc_auc_score(y, p)), 4) if iki_sinif else None,
        "dengeli_dogruluk": round(float(balanced_accuracy_score(y, tahmin)), 4) if iki_sinif else None,
        "dogruluk": round(float(accuracy_score(y, tahmin)), 4),
        "cogunluk_taban_dogruluk": round(float(max(np.mean(y), 1 - np.mean(y))), 4),
        "brier": round(float(brier_score_loss(y, p)), 4),
    }


def onnx_aktar(model, X_ornek: pd.DataFrame, hedef_dizin: Path) -> float:
    """Başlangıç reposundaki onnx_aktar ile aynı sözleşme: girdi 'input' float32 [n, özellik], çıktı 'probabilities'."""
    import onnxruntime as ort
    from skl2onnx import to_onnx
    from skl2onnx.common.data_types import FloatTensorType

    onx = to_onnx(model, initial_types=[("input", FloatTensorType([None, X_ornek.shape[1]]))],
                  options={id(model): {"zipmap": False}}, target_opset=17)
    yol = hedef_dizin / "model.onnx"
    yol.write_bytes(onx.SerializeToString())
    oturum = ort.InferenceSession(str(yol), providers=["CPUExecutionProvider"])
    p_onnx = oturum.run(["probabilities"], {"input": X_ornek.to_numpy(np.float32)})[0]
    return float(np.abs(p_onnx - model.predict_proba(X_ornek)).max())


def model_karti(config: dict) -> str:
    m, g, v = config["metrics"]["test"], config["metrics"]["gercek_test"], config["data"]

    def satir(ad, anahtar):
        a, b = m.get(anahtar), (g or {}).get(anahtar)
        return f"| {ad} | {a if a is not None else '—'} | {b if b is not None else '—'} |"

    ozellik_tablosu = "\n".join(f"| {i + 1} | `{o['name']}` | {o['label']} | {o['unit']} |" for i, o in enumerate(config["features"]))
    katsayi = "\n".join(f"| `{k}` | {v_:+.3f} |" for k, v_ in config["katsayilar"].items())
    return f"""---
license: mit
library_name: onnx
tags: [tabular-classification, sklearn, onnx, education, se-primer]
language: [tr]
---

# SE Primer · Kötü sona gitme riski modeli (v{config['version']}{' · TASLAK' if config['surum_turu'] == 'taslak' else ''})

Model kartı (Mitchell vd., 2019 yapısında). Kaynak kod ve veri: https://github.com/abdulkadirelaldi/se-primer

## Amaç
SE Primer, yazılım mühendisi adayları için telefonda oynanan bir oyun-kitap. Bu model her karar sahnesi açılırken
oyuncunun **o sahnede riskli seçeneği (B) seçme olasılığını** (`p`) önceki davranışından tahmin eder.
Yalnızca **Karar 2–3**'te çalışır: Karar 1'de oyuncu henüz gözlenmediği için tahmin yapılmaz (soğuk başlangıç).
`p ≥ {config['karar_esigi']}` olduğunda oyun seçeneklerden önce bir “🧭 Dur ve düşün” Sokratik kartı gösterir.

## Kullanılmaması gereken durumlar
- Öğrenciyi **notlandırmak, sıralamak ya da yetkinlik ölçmek**: model bir eğilim tahmini yapar, bilgi ölçmez.
- Oyun dışındaki bir bağlamda (gerçek nöbet, işe alım, sınav) karar vermek.
- Bu 3 sahneden farklı bir senaryoya, yeniden eğitmeden uygulamak.

## Girdi sözleşmesi
ONNX girdisi `input`, float32 `[n, {len(config['features'])}]` (sütun sırası aşağıdaki gibidir). Çıktı `probabilities` float32 `[n, 2]`, ikinci sütun `p(riskli)`.

| # | Özellik | Anlam | Birim |
|---|---|---|---|
{ozellik_tablosu}

## Veri
- `data/oturumlar.csv` · sha256 `{v['sha256'][:16]}…` · {v['n_satir']} satır (her karar bir satır), modelde Karar 2–3'e ait {v['n_model_satir']} satır
- **Gerçek:** {v['n_gercek_oturum']} oturum, {v['n_gercek_katilimci']} katılımcı, {v['n_gercek_satir']} satır (uygulamanın Veri Toplama Modu ile, kişisel veri olmadan)
- **Sentetik:** {v['n_sentetik_satir']} satır, tohum {config['seed']}, üretici kuralı `data/hazirla.py` ve README'de
- Ayırma: katılımcı bazında gruplu (`GroupShuffleSplit`, test %25, tohum {config['seed']}). Aynı kişi hem eğitimde hem testte yok.

## Metrikler (test kümesi, karar eşiği {config['karar_esigi']})

| Metrik | Tüm test | Yalnız gerçek test satırları |
|---|---|---|
{satir('Satır', 'n')}
{satir('ROC-AUC', 'roc_auc')}
{satir('Dengeli doğruluk', 'dengeli_dogruluk')}
{satir('Doğruluk', 'dogruluk')}
{satir('Çoğunluk sınıfı tabanı', 'cogunluk_taban_dogruluk')}
{satir('Brier', 'brier')}

**Kabul eşiği (eğitimden önce, spec.md §10):** ROC-AUC ≥ {config['esikler']['roc_auc']} · dengeli doğruluk ≥ {config['esikler']['dengeli_dogruluk']} · ONNX↔sklearn fark ≤ {config['esikler']['onnx_fark']} · gerçek oturum ≥ {config['esikler']['gercek_oturum']}.
**Sonuç:** {'✅ eşikler geçildi' if config['metrics']['kapi_gecti'] else '⚠️ taslak: gerçek oturum eşiği sağlanmadı, yayınlanmaz'} · ONNX↔sklearn maks fark {config['metrics']['onnx_sklearn_maks_fark']:.1e}

## Katsayılar (standartlaştırılmış özellik başına, log-odds)
| Özellik | Katsayı |
|---|---|
{katsayi}

## Sınırlar
- **Gerçek veri küçük:** gerçek test satırı az olduğundan oradaki metriklerin güven aralığı çok geniş; “yalnız gerçek” sütunu bir gösterge, kanıt değil.
- **Sentetik veri baskın:** model, `data/hazirla.py`'deki varsayımları (aceleci oyuncu kısa okur ve risk alır) büyük ölçüde öğrenir. Gerçek oyuncular bu kalıba uymayabilir.
- **Soğuk başlangıç:** Karar 1'de model çalışmaz. İlk deneme (Karar 1–3) eval kapısında AUC 0,711 ile reddedildi; Karar 1'de AUC 0,574'tü (spec.md › Revizyon 1).
- **Geri besleme döngüsü:** kart gösterildiğinde oyuncu daha az risk alır; bu, sonraki sürümün etiketlerini etkiler. Bu yüzden veri toplama gölge modda (kart gösterilmeden) yapılır.
- **Model herkese açıktır** (tarayıcıda çalışır); gizli değildir. Hassas veriyle eğitilmediği için kabul edilebilir.

## Sürüm
`{config['version']}` · sklearn {config['sklearn_version']} · skl2onnx {config['skl2onnx_version']} · Python {config['python_version']}
Tüketiciler modeli `main`'den değil, commit'e sabitlenmiş URL'den indirir:
`https://huggingface.co/<repo_id>/resolve/<commit>/model.onnx`
"""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--taslak", action="store_true", help="gerçek oturum eşiğini (E4) atla; çıktı 'taslak' olarak işaretlenir")
    ap.add_argument("--esik-auc", type=float, default=ESIK_AUC)
    ap.add_argument("--esik-bacc", type=float, default=ESIK_BACC)
    ap.add_argument("--cikti", type=Path, default=MODEL_DIR, help="artefakt klasörü (testler geçici klasör verir)")
    args = ap.parse_args()

    import onnxruntime
    import skl2onnx
    import sklearn
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import GroupShuffleSplit
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler

    tum_veri = pd.read_csv(VERI)
    veri = tum_veri[tum_veri["sahne_no"].isin(MODEL_SAHNELERI)].reset_index(drop=True)
    adlar = [o["name"] for o in OZELLIKLER]
    eksik = [s for s in adlar + [HEDEF, "kaynak", "katilimci_id", "oturum_id"] if s not in veri.columns]
    if eksik:
        print(f"✗ veri şeması eksik: {eksik}")
        return 1
    if veri[adlar + [HEDEF]].isna().any().any():
        print("✗ özelliklerde ya da hedefte boş değer var")
        return 1

    X, y, gruplar = veri[adlar].astype("float32"), veri[HEDEF].astype(int).to_numpy(), veri["katilimci_id"]
    egitim_i, test_i = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=TOHUM).split(X, y, gruplar))
    X_tr, X_te, y_tr, y_te = X.iloc[egitim_i], X.iloc[test_i], y[egitim_i], y[test_i]

    model = Pipeline([("olcek", StandardScaler()), ("lr", LogisticRegression(random_state=TOHUM, max_iter=1000))])
    model.fit(X_tr, y_tr)
    p_te = model.predict_proba(X_te)[:, 1]
    m_test = metrikler(y_te, p_te)
    gercek_maske = (veri["kaynak"].iloc[test_i] == "gercek").to_numpy()
    m_gercek = metrikler(y_te[gercek_maske], p_te[gercek_maske]) if gercek_maske.sum() >= 2 else None

    gercek = tum_veri[tum_veri["kaynak"] == "gercek"]
    n_gercek_oturum = int(gercek["oturum_id"].nunique())

    print(f"Veri: {len(tum_veri)} satır, modelde {len(veri)} (Karar 2–3) · gerçek {n_gercek_oturum} oturum ({len(gercek)} satır) · eğitim {len(egitim_i)} / test {len(test_i)}")
    print(f"Test: ROC-AUC {m_test['roc_auc']} · dengeli doğruluk {m_test['dengeli_dogruluk']} · doğruluk {m_test['dogruluk']} "
          f"(çoğunluk tabanı {m_test['cogunluk_taban_dogruluk']})")
    if m_gercek:
        print(f"Yalnız gerçek test satırları (n={m_gercek['n']}): ROC-AUC {m_gercek['roc_auc']} · dengeli doğruluk {m_gercek['dengeli_dogruluk']}")

    # --- Eval kapısı (spec.md §10) ---
    hatalar = []
    if m_test["roc_auc"] is None or m_test["roc_auc"] < args.esik_auc:
        hatalar.append(f"E1 ROC-AUC {m_test['roc_auc']} < {args.esik_auc}")
    if m_test["dengeli_dogruluk"] is None or m_test["dengeli_dogruluk"] < args.esik_bacc:
        hatalar.append(f"E2 dengeli doğruluk {m_test['dengeli_dogruluk']} < {args.esik_bacc}")
    if n_gercek_oturum < ESIK_GERCEK_OTURUM and not args.taslak:
        hatalar.append(f"E4 gerçek oturum {n_gercek_oturum} < {ESIK_GERCEK_OTURUM} (geliştirme için --taslak)")

    with tempfile.TemporaryDirectory() as gecici:
        gecici_dizin = Path(gecici)
        fark = onnx_aktar(model, X_te, gecici_dizin)
        if fark > ESIK_ONNX_FARK:
            hatalar.append(f"E3 ONNX↔sklearn fark {fark:.2e} > {ESIK_ONNX_FARK}")

        if hatalar:
            print("\n✗ EVAL KAPISI: model yayınlanmadı, model/ değiştirilmedi.")
            for h in hatalar:
                print(f"  - {h}")
            return 1

        lr = model.named_steps["lr"]
        config = {
            "title": "SE Primer · Kötü sona gitme riski",
            "description": "Her karar sahnesi açılırken oyuncunun riskli seçeneği (B) seçme olasılığı.",
            "version": SURUM,
            "surum_turu": "taslak" if n_gercek_oturum < ESIK_GERCEK_OTURUM else "yayin",
            "target": HEDEF,
            "classes": [0, 1],
            "class_labels": {"0": "güvenli (A)", "1": "riskli (B)"},
            "positive_class_index": 1,
            "karar_esigi": KARAR_ESIGI,
            "model_sahneleri": list(MODEL_SAHNELERI),
            "onnx": {"input": "input", "input_dtype": "float32", "outputs": ["label", "probabilities"], "opset": 17},
            "features": OZELLIKLER,
            "esikler": {"roc_auc": args.esik_auc, "dengeli_dogruluk": args.esik_bacc,
                        "onnx_fark": ESIK_ONNX_FARK, "gercek_oturum": ESIK_GERCEK_OTURUM},
            "metrics": {"test": m_test, "gercek_test": m_gercek, "onnx_sklearn_maks_fark": float(f"{fark:.3e}"),
                        "kapi_gecti": n_gercek_oturum >= ESIK_GERCEK_OTURUM},
            "katsayilar": {o["name"]: round(float(c), 4) for o, c in zip(OZELLIKLER, lr.coef_[0])} | {"(sabit)": round(float(lr.intercept_[0]), 4)},
            "data": {"dosya": "data/oturumlar.csv", "sha256": sha256(VERI), "n_satir": int(len(tum_veri)), "n_model_satir": int(len(veri)),
                     "n_gercek_satir": int(len(gercek)), "n_gercek_oturum": n_gercek_oturum,
                     "n_gercek_katilimci": int(gercek["katilimci_id"].nunique()),
                     "n_sentetik_satir": int((tum_veri["kaynak"] == "sentetik").sum()),
                     "bolme": "GroupShuffleSplit(katilimci_id, test_size=0.25)", "n_egitim": int(len(egitim_i)), "n_test": int(len(test_i))},
            "seed": TOHUM,
            "sklearn_version": sklearn.__version__,
            "skl2onnx_version": skl2onnx.__version__,
            "onnxruntime_version": onnxruntime.__version__,
            "python_version": platform.python_version(),
        }
        (gecici_dizin / "config.json").write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (gecici_dizin / "README.md").write_text(model_karti(config), encoding="utf-8")

        # Hepsi hazırsa model/ klasörünü tek seferde değiştir (yarım artefakt kalmasın).
        args.cikti.mkdir(parents=True, exist_ok=True)
        for ad in ("model.onnx", "config.json", "README.md"):
            shutil.copyfile(gecici_dizin / ad, args.cikti / ad)

    print(f"\n✓ eşikler geçildi → {args.cikti.name}/ (model.onnx, config.json, README.md) · ONNX↔sklearn fark {fark:.1e} · "
          f"{config['surum_turu']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
