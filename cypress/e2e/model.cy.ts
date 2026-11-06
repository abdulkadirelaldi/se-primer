/**
 * v2 · Uyarlanabilir risk modeli (spec.md §8–12).
 * KÖ-7: model iki oyuncu için farklı karar verir ve oyunu değiştirir · KÖ-8: diferansiyel (parite) testi.
 * Testler geliştirme sunucusunda yerel model/ dosyalarını kullanır (yayındaki HF sürümü: model-canli.cy.ts).
 */
interface Parite {
  tolerans: number;
  karar_esigi: number;
  girdiler: (Record<string, number | string> & { ad: string; p_beklenen: number })[];
}

describe('KÖ-8 · Diferansiyel test: tarayıcı (onnxruntime-web) = Python test kahini', () => {
  it('5 referans girdide |p_tarayıcı − p_python| < 1e-4', () => {
    cy.readFile<Parite>('tests/parite.json').then((parite) => {
      cy.visit('/?lab=1');
      cy.get('[data-cy=lab-durum]', { timeout: 20000 }).should('contain', 'kaynak');
      parite.girdiler.forEach((g) => {
        Object.entries(g).forEach(([ad, deger]) => {
          if (ad === 'ad' || ad === 'p_beklenen') return;
          cy.get(`[data-cy=f-${ad}]`).clear().type(String(deger));
        });
        cy.get('[data-cy=hesapla]').click();
        cy.get('[data-cy=p]')
          .invoke('text')
          .should((metin) => {
            const fark = Math.abs(Number(metin) - g.p_beklenen);
            expect(fark, `${g.ad}: tarayıcı ${metin}, python ${g.p_beklenen}`).to.be.lessThan(parite.tolerans);
          });
        cy.get('[data-cy=lab-karar]').should('contain', g.p_beklenen >= parite.karar_esigi ? 'Dur ve düşün' : 'v1 davranışı');
      });
    });
  });
});

/** Karar 1'i belirli bir davranışla oynar: süreleri cy.clock (yalnız Date) ile kesin olarak ayarlar. */
function karar1(o: { seviye: string; secim: 'A' | 'B'; kararMs: number; okumaMs: number; tutor: number }, url = '/?tutor=offline') {
  cy.clock(Date.now(), ['Date']);
  cy.visit(url);
  cy.get('[data-cy=start-btn]').click();
  cy.get(`[data-cy=opt-level-${o.seviye}]`).click();
  cy.get('[data-cy=opt-role-backend]').click();
  cy.get('[data-cy=opt-goal-architecture]').click();
  cy.get('[data-cy=scene-tag]').should('contain', 'KARAR 1');
  cy.get('[data-cy=screen-scene]').should('not.have.attr', 'data-risk-p'); // soğuk başlangıç: Karar 1'de model yok
  if (o.tutor) {
    cy.get('[data-cy=tutor-toggle]').click();
    for (let i = 0; i < o.tutor; i++) cy.get('[data-cy=tutor-hint-btn]').click();
    cy.get('[data-cy=tutor-msg][data-role=tutor]').should('have.length', o.tutor);
  }
  cy.tick(o.kararMs);
  cy.get(`[data-cy=choice-${o.secim}]`).click();
  cy.get('[data-cy=feedback]').should('be.visible');
  cy.tick(o.okumaMs);
  cy.get('[data-cy=next-btn]').click();
  cy.get('[data-cy=scene-tag]').should('contain', 'KARAR 2');
}

const ACELECI = { seviye: 'beginner', secim: 'B' as const, kararMs: 4000, okumaMs: 2000, tutor: 0 };
const DIKKATLI = { seviye: 'experienced', secim: 'A' as const, kararMs: 25000, okumaMs: 20000, tutor: 2 };

describe('KÖ-7 · Model aynı sahnede iki oyuncu için farklı karar verir ve oyunu değiştirir', () => {
  it('Oyuncu 1 (ilk oyun, aceleci): p ≥ 0,5 → “Dur ve düşün” kartı', () => {
    karar1(ACELECI);
    cy.get('[data-cy=screen-scene]', { timeout: 20000 }).should('have.attr', 'data-risk-p').then((p) => expect(Number(p)).to.be.at.least(0.5));
    cy.get('[data-cy=risk-card]').should('be.visible').and('contain', 'Dur ve düşün').and('contain', '?');
    cy.get('[data-cy=risk-badge]').should('contain', 'Uyum modeli');
    // Kart eklemelidir: seçenekler ve tutor yerinde, oyun sürer
    cy.get('[data-cy=choice-A]').click();
    cy.get('[data-cy=risk-card]').should('not.exist');
    cy.get('[data-cy=feedback]').should('be.visible');
  });

  it('Oyuncu 2 (4. oyun, dikkatli, tutor kullanıyor): p < 0,5 → kart yok', () => {
    cy.visit('/', { onBeforeLoad: (w) => w.localStorage.setItem('seprimer.oyunSayisi', '3') });
    karar1(DIKKATLI);
    cy.get('[data-cy=screen-scene]', { timeout: 20000 }).should('have.attr', 'data-risk-p').then((p) => expect(Number(p)).to.be.below(0.5));
    cy.get('[data-cy=risk-card]').should('not.exist');
  });

  it('model yüklenemezse (?model=kapali) kart çıkmaz, oyun v1 gibi sonuna kadar oynanır', () => {
    karar1(ACELECI, '/?tutor=offline&model=kapali');
    cy.get('[data-cy=risk-card]').should('not.exist');
    cy.get('[data-cy=choice-B]').click();
    cy.get('[data-cy=next-btn]').click();
    cy.get('[data-cy=choice-B]').click();
    cy.get('[data-cy=next-btn]').click();
    cy.get('[data-cy=screen-ending]').should('have.attr', 'data-ending', 'B');
  });
});

describe('Veri Toplama Modu (?veri=1) · gölge dağıtım', () => {
  beforeEach(() => {
    cy.visit('/?veri=1&tutor=offline', { onBeforeLoad: (w) => w.localStorage.clear() });
  });

  it('oturumu “her karar bir satır” olarak kaydeder; model gölgede çalışır, kart göstermez', () => {
    cy.get('[data-cy=veri-panel]').should('contain', 'Veri Toplama Modu');
    cy.get('[data-cy=veri-oturum]').should('have.text', '0');
    karar1(ACELECI, '/?veri=1&tutor=offline');
    cy.get('[data-cy=screen-scene]', { timeout: 20000 }).should('have.attr', 'data-risk-p'); // model tahmin etti…
    cy.get('[data-cy=risk-card]').should('not.exist'); // …ama gölge modda oyunu değiştirmedi
    cy.get('[data-cy=choice-A]').click();
    cy.get('[data-cy=next-btn]').click();
    cy.get('[data-cy=choice-A]').click();
    cy.get('[data-cy=next-btn]').click();
    cy.get('[data-cy=veri-kaydedildi]').should('contain', 'Oturum kaydedildi');
    cy.window().then((w) => {
      const d = JSON.parse(w.localStorage.getItem('seprimer.veri.v1')!);
      expect(d.satirlar).to.have.length(3);
      const [s1, s2] = d.satirlar;
      expect(s1).to.include({ kaynak: 'gercek', sahne_no: 1, secim: 'B', riskli_secim: 1, karar_suresi_sn: 4, okuma_suresi_sn: 2 });
      expect(s2).to.include({ sahne_no: 2, onceki_riskli_sayisi: 1, onceki_karar_suresi_sn: 4, onceki_okuma_suresi_sn: 2, secim: 'A' });
      expect(Number(s2.model_p)).to.be.at.least(0.5);
      expect(s1.model_p).to.eq(''); // Karar 1'de model çalışmaz
      // KVKK: kişisel alan yok, kimlikler rastgele biçimli
      expect(Object.keys(s1)).not.to.include.members(['ad', 'email', 'ip', 'zaman']);
      expect(s1.katilimci_id).to.match(/^K-[0-9A-F]{4}$/);
    });
    cy.get('[data-cy=restart-btn]').click();
    cy.get('[data-cy=veri-oturum]').should('have.text', '1');
  });

  it('Yeni katılımcı farklı rastgele kimlik üretir; silme iki adımlıdır', () => {
    cy.get('[data-cy=veri-katilimci]').invoke('text').then((ilk) => {
      cy.get('[data-cy=veri-yeni]').click();
      cy.get('[data-cy=veri-katilimci]').invoke('text').should('match', /^K-[0-9A-F]{4}$/).and('not.eq', ilk);
    });
    cy.get('[data-cy=veri-sil]').click();
    cy.get('[data-cy=veri-sil]').should('contain', 'Emin misin');
  });
});

describe('300 girdilik diferansiyel test (ders provası): tarayıcı = Python test kahini', () => {
  it('300 girdinin hepsinde |fark| < 1e-4 ve karar uyuşması 300/300 (30 tanesi eşik çevresinde)', () => {
    cy.visit('/?lab=1');
    cy.get('[data-cy=lab-durum]', { timeout: 20000 }).should('contain', 'kaynak');
    cy.get('[data-cy=toplu-btn]').click();
    cy.get('[data-cy=toplu-n]', { timeout: 20000 }).should('have.text', '300');
    cy.get('[data-cy=toplu-maks]').invoke('text').then((t) => expect(Number(t)).to.be.lessThan(1e-4));
    cy.get('[data-cy=toplu-karar]').should('have.text', '300');
    cy.get('[data-cy=toplu-sonuc]').should('contain', '✓ geçti');
  });
});
