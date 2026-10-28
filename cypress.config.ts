import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.ts',
  },
  // iPhone 14 boyutu: uygulama telefonda oynanacak
  viewportWidth: 390,
  viewportHeight: 844,
  video: false,
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
});
