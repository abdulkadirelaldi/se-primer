/**
 * Davranış ölçümü (v2). Model girdileri ve Veri Toplama Modu satırları buradan üretilir.
 * Saf fonksiyonlar: zaman damgaları dışarıdan (Date.now) gelir; böylece Cypress cy.clock ile test edilebilir.
 */
import type { Choice, Level, Profile } from '../types';

export interface SceneLog {
  startedAt: number;
  chosenAt?: number;
  feedbackAt?: number;
  nextAt?: number;
  /** Bu sahnede tutor'a gönderilen mesaj + ipucu isteği sayısı (içerik değil, yalnız sayı). */
  tutorCount: number;
  choice?: Choice;
  timedOut?: boolean;
  /** Bu sahne açılırken modelin verdiği olasılık (Karar 1'de ya da model yoksa null). */
  p?: number | null;
}

export const LEVEL_INDEX: Record<Level, number> = { beginner: 0, intermediate: 1, experienced: 2 };

const sn = (ms: number) => Math.round(ms / 100) / 10;

/** Sahne açılırken modelin göreceği özellikler. Yalnız önceki sahneler kullanılır (bu sahnenin süresi sızıntı olurdu). */
export function sceneFeatures(step: number, logs: SceneLog[], level: Level, oyunSayisi: number): Record<string, number> {
  const onceki = logs.slice(0, step);
  const son = onceki[onceki.length - 1];
  return {
    sahne_no: step + 1,
    seviye: LEVEL_INDEX[level],
    onceki_oyun_sayisi: oyunSayisi,
    onceki_riskli_sayisi: onceki.filter((l) => l.choice === 'B').length,
    onceki_karar_suresi_sn: son?.chosenAt ? sn(son.chosenAt - son.startedAt) : 0,
    onceki_okuma_suresi_sn: son?.feedbackAt && son.nextAt ? sn(son.nextAt - son.feedbackAt) : 0,
    tutor_mesaj_sayisi: onceki.reduce((t, l) => t + l.tutorCount, 0),
  };
}

/** data/hazirla.py › SUTUNLAR ile aynı sıra. */
export const SUTUNLAR = [
  'oturum_id', 'katilimci_id', 'kaynak', 'seviye', 'rol', 'hedef', 'sahne_no',
  'onceki_oyun_sayisi', 'onceki_riskli_sayisi', 'onceki_karar_suresi_sn', 'onceki_okuma_suresi_sn',
  'tutor_mesaj_sayisi', 'karar_suresi_sn', 'okuma_suresi_sn', 'secim', 'zaman_asimi', 'riskli_secim',
  'model_p', 'model_surumu',
] as const;

export type Satir = Record<(typeof SUTUNLAR)[number], string | number>;

/** Biten bir oturumu “her karar bir satır” biçimine çevirir. */
export function oturumSatirlari(
  logs: SceneLog[],
  profile: Profile,
  ids: { oturum: string; katilimci: string },
  oyunSayisi: number,
  modelSurumu: string,
): Satir[] {
  return logs.map((l, i) => {
    const f = sceneFeatures(i, logs, profile.level, oyunSayisi);
    return {
      oturum_id: ids.oturum,
      katilimci_id: ids.katilimci,
      kaynak: 'gercek',
      seviye: f.seviye,
      rol: profile.role,
      hedef: profile.goal,
      sahne_no: f.sahne_no,
      onceki_oyun_sayisi: f.onceki_oyun_sayisi,
      onceki_riskli_sayisi: f.onceki_riskli_sayisi,
      onceki_karar_suresi_sn: f.onceki_karar_suresi_sn,
      onceki_okuma_suresi_sn: f.onceki_okuma_suresi_sn,
      tutor_mesaj_sayisi: f.tutor_mesaj_sayisi,
      karar_suresi_sn: l.chosenAt ? sn(l.chosenAt - l.startedAt) : '',
      okuma_suresi_sn: l.feedbackAt && l.nextAt ? sn(l.nextAt - l.feedbackAt) : '',
      secim: l.choice ?? '',
      zaman_asimi: l.timedOut ? 1 : 0,
      riskli_secim: l.choice === 'B' ? 1 : 0,
      model_p: l.p == null ? '' : l.p.toFixed(6),
      model_surumu: l.p == null ? '' : modelSurumu,
    };
  });
}

export function toCsv(rows: Satir[]): string {
  const kacis = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [SUTUNLAR.join(','), ...rows.map((r) => SUTUNLAR.map((c) => kacis(r[c])).join(','))].join('\n') + '\n';
}
