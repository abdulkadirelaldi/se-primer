import { decide, next, startGame } from '../support/game';

describe('KÖ-1 · Yeni başlayan oyuncu her kararda ipucu görür', () => {
  it('beginner: 3 kararın hepsinde ipucu kartı var, süre yok', () => {
    startGame('beginner');
    cy.get('[data-cy=briefing]').should('contain', 'her kararda bir ipucu kartı');
    [0, 1, 2].forEach((i) => {
      cy.get('[data-cy=scene-tag]').should('contain', `KARAR ${i + 1}`);
      cy.get('[data-cy=hint-card]').should('be.visible').and('contain', '?');
      cy.get('[data-cy=timer]').should('not.exist');
      decide('A');
      cy.get('[data-cy=hint-card]').should('not.exist');
      next();
    });
    cy.get('[data-cy=screen-ending]').should('be.visible');
  });

  it('intermediate: ipucu kartı da süre de yok', () => {
    startGame('intermediate');
    cy.get('[data-cy=hint-card]').should('not.exist');
    cy.get('[data-cy=timer]').should('not.exist');
    cy.get('[data-cy=tutor-toggle]').should('be.visible');
  });
});

describe('KÖ-2 · Deneyimli oyuncu 60 saniyelik süre baskısı altında karar verir', () => {
  it('sayaç 60’tan geri sayar; süre dolunca varsayılan B uygulanır ve bu açıkça söylenir', () => {
    cy.clock();
    startGame('experienced');
    cy.get('[data-cy=briefing]').should('contain', '60 saniyen var');
    cy.get('[data-cy=hint-card]').should('not.exist');
    cy.get('[data-cy=timer-value]').should('have.text', '60 sn');
    cy.tick(30_000);
    cy.get('[data-cy=timer-value]').should('have.text', '30 sn');

    // Karar 1: süre dolmadan seçim yapılır
    decide('A', '08:15');
    cy.get('[data-cy=feedback-timeout]').should('not.exist');
    next();

    // Karar 2: sayaç her kararda yeniden 60'tan başlar; süre dolar
    cy.get('[data-cy=timer-value]').should('have.text', '60 sn');
    cy.tick(60_000);
    cy.get('[data-cy=feedback]').should('be.visible');
    cy.get('[data-cy=feedback-timeout]').should('contain', 'Süre doldu');
    cy.get('[data-cy=feedback-choice]').should('contain', 'B) Hemen yayına al');
    next();

    // Karar 3: süre dolar, KVKK kararı da B olur ve kötü son gelir
    cy.tick(60_000);
    cy.get('[data-cy=feedback-timeout]').should('be.visible');
    next();
    cy.get('[data-cy=screen-ending]').should('have.attr', 'data-ending', 'B');
    cy.get('[data-cy=ending-row-1]').should('contain', 'süre doldu');
    cy.get('[data-cy=ending-row-2]').should('contain', 'süre doldu');
    cy.get('[data-cy=ending-row-0]').should('not.contain', 'süre doldu');
  });
});

describe('KÖ-3 · Rol ve hedef anlatıyı değiştirir', () => {
  it('QA + test hedefi: QA brifingi, 2. kararda hedef rozeti ve derinleşme notu', () => {
    startGame('intermediate', 'qa', 'testing');
    cy.get('[data-cy=briefing]').should('contain', 'test raporunu sen imzaladın').and('contain', '2. karara');
    cy.get('[data-cy=goal-badge]').should('not.exist');
    decide('A');
    cy.get('[data-cy=feedback-role]').should('contain', 'Test mühendisi olarak');
    cy.get('[data-cy=feedback-goal]').should('not.exist');
    next();

    cy.get('[data-cy=goal-badge]').should('contain', 'Test ve kalite');
    decide('A');
    cy.get('[data-cy=feedback-goal]').should('contain', 'sınır değer');
    next();

    cy.get('[data-cy=goal-badge]').should('not.exist');
    decide('A');
    next();
    cy.get('[data-cy=ending-row-1]').should('have.class', 'is-goal');
    cy.get('[data-cy=ending-profile]').should('contain', 'Test (QA) mühendisi').and('contain', 'Test ve kalite');
  });

  it('DevOps + veri güvenliği: DevOps brifingi, rozet 3. kararda', () => {
    startGame('intermediate', 'devops', 'security');
    cy.get('[data-cy=briefing]').should('contain', 'Yayın hattı (CI/CD)');
    decide('A');
    next();
    decide('A');
    next();
    cy.get('[data-cy=goal-badge]').should('contain', 'Veri güvenliği');
    decide('A');
    cy.get('[data-cy=feedback-role]').should('contain', 'DevOps olarak');
    cy.get('[data-cy=feedback-goal]').should('contain', 'privacy by design');
  });

  it('2. kararın sahne metni 1. karara göre değişir', () => {
    startGame();
    decide('A');
    next();
    cy.get('[data-cy=scene-prompt]').should('contain', 'v2.3 ile ayakta');
    startGame();
    decide('B');
    next();
    cy.get('[data-cy=scene-prompt]').should('contain', 'Canlı yaman hazır');
  });

  it('profil sorularında geri dönülebilir', () => {
    cy.visit('/?tutor=offline');
    cy.get('[data-cy=start-btn]').click();
    cy.get('[data-cy=opt-level-beginner]').click();
    cy.get('[data-cy=profile-back]').click();
    cy.get('[data-cy=profile-step]').should('have.text', '1 / 3');
    cy.get('[data-cy=opt-level-beginner]').should('have.attr', 'aria-checked', 'true');
  });
});
