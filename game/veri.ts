/**
 * Yerel kayıt (localStorage). Kişisel veri tutulmaz: kimlikler rastgele, tarih/saat yok, tutor metni yok.
 * Tarayıcı depolaması kapalıysa (gizli pencere vb.) sessizce bellekte çalışır; oyun asla bozulmaz.
 */
import type { Satir } from './telemetry';

const VERI_KEY = 'seprimer.veri.v1';
const OYUN_KEY = 'seprimer.oyunSayisi';

interface VeriDeposu {
  katilimci: string;
  satirlar: Satir[];
}

function oku<T>(key: string, varsayilan: T): T {
  try {
    const ham = localStorage.getItem(key);
    return ham ? (JSON.parse(ham) as T) : varsayilan;
  } catch {
    return varsayilan;
  }
}

function yaz(key: string, deger: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(deger));
  } catch {
    /* depolama yok: veri bu oturumla sınırlı kalır */
  }
}

export function rastgeleKimlik(onek: string, uzunluk: number): string {
  const b = new Uint8Array(uzunluk);
  crypto.getRandomValues(b);
  return onek + Array.from(b, (x) => (x % 16).toString(16).toUpperCase()).join('');
}

export function veriModuAcik(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('veri') === '1';
}

export function depo(): VeriDeposu {
  const d = oku<VeriDeposu | null>(VERI_KEY, null);
  if (d?.katilimci) return d;
  const yeni = { katilimci: rastgeleKimlik('K-', 4), satirlar: [] };
  yaz(VERI_KEY, yeni);
  return yeni;
}

export function yeniKatilimci(): string {
  const d = depo();
  d.katilimci = rastgeleKimlik('K-', 4);
  yaz(VERI_KEY, d);
  return d.katilimci;
}

export function satirEkle(satirlar: Satir[]) {
  const d = depo();
  d.satirlar.push(...satirlar);
  yaz(VERI_KEY, d);
}

export function veriyiTemizle() {
  try {
    localStorage.removeItem(VERI_KEY);
  } catch {
    /* yok say */
  }
}

/** Veri modunda katılımcının kendi oyun sayısı (aynı cihazı birden çok kişi kullanır); normal modda cihazın sayısı. */
export function oyunSayisi(): number {
  if (veriModuAcik()) {
    const d = depo();
    return new Set(d.satirlar.filter((s) => s.katilimci_id === d.katilimci).map((s) => s.oturum_id)).size;
  }
  return oku<number>(OYUN_KEY, 0);
}

export function oyunTamamlandi() {
  if (!veriModuAcik()) yaz(OYUN_KEY, oku<number>(OYUN_KEY, 0) + 1);
}
