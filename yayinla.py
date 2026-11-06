"""model/ klasörünü Hugging Face'e yayınlar ve tüketicileri commit'e sabitler.

    .venv/bin/hf auth login                      # bir kez, "Write" token ile (kendi hesabınızda)
    .venv/bin/python yayinla.py                  # yayın: <kullanıcı>/se-primer-risk-onnx
    .venv/bin/python yayinla.py --kuru           # yalnız denetim, yükleme yok
    .venv/bin/python yayinla.py --aday 1         # E4 sağlanmadıysa: v2.0.0-rc1 aday (yalnız gölge, spec Revizyon 3)

Adımlar: (1) artefakt denetimi (eval kapısı geçilmiş, taslak değil, parite tutuyor) → (2) HF'ye yükle →
(3) sürüm etiketi → (4) commit'e sabitli URL'den indirip byte ve parite doğrula → (5) tüketicileri sabitle.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

KOK = Path(__file__).resolve().parent
MODEL_DIR = KOK / "model"
REPO_ADI = "se-primer-risk-onnx"
DOSYALAR = ("model.onnx", "config.json", "README.md")


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kuru", action="store_true", help="yükleme yapmadan denetle")
    ap.add_argument("--repo", default=REPO_ADI)
    ap.add_argument("--aday", type=int, help="aday numarası: taslak modeli -rcN etiketiyle yükle (yalnız gölge)")
    args = ap.parse_args()

    config = json.loads((MODEL_DIR / "config.json").read_text(encoding="utf-8"))
    if args.aday is None and (config["surum_turu"] != "yayin" or not config["metrics"]["kapi_gecti"]):
        print(f"✗ model/ terfi edilemez (surum_turu={config['surum_turu']}). Gerçek veriyle python train.py ya da --aday N")
        return 1
    if subprocess.run([sys.executable, str(KOK / "tests" / "parite.py")]).returncode:
        print("✗ parite.json güncel modelle uyuşmuyor: python tests/parite.py --yaz")
        return 1
    surum = config["version"] + (f"-rc{args.aday}" if args.aday is not None else "")
    print(f"✓ artefakt denetimi: v{surum}, E0–E3 geçildi, parite tutuyor" + (" · ADAY: yalnız gölge" if args.aday is not None else ""))
    if args.kuru:
        return 0

    from huggingface_hub import HfApi

    api = HfApi()
    kullanici = api.whoami()["name"]
    repo = f"{kullanici}/{args.repo}"
    api.create_repo(repo, repo_type="model", private=False, exist_ok=True)

    kart = (MODEL_DIR / "README.md").read_text(encoding="utf-8").replace("<repo_id>", repo)
    if args.aday is not None and "ADAY SÜRÜM" not in kart:
        kart = kart.replace("\n# ", f"\n> ⚠️ **ADAY SÜRÜM (v{surum}).** Eval kapısının E4 koşulu (≥ 15 gerçek oturum) henüz sağlanmadı. "
                            "Tüketiciler bu modeli **yalnızca gölge modda** çalıştırır: tahmin eder ve kaydeder, oyunu değiştirmez "
                            "(spec.md › Revizyon 3).\n\n# ", 1)
    (MODEL_DIR / "README.md").write_text(kart, encoding="utf-8")
    bilgi = api.upload_folder(repo_id=repo, repo_type="model", folder_path=str(MODEL_DIR),
                              allow_patterns=list(DOSYALAR) + ["DEGERLENDIRME.md"], commit_message=f"v{surum}: risk modeli")
    commit = bilgi.oid
    etiket = f"v{surum}"
    if etiket in {t.name for t in api.list_repo_refs(repo).tags}:
        print(f"! {etiket} etiketi zaten var; yeni commit etiketlenmedi (sürüm numarasını artırın)")
    else:
        api.create_tag(repo, tag=etiket, revision=commit, tag_message=f"SE Primer risk modeli {etiket}")
    base = f"https://huggingface.co/{repo}/resolve/{commit}/"
    print(f"✓ yüklendi: https://huggingface.co/{repo} · commit {commit} · etiket {etiket}")

    # Commit'e sabitli URL'den geri indir: yüklenen = yereldeki
    for ad in DOSYALAR:
        with urllib.request.urlopen(base + ad, timeout=60) as r:
            uzak = r.read()
        if sha(uzak) != sha((MODEL_DIR / ad).read_bytes()):
            print(f"✗ {ad}: HF'deki dosya yereldekiyle aynı değil")
            return 1
    print("✓ commit'e sabitli dosyalar yereldekiyle byte düzeyinde aynı")
    if subprocess.run([sys.executable, str(KOK / "tests" / "parite.py"), "--url", base]).returncode:
        return 1

    # Tüketicileri sabitle: tarayıcı (services/riskModel.ts) ve kayıt (model/YAYIN.json)
    ts = KOK / "services" / "riskModel.ts"
    kaynak = re.sub(r"export const HF_MODEL_BASE = '[^']*';", f"export const HF_MODEL_BASE = '{base}';", ts.read_text(encoding="utf-8"))
    ts.write_text(kaynak, encoding="utf-8")
    (KOK / "model" / "YAYIN.json").write_text(json.dumps({
        "surum": surum, "repo": repo, "commit": commit, "etiket": etiket, "base_url": base,
        "model_sha256": sha((MODEL_DIR / "model.onnx").read_bytes()),
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"✓ tüketiciler sabitlendi → services/riskModel.ts, model/YAYIN.json\n  {base}model.onnx")
    return 0


if __name__ == "__main__":
    sys.exit(main())
