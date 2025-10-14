/**
 * PRUEBAS DE SINTAXIS DE NAVEGACIÓN - VALIDEZ DE RUTAS
 *
 * Objetivo: Verificar que todas las rutas definidas en app-routing.module.ts
 * sean válidas y no devuelvan errores 404.
 *
 * Referencia: Ingeniería de Software II - Pruebas de Navegación
 */

describe('01 - Sintaxis de Navegación: Validez de Rutas', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  context('Rutas Públicas', () => {

    it('Debe cargar correctamente la ruta /home', () => {
      cy.visit('/home');
      cy.url().should('include', '/home');
      cy.get('body').should('be.visible');
    });

    it('Debe cargar correctamente la ruta /movies', () => {
      cy.visit('/movies');
      cy.url().should('include', '/movies');
      cy.contains(/películas|cartelera/i).should('be.visible');
    });

    it('Debe cargar correctamente la ruta /coming-soon', () => {
      cy.visit('/coming-soon');
      cy.url().should('include', '/coming-soon');
      cy.contains(/próximos|estrenos/i).should('be.visible');
    });

    it('Debe cargar correctamente la ruta /bar', () => {
      cy.visit('/bar');
      cy.url().should('include', '/bar');
      cy.contains(/bar|snack/i).should('be.visible');
    });

    it('Debe cargar correctamente la ruta /login', () => {
      cy.visit('/login');
      cy.url().should('include', '/login');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
    });

    it('Debe cargar correctamente la ruta /register', () => {
      cy.visit('/register');
      cy.url().should('include', '/register');
      cy.get('form').should('be.visible');
    });

    it('Debe cargar correctamente la ruta /forgot-password', () => {
      cy.visit('/forgot-password');
      cy.url().should('include', '/forgot-password');
      cy.contains(/recuperar|olvidaste/i).should('be.visible');
    });
  });

  context('Rutas con Redirección', () => {

    it('La ruta raíz "/" debe redirigir a /home', () => {
      cy.visit('/');
      cy.url().should('include', '/home');
    });

    it('La ruta /orders debe redirigir a /order-history', () => {
      // Esta ruta requiere autenticación, verificamos solo la redirección
      cy.visit('/orders', { failOnStatusCode: false });
      // Debe redirigir a login o a order-history si está autenticado
      cy.url().should('match', /\/(login|order-history)/);
    });

    it('Rutas inexistentes deben redirigir a /home (wildcard)', () => {
      cy.visit('/ruta-que-no-existe-12345', { failOnStatusCode: false });
      cy.url().should('include', '/home');
    });
  });

  context('Verificación de Rutas Protegidas (Sin Autenticación)', () => {

    it('Intentar acceder a /profile sin login debe redirigir a /login', () => {
      cy.visit('/profile', { failOnStatusCode: false });
      cy.url().should('include', '/login');

      // Verificar que se guardó la URL de redirección
      cy.window().then((win) => {
        const redirectUrl = win.localStorage.getItem('redirectUrl');
        expect(redirectUrl).to.include('/profile');
      });
    });

    it('Intentar acceder a /cart sin login debe redirigir a /login', () => {
      cy.visit('/cart', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });

    it('Intentar acceder a /checkout sin login debe redirigir a /login', () => {
      cy.visit('/checkout', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });

    it('Intentar acceder a /rewards sin login debe redirigir a /login', () => {
      cy.visit('/rewards', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });

    it('Intentar acceder a /favorites sin login debe redirigir a /login', () => {
      cy.visit('/favorites', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });
  });

  context('Verificación de Rutas de Admin (Sin Autenticación)', () => {

    it('Intentar acceder a /admin sin login debe redirigir a /login', () => {
      cy.visit('/admin', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });

    it('Intentar acceder a /admin/dashboard sin login debe redirigir a /login', () => {
      cy.visit('/admin/dashboard', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });

    it('Intentar acceder a /admin/movies sin login debe redirigir a /login', () => {
      cy.visit('/admin/movies', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });

    it('Intentar acceder a /admin/users sin login debe redirigir a /login', () => {
      cy.visit('/admin/users', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });
  });

  context('Verificación de Status HTTP', () => {

    it('Rutas públicas deben devolver status 200', () => {
      const publicRoutes = ['/home', '/movies', '/bar', '/login', '/register'];

      publicRoutes.forEach(route => {
        cy.request({
          url: route,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(200);
        });
      });
    });

    it('Rutas protegidas sin autenticación deben redirigir (status 200 pero URL diferente)', () => {
      cy.visit('/profile', { failOnStatusCode: false });
      cy.url().should('not.include', '/profile');
      cy.url().should('include', '/login');
    });
  });

  context('Verificación de Títulos de Página', () => {

    it('La ruta /home debe tener el título correcto', () => {
      cy.visit('/home');
      cy.title().should('include', 'Parky Films');
    });

    it('La ruta /login debe tener el título correcto', () => {
      cy.visit('/login');
      cy.title().should('match', /login|iniciar|sesión/i);
    });

    it('La ruta /movies debe tener el título correcto', () => {
      cy.visit('/movies');
      cy.title().should('match', /películas|cartelera/i);
    });
  });
});
