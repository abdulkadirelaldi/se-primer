"""Model değerlendirme raporu → model/DEGERLENDIRME.md     .venv/bin/python tests/eval_raporu.py

Spec'teki eval kapısı tek bir ayırmaya bakar. Bu rapor daha geniş bir resim verir:
  1. 30 gruplu ayırmada model ve üç taban çizgisi (ML basit bir kuraldan iyi mi?)
  2. Spec ayırmasında (tohum 42) karışıklık matrisi, sahne bazında metrik, kalibrasyon
  3. Gerçek ve sentetik veri karşılaştırması (dağılım kayması) ve gölge dağıtım sonuçları
Eşikleri ya da modeli değiştirmez; yalnızca ölçer ve raporlar.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score, brier_score_loss, confusion_matrix, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK))
from train import MODEL_SAHNELERI, OZELLIKLER, TOHUM  # noqa: E402

ADLAR = [o["name"] for o in OZELLIKLER]
N_AYIRMA = 30


def lr(cw=None, ozellikler=None):
    return ozellikler or ADLAR, Pipeline([("olcek", StandardScaler()),
                                          ("lr", LogisticRegression(random_state=TOHUM, max_iter=1000, class_weight=cw))])


def kural(X: pd.DataFrame) -> np.ndarray:
    """Model olmasaydı yazılacak elle kural: önceki kararda riskli seçtiyse ya da geri bildirimi 3 sn'den kısa okuduysa."""
    return ((X["onceki_riskli_sayisi"] >= 1) | (X["onceki_okuma_suresi_sn"] < 3)).astype(float).to_numpy()


def bicim(a: np.ndarray) -> str:
    return f"{a.mean():.3f} ({a.min():.3f}–{a.max():.3f})"


def main() -> int:
    tum = pd.read_csv(KOK / "data" / "oturumlar.csv")
    d = tum[tum["sahne_no"].isin(MODEL_SAHNELERI)].reset_index(drop=True)
    X, y, g = d[ADLAR].astype(float), d["riskli_secim"].to_numpy(), d["katilimci_id"]
    config = json.loads((KOK / "model" / "config.json").read_text(encoding="utf-8"))

    adaylar = {
        "**Model** (LR, `class_weight=balanced`, 7 özellik)": ("model", lr("balanced")),
        "LR, ağırlıksız (Deneme 2)": ("model", lr(None)),
        "Yalnız beyan: LR(`seviye`, `sahne_no`)": ("model", lr("balanced", ["seviye", "sahne_no"])),
        "Elle kural: önceki riskli ≥ 1 ya da okuma < 3 sn": ("kural", None),
        "Çoğunluk sınıfı (hep “güvenli”)": ("cogunluk", None),
    }
    sonuc = {ad: {"auc": [], "bacc": []} for ad in adaylar}
    for tohum in range(N_AYIRMA):
        tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=tohum).split(X, y, g))
        for ad, (tur, m) in adaylar.items():
            if tur == "model":
                oz, pipe = m
                pipe.fit(X.iloc[tr][oz], y[tr])
                p = pipe.predict_proba(X.iloc[te][oz])[:, 1]
            elif tur == "kural":
                p = kural(X.iloc[te])
            else:
                p = np.zeros(len(te))
            sonuc[ad]["auc"].append(roc_auc_score(y[te], p) if len(set(y[te])) == 2 else np.nan)
            sonuc[ad]["bacc"].append(balanced_accuracy_score(y[te], p >= 0.5))

    satirlar = []
    for ad, r in sonuc.items():
        auc, bacc = np.array(r["auc"]), np.array(r["bacc"])
        satirlar.append(f"| {ad} | {bicim(auc)} | {bicim(bacc)} | {(bacc >= config['esikler']['dengeli_dogruluk']).sum()}/{N_AYIRMA} |")

    # Spec ayırması (tohum 42): yayınlanan modelle aynı
    tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=TOHUM).split(X, y, g))
    _, pipe = lr("balanced")
    pipe.fit(X.iloc[tr], y[tr])
    p = pipe.predict_proba(X.iloc[te])[:, 1]
    yt = y[te]
    tn, fp, fn, tp = confusion_matrix(yt, p >= 0.5).ravel()
    sahne = []
    for s in MODEL_SAHNELERI:
        m = d["sahne_no"].iloc[te].to_numpy() == s
        sahne.append(f"| Karar {s} | {m.sum()} | {yt[m].mean():.2f} | {roc_auc_score(yt[m], p[m]):.3f} | {balanced_accuracy_score(yt[m], p[m] >= 0.5):.3f} |")
    kal = []
    for lo, hi in [(0, .2), (.2, .4), (.4, .6), (.6, .8), (.8, 1.0001)]:
        m = (p >= lo) & (p < hi)
        if m.sum():
            kal.append(f"| {lo:.1f}–{min(hi, 1):.1f} | {m.sum()} | {p[m].mean():.2f} | {yt[m].mean():.2f} |")

    # Gerçek ve sentetik: dağılım kayması ve gölge dağıtım
    gr, sn = tum[tum["kaynak"] == "gercek"], tum[tum["kaynak"] == "sentetik"]
    def med(df, c):
        v = pd.to_numeric(df[c], errors="coerce").dropna()
        return f"{v.median():.1f}" if len(v) else "—"
    kayma = [f"| {ad} | {med(sn, c)} | {med(gr, c)} |" for ad, c in
             [("Karar süresi, medyan (sn)", "karar_suresi_sn"), ("Geri bildirim okuma süresi, medyan (sn)", "okuma_suresi_sn")]]
    kayma.append(f"| Riskli seçim oranı (tüm kararlar) | {sn['riskli_secim'].mean():.2f} | {gr['riskli_secim'].mean():.2f} |" if len(gr) else "")
    kayma.append(f"| Tutor kullanılan oturum oranı | {(sn.groupby('oturum_id')['tutor_mesaj_sayisi'].max() > 0).mean():.2f} | "
                 f"{(gr.groupby('oturum_id')['tutor_mesaj_sayisi'].max() > 0).mean() if len(gr) else 0:.2f} |")
    golge = gr[(gr["sahne_no"].isin(MODEL_SAHNELERI)) & gr["model_p"].notna()]
    golge_satir = "Gölge kaydı yok."
    if len(golge):
        mp, gy = golge["model_p"].astype(float).to_numpy(), golge["riskli_secim"].to_numpy()
        isabet = ((mp >= 0.5) == gy).mean()
        golge_satir = (f"{len(golge)} karar ({golge['oturum_id'].nunique()} oturum) · gölge modelin (`{golge['model_surumu'].iloc[0]}`) "
                       f"kartı **göstereceği** karar oranı {(mp >= 0.5).mean():.2f}, gerçekte riskli seçim oranı {gy.mean():.2f}, "
                       f"eşik 0,5'te isabet {isabet:.2f}. n çok küçük; bu bir gösterge, kanıt değil.")

    rapor = f"""# Değerlendirme raporu · v{config['version']} ({config['surum_turu']})

_Üretildi: `python tests/eval_raporu.py` · veri sha256 `{config['data']['sha256'][:12]}…` · eşikleri ya da modeli değiştirmez._

## 1. Spec protokolü (eval kapısı, `train.py`)

Tek ayırma, tohum {TOHUM}: ROC-AUC **{config['metrics']['test']['roc_auc']}** (eşik {config['esikler']['roc_auc']}) · dengeli doğruluk **{config['metrics']['test']['dengeli_dogruluk']}** (eşik {config['esikler']['dengeli_dogruluk']}) · ONNX↔sklearn fark {config['metrics']['onnx_sklearn_maks_fark']:.1e} · gerçek oturum {config['data']['n_gercek_oturum']} (eşik {config['esikler']['gercek_oturum']}) → **{'yayın adayı' if config['metrics']['kapi_gecti'] else 'taslak (E4 sağlanmadı)'}**

## 2. ML basit bir kuraldan iyi mi? · {N_AYIRMA} gruplu ayırma

Aynı {N_AYIRMA} katılımcı-gruplu ayırmada (test %25), ortalama (min–maks):

| Aday | ROC-AUC | Dengeli doğruluk (eşik 0,5) | E2'yi geçen ayırma |
|---|---|---|---|
{chr(10).join(satirlar)}

**Okuma:**
- **Model ile elle kural** karşılaştırması, ML'nin buradaki gerçek katkısını gösteriyor: davranış sinyallerini birlikte tartmak.
- **Yalnız beyan** modeli, oyuncunun kendi söylediği seviyenin riski ne kadar az açıkladığını gösteriyor; v2'nin varlık nedeni bu.
- **Model eşik sınırında:** Ortalama dengeli doğruluk eşiğe çok yakın. Spec ayırmasında kapıyı geçmesi, kısmen hangi katılımcıların teste düştüğüne bağlı (`spec.md` › Revizyon 2).

## 3. Spec ayırmasında ayrıntı (yayınlanan modelin test kümesi)

**Karışıklık matrisi** (eşik 0,5, n = {len(yt)}):

| | Tahmin: güvenli | Tahmin: riskli |
|---|---:|---:|
| **Gerçek: güvenli** | {tn} | {fp} (gereksiz kart) |
| **Gerçek: riskli** | {fn} (kaçırılan) | {tp} |

Yanlış pozitifin maliyeti düşük (oyuncu fazladan bir soru görür). Yanlış negatifte v1 davranışına düşülür. Sınıf ağırlıklandırma bu yüzden duyarlılığı (riskli oyuncuyu yakalamayı) öne çıkarır.

**Sahne bazında:**

| Sahne | n | Riskli oranı | ROC-AUC | Dengeli doğruluk |
|---|---:|---:|---:|---:|
{chr(10).join(sahne)}

**Kalibrasyon** (Brier {brier_score_loss(yt, p):.3f}): `class_weight` olasılıkları bilerek yukarı kaydırır. Bu yüzden `p` bir “risk puanı” olarak okunmalı, gerçek olasılık olarak değil. Kartta gösterilen yüzde de bu nedenle “eğilim” diye sunuluyor.

| Tahmin aralığı | n | Ortalama p | Gözlenen riskli oranı |
|---|---:|---:|---:|
{chr(10).join(kal)}

## 4. Gerçek ve sentetik: dağılım kayması ve gölge dağıtım

| | Sentetik | Gerçek ({config['data']['n_gercek_oturum']} oturum) |
|---|---:|---:|
{chr(10).join(x for x in kayma if x)}

**Gölge dağıtım:** {golge_satir}

**Bulgu:** Gerçek oyuncular sentetik varsayımdan çok daha hızlı karar veriyor ve geri bildirimi çok daha kısa okuyor. Sentetik üretici “aceleci oyuncu” profilini gerçekten daha yavaş varsaymış. Bu bir **dağılım kayması** (Amershi vd., 2019): sentetik veride öğrenilen eşikler gerçek kullanıcıda kartı çok sık açabilir. Gerçek veri arttıkça yapılacaklar: (1) sentetik üreticinin süre dağılımını gerçek medyanlara göre yeniden ayarlamak (yeni sürüm, yeni spec), (2) gölge modda kart gösterme oranını izlemek.
"""
    (KOK / "model" / "DEGERLENDIRME.md").write_text(rapor, encoding="utf-8")
    print(rapor.split("## 3.")[0])
    return 0


if __name__ == "__main__":
    sys.exit(main())
