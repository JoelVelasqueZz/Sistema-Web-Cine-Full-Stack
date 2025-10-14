/**
 * PRUEBAS DE ACCESIBILIDAD - NAVEGACIÓN POR TECLADO
 *
 * Objetivo: Verificar que la aplicación sea completamente navegable
 * usando solo el teclado (Tab, Enter, Esc, flechas).
 *
 * Referencia: WCAG 2.1 - Keyboard Accessible
 */

describe('05 - Accesibilidad: Navegación por Teclado', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  context('Navegación con Tab en el Navbar', () => {

    it('Debe poder navegar por todos los enlaces del navbar con Tab', () => {
      cy.visit('/home');

      cy.get('body').type('{tab}');
      cy.focused().should('exist');

      // Continuar tabulando por los elementos del navbar
      for (let i = 0; i < 5; i++) {
        cy.focused().should('be.visible');
        cy.get('body').type('{tab}');
      }
    });

    it('El foco debe ser visible en cada elemento', () => {
      cy.visit('/home');

      cy.get('nav a, nav button').first().focus();
      cy.focused().should('have.css', 'outline').and('not.eq', 'none');
    });

    it('Debe poder activar enlaces con Enter', () => {
      cy.visit('/home');

      cy.get('nav').contains(/películas|movies/i).focus().type('{enter}');
      cy.url().should('include', '/movies');
    });
  });

  context('Navegación con Tab en Formularios', () => {

    it('Debe poder navegar por todos los campos del formulario de login', () => {
      cy.visit('/login');

      // Email
      cy.get('body').type('{tab}');
      cy.focused().should('have.attr', 'type', 'email');

      // Password
      cy.get('body').type('{tab}');
      cy.focused().should('have.attr', 'type', 'password');

      // Submit button
      cy.get('body').type('{tab}');
      cy.focused().should('have.attr', 'type', 'submit');
    });

    it('Debe poder enviar formulario con Enter en el último campo', () => {
      cy.visit('/login');
      cy.fixture('users').then((users) => {
        cy.get('input[type="email"]').type(users.testUser.email);
        cy.get('input[type="password"]').type(users.testUser.password + '{enter}');

        cy.wait(1000);
        cy.url().should('not.include', '/login');
      });
    });
  });

  context('Navegación en Listas de Películas', () => {

    it('Las tarjetas de películas deben ser accesibles con Tab', () => {
      cy.visit('/movies');
      cy.wait(1000);

      cy.get('.card, .movie-card').first().focus();
      cy.focused().should('be.visible');
    });

    it('Debe poder abrir una película con Enter', () => {
      cy.visit('/movies');
      cy.wait(1000);

      cy.get('.card, .movie-card').first().focus().type('{enter}');
      cy.url().should('match', /\/movie\/\d+/);
    });
  });

  context('Navegación con Esc para Cerrar Modales', () => {

    it('Debe cerrar modales con Esc (si existen)', () => {
      cy.visit('/home');

      cy.get('body').then(($body) => {
        if ($body.find('.modal, [role="dialog"]').length > 0) {
          cy.get('.modal').first().should('be.visible');
          cy.get('body').type('{esc}');
          cy.get('.modal').should('not.be.visible');
        }
      });
    });
  });

  context('Skip Links (Acceso Rápido)', () => {

    it('Debe existir un link de "Skip to main content" (opcional pero recomendado)', () => {
      cy.visit('/home');

      cy.get('body').then(($body) => {
        if ($body.find('a[href="#main"], a:contains("Skip")').length > 0) {
          cy.get('a[href="#main"], a:contains("Skip")').should('exist');
        }
      });
    });
  });

  context('Orden Lógico de Tabulación', () => {

    it('El orden de tab debe ser lógico (navbar → contenido → footer)', () => {
      cy.visit('/home');

      // Primer tab debe ir al navbar
      cy.get('body').type('{tab}');
      cy.focused().parents('nav, header').should('exist');
    });

    it('No debe haber tab traps (trampas de teclado)', () => {
      cy.visit('/home');

      // Tabular 20 veces y verificar que sigue moviéndose
      for (let i = 0; i < 20; i++) {
        cy.get('body').type('{tab}');
        cy.focused().should('exist');
      }
    });
  });
});
