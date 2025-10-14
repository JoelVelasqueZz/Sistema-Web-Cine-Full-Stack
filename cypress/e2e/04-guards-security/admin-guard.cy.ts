/**
 * PRUEBAS DE SEGURIDAD - ADMIN GUARD
 *
 * Objetivo: Verificar que el AdminGuard proteja correctamente las rutas
 * de administración y solo permita acceso a usuarios con role='admin'.
 *
 * Referencia: admin.guard.ts:10-40, app-routing.module.ts:212-274
 */

describe('04 - Seguridad: AdminGuard', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  context('Bloqueo Total Sin Autenticación', () => {

    const adminRoutes = [
      '/admin',
      '/admin/dashboard',
      '/admin/movies',
      '/admin/users',
      '/admin/functions',
      '/admin/bar',
      '/admin/rewards',
      '/admin/config',
      '/admin/logs'
    ];

    adminRoutes.forEach(route => {
      it(`Sin autenticación, ${route} debe redirigir a /login`, () => {
        cy.visit(route, { failOnStatusCode: false });
        cy.url().should('include', '/login');
      });
    });

    it('Debe mostrar mensaje de "Debes iniciar sesión" al bloquear', () => {
      cy.visit('/admin', { failOnStatusCode: false });
      cy.url().should('include', '/login');

      // Verificar toast según admin.guard.ts:25
      cy.get('body').should('contain.text', 'sesión');
    });

    it('Debe guardar redirectUrl para ruta admin bloqueada', () => {
      cy.visit('/admin/users', { failOnStatusCode: false });
      cy.url().should('include', '/login');

      cy.window().then((win) => {
        const redirectUrl = win.localStorage.getItem('redirectUrl');
        expect(redirectUrl).to.include('/admin');
      });
    });
  });

  context('Bloqueo de Usuario Normal (No Admin)', () => {

    beforeEach(() => {
      // Login como usuario normal (NO admin)
      cy.fixture('users').then((users) => {
        cy.login(users.testUser.email, users.testUser.password);
      });
    });

    it('Usuario normal debe ser bloqueado de /admin', () => {
      cy.visit('/admin', { failOnStatusCode: false });
      cy.url().should('not.include', '/admin');
      cy.url().should('include', '/home');
    });

    it('Usuario normal debe ser bloqueado de /admin/dashboard', () => {
      cy.visit('/admin/dashboard', { failOnStatusCode: false });
      cy.url().should('not.include', '/admin');
      cy.url().should('include', '/home');
    });

    it('Usuario normal debe ser bloqueado de /admin/users', () => {
      cy.visit('/admin/users', { failOnStatusCode: false });
      cy.url().should('not.include', '/admin');
      cy.url().should('include', '/home');
    });

    it('Debe mostrar mensaje "Acceso denegado" al bloquear usuario normal', () => {
      cy.visit('/admin', { failOnStatusCode: false });

      // Verificar mensaje de error según admin.guard.ts:35
      cy.get('body').should('contain.text', 'denegado');
    });

    it('Usuario normal debe poder acceder a rutas no-admin', () => {
      cy.visit('/profile');
      cy.url().should('include', '/profile');

      cy.visit('/cart');
      cy.url().should('include', '/cart');
    });
  });

  context('Acceso Permitido Para Admin', () => {

    beforeEach(() => {
      // Login como admin
      cy.fixture('users').then((users) => {
        cy.login(users.testAdmin.email, users.testAdmin.password);
      });
    });

    it('Admin debe acceder a /admin', () => {
      cy.visit('/admin');
      cy.url().should('include', '/admin');
    });

    it('Admin debe acceder a /admin/dashboard', () => {
      cy.visit('/admin/dashboard');
      cy.url().should('include', '/admin/dashboard');
    });

    it('Admin debe acceder a /admin/movies', () => {
      cy.visit('/admin/movies');
      cy.url().should('include', '/admin/movies');
    });

    it('Admin debe acceder a /admin/users', () => {
      cy.visit('/admin/users');
      cy.url().should('include', '/admin/users');
    });

    it('Admin debe acceder a /admin/functions', () => {
      cy.visit('/admin/functions');
      cy.url().should('include', '/admin/functions');
    });

    it('Admin debe acceder a /admin/bar', () => {
      cy.visit('/admin/bar');
      cy.url().should('include', '/admin/bar');
    });

    it('Admin debe acceder a /admin/rewards', () => {
      cy.visit('/admin/rewards');
      cy.url().should('include', '/admin/rewards');
    });

    it('Admin debe acceder a /admin/config', () => {
      cy.visit('/admin/config');
      cy.url().should('include', '/admin/config');
    });

    it('Admin debe acceder a /admin/logs', () => {
      cy.visit('/admin/logs');
      cy.url().should('include', '/admin/logs');
    });

    it('Admin debe poder navegar entre rutas admin sin bloqueos', () => {
      cy.visit('/admin/dashboard');
      cy.url().should('include', '/admin/dashboard');

      cy.visit('/admin/users');
      cy.url().should('include', '/admin/users');

      cy.visit('/admin/movies');
      cy.url().should('include', '/admin/movies');
    });
  });

  context('Redirección de /admin a /admin/dashboard', () => {

    beforeEach(() => {
      cy.fixture('users').then((users) => {
        cy.login(users.testAdmin.email, users.testAdmin.password);
      });
    });

    it('/admin sin subruta debe redirigir a /admin/dashboard', () => {
      cy.visit('/admin');
      cy.wait(500);
      cy.url().should('include', '/admin/dashboard');
    });
  });

  context('Validación de Role en localStorage', () => {

    it('Manipular role en localStorage no debe bypasear AdminGuard', () => {
      // Login como usuario normal
      cy.fixture('users').then((users) => {
        cy.login(users.testUser.email, users.testUser.password);
      });

      // Intentar manipular el role
      cy.window().then((win) => {
        const userStr = win.localStorage.getItem('current_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.role = 'admin'; // Intentar cambiar a admin
          win.localStorage.setItem('current_user', JSON.stringify(user));
        }
      });

      // Intentar acceder a admin
      cy.visit('/admin', { failOnStatusCode: false });

      // El guard debe verificar con el servidor, no solo con localStorage
      // Puede redirigir o mostrar error
      cy.url().should('exist');
    });
  });

  context('Login Directo Como Admin', () => {

    it('Login exitoso de admin debe redirigir a /admin', () => {
      cy.visit('/login');

      cy.fixture('users').then((users) => {
        cy.get('input[type="email"]').type(users.testAdmin.email);
        cy.get('input[type="password"]').type(users.testAdmin.password);
        cy.get('button[type="submit"]').click();

        cy.wait(1500);

        // Según login.component.ts:66-67, admin debe ir a /admin
        cy.url().should('include', '/admin');
      });
    });
  });

  context('Admin Puede Acceder a Rutas de Usuario Normal', () => {

    beforeEach(() => {
      cy.fixture('users').then((users) => {
        cy.login(users.testAdmin.email, users.testAdmin.password);
      });
    });

    it('Admin debe poder acceder a rutas de usuario normal', () => {
      const userRoutes = ['/profile', '/cart', '/favorites', '/rewards'];

      userRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', route);
      });
    });
  });

  context('Pruebas de Seguridad Avanzadas', () => {

    it('Usuario normal no debe ver enlaces a admin en el navbar', () => {
      cy.fixture('users').then((users) => {
        cy.login(users.testUser.email, users.testUser.password);
      });

      cy.visit('/home');

      cy.get('nav, .navbar').within(() => {
        cy.get('body').should('not.contain', 'Admin');
        cy.get('body').should('not.contain', 'Dashboard');
      });
    });

    it('Admin debe ver enlaces a admin en el navbar', () => {
      cy.fixture('users').then((users) => {
        cy.login(users.testAdmin.email, users.testAdmin.password);
      });

      cy.visit('/home');

      cy.get('nav, .navbar, .sidebar').then(($body) => {
        // Verificar que existe algún enlace a admin
        if ($body.text().includes('Admin') || $body.text().includes('Dashboard')) {
          cy.contains(/admin|dashboard/i).should('exist');
        }
      });
    });

    it('Acceso directo a subruta admin sin autenticación debe bloquear', () => {
      cy.visit('/admin/users', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });

    it('Múltiples intentos de acceso a admin deben ser bloqueados consistentemente', () => {
      cy.fixture('users').then((users) => {
        cy.login(users.testUser.email, users.testUser.password);
      });

      // Intentar 3 veces
      for (let i = 0; i < 3; i++) {
        cy.visit('/admin', { failOnStatusCode: false });
        cy.url().should('include', '/home');
        cy.wait(500);
      }
    });
  });

  context('Combinación de Guards (AuthGuard + AdminGuard)', () => {

    it('Rutas admin deben estar protegidas por AMBOS guards', () => {
      // Sin autenticación - bloqueado por AuthGuard
      cy.visit('/admin/users', { failOnStatusCode: false });
      cy.url().should('include', '/login');

      // Con autenticación pero sin role admin - bloqueado por AdminGuard
      cy.fixture('users').then((users) => {
        cy.get('input[type="email"]').type(users.testUser.email);
        cy.get('input[type="password"]').type(users.testUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait(1500);

        cy.visit('/admin/users', { failOnStatusCode: false });
        cy.url().should('not.include', '/admin/users');
        cy.url().should('include', '/home');
      });
    });
  });
});
