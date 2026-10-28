/**
 * Sunucu tarafı Gemini tutor. Yalnızca Node'da çalışır (server.ts ve eval/run-eval.ts).
 * API anahtarı ortam değişkeninden okunur ve tarayıcıya hiç gönderilmez.
 */
import { GoogleGenAI } from '@google/genai';
import { applyGuard, offlineReply, systemInstruction, type TutorReply, type TutorRequest } from './tutor.ts';

/** Sırayla denenir; ilki hata verirse ikincisine geçilir. */
export const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

export const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

let client: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  return client;
}

export interface ServerTutorReply extends TutorReply {
  model: string;
}

/** Gemini'den Sokratik yanıt alır ve sızıntı korumasından geçirir. Anahtar yoksa çevrimdışı tutor yanıt verir. */
export async function geminiTutorReply(req: TutorRequest): Promise<ServerTutorReply> {
  if (!apiKey) return { ...applyGuard(offlineReply(req), req, 'offline'), model: 'offline' };

  const contents = [...req.history, { role: 'student' as const, text: req.message }].map((m) => ({
    role: m.role === 'student' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  let lastError: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      const res = await ai().models.generateContent({
        model,
        contents,
        config: { systemInstruction: systemInstruction(req.decision, req.profile, req.choices), temperature: 0.4 },
      });
      const text = (res.text ?? '').trim();
      if (text) return { ...applyGuard(text, req, 'gemini'), model };
    } catch (err) {
      console.warn(`[tutor] ${model} başarısız, sıradaki model deneniyor:`, (err as Error)?.message ?? err);
      lastError = err;
    }
  }
  throw lastError ?? new Error('Tüm modeller başarısız');
}
