/**
 * PRUEBAS DE SEGURIDAD - AUTH GUARD
 *
 * Objetivo: Verificar que el AuthGuard proteja correctamente las rutas
 * que requieren autenticación.
 *
 * Referencia: auth.guard.ts:10-32, app-routing.module.ts (rutas con canActivate)
 */

describe('04 - Seguridad: AuthGuard', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  context('Bloqueo de Rutas Protegidas Sin Autenticación', () => {

    const protectedRoutes = [
      '/profile',
      '/favorites',
      '/history',
      '/cart',
      '/checkout',
      '/rewards',
      '/order-history',
      '/points-history',
      '/suggestions',
      '/seat-selection/1/1/2'
    ];

    protectedRoutes.forEach(route => {
      it(`Debe redirigir a /login al intentar acceder a ${route} sin autenticación`, () => {
        cy.visit(route, { failOnStatusCode: false });
        cy.url().should('include', '/login');
      });

      it(`Debe guardar redirectUrl al bloquear ${route}`, () => {
        cy.visit(route, { failOnStatusCode: false });
        cy.url().should('include', '/login');

        cy.window().then((win) => {
          const redirectUrl = win.localStorage.getItem('redirectUrl');
          expect(redirectUrl).to.include(route.split('/')[1]); // Verificar parte de la ruta
        });
      });
    });

    it('Debe mostrar toast/mensaje al redirigir a login', () => {
      cy.visit('/profile', { failOnStatusCode: false });
      cy.url().should('include', '/login');

      // Verificar mensaje según auth.guard.ts:26
      cy.get('body').should('contain.text', 'sesión'); // Parte del mensaje
    });
  });

  context('Acceso Permitido Con Autenticación', () => {

    beforeEach(() => {
      cy.fixture('users').then((users) => {
        cy.login(users.testUser.email, users.testUser.password);
      });
    });

    it('Usuario autenticado debe acceder a /profile', () => {
      cy.visit('/profile');
      cy.url().should('include', '/profile');
      cy.url().should('not.include', '/login');
    });

    it('Usuario autenticado debe acceder a /favorites', () => {
      cy.visit('/favorites');
      cy.url().should('include', '/favorites');
    });

    it('Usuario autenticado debe acceder a /cart', () => {
      cy.visit('/cart');
      cy.url().should('include', '/cart');
    });

    it('Usuario autenticado debe acceder a /checkout', () => {
      cy.visit('/checkout');
      cy.url().should('include', '/checkout');
    });

    it('Usuario autenticado debe acceder a /rewards', () => {
      cy.visit('/rewards');
      cy.url().should('include', '/rewards');
    });

    it('Usuario autenticado debe acceder a /order-history', () => {
      cy.visit('/order-history');
      cy.url().should('include', '/order-history');
    });

    it('Usuario autenticado debe acceder a /points-history', () => {
      cy.visit('/points-history');
      cy.url().should('include', '/points-history');
    });

    it('Usuario autenticado debe acceder a /seat-selection con parámetros', () => {
      cy.visit('/seat-selection/1/1/2');
      cy.url().should('include', '/seat-selection');
      cy.url().should('not.include', '/login');
    });
  });

  context('RedirectUrl Después del Login', () => {

    it('Debe redirigir a la URL guardada después de login exitoso', () => {
      // Intentar acceder a ruta protegida
      cy.visit('/favorites', { failOnStatusCode: false });
      cy.url().should('include', '/login');

      // Login
      cy.fixture('users').then((users) => {
        cy.get('input[type="email"]').type(users.testUser.email);
        cy.get('input[type="password"]').type(users.testUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait(1500);

        // Debe redirigir a /favorites
        cy.url().should('include', '/favorites');
      });
    });

    it('Debe limpiar redirectUrl después de usarla', () => {
      cy.visit('/history', { failOnStatusCode: false });
      cy.url().should('include', '/login');

      cy.fixture('users').then((users) => {
        cy.get('input[type="email"]').type(users.testUser.email);
        cy.get('input[type="password"]').type(users.testUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait(1500);

        // Verificar que se limpió la redirectUrl
        cy.window().then((win) => {
          const redirectUrl = win.localStorage.getItem('redirectUrl');
          expect(redirectUrl).to.be.null;
        });
      });
    });
  });

  context('Validación de Token Expirado', () => {

    it('Token expirado debe redirigir a login', () => {
      // Setear un token expirado manualmente
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'expired.fake.token');
        win.localStorage.setItem('is_authenticated', 'true');
      });

      // Intentar acceder a ruta protegida
      cy.visit('/profile', { failOnStatusCode: false });

      // Debe redirigir a login o limpiar el token
      cy.wait(1000);
      cy.url().should('match', /\/(login|home)/);
    });

    it('Token inválido debe ser limpiado', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'invalid-token');
        win.localStorage.setItem('is_authenticated', 'true');
      });

      cy.visit('/profile', { failOnStatusCode: false });
      cy.wait(1000);

      cy.window().then((win) => {
        const token = win.localStorage.getItem('auth_token');
        // Token debería ser null o la página debe redirigir
        if (token) {
          cy.url().should('include', '/login');
        } else {
          expect(token).to.be.null;
        }
      });
    });
  });

  context('Rutas Públicas No Deben Ser Afectadas', () => {

    const publicRoutes = [
      '/home',
      '/movies',
      '/coming-soon',
      '/bar',
      '/login',
      '/register',
      '/forgot-password'
    ];

    publicRoutes.forEach(route => {
      it(`Debe acceder a ${route} sin autenticación`, () => {
        cy.visit(route);
        cy.url().should('include', route);
        cy.url().should('not.include', '/login');
      });
    });
  });

  context('Pruebas de Manipulación de localStorage', () => {

    it('Manipular localStorage manualmente no debe bypasear el guard', () => {
      // Setear auth manualmente sin token válido
      cy.window().then((win) => {
        win.localStorage.setItem('is_authenticated', 'true');
        // Sin auth_token válido
      });

      cy.visit('/profile', { failOnStatusCode: false });

      // Debe redirigir a login porque falta el token
      cy.url().should('match', /\/(login|home)/);
    });

    it('Solo is_authenticated sin token no debe permitir acceso', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('is_authenticated', 'true');
        win.localStorage.removeItem('auth_token');
      });

      cy.visit('/cart', { failOnStatusCode: false });
      cy.url().should('not.include', '/cart');
    });

    it('Solo token sin is_authenticated no debe permitir acceso', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'some-token');
        win.localStorage.setItem('is_authenticated', 'false');
      });

      cy.visit('/checkout', { failOnStatusCode: false });
      cy.url().should('not.include', '/checkout');
    });
  });

  context('Navegación Entre Rutas Protegidas', () => {

    beforeEach(() => {
      cy.fixture('users').then((users) => {
        cy.login(users.testUser.email, users.testUser.password);
      });
    });

    it('Debe permitir navegar entre rutas protegidas sin re-autenticación', () => {
      cy.visit('/profile');
      cy.url().should('include', '/profile');

      cy.visit('/favorites');
      cy.url().should('include', '/favorites');

      cy.visit('/rewards');
      cy.url().should('include', '/rewards');

      // No debe redirigir a login en ningún momento
      cy.url().should('not.include', '/login');
    });

    it('Token debe persistir durante la sesión', () => {
      cy.visit('/profile');

      cy.window().then((win) => {
        const token1 = win.localStorage.getItem('auth_token');

        cy.visit('/cart');

        cy.window().then((win2) => {
          const token2 = win2.localStorage.getItem('auth_token');
          expect(token1).to.eq(token2);
        });
      });
    });
  });
});
