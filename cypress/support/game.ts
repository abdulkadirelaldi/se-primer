export type Level = 'beginner' | 'intermediate' | 'experienced';
export type Role = 'backend' | 'qa' | 'devops';
export type Goal = 'architecture' | 'testing' | 'security';

/** Uygulamayı açar, girişteki 3 soruyu yanıtlar ve ilk karara gelir. */
export function startGame(level: Level = 'intermediate', role: Role = 'backend', goal: Goal = 'architecture', url = '/?tutor=offline') {
  cy.visit(url);
  cy.get('[data-cy=start-btn]').click();
  cy.get('[data-cy=profile-step]').should('have.text', '1 / 3');
  cy.get(`[data-cy=opt-level-${level}]`).click();
  cy.get('[data-cy=profile-step]').should('have.text', '2 / 3');
  cy.get(`[data-cy=opt-role-${role}]`).click();
  cy.get('[data-cy=profile-step]').should('have.text', '3 / 3');
  cy.get(`[data-cy=opt-goal-${goal}]`).click();
  cy.get('[data-cy=screen-scene]').should('be.visible');
  cy.get('[data-cy=scene-tag]').should('contain', 'KARAR 1');
}

/** Bir karar verir ve geri bildirimin (ne oldu / neden oldu) göründüğünü doğrular. */
export function decide(choice: 'A' | 'B', expectedClock?: string) {
  cy.get(`[data-cy=choice-${choice}]`).click();
  cy.get('[data-cy=feedback]').should('be.visible');
  cy.get('[data-cy=feedback-choice]').should('contain', `${choice})`);
  cy.get('[data-cy=feedback-what]').invoke('text').should('have.length.greaterThan', 40);
  cy.get('[data-cy=feedback-why]').invoke('text').should('have.length.greaterThan', 40);
  if (expectedClock) cy.get('[data-cy=scene-clock]').should('have.text', expectedClock);
}

export function next() {
  cy.get('[data-cy=next-btn]').click();
}
