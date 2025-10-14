/**
 * PRUEBAS DE RENDIMIENTO - TIEMPO DE CARGA DE RUTAS
 *
 * Objetivo: Verificar que las rutas carguen en menos de 3 segundos
 * según los requisitos del documento de Ing. de Software II.
 *
 * Referencia: Requisitos de Performance
 */

describe('06 - Rendimiento: Tiempo de Carga de Rutas', () => {

  const MAX_LOAD_TIME = 3000; // 3 segundos

  context('Tiempo de Carga de Rutas Públicas', () => {

    it('/home debe cargar en menos de 3 segundos', () => {
      const startTime = Date.now();

      cy.visit('/home').then(() => {
        const loadTime = Date.now() - startTime;
        cy.log(`Tiempo de carga: ${loadTime}ms`);
        expect(loadTime).to.be.lessThan(MAX_LOAD_TIME);
      });
    });

    it('/movies debe cargar en menos de 3 segundos', () => {
      const startTime = Date.now();

      cy.visit('/movies').then(() => {
        const loadTime = Date.now() - startTime;
        cy.log(`Tiempo de carga: ${loadTime}ms`);
        expect(loadTime).to.be.lessThan(MAX_LOAD_TIME);
      });
    });

    it('/bar debe cargar en menos de 3 segundos', () => {
      const startTime = Date.now();

      cy.visit('/bar').then(() => {
        const loadTime = Date.now() - startTime;
        cy.log(`Tiempo de carga: ${loadTime}ms`);
        expect(loadTime).to.be.lessThan(MAX_LOAD_TIME);
      });
    });

    it('/login debe cargar en menos de 3 segundos', () => {
      const startTime = Date.now();

      cy.visit('/login').then(() => {
        const loadTime = Date.now() - startTime;
        cy.log(`Tiempo de carga: ${loadTime}ms`);
        expect(loadTime).to.be.lessThan(MAX_LOAD_TIME);
      });
    });
  });

  context('Tiempo de Carga de Rutas con Parámetros', () => {

    it('/movie/:id debe cargar en menos de 3 segundos', () => {
      const startTime = Date.now();

      cy.visit('/movie/1').then(() => {
        const loadTime = Date.now() - startTime;
        cy.log(`Tiempo de carga: ${loadTime}ms`);
        expect(loadTime).to.be.lessThan(MAX_LOAD_TIME);
      });
    });

    it('/ticket-purchase/:id debe cargar en menos de 3 segundos', () => {
      const startTime = Date.now();

      cy.visit('/ticket-purchase/1').then(() => {
        const loadTime = Date.now() - startTime;
        cy.log(`Tiempo de carga: ${loadTime}ms`);
        expect(loadTime).to.be.lessThan(MAX_LOAD_TIME);
      });
    });
  });

  context('Tiempo de Navegación Entre Rutas', () => {

    it('Navegar de /home a /movies debe ser rápido', () => {
      cy.visit('/home');

      const startTime = Date.now();

      cy.contains(/películas|movies/i).click();

      cy.url().should('include', '/movies').then(() => {
        const navTime = Date.now() - startTime;
        cy.log(`Tiempo de navegación: ${navTime}ms`);
        expect(navTime).to.be.lessThan(MAX_LOAD_TIME);
      });
    });
  });

  context('Medición de Time to Interactive', () => {

    it('Los elementos interactivos deben estar disponibles rápidamente', () => {
      cy.visit('/movies', {
        onBeforeLoad(win) {
          win.performance.mark('start');
        }
      });

      cy.get('.card, .movie-card').first().should('be.visible').then(() => {
        cy.window().then((win) => {
          win.performance.mark('end');
          win.performance.measure('time-to-interactive', 'start', 'end');

          const measure = win.performance.getEntriesByName('time-to-interactive')[0];
          cy.log(`Time to Interactive: ${measure.duration}ms`);
          expect(measure.duration).to.be.lessThan(MAX_LOAD_TIME);
        });
      });
    });
  });

  context('Pruebas de Performance de API', () => {

    it('Las llamadas a la API no deben tardar más de 2 segundos', () => {
      cy.intercept('GET', '**/api/**').as('apiCall');

      cy.visit('/movies');

      cy.wait('@apiCall', { timeout: 2000 }).its('duration').should('be.lessThan', 2000);
    });
  });
});
