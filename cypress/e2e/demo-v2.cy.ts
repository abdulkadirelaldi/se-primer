/**
 * v2 demo videosu (60–90 sn): aynı sahnede (Karar 2) modelin iki oyuncu için iki farklı karar vermesi.
 *   npm run demo:v2   → cypress/videos/demo-v2.cy.ts.mp4
 * Süreler cy.clock (yalnız Date) ile kesin ayarlanır; cy.wait yalnızca izleyicinin okuyabilmesi içindir.
 */
const yavas = (ms: number) => cy.wait(ms);

function oyna(o: { baslik: string; seviye: string; secim: 'A' | 'B'; kararMs: number; okumaMs: number; tutor: number }) {
  cy.clock(Date.now(), ['Date']);
  cy.visit('/?tutor=offline', {
    onBeforeLoad: (w) => {
      w.localStorage.clear();
      if (o.seviye === 'experienced') w.localStorage.setItem('seprimer.oyunSayisi', '3');
    },
  });
  cy.document().then((d) => {
    const etiket = d.createElement('div');
    etiket.textContent = o.baslik;
    etiket.setAttribute('style', 'position:fixed;bottom:10px;left:50%;transform:translateX(-50%);z-index:99;background:#F0A35E;color:#13203B;font:700 14px Inter,sans-serif;padding:6px 12px;border-radius:999px');
    d.body.appendChild(etiket);
  });
  yavas(2500);
  cy.get('[data-cy=start-btn]').click();
  yavas(600);
  cy.get(`[data-cy=opt-level-${o.seviye}]`).click();
  yavas(500);
  cy.get('[data-cy=opt-role-backend]').click();
  yavas(500);
  cy.get('[data-cy=opt-goal-testing]').click();
  yavas(1200);
  if (o.tutor) {
    cy.get('[data-cy=tutor-toggle]').scrollIntoView({ duration: 300 }).click();
    for (let i = 0; i < o.tutor; i++) {
      cy.get('[data-cy=tutor-hint-btn]').click();
      yavas(1200);
    }
  }
  cy.tick(o.kararMs);
  cy.get(`[data-cy=choice-${o.secim}]`).scrollIntoView({ duration: 300 }).click();
  cy.get('[data-cy=feedback]').scrollIntoView({ duration: 400 });
  yavas(o.okumaMs > 5000 ? 4500 : 2000);
  cy.tick(o.okumaMs);
  cy.get('[data-cy=next-btn]').scrollIntoView({ duration: 300 }).click();
  cy.get('[data-cy=screen-scene]', { timeout: 20000 }).should('have.attr', 'data-risk-p');
  yavas(1500);
}

describe('SE Primer v2 · demo', () => {
  it('Karar 2: aceleci oyuncuya “Dur ve düşün”, dikkatli oyuncuya v1', () => {
    oyna({ baslik: 'Oyuncu 1 · ilk oyun · 4 sn’de B · geri bildirimi 2 sn okudu', seviye: 'beginner', secim: 'B', kararMs: 4000, okumaMs: 2000, tutor: 0 });
    cy.get('[data-cy=risk-card]').should('be.visible').scrollIntoView({ duration: 500 });
    yavas(8000);
    cy.get('[data-cy=choice-A]').scrollIntoView({ duration: 500 });
    yavas(2500);

    oyna({ baslik: 'Oyuncu 2 · 4. oyun · 25 sn düşündü, A · 20 sn okudu · tutor ×2', seviye: 'experienced', secim: 'A', kararMs: 25000, okumaMs: 20000, tutor: 2 });
    cy.get('[data-cy=risk-card]').should('not.exist');
    cy.get('[data-cy=scene-prompt]').scrollIntoView({ duration: 500 });
    yavas(7000);
    cy.get('[data-cy=choice-A]').scrollIntoView({ duration: 500 });
    yavas(2500);

    // Aynı iki girdi, model laboratuvarında: tarayıcıdaki ONNX olasılıkları
    cy.readFile('tests/parite.json').then((parite) => {
      cy.visit('/?lab=1');
      cy.get('[data-cy=lab-durum]', { timeout: 20000 }).should('contain', 'kaynak');
      yavas(1500);
      parite.girdiler.slice(0, 2).forEach((g: Record<string, number | string>) => {
        Object.entries(g).forEach(([ad, v]) => {
          if (ad !== 'ad' && ad !== 'p_beklenen') cy.get(`[data-cy=f-${ad}]`).clear().type(String(v), { delay: 0 });
        });
        cy.get('[data-cy=hesapla]').scrollIntoView({ duration: 300 }).click();
        cy.get('[data-cy=p]').scrollIntoView({ duration: 400 });
        yavas(5000);
      });
    });
  });
});
