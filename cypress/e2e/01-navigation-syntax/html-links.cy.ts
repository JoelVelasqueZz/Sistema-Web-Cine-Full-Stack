/**
 * PRUEBAS DE SINTAXIS DE NAVEGACIÓN - ENLACES HTML
 *
 * Objetivo: Verificar que todos los enlaces HTML (routerLink, href)
 * apunten a rutas válidas definidas en app-routing.module.ts
 *
 * Referencia: NavbarComponent, componentes con navegación
 */

describe('01 - Sintaxis de Navegación: Enlaces HTML', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  context('Enlaces del Navbar (Rutas Públicas)', () => {

    beforeEach(() => {
      cy.visit('/home');
    });

    it('El navbar debe contener enlace a "Inicio" o "Home"', () => {
      cy.get('nav, .navbar').within(() => {
        cy.contains(/inicio|home/i).should('exist');
      });
    });

    it('El navbar debe contener enlace a "Películas"', () => {
      cy.get('nav, .navbar').within(() => {
        cy.contains(/películas|movies|cartelera/i).should('exist');
      });
    });

    it('El navbar debe contener enlace a "Próximos Estrenos"', () => {
      cy.get('nav, .navbar').within(() => {
        cy.contains(/próximos|estrenos|coming/i).should('exist');
      });
    });

    it('El navbar debe contener enlace al "Bar"', () => {
      cy.get('nav, .navbar').within(() => {
        cy.contains(/bar|snacks/i).should('exist');
      });
    });

    it('Todos los enlaces del navbar deben tener atributo routerLink o href válido', () => {
      cy.get('nav a[routerLink], nav a[href]').each(($link) => {
        const routerLink = $link.attr('routerLink');
        const href = $link.attr('href');

        // Verificar que al menos uno exista
        expect(routerLink || href).to.exist;

        // Si tiene routerLink, verificar que no esté vacío
        if (routerLink) {
          expect(routerLink).to.not.be.empty;
        }
      });
    });
  });

  context('Enlaces de Autenticación (Sin Login)', () => {

    beforeEach(() => {
      cy.visit('/home');
    });

    it('Debe mostrar botón/enlace "Iniciar Sesión" cuando no está logueado', () => {
      cy.contains(/iniciar|login|entrar/i).should('be.visible');
    });

    it('Debe mostrar botón/enlace "Registrarse" cuando no está logueado', () => {
      cy.contains(/registr|sign up|crear cuenta/i).should('be.visible');
    });

    it('El enlace "Iniciar Sesión" debe navegar a /login', () => {
      cy.contains(/iniciar|login|entrar/i).click();
      cy.url().should('include', '/login');
    });

    it('El enlace "Registrarse" debe navegar a /register', () => {
      cy.visit('/home');
      cy.contains(/registr|sign up|crear cuenta/i).click();
      cy.url().should('include', '/register');
    });
  });

  context('Enlaces en la Página de Películas', () => {

    beforeEach(() => {
      cy.visit('/movies');
      cy.wait(1000); // Esperar a que carguen las películas
    });

    it('Las tarjetas de películas deben tener enlaces clickeables', () => {
      cy.get('.card, .movie-card, .pelicula-card').first().within(() => {
        cy.get('a, button').should('exist');
      });
    });

    it('Hacer clic en una película debe navegar a /movie/:id', () => {
      cy.get('.card, .movie-card, .pelicula-card').first().click({ force: true });
      cy.url().should('match', /\/movie\/\d+/);
    });
  });

  context('Enlaces en Página de Login', () => {

    beforeEach(() => {
      cy.visit('/login');
    });

    it('Debe existir enlace a "Olvidaste tu contraseña"', () => {
      cy.contains(/olvidaste|recuperar|forgot/i).should('be.visible');
    });

    it('El enlace de recuperación debe navegar a /forgot-password', () => {
      cy.contains(/olvidaste|recuperar|forgot/i).click();
      cy.url().should('include', '/forgot-password');
    });

    it('Debe existir enlace para "Crear cuenta" o "Registrarse"', () => {
      cy.visit('/login');
      cy.contains(/crear cuenta|registr|sign up/i).should('be.visible');
    });

    it('El enlace "Crear cuenta" debe navegar a /register', () => {
      cy.visit('/login');
      cy.contains(/crear cuenta|registr|sign up/i).click();
      cy.url().should('include', '/register');
    });
  });

  context('Enlaces en Página de Registro', () => {

    beforeEach(() => {
      cy.visit('/register');
    });

    it('Debe existir enlace para usuarios que ya tienen cuenta', () => {
      cy.contains(/ya tienes|iniciar|login/i).should('be.visible');
    });

    it('El enlace debe navegar a /login', () => {
      cy.contains(/ya tienes|iniciar|login/i).click();
      cy.url().should('include', '/login');
    });
  });

  context('Verificación de Enlaces Rotos', () => {

    it('Ningún enlace del navbar debe devolver 404', () => {
      cy.visit('/home');

      cy.get('nav a[routerLink]').each(($link) => {
        const route = $link.attr('routerLink');
        if (route && !route.includes(':')) {
          cy.request({
            url: route,
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.not.eq(404);
          });
        }
      });
    });

    it('Enlaces de footer (si existe) deben ser válidos', () => {
      cy.visit('/home');

      cy.get('footer').then(($footer) => {
        if ($footer.length > 0) {
          cy.get('footer a[routerLink]').each(($link) => {
            const route = $link.attr('routerLink');
            if (route && !route.includes(':')) {
              expect(route).to.match(/^\/[a-z-]+$/);
            }
          });
        }
      });
    });
  });

  context('Navegación Relativa y Absoluta', () => {

    it('Los enlaces principales deben usar rutas absolutas (/movies)', () => {
      cy.visit('/home');

      cy.get('nav a[routerLink]').each(($link) => {
        const route = $link.attr('routerLink');
        if (route) {
          // Las rutas principales deberían empezar con /
          expect(route).to.match(/^\//);
        }
      });
    });

    it('No debe haber enlaces con # vacíos o javascript:void(0)', () => {
      cy.visit('/home');

      cy.get('a').each(($link) => {
        const href = $link.attr('href');
        if (href) {
          expect(href).to.not.eq('#');
          expect(href).to.not.include('javascript:void');
        }
      });
    });
  });

  context('Validación de Target en Enlaces', () => {

    it('Enlaces internos no deben abrir en nueva pestaña (sin target="_blank")', () => {
      cy.visit('/home');

      cy.get('nav a[routerLink]').each(($link) => {
        const target = $link.attr('target');
        expect(target).to.not.eq('_blank');
      });
    });

    it('Enlaces externos (si existen) deben abrir en nueva pestaña', () => {
      cy.visit('/home');

      cy.get('a[href^="http"]').each(($link) => {
        const href = $link.attr('href') || '';
        const baseUrl = Cypress.config().baseUrl || '';

        // Si no es la URL base, debería abrir en nueva pestaña
        if (!href.includes(baseUrl)) {
          const target = $link.attr('target');
          expect(target).to.eq('_blank');
        }
      });
    });
  });
});
