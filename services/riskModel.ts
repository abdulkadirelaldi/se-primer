/**
 * “Kötü sona gitme riski” modeli: model.onnx'i tarayıcıda onnxruntime-web ile çalıştırır.
 * Sözleşme (özellik sırası, karar eşiği, sürüm) model/config.json'dan okunur; kodda sabit özellik sırası yoktur.
 * Model yüklenemezse null döner ve oyun v1 davranışıyla sürer.
 */

/** Yayınlanan sürüm: commit'e sabitlenmiş Hugging Face URL'si (RELEASE.md). Boşsa uygulamayla birlikte gelen model/ kullanılır. */
export const HF_MODEL_BASE = '';

export interface ModelConfig {
  version: string;
  surum_turu: string;
  karar_esigi: number;
  model_sahneleri: number[];
  features: { name: string; label: string; unit: string; min: number; max: number; example: number }[];
  onnx: { input: string; outputs: string[] };
}

export interface RiskModel {
  config: ModelConfig;
  base: string;
  predict(features: Record<string, number>): Promise<number>;
}

export function modelBase(): string {
  if (typeof window !== 'undefined') {
    const zorla = new URLSearchParams(window.location.search).get('model');
    if (zorla === 'kapali') return '';
    if (zorla === 'yerel') return `${import.meta.env.BASE_URL}model/`;
  }
  if (import.meta.env.DEV) return '/model/';
  return HF_MODEL_BASE || `${import.meta.env.BASE_URL}model/`;
}

let yukleniyor: Promise<RiskModel | null> | null = null;

export function loadRiskModel(): Promise<RiskModel | null> {
  yukleniyor ??= (async () => {
    const base = modelBase();
    if (!base) return null;
    try {
      const [config, bytes, ort] = await Promise.all([
        fetch(`${base}config.json`).then((r) => {
          if (!r.ok) throw new Error(`config.json HTTP ${r.status}`);
          return r.json() as Promise<ModelConfig>;
        }),
        fetch(`${base}model.onnx`).then((r) => {
          if (!r.ok) throw new Error(`model.onnx HTTP ${r.status}`);
          return r.arrayBuffer();
        }),
        import('onnxruntime-web/wasm'),
      ]);
      // wasm dosyası Vite tarafından uygulamayla birlikte paketlenir (CDN bağımlılığı yok).
      ort.env.wasm.numThreads = 1;
      const session = await ort.InferenceSession.create(new Uint8Array(bytes));
      return {
        config,
        base,
        async predict(features) {
          const x = Float32Array.from(config.features.map((f) => {
            const v = features[f.name];
            if (typeof v !== 'number' || Number.isNaN(v)) throw new Error(`Eksik özellik: ${f.name}`);
            return v;
          }));
          const out = await session.run({ [config.onnx.input]: new ort.Tensor('float32', x, [1, x.length]) }, ['probabilities']);
          return Number((out.probabilities.data as Float32Array)[1]);
        },
      };
    } catch (err) {
      console.warn('[risk] Model yüklenemedi, v1 davranışı sürüyor:', err);
      return null;
    }
  })();
  return yukleniyor;
}
