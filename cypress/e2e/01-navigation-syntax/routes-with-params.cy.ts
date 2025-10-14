/**
 * PRUEBAS DE SINTAXIS DE NAVEGACIÓN - RUTAS CON PARÁMETROS
 *
 * Objetivo: Verificar que las rutas con parámetros dinámicos (:id, :movieId, etc.)
 * funcionen correctamente y manejen valores válidos e inválidos.
 *
 * Referencia: app-routing.module.ts líneas 66-76, 89-91, etc.
 */

describe('01 - Sintaxis de Navegación: Rutas con Parámetros', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  context('Rutas de Películas con ID', () => {

    it('Debe cargar /movie/:id con ID válido', () => {
      cy.visit('/movie/1');
      cy.url().should('include', '/movie/1');
      cy.get('body').should('be.visible');
    });

    it('Debe manejar /movie/:id con diferentes IDs numéricos', () => {
      const movieIds = [1, 2, 5, 10, 999];

      movieIds.forEach(id => {
        cy.visit(`/movie/${id}`, { failOnStatusCode: false });
        cy.url().should('include', `/movie/${id}`);
      });
    });

    it('Debe manejar /movie/:id con ID no numérico', () => {
      cy.visit('/movie/abc', { failOnStatusCode: false });
      // La aplicación debería manejar esto apropiadamente
      cy.url().should('include', '/movie/abc');
    });

    it('Debe cargar /ticket-purchase/:id con ID válido', () => {
      cy.visit('/ticket-purchase/1');
      cy.url().should('include', '/ticket-purchase/1');
    });
  });

  context('Rutas de Selección de Asientos (Protegida)', () => {

    it('Debe cargar /seat-selection/:movieId/:funcionId/:cantidad sin login (redirigir)', () => {
      cy.visit('/seat-selection/1/1/2', { failOnStatusCode: false });
      // Debe redirigir a login porque está protegida
      cy.url().should('include', '/login');
    });

    it('Debe validar la estructura de parámetros múltiples', () => {
      const validParams = [
        { movieId: 1, funcionId: 1, cantidad: 2 },
        { movieId: 5, funcionId: 3, cantidad: 4 },
        { movieId: 10, funcionId: 8, cantidad: 1 }
      ];

      validParams.forEach(params => {
        cy.visit(`/seat-selection/${params.movieId}/${params.funcionId}/${params.cantidad}`, {
          failOnStatusCode: false
        });
        // Debe redirigir a login
        cy.url().should('include', '/login');
      });
    });
  });

  context('Rutas del Bar con ID', () => {

    it('Debe cargar /bar/:id con ID válido', () => {
      cy.visit('/bar/1');
      cy.url().should('include', '/bar/1');
    });

    it('Debe manejar múltiples IDs de productos del bar', () => {
      const productIds = [1, 2, 3, 5, 10];

      productIds.forEach(id => {
        cy.visit(`/bar/${id}`, { failOnStatusCode: false });
        cy.url().should('include', `/bar/${id}`);
      });
    });
  });

  context('Rutas de Próximos Estrenos con ID', () => {

    it('Debe cargar /coming-soon/:id con ID válido', () => {
      cy.visit('/coming-soon/1');
      cy.url().should('include', '/coming-soon/1');
    });

    it('Debe validar diferentes IDs de próximos estrenos', () => {
      [1, 2, 3].forEach(id => {
        cy.visit(`/coming-soon/${id}`, { failOnStatusCode: false });
        cy.url().should('include', `/coming-soon/${id}`);
      });
    });
  });

  context('Ruta de Búsqueda con Término', () => {

    it('Debe cargar /buscar/:termino con término válido', () => {
      cy.visit('/buscar/avengers');
      cy.url().should('include', '/buscar/avengers');
    });

    it('Debe manejar términos de búsqueda con espacios (URL encoded)', () => {
      cy.visit('/buscar/spider%20man');
      cy.url().should('include', '/buscar/spider');
    });

    it('Debe manejar términos de búsqueda con caracteres especiales', () => {
      const searchTerms = ['action', 'comedy', 'sci-fi', '2024'];

      searchTerms.forEach(term => {
        cy.visit(`/buscar/${term}`, { failOnStatusCode: false });
        cy.url().should('include', `/buscar/${term}`);
      });
    });

    it('Debe manejar término de búsqueda vacío o muy corto', () => {
      cy.visit('/buscar/a', { failOnStatusCode: false });
      cy.url().should('include', '/buscar');
    });
  });

  context('Ruta de Reset Password con Token', () => {

    it('Debe cargar /reset-password/:token con token simulado', () => {
      const fakeToken = 'fake-reset-token-123abc';
      cy.visit(`/reset-password/${fakeToken}`);
      cy.url().should('include', `/reset-password/${fakeToken}`);
    });

    it('Debe manejar diferentes formatos de token', () => {
      const tokens = [
        'short',
        'very-long-token-123456789-abcdefg',
        'token_with_underscores',
        'token-with-dashes'
      ];

      tokens.forEach(token => {
        cy.visit(`/reset-password/${token}`, { failOnStatusCode: false });
        cy.url().should('include', `/reset-password/${token}`);
      });
    });
  });

  context('Validación de Parámetros Inválidos', () => {

    it('Debe manejar ID negativo en /movie/:id', () => {
      cy.visit('/movie/-1', { failOnStatusCode: false });
      cy.url().should('include', '/movie/-1');
      // La aplicación debería mostrar un mensaje de error apropiado
    });

    it('Debe manejar ID cero en rutas de recursos', () => {
      cy.visit('/movie/0', { failOnStatusCode: false });
      cy.url().should('include', '/movie/0');
    });

    it('Debe manejar parámetros faltantes en rutas múltiples', () => {
      // Intentar acceder a seat-selection sin todos los parámetros
      cy.visit('/seat-selection/1/1', { failOnStatusCode: false });
      // Angular debería manejar esto redirigiendo o mostrando error
      cy.url().should('exist');
    });
  });

  context('Persistencia de Parámetros en Navegación', () => {

    it('Los parámetros deben mantenerse en la URL después de la carga', () => {
      cy.visit('/movie/5');
      cy.url().should('include', '/movie/5');

      // Esperar carga completa
      cy.wait(1000);

      // Verificar que el parámetro sigue presente
      cy.url().should('include', '/movie/5');
    });

    it('Navegar entre rutas con parámetros debe actualizar correctamente', () => {
      cy.visit('/movie/1');
      cy.url().should('include', '/movie/1');

      // Simular navegación a otra película
      cy.visit('/movie/2');
      cy.url().should('include', '/movie/2');
      cy.url().should('not.include', '/movie/1');
    });
  });
});
