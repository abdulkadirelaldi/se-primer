import { decide, next, startGame } from '../support/game';

/**
 * Tüm oynanış yolları: 3 karar × 2 seçenek = 8 yol, 2 son.
 * Süreler: K1 A=15 B=30 dk · K2 A=8 B=20 dk · K3 A=2 B=0 dk (başlangıç 08:00).
 */
const MINUTES = [
  { A: 15, B: 30 },
  { A: 8, B: 20 },
  { A: 2, B: 0 },
] as const;

const clock = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

const PATHS = ['AAA', 'AAB', 'ABA', 'ABB', 'BAA', 'BAB', 'BBA', 'BBB'];

describe('KÖ-4 · Her yol: her seçimden sonra ne oldu / neden oldu, KVKK kararına göre iki son', () => {
  PATHS.forEach((path) => {
    it(`yol ${path}`, () => {
      startGame('intermediate', 'backend', 'architecture');
      let t = 8 * 60;
      cy.get('[data-cy=scene-clock]').should('have.text', '08:00');

      [...path].forEach((c, i) => {
        const choice = c as 'A' | 'B';
        t += MINUTES[i][choice];
        cy.get('[data-cy=scene-tag]').should('contain', `KARAR ${i + 1}`);
        decide(choice, clock(t));
        next();
      });

      const ending = path[2] === 'A' ? 'A' : 'B';
      cy.get('[data-cy=screen-ending]').should('have.attr', 'data-ending', ending);
      cy.get('[data-cy=ending-tag]').should('contain', `SON ${ending}`);
      cy.get('[data-cy=ending-headline]').should(
        'have.text',
        ending === 'A' ? `${clock(t)} sistem ayakta, veri güvende` : `${clock(t)} sistem ayakta ama KVKK ihlali`,
      );
      cy.get('[data-cy=stat-finish]').should('have.text', clock(t));
      cy.get('[data-cy=stat-minutes]').should('have.text', `${t - 8 * 60} dk`);
      cy.get('[data-cy=stat-data]').should('have.text', ending === 'A' ? 'Güvende' : 'İhlal');
      [...path].forEach((c, i) => cy.get(`[data-cy=ending-row-${i}]`).should('contain', `${c})`));
      cy.get('[data-cy=ending-reflection]').should('contain', '?');
    });
  });

  it('en iyi yol 08:25’te biter (örnek oyundaki Son A)', () => {
    startGame();
    ['A', 'A', 'A'].forEach((c) => {
      decide(c as 'A');
      next();
    });
    cy.get('[data-cy=ending-headline]').should('have.text', '08:25 sistem ayakta, veri güvende');
  });

  it('Tekrar oyna, oyunu baştan başlatır', () => {
    startGame();
    ['B', 'B', 'B'].forEach((c) => {
      decide(c as 'B');
      next();
    });
    cy.get('[data-cy=restart-btn]').click();
    cy.get('[data-cy=screen-intro]').should('be.visible');
    cy.get('[data-cy=start-btn]').click();
    cy.get('[data-cy=profile-step]').should('have.text', '1 / 3');
  });
});
