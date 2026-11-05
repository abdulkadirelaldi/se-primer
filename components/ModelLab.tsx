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

  return (
    <main className="screen lab" data-cy="screen-lab">
      <p className="eyebrow">SE Primer · Model laboratuvarı</p>
      <h1 className="h2">Kötü sona gitme riski</h1>
      {model === undefined && <p data-cy="lab-durum">Model yükleniyor…</p>}
      {model === null && <p data-cy="lab-durum">Model yüklenemedi.</p>}
      {model && (
        <>
          <p className="muted small" data-cy="lab-durum">
            v{model.config.version} ({model.config.surum_turu}) · kaynak: <code data-cy="lab-kaynak">{model.base}</code> · karar eşiği{' '}
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
        </>
      )}
    </main>
  );
}
