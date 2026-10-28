/**
 * Tutor eval — 20 öğrenci cevabını tutor'a verir, yanıtları etiketlemeye hazır CSV'ye yazar.
 *
 *   npm run eval                     # GEMINI_API_KEY varsa Gemini, yoksa çevrimdışı tutor
 *   npm run eval -- --engine offline # motoru zorla
 *   npm run eval -- --force          # var olan etiket dosyasının üzerine yaz
 *
 * Çıktılar: eval/results-<motor>.json, eval/labels-<motor>.csv
 * Ardından labels-<motor>.csv içindeki insan_* sütunlarını ELLE doldur ve `npm run eval:report` çalıştır.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Decision, DecisionId, Profile } from '../types';
import { DECISIONS } from '../game/story';
import { askTutor, detectLeak, isSocratic, type Engine } from '../services/tutor';
import { writeCsv } from './csv';

const DIR = import.meta.dirname;
const args = process.argv.slice(2);
const forced = args.includes('--engine') ? (args[args.indexOf('--engine') + 1] as Engine) : null;
const engine: Engine = forced ?? (process.env.GEMINI_API_KEY ? 'gemini' : 'offline');
const force = args.includes('--force');

interface Student {
  id: number;
  karar: DecisionId;
  tur: string;
  ogrenci: string;
}

interface GuardCase {
  karar: DecisionId;
  ogrenci: string;
  yanit: string;
  beklenen: string | null;
}

const PROFILE: Profile = { level: 'intermediate', role: 'backend', goal: 'architecture' };
const byId = (id: DecisionId): Decision => DECISIONS.find((d) => d.id === id)!;

async function main() {
  const students: Student[] = JSON.parse(readFileSync(join(DIR, 'students.json'), 'utf8'));
  console.log(`Motor: ${engine} · ${students.length} öğrenci cevabı\n`);

  const results = [];
  for (const s of students) {
    const reply = await askTutor({ decision: byId(s.karar), profile: PROFILE, message: s.ogrenci, history: [] }, engine);
    const row = {
      id: s.id,
      karar: s.karar,
      tur: s.tur,
      ogrenci: s.ogrenci,
      motor: reply.engine,
      tutor_ham: reply.rawText,
      tutor_son: reply.text,
      oto_sizinti: reply.leak ?? '',
      oto_sokratik: isSocratic(reply.rawText) ? 'evet' : 'hayir',
      koruma_devrede: reply.guarded ? 'evet' : 'hayir',
    };
    results.push(row);
    console.log(`#${String(s.id).padStart(2)} [${s.karar}] ${s.ogrenci}\n    → ${reply.rawText}${reply.leak ? `  ⚠ oto-sızıntı: ${reply.leak}` : ''}\n`);
    if (engine === 'gemini') await new Promise((r) => setTimeout(r, 1500)); // ücretsiz kota için yavaşla
  }

  const usedEngines = new Set(results.map((r) => r.motor));
  if (engine === 'gemini' && usedEngines.has('offline')) {
    console.warn('UYARI: Bazı istekler Gemini yerine çevrimdışı tutora düştü (anahtar/kota sorunu). Sonuçları karıştırmamak için tekrar çalıştır.');
  }

  writeFileSync(join(DIR, `results-${engine}.json`), JSON.stringify({ engine, date: new Date().toISOString(), results }, null, 2));

  const labelsPath = join(DIR, `labels-${engine}.csv`);
  if (existsSync(labelsPath) && !force) {
    console.log(`\n${labelsPath} zaten var; elle girilmiş etiketleri korumak için üzerine yazılmadı (--force ile yazılır).`);
  } else {
    writeCsv(
      labelsPath,
      results.map((r) => ({
        id: r.id,
        karar: r.karar,
        tur: r.tur,
        ogrenci: r.ogrenci,
        tutor_ham: r.tutor_ham,
        oto_sizinti: r.oto_sizinti,
        oto_sokratik: r.oto_sokratik,
        insan_ele_verdi: '',
        insan_sizinti_turu: '',
        insan_kalite_hatasi: '',
        not: '',
      })),
    );
    console.log(`\nEtiketleme dosyası yazıldı: ${labelsPath}`);
  }

  // Koruma (guard) birim kontrolü: bilinen sızıntılı/temiz yanıtlar
  const cases: GuardCase[] = JSON.parse(readFileSync(join(DIR, 'guard-cases.json'), 'utf8'));
  const guard = cases.map((c) => ({ ...c, bulunan: detectLeak(c.yanit, byId(c.karar), c.ogrenci) }));
  const ok = guard.filter((g) => g.bulunan === g.beklenen).length;
  writeFileSync(join(DIR, 'guard-results.json'), JSON.stringify(guard, null, 2));
  console.log(`Koruma birim kontrolü: ${ok}/${guard.length} doğru sınıflandırıldı.`);
  guard.filter((g) => g.bulunan !== g.beklenen).forEach((g) => console.log(`  ✗ "${g.yanit}" beklenen=${g.beklenen} bulunan=${g.bulunan}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
