// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Importar cypress-axe para pruebas de accesibilidad
import 'cypress-axe';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Manejo global de errores de aplicación no capturados
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignorar ciertos errores conocidos que no afectan las pruebas
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }

  if (err.message.includes('hydration')) {
    return false;
  }

  // No fallar la prueba en otros errores
  return true;
});

// Configurar comandos personalizados antes de cada prueba
beforeEach(() => {
  // Limpiar localStorage y sessionStorage
  cy.clearLocalStorage();
  cy.clearCookies();

  // Interceptar llamadas a la API
  cy.intercept('GET', '**/api/**').as('apiRequest');
});

// Configuración global después de cada prueba
afterEach(() => {
  // Capturar screenshot en caso de fallo
  cy.screenshot({ capture: 'runner', onAfterScreenshot: () => {} });
});

// Configuración de tipos para TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to login as admin
       * @example cy.loginAsAdmin()
       */
      loginAsAdmin(): Chainable<void>;

      /**
       * Custom command to login as test user
       * @example cy.loginAsTestUser()
       */
      loginAsTestUser(): Chainable<void>;

      /**
       * Custom command to logout
       * @example cy.logout()
       */
      logout(): Chainable<void>;

      /**
       * Custom command to check if user is logged in
       * @example cy.checkLoggedIn()
       */
      checkLoggedIn(): Chainable<void>;

      /**
       * Custom command to wait for page to load
       * @example cy.waitForPageLoad()
       */
      waitForPageLoad(): Chainable<void>;

      /**
       * Custom command to check route accessibility
       * @example cy.checkA11y()
       */
      checkA11y(context?: any, options?: any): Chainable<void>;

      /**
       * Custom command to inject axe for accessibility testing
       * @example cy.injectAxe()
       */
      injectAxe(): Chainable<void>;
    }
  }
}
