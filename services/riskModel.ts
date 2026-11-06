/**
 * “Kötü sona gitme riski” modeli: model.onnx'i tarayıcıda onnxruntime-web ile çalıştırır.
 * Sözleşme (özellik sırası, karar eşiği, sürüm) model/config.json'dan okunur; kodda sabit özellik sırası yoktur.
 * Model yüklenemezse null döner ve oyun v1 davranışıyla sürer.
 */

/** Yayınlanan sürüm: commit'e sabitlenmiş Hugging Face URL'si (RELEASE.md). Boşsa uygulamayla birlikte gelen model/ kullanılır. */
export const HF_MODEL_BASE = 'https://huggingface.co/abdulkadirelaldi/se-primer-risk-onnx/resolve/abbf7f019bc9f521e2a94d681655e2dccc820a1f/';

/**
 * Aşamalı geçiş (RELEASE.md): modelin oyunu değiştirdiği cihazların yüzdesi. 5 → 25 → 50 → 100.
 * Kovanın dışındaki cihazlarda model gölgede çalışır (tahmin eder, kart göstermez).
 */
export const YAYILIM_YUZDESI = 100;

/** Cihaza bir kez atanan rastgele kova (0–99). Kişisel veri değildir; cihazdan çıkmaz. */
export function cihazKovasi(): number {
  try {
    const kayitli = localStorage.getItem('seprimer.kova');
    if (kayitli !== null) return Number(kayitli);
    const kova = crypto.getRandomValues(new Uint8Array(1))[0] % 100;
    localStorage.setItem('seprimer.kova', String(kova));
    return kova;
  } catch {
    return 0;
  }
}

export function kanaryadaMi(yuzde = YAYILIM_YUZDESI): boolean {
  return cihazKovasi() < yuzde;
}

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
  /** Toplu çıkarım: satırlar config.features sırasında. Diferansiyel testte kullanılır. */
  predictBatch(rows: number[][]): Promise<number[]>;
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
        async predictBatch(rows) {
          const n = config.features.length;
          const x = Float32Array.from(rows.flat());
          if (x.length !== rows.length * n) throw new Error(`Her satırda ${n} özellik olmalı`);
          const out = await session.run({ [config.onnx.input]: new ort.Tensor('float32', x, [rows.length, n]) }, ['probabilities']);
          const p = out.probabilities.data as Float32Array;
          return rows.map((_, i) => Number(p[i * 2 + 1]));
        },
      };
    } catch (err) {
      console.warn('[risk] Model yüklenemedi, v1 davranışı sürüyor:', err);
      return null;
    }
  })();
  return yukleniyor;
}
