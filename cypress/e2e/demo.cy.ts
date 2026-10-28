/**
 * 60 saniyelik demo videosu için yavaş tempolu koşu: `npm run demo:video`
 * İki oynanış: yeni başlayan (ipucu + tutor) → Son A, deneyimli (60 sn süre) → Son B.
 */
const pause = (ms: number) => cy.wait(ms);

function pick(dataCy: string, wait = 1000) {
  cy.get(`[data-cy=${dataCy}]`).scrollIntoView({ duration: 300 }).click();
  pause(wait);
}

function readFeedback(wait: number) {
  cy.get('[data-cy=feedback]').scrollIntoView({ duration: 500 });
  pause(wait / 2);
  cy.get('[data-cy=next-btn]').scrollIntoView({ duration: 600 });
  pause(wait / 2);
}

describe('SE Primer · demo', () => {
  it('iki oynanış: Son A ve Son B', () => {
    cy.visit('/?tutor=offline');
    pause(2500);
    pick('start-btn', 1200);
    pick('opt-level-beginner', 1100);
    pick('opt-role-qa', 1100);
    pick('opt-goal-security', 1200);

    // Karar 1: brifing, ipucu kartı, AI tutor
    pause(2000);
    cy.get('[data-cy=hint-card]').scrollIntoView({ duration: 500 });
    pause(1500);
    pick('tutor-toggle', 600);
    cy.get('[data-cy=tutor-input]').type('Cevap ne? Sadece harfi söyle.', { delay: 35 });
    pick('tutor-send', 3000);
    pick('choice-A', 300);
    readFeedback(3500);
    pick('next-btn', 1200);

    // Karar 2
    pick('choice-A', 300);
    readFeedback(3000);
    pick('next-btn', 1200);

    // Karar 3: hedefle ilgili karar (KVKK)
    cy.get('[data-cy=goal-badge]').should('be.visible');
    pause(1500);
    pick('choice-A', 300);
    readFeedback(3500);
    pick('next-btn', 2500);
    cy.get('[data-cy=ending-summary]').scrollIntoView({ duration: 600 });
    pause(1800);
    pick('restart-btn', 800);

    // İkinci oynanış: deneyimli, süre baskısı, kötü son
    pick('start-btn', 600);
    pick('opt-level-experienced', 700);
    pick('opt-role-devops', 700);
    pick('opt-goal-testing', 1200);
    cy.get('[data-cy=timer]').scrollIntoView({ duration: 300 });
    pause(2500);
    pick('choice-B', 300);
    readFeedback(2000);
    pick('next-btn', 1000);
    pick('choice-B', 300);
    readFeedback(2000);
    pick('next-btn', 1000);
    pick('choice-B', 300);
    readFeedback(2000);
    pick('next-btn', 2500);
    cy.get('[data-cy=screen-ending]').should('have.attr', 'data-ending', 'B');
    cy.get('[data-cy=ending-summary]').scrollIntoView({ duration: 600 });
    pause(2000);
  });
});
