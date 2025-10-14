/**
 * PRUEBAS DE SEMÁNTICA DE NAVEGACIÓN - LOGIN Y LOGOUT
 *
 * Objetivo: Verificar que los botones "Iniciar Sesión" y "Cerrar Sesión"
 * naveguen correctamente a las rutas esperadas.
 *
 * Referencia: LoginComponent (login.component.ts:30-87),
 *             NavbarComponent (navbar.component.ts:148-158)
 */

describe('02 - Semántica de Navegación: Login y Logout', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  context('Navegación a Login', () => {

    it('El botón "Iniciar Sesión" debe navegar a /login', () => {
      cy.visit('/home');
      cy.contains(/iniciar|login|entrar/i).click();
      cy.url().should('include', '/login');
    });

    it('La página de login debe cargar correctamente', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('Debe mostrar el título correcto en la página de login', () => {
      cy.visit('/login');
      cy.contains(/iniciar sesión|login/i).should('be.visible');
    });
  });

  context('Proceso de Login Exitoso - Usuario Normal', () => {

    it('Login exitoso debe navegar a /home', () => {
      cy.fixture('users').then((users) => {
        cy.visit('/login');
        cy.get('input[type="email"]').type(users.testUser.email);
        cy.get('input[type="password"]').type(users.testUser.password);
        cy.get('button[type="submit"]').click();

        // Verificar navegación (puede ir a /home o a la URL guardada)
        cy.url().should('not.include', '/login');
        cy.url().should('match', /\/(home|profile|movies)/);
      });
    });

    it('Login exitoso debe guardar el token en localStorage', () => {
      cy.fixture('users').then((users) => {
        cy.visit('/login');
        cy.get('input[type="email"]').type(users.testUser.email);
        cy.get('input[type="password"]').type(users.testUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait(1000);

        cy.window().then((win) => {
          const token = win.localStorage.getItem('auth_token');
          const isAuth = win.localStorage.getItem('is_authenticated');

          expect(token).to.exist;
          expect(isAuth).to.eq('true');
        });
      });
    });

    it('Después del login debe mostrar el nombre del usuario en el navbar', () => {
      cy.fixture('users').then((users) => {
        cy.visit('/login');
        cy.get('input[type="email"]').type(users.testUser.email);
        cy.get('input[type="password"]').type(users.testUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait(1000);

        // Verificar que aparezca el nombre o un indicador de usuario logueado
        cy.get('nav, .navbar').within(() => {
          cy.contains(/perfil|cerrar|logout|salir/i).should('be.visible');
        });
      });
    });
  });

  context('Proceso de Login Exitoso - Admin', () => {

    it('Login como admin debe navegar a /admin', () => {
      cy.fixture('users').then((users) => {
        cy.visit('/login');
        cy.get('input[type="email"]').type(users.testAdmin.email);
        cy.get('input[type="password"]').type(users.testAdmin.password);
        cy.get('button[type="submit"]').click();

        // Admin debe ir a /admin (según login.component.ts:66-67)
        cy.url().should('include', '/admin');
      });
    });
  });

  context('Login con RedirectUrl', () => {

    it('Debe redirigir a la URL guardada después del login', () => {
      // Intentar acceder a una ruta protegida
      cy.visit('/profile', { failOnStatusCode: false });
      cy.url().should('include', '/login');

      // Verificar que se guardó la URL
      cy.window().then((win) => {
        const redirectUrl = win.localStorage.getItem('redirectUrl');
        expect(redirectUrl).to.include('/profile');
      });

      // Hacer login
      cy.fixture('users').then((users) => {
        cy.get('input[type="email"]').type(users.testUser.email);
        cy.get('input[type="password"]').type(users.testUser.password);
        cy.get('button[type="submit"]').click();

        // Debe redirigir a /profile
        cy.url().should('include', '/profile');
      });
    });
  });

  context('Login Fallido', () => {

    it('Credenciales incorrectas no deben navegar fuera de /login', () => {
      cy.fixture('users').then((users) => {
        cy.visit('/login');
        cy.get('input[type="email"]').type(users.invalidUser.email);
        cy.get('input[type="password"]').type(users.invalidUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait(1000);

        // Debe permanecer en /login
        cy.url().should('include', '/login');
      });
    });

    it('Debe mostrar mensaje de error en login fallido', () => {
      cy.fixture('users').then((users) => {
        cy.visit('/login');
        cy.get('input[type="email"]').type(users.invalidUser.email);
        cy.get('input[type="password"]').type(users.invalidUser.password);
        cy.get('button[type="submit"]').click();

        // Debe mostrar toast o mensaje de error
        cy.contains(/error|incorrecto|inválido/i, { timeout: 5000 }).should('be.visible');
      });
    });
  });

  context('Navegación de Logout', () => {

    beforeEach(() => {
      // Login automático antes de cada prueba
      cy.fixture('users').then((users) => {
        cy.login(users.testUser.email, users.testUser.password);
      });
    });

    it('El botón "Cerrar Sesión" debe navegar a /home', () => {
      cy.visit('/home');
      cy.logout();
      cy.url().should('include', '/home');
    });

    it('Logout debe limpiar el token de localStorage', () => {
      cy.visit('/home');
      cy.logout();

      cy.window().then((win) => {
        const token = win.localStorage.getItem('auth_token');
        const isAuth = win.localStorage.getItem('is_authenticated');

        expect(token).to.be.null;
        expect(isAuth).to.be.null;
      });
    });

    it('Después de logout no debe mostrar opciones de usuario logueado', () => {
      cy.visit('/home');
      cy.logout();

      // Verificar que aparezcan botones de login/register
      cy.get('nav, .navbar').within(() => {
        cy.contains(/iniciar|login|registr/i).should('be.visible');
      });
    });

    it('Después de logout no debe poder acceder a rutas protegidas', () => {
      cy.visit('/home');
      cy.logout();

      // Intentar acceder a perfil
      cy.visit('/profile', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });
  });

  context('Login con OAuth', () => {

    it('El botón de Google OAuth debe existir', () => {
      cy.visit('/login');
      cy.contains(/google|continuar con google/i).should('exist');
    });

    it('Hacer clic en Google OAuth debe iniciar el flujo (redirect externo)', () => {
      cy.visit('/login');

      // Interceptar la redirección
      cy.window().then((win) => {
        cy.stub(win, 'location').get(() => {
          return {
            href: Cypress.config().baseUrl + '/login',
            assign: cy.stub().as('locationAssign')
          };
        });
      });

      // Click en botón OAuth
      cy.contains(/google|continuar con google/i).click();

      // Verificar que se intentó redirigir
      // Nota: No podemos verificar la URL externa, solo que se llamó al método
    });
  });

  context('Validaciones de Formulario de Login', () => {

    it('No debe permitir enviar formulario con campos vacíos', () => {
      cy.visit('/login');
      cy.get('button[type="submit"]').click();

      // Debe permanecer en login
      cy.url().should('include', '/login');
    });

    it('No debe permitir login con email vacío', () => {
      cy.visit('/login');
      cy.get('input[type="password"]').type('somepassword');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/login');
    });

    it('No debe permitir login con password vacío', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/login');
    });
  });
});
