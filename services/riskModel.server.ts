/**
 * Sunucu tarafı tüketici (bonus): aynı model.onnx'i onnxruntime-node ile çalıştırır.
 * Kaynak: MODEL_BASE ortam değişkeni (commit'e sabitli HF URL'si ya da yerel klasör); yoksa ./model/.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import * as ort from 'onnxruntime-node';

interface Config {
  version: string;
  karar_esigi: number;
  features: { name: string; min: number; max: number }[];
  onnx: { input: string };
}

export const MODEL_BASE = process.env.MODEL_BASE || path.resolve(import.meta.dirname, '..', 'model') + path.sep;

async function oku(ad: string): Promise<Buffer> {
  if (/^https?:\/\//.test(MODEL_BASE)) {
    const r = await fetch(MODEL_BASE + ad);
    if (!r.ok) throw new Error(`${ad} HTTP ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  return readFile(path.join(MODEL_BASE, ad));
}

let yuklu: Promise<{ config: Config; session: ort.InferenceSession }> | null = null;

function yukle() {
  yuklu ??= (async () => {
    const [cfg, bytes] = await Promise.all([oku('config.json'), oku('model.onnx')]);
    return { config: JSON.parse(cfg.toString('utf8')) as Config, session: await ort.InferenceSession.create(bytes) };
  })().catch((err) => {
    yuklu = null; // bir sonraki istekte yeniden dene
    throw err;
  });
  return yuklu;
}

export class GirdiHatasi extends Error {}

/** Sözleşmeye göre doğrular: her özellik sayı olmalı ve config'deki [min, max] aralığında kalmalı. */
export async function riskTahmin(inputs: unknown): Promise<{ p: number; karar: 'dur_dusun' | 'v1'; version: string }> {
  const { config, session } = await yukle();
  if (!inputs || typeof inputs !== 'object') throw new GirdiHatasi('inputs nesnesi gerekli');
  const girdi = inputs as Record<string, unknown>;
  const x = Float32Array.from(
    config.features.map((f) => {
      const v = girdi[f.name];
      if (typeof v !== 'number' || !Number.isFinite(v)) throw new GirdiHatasi(`${f.name} sayı olmalı`);
      if (v < f.min || v > f.max) throw new GirdiHatasi(`${f.name} ${f.min}–${f.max} aralığında olmalı`);
      return v;
    }),
  );
  const out = await session.run({ [config.onnx.input]: new ort.Tensor('float32', x, [1, x.length]) }, ['probabilities']);
  const p = Number((out.probabilities.data as Float32Array)[1]);
  return { p, karar: p >= config.karar_esigi ? 'dur_dusun' : 'v1', version: config.version };
}
