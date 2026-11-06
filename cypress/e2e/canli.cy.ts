/**
 * Canlı yayın doğrulaması (GitHub Pages + Hugging Face). Yalnız üretim derlemesine karşı koşulur:
 *   npx cypress run --spec cypress/e2e/canli.cy.ts --config baseUrl=https://abdulkadirelaldi.github.io/se-primer
 */
interface Yayin { commit: string; base_url: string; surum: string }

describe('Canlı · model commit’e sabitli Hugging Face URL’sinden yükleniyor', () => {
  it('laboratuvar HF commit URL’sini kullanıyor; 5 ve 300 girdide parite', () => {
    cy.readFile<Yayin>('model/YAYIN.json').then((y) => {
      cy.visit('/?lab=1');
      cy.get('[data-cy=lab-kaynak]', { timeout: 30000 }).should('have.text', y.base_url).and('contain', y.commit);
      cy.get('[data-cy=toplu-btn]').click();
      cy.get('[data-cy=toplu-n]', { timeout: 30000 }).should('have.text', '300');
      cy.get('[data-cy=toplu-maks]').invoke('text').then((t) => expect(Number(t)).to.be.lessThan(1e-4));
      cy.get('[data-cy=toplu-karar]').should('have.text', '300');
    });
  });
});

function aceleciKarar2(url: string) {
  cy.clock(Date.now(), ['Date']);
  cy.visit(url, { onBeforeLoad: (w) => w.localStorage.clear() });
  cy.get('[data-cy=start-btn]').click();
  cy.get('[data-cy=opt-level-beginner]').click();
  cy.get('[data-cy=opt-role-backend]').click();
  cy.get('[data-cy=opt-goal-architecture]').click();
  cy.tick(4000);
  cy.get('[data-cy=choice-B]').click();
  cy.tick(2000);
  cy.get('[data-cy=next-btn]').click();
  cy.get('[data-cy=screen-scene]', { timeout: 30000 }).should('have.attr', 'data-risk-p').then((p) => expect(Number(p)).to.be.at.least(0.5));
}

describe('Canlı · aday (rc) model: oyuncuda gölge, önizlemede aktif (spec Revizyon 3)', () => {
  it('normal oyuncu: model tahmin ediyor ama kart göstermiyor (gölge)', () => {
    aceleciKarar2('/?tutor=offline');
    cy.get('[data-cy=risk-card]').should('not.exist');
  });

  it('?onizleme=1: aynı oyuncuya “Dur ve düşün” kartı', () => {
    aceleciKarar2('/?tutor=offline&onizleme=1');
    cy.get('[data-cy=risk-card]').should('be.visible');
  });
});
