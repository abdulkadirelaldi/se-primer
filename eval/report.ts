/**
 * Elle etiketlenmiş labels-<motor>.csv dosyalarından eval/REPORT.md üretir.
 *   npm run eval:report
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readCsv } from './csv';

const DIR = import.meta.dirname;

const LEAK_TYPES: Record<string, string> = {
  D: 'Doğrudan cevap (seçenek harfi/adı “doğru” diye verildi)',
  O: 'Onaylama/reddetme (öğrencinin tahminine evet/hayır dendi)',
  Y: 'Yönlendirme (emir kipi, “en doğrusu” ya da bir seçeneğin sonucunu kesin bilgi gibi verme)',
};

const QUALITY_TYPES: Record<string, string> = {
  U: 'Uyumsuz ipucu (öğrencinin söylediğini dikkate almadı, ilerletmedi)',
  S: 'Sokratik değil (soru sormadan açıklama yaptı)',
  B: 'Bilgi hatası (yanlış teknik/hukuki bilgi)',
  K: 'Konu dışı yanıt',
};

const DECISION_LABELS: Record<string, string> = { architecture: 'Karar 1 · Mimari', testing: 'Karar 2 · Test', kvkk: 'Karar 3 · KVKK' };

const pct = (k: number, n: number) => (n ? `${((100 * k) / n).toFixed(1).replace('.', ',')}%` : '—');
const frac = (k: number, n: number) => `${k}/${n} (${pct(k, n)})`;
const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function groupTable(rows: Record<string, string>[], key: string, labels: Record<string, string> = {}): string {
  const groups = [...new Set(rows.map((r) => r[key]))];
  const lines = ['| Grup | Örnek | Ele verdi | Kalite hatası |', '|---|---:|---:|---:|'];
  for (const g of groups) {
    const rs = rows.filter((r) => r[key] === g);
    const leaks = rs.filter((r) => r.insan_ele_verdi === 'evet').length;
    const q = rs.filter((r) => r.insan_kalite_hatasi).length;
    lines.push(`| ${labels[g] ?? g} | ${rs.length} | ${frac(leaks, rs.length)} | ${frac(q, rs.length)} |`);
  }
  return lines.join('\n');
}

function section(engine: string, rows: Record<string, string>[]): string {
  const n = rows.length;
  const unlabeled = rows.filter((r) => !['evet', 'hayir'].includes(r.insan_ele_verdi)).length;
  const leaks = rows.filter((r) => r.insan_ele_verdi === 'evet');
  const quality = rows.filter((r) => r.insan_kalite_hatasi);
  const clean = rows.filter((r) => r.insan_ele_verdi === 'hayir' && !r.insan_kalite_hatasi);

  const autoLeak = (r: Record<string, string>) => Boolean(r.oto_sizinti);
  const humanLeak = (r: Record<string, string>) => r.insan_ele_verdi === 'evet';
  const tp = rows.filter((r) => autoLeak(r) && humanLeak(r)).length;
  const fp = rows.filter((r) => autoLeak(r) && !humanLeak(r)).length;
  const fn = rows.filter((r) => !autoLeak(r) && humanLeak(r)).length;
  const agree = n - fp - fn;

  const out: string[] = [];
  out.push(`## Motor: \`${engine}\``, '');
  if (unlabeled) out.push(`> ⚠ ${unlabeled} satır henüz elle etiketlenmedi; oranlar eksik.`, '');

  out.push('### Özet', '');
  out.push('| Ölçüt | Sonuç |', '|---|---|');
  out.push(`| Örnek sayısı | **${n}** |`);
  out.push(`| Cevabı ele verme oranı (insan etiketi) | **${frac(leaks.length, n)}** |`);
  out.push(`| Kalite hatası oranı | **${frac(quality.length, n)}** |`);
  out.push(`| Kusursuz yanıt (sızıntı yok + kalite hatası yok) | **${frac(clean.length, n)}** |`);
  out.push(`| Otomatik dedektör ile insan etiketinin uyumu | ${frac(agree, n)} · doğru pozitif ${tp}, yanlış pozitif ${fp}, yanlış negatif ${fn} |`);
  out.push(`| Koruma (guard) sonrası kullanıcıya ulaşan sızıntı | ${frac(fn, n)} (insanın sızıntı dediği ama dedektörün kaçırdığı) |`);
  out.push('');

  out.push('### Hata türleri', '');
  out.push('| Kod | Hata türü | Sayı | Oran |', '|---|---|---:|---:|');
  for (const [k, v] of Object.entries(LEAK_TYPES)) {
    const c = rows.filter((r) => r.insan_sizinti_turu === k).length;
    out.push(`| ${k} | Sızıntı · ${v} | ${c} | ${pct(c, n)} |`);
  }
  for (const [k, v] of Object.entries(QUALITY_TYPES)) {
    const c = rows.filter((r) => r.insan_kalite_hatasi === k).length;
    out.push(`| ${k} | Kalite · ${v} | ${c} | ${pct(c, n)} |`);
  }
  out.push('');

  out.push('### Karar bazında', '', groupTable(rows, 'karar', DECISION_LABELS), '');
  out.push('### Öğrenci mesajı türüne göre', '', groupTable(rows, 'tur'), '');

  out.push('### Tüm örnekler', '');
  out.push('| # | Karar | Tür | Öğrenci | Tutor yanıtı | Ele verdi? | Hata | Not |', '|---:|---|---|---|---|---|---|---|');
  for (const r of rows) {
    const err = [r.insan_sizinti_turu, r.insan_kalite_hatasi].filter(Boolean).join(', ') || '—';
    out.push(
      `| ${r.id} | ${DECISION_LABELS[r.karar] ?? r.karar} | ${r.tur} | ${cell(r.ogrenci)} | ${cell(r.tutor_ham)} | ${r.insan_ele_verdi || '?'} | ${err} | ${cell(r.not)} |`,
    );
  }
  out.push('');
  return out.join('\n');
}

const files = readdirSync(DIR).filter((f) => /^labels-.+\.csv$/.test(f)).sort();
if (!files.length) {
  console.error('Etiket dosyası yok. Önce `npm run eval` çalıştır.');
  process.exit(1);
}

const parts = [
  '# Tutor Eval Raporu',
  '',
  `_Otomatik üretildi: \`npm run eval:report\` · ${new Date().toISOString().slice(0, 10)}_`,
  '',
  'Etiketler `eval/labels-<motor>.csv` dosyalarındaki `insan_*` sütunlarından, yani **elle** verilen kararlardan okunur. Yöntem için [EVAL.md](EVAL.md) dosyasına bak.',
  '',
];
for (const f of files) parts.push(section(f.replace(/^labels-|\.csv$/g, ''), readCsv(join(DIR, f))));

const guardPath = join(DIR, 'guard-results.json');
if (existsSync(guardPath)) {
  const guard: { yanit: string; beklenen: string | null; bulunan: string | null }[] = JSON.parse(readFileSync(guardPath, 'utf8'));
  const ok = guard.filter((g) => g.bulunan === g.beklenen).length;
  parts.push('## Koruma (guard) birim kontrolü', '');
  const leaky = guard.filter((g) => g.beklenen).length;
  parts.push(`Bilinen ${guard.length} yanıt (${leaky} sızıntılı, ${guard.length - leaky} temiz) üzerinde dedektör doğruluğu: **${frac(ok, guard.length)}**`, '');
  parts.push('| Yanıt | Beklenen | Bulunan |', '|---|---|---|');
  for (const g of guard) parts.push(`| ${cell(g.yanit)} | ${g.beklenen ?? 'temiz'} | ${g.bulunan ?? 'temiz'} |`);
  parts.push('');
}

writeFileSync(join(DIR, 'REPORT.md'), parts.join('\n'));
console.log(`eval/REPORT.md yazıldı (${files.join(', ')})`);
