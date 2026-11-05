/**
 * SE Primer sunucusu: oyunu sunar ve iki API uç noktası açar.
 *  - POST /api/tutor : Gemini tutor (anahtar tarayıcıya inmez)
 *  - POST /api/risk  : risk modeli, sunucu tarafı tüketici (onnxruntime-node; tarayıcıdakiyle aynı model.onnx)
 * Geliştirmede Vite ara katman olarak çalışır.
 */
import express from 'express';
import path from 'path';
import type { ChatMessage, Choice, Level, Role, Goal } from './types.ts';
import { DECISIONS } from './game/story.ts';
import { LIMITS, type TutorApiResponse } from './services/tutor.ts';
import { apiKey, geminiTutorReply } from './services/tutor.server.ts';
import { GirdiHatasi, MODEL_BASE, riskTahmin } from './services/riskModel.server.ts';

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const ROOT = import.meta.dirname;

const LEVELS: Level[] = ['beginner', 'intermediate', 'experienced'];
const ROLES: Role[] = ['backend', 'qa', 'devops'];
const GOALS: Goal[] = ['architecture', 'testing', 'security'];

const app = express();
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', tutor: apiKey ? 'gemini' : 'offline' });
});

// Gövde: {"inputs": {"sahne_no": 2, ...}} → {"p": 0.82, "karar": "dur_dusun", "version": "2.0.0"}
app.post('/api/risk', async (req, res) => {
  try {
    return res.json(await riskTahmin(req.body?.inputs));
  } catch (err) {
    if (err instanceof GirdiHatasi) return res.status(400).json({ error: err.message });
    console.warn('[server] risk modeli hatası:', (err as Error)?.message ?? err);
    return res.status(503).json({ error: 'Model şu an kullanılamıyor' });
  }
});

app.post('/api/tutor', async (req, res) => {
  const { decisionId, profile, message, history = [], choices = [] } = req.body ?? {};

  // İstemciden gelen hiçbir metin sistem talimatına girmez: karar sunucudaki listeden bulunur.
  const decision = DECISIONS.find((d) => d.id === decisionId);
  const validProfile =
    profile && LEVELS.includes(profile.level) && ROLES.includes(profile.role) && GOALS.includes(profile.goal);
  const validHistory =
    Array.isArray(history) &&
    history.length <= LIMITS.historyItems &&
    history.every(
      (m: ChatMessage) =>
        (m?.role === 'student' || m?.role === 'tutor') && typeof m.text === 'string' && m.text.length <= LIMITS.historyText,
    );
  const validChoices = Array.isArray(choices) && choices.length <= 3 && choices.every((c: Choice) => c === 'A' || c === 'B');

  if (!decision || !validProfile || typeof message !== 'string' || !message.trim() || message.length > LIMITS.message || !validHistory || !validChoices) {
    return res.status(400).json({ error: 'Geçersiz istek' });
  }

  try {
    const reply = await geminiTutorReply({ decision, profile, message, history, choices });
    // Ham model yanıtı bilerek gönderilmez: öğrenci geliştirici araçlarından sızıntıyı göremesin.
    const body: TutorApiResponse = { text: reply.text, engine: reply.engine, leak: reply.leak, guarded: reply.guarded, model: reply.model };
    return res.json(body);
  } catch (err) {
    console.warn('[server] Gemini hatası, istemci çevrimdışı tutora geçecek:', (err as Error)?.message ?? err);
    return res.status(502).json({ error: 'Tutor şu an yanıt veremiyor' });
  }
});

async function start() {
  if (isProduction) {
    app.use(express.static(path.resolve(ROOT, 'dist')));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.resolve(ROOT, 'dist', 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SE Primer: http://localhost:${PORT} · tutor: ${apiKey ? 'Gemini' : 'çevrimdışı (GEMINI_API_KEY yok)'} · risk modeli: ${MODEL_BASE}`);
  });
}

void start();
