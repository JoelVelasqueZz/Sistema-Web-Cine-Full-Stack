/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Comando personalizado para iniciar sesión
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.log(`🔐 Iniciando sesión como: ${email}`);

  cy.visit('/login');
  cy.get('input[name="email"], input[type="email"]').clear().type(email);
  cy.get('input[name="password"], input[type="password"]').clear().type(password);
  cy.get('button[type="submit"]').contains(/iniciar|login/i).click();

  // Esperar a que la navegación se complete
  cy.url().should('not.include', '/login');

  // Verificar que el token esté guardado
  cy.window().then((win) => {
    const token = win.localStorage.getItem('auth_token');
    expect(token).to.exist;
  });

  cy.log('✅ Sesión iniciada correctamente');
});

/**
 * Comando personalizado para iniciar sesión como admin
 */
Cypress.Commands.add('loginAsAdmin', () => {
  const adminEmail = Cypress.env('testAdmin').email;
  const adminPassword = Cypress.env('testAdmin').password;

  cy.log('👑 Iniciando sesión como ADMIN');
  cy.login(adminEmail, adminPassword);

  // Verificar que llegó al dashboard de admin
  cy.url().should('include', '/admin');
  cy.log('✅ Sesión de admin iniciada');
});

/**
 * Comando personalizado para iniciar sesión como usuario de prueba
 */
Cypress.Commands.add('loginAsTestUser', () => {
  const userEmail = Cypress.env('testUser').email;
  const userPassword = Cypress.env('testUser').password;

  cy.log('👤 Iniciando sesión como USUARIO TEST');
  cy.login(userEmail, userPassword);

  // Verificar que llegó a home
  cy.url().should('include', '/home');
  cy.log('✅ Sesión de usuario test iniciada');
});

/**
 * Comando personalizado para cerrar sesión
 */
Cypress.Commands.add('logout', () => {
  cy.log('🚪 Cerrando sesión...');

  // Buscar el botón de logout en el navbar
  cy.get('button, a').contains(/cerrar|logout|salir/i).click({ force: true });

  // Esperar a que redirija a home
  cy.url().should('include', '/home');

  // Verificar que el token fue eliminado
  cy.window().then((win) => {
    const token = win.localStorage.getItem('auth_token');
    expect(token).to.be.null;
  });

  cy.log('✅ Sesión cerrada correctamente');
});

/**
 * Comando personalizado para verificar si el usuario está logueado
 */
Cypress.Commands.add('checkLoggedIn', () => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('auth_token');
    const isAuth = win.localStorage.getItem('is_authenticated');

    expect(token).to.exist;
    expect(isAuth).to.equal('true');
  });

  cy.log('✅ Usuario está autenticado');
});

/**
 * Comando personalizado para esperar a que la página cargue completamente
 */
Cypress.Commands.add('waitForPageLoad', () => {
  cy.log('⏳ Esperando carga completa de la página...');

  // Esperar a que Angular termine de renderizar
  cy.window().should('have.property', 'ng');

  // Esperar a que no haya requests pendientes
  cy.wait(500);

  cy.log('✅ Página cargada completamente');
});

/**
 * Comando personalizado para verificar accesibilidad con axe
 */
Cypress.Commands.add('checkA11y', (context?: any, options?: any) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

/**
 * Sobrescribir comando de visit para agregar logging
 */
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  cy.log(`🌐 Navegando a: ${url}`);
  return originalFn(url, options);
});

/**
 * Comando para simular login directo (bypass UI) para pruebas más rápidas
 */
Cypress.Commands.add('loginBypass', (email: string, password: string) => {
  cy.log(`⚡ Login directo (bypass) para: ${email}`);

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email,
      password
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.be.true;

    // Guardar token en localStorage
    const token = response.body.data.token;
    const user = response.body.data.user;

    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', token);
      win.localStorage.setItem('current_user', JSON.stringify(user));
      win.localStorage.setItem('is_authenticated', 'true');
    });

    cy.log('✅ Login bypass exitoso');
  });
});

/**
 * Comando para verificar que una ruta existe (no devuelve 404)
 */
Cypress.Commands.add('checkRouteExists', (route: string) => {
  cy.visit(route, { failOnStatusCode: false });
  cy.url().should('not.include', '404');
  cy.url().should('not.eq', Cypress.config().baseUrl + '/home'); // No debe redirigir a home
});

/**
 * Comando para verificar tiempo de carga de una ruta
 */
Cypress.Commands.add('measureLoadTime', (route: string, maxTime: number = 3000) => {
  const startTime = Date.now();

  cy.visit(route).then(() => {
    const loadTime = Date.now() - startTime;
    cy.log(`⏱️ Tiempo de carga de ${route}: ${loadTime}ms`);

    expect(loadTime).to.be.lessThan(maxTime);
  });
});

/**
 * Comando para navegar usando teclado
 */
Cypress.Commands.add('navigateWithKeyboard', (selector: string) => {
  cy.get(selector).focus().type('{enter}');
});

// Agregar declaraciones de tipos para TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      loginBypass(email: string, password: string): Chainable<void>;
      checkRouteExists(route: string): Chainable<void>;
      measureLoadTime(route: string, maxTime?: number): Chainable<void>;
      navigateWithKeyboard(selector: string): Chainable<void>;
    }
  }
}

export {};
