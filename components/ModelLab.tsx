import { useEffect, useState } from 'react';
import { loadRiskModel, type RiskModel } from '../services/riskModel';

/**
 * Model laboratuvarı (?lab=1): diferansiyel testte tarayıcı tarafındaki tüketici.
 * Aynı model.onnx'e verilen girdinin olasılığını gösterir (data-cy="p"); Python test kahiniyle karşılaştırılır.
 */
export default function ModelLab() {
  const [model, setModel] = useState<RiskModel | null | undefined>(undefined);
  const [girdi, setGirdi] = useState<Record<string, string>>({});
  const [p, setP] = useState<number | null>(null);
  const [hata, setHata] = useState('');
  const [sure, setSure] = useState<{ yukleme?: number; cikarim?: number }>({});
  const [toplu, setToplu] = useState<{ n: number; maks: number; kararUyusan: number; tolerans: number } | null>(null);

  useEffect(() => {
    const t0 = performance.now();
    void loadRiskModel().then((m) => {
      setSure({ yukleme: performance.now() - t0 });
      setModel(m);
      if (m) setGirdi(Object.fromEntries(m.config.features.map((f) => [f.name, String(f.example)])));
    });
  }, []);

  async function hesapla() {
    if (!model) return;
    setHata('');
    try {
      const f = Object.fromEntries(Object.entries(girdi).map(([k, v]) => [k, Number(v)]));
      const t0 = performance.now();
      const sonuc = await model.predict(f);
      setSure((s) => ({ ...s, cikarim: performance.now() - t0 }));
      setP(sonuc);
    } catch (err) {
      setP(null);
      setHata(String(err));
    }
  }

  /** 300 girdilik diferansiyel test: tests/parite300.json'daki kahin olasılıklarıyla karşılaştır. */
  async function topluTest() {
    if (!model) return;
    const r = await fetch(`${import.meta.env.BASE_URL}tests/parite300.json`);
    const d = (await r.json()) as { ozellikler: string[]; girdiler: number[][]; p_beklenen: number[]; tolerans: number };
    const sira = model.config.features.map((f) => d.ozellikler.indexOf(f.name));
    const p = await model.predictBatch(d.girdiler.map((g) => sira.map((i) => g[i])));
    const esik = model.config.karar_esigi;
    setToplu({
      n: p.length,
      maks: Math.max(...p.map((v, i) => Math.abs(v - d.p_beklenen[i]))),
      kararUyusan: p.filter((v, i) => v >= esik === d.p_beklenen[i] >= esik).length,
      tolerans: d.tolerans,
    });
  }

  return (
    <main className="screen lab" data-cy="screen-lab">
      <p className="eyebrow">SE Primer · Model laboratuvarı</p>
      <h1 className="h2">Kötü sona gitme riski</h1>
      {model === undefined && <p data-cy="lab-durum">Model yükleniyor…</p>}
      {model === null && <p data-cy="lab-durum">Model yüklenemedi.</p>}
      {model && (
        <>
          <p className="muted small" data-cy="lab-durum">
            v{model.config.version} ({model.config.surum_turu === 'taslak' ? 'aday · yalnız gölge' : 'yayın'}) · kaynak: <code data-cy="lab-kaynak">{model.base}</code> · karar eşiği{' '}
            {model.config.karar_esigi}
          </p>
          {model.config.features.map((f) => (
            <label key={f.name} className="lab__field">
              <span>
                <code>{f.name}</code> · {f.label} ({f.unit})
              </span>
              <input
                inputMode="decimal"
                data-cy={`f-${f.name}`}
                value={girdi[f.name] ?? ''}
                onChange={(e) => setGirdi({ ...girdi, [f.name]: e.target.value })}
              />
            </label>
          ))}
          <button className="btn btn--primary btn--block" data-cy="hesapla" onClick={() => void hesapla()}>
            Hesapla
          </button>
          {p !== null && (
            <section className="card">
              <p className="muted small">p(riskli seçim)</p>
              <p className="lab__p" data-cy="p">
                {p.toFixed(6)}
              </p>
              <p className="muted small" data-cy="lab-sure">
                Model + çalışma zamanı yükleme {sure.yukleme?.toFixed(0)} ms · çıkarım {sure.cikarim?.toFixed(2)} ms (bu cihazda)
              </p>
              <p data-cy="lab-karar">
                {p >= model.config.karar_esigi ? '🧭 Dur ve düşün kartı gösterilir' : 'v1 davranışı (kart yok)'}
              </p>
            </section>
          )}
          {hata && <p className="badge badge--warn">{hata}</p>}
          <button className="btn btn--ghost btn--block" data-cy="toplu-btn" onClick={() => void topluTest()}>
            300 girdilik diferansiyel test
          </button>
          {toplu && (
            <section className="card" data-cy="toplu-sonuc">
              <p>
                <b data-cy="toplu-n">{toplu.n}</b> girdi · maks |p<sub>tarayıcı</sub> − p<sub>python</sub>| ={' '}
                <b data-cy="toplu-maks">{toplu.maks.toExponential(2)}</b> (tolerans {toplu.tolerans})
              </p>
              <p>
                Karar uyuşması: <b data-cy="toplu-karar">{toplu.kararUyusan}</b>/{toplu.n} ·{' '}
                {toplu.maks < toplu.tolerans && toplu.kararUyusan === toplu.n ? '✓ geçti' : '✗ kaldı'}
              </p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
