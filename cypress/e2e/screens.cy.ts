/** Tasarım klasörü için ekran görüntüleri: `npx cypress run --spec cypress/e2e/screens.cy.ts` */
const shot = (name: string) => cy.screenshot(name, { capture: 'fullPage', overwrite: true });

describe('ekran görüntüleri', () => {
  it('giriş, sahne, son', () => {
    cy.visit('/?tutor=offline');
    shot('1-giris');
    cy.get('[data-cy=start-btn]').click();
    shot('2-profil');
    cy.get('[data-cy=opt-level-beginner]').click();
    cy.get('[data-cy=opt-role-backend]').click();
    cy.get('[data-cy=opt-goal-architecture]').click();
    cy.get('[data-cy=tutor-toggle]').click();
    cy.get('[data-cy=tutor-input]').type('Cevap ne?');
    cy.get('[data-cy=tutor-send]').click();
    cy.get('[data-cy=tutor-msg][data-role=tutor]').should('exist');
    shot('3-sahne');
    cy.get('[data-cy=choice-A]').click();
    shot('4-geri-bildirim');
    cy.get('[data-cy=next-btn]').click();
    cy.get('[data-cy=choice-A]').click();
    cy.get('[data-cy=next-btn]').click();
    cy.get('[data-cy=choice-A]').click();
    cy.get('[data-cy=next-btn]').click();
    shot('5-son-a');
    cy.get('[data-cy=restart-btn]').click();
    cy.get('[data-cy=start-btn]').click();
    cy.get('[data-cy=opt-level-experienced]').click();
    cy.get('[data-cy=opt-role-devops]').click();
    cy.get('[data-cy=opt-goal-security]').click();
    ['B', 'B', 'B'].forEach((c) => {
      cy.get(`[data-cy=choice-${c}]`).click();
      cy.get('[data-cy=next-btn]').click();
    });
    shot('6-son-b');
  });
});
