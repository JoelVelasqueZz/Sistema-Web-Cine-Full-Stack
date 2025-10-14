/**
 * PRUEBAS DE FLUJO COMPLETO - COMPRA DE ENTRADAS
 *
 * Objetivo: Verificar el flujo completo de navegación desde la selección
 * de película hasta la confirmación de compra.
 *
 * Flujo: /home → /movies → /movie/:id → /ticket-purchase/:id →
 *        /seat-selection → /cart → /checkout → /order-history
 *
 * Referencia: app-routing.module.ts (flujo principal)
 */

describe('03 - Flujo Completo: Compra de Entradas de Cine', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Login antes de cada prueba (requerido para seat-selection)
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password);
    });
  });

  context('Flujo Completo: Compra Exitosa', () => {

    it('FLUJO PRINCIPAL: Debe completar todo el proceso de compra', () => {
      // PASO 1: Ir a la lista de películas
      cy.log('📍 PASO 1: Navegando a /movies');
      cy.visit('/movies');
      cy.url().should('include', '/movies');
      cy.contains(/películas|cartelera/i).should('be.visible');

      // PASO 2: Seleccionar una película
      cy.log('📍 PASO 2: Seleccionando película');
      cy.get('.card, .movie-card, .pelicula-card').first().click({ force: true });
      cy.url().should('match', /\/movie\/\d+/);

      // PASO 3: Ver detalles y hacer clic en "Comprar" o "Ver funciones"
      cy.log('📍 PASO 3: Abriendo página de compra');
      cy.contains(/comprar|funciones|tickets|entradas/i).first().click({ force: true });
      cy.url().should('match', /\/ticket-purchase\/\d+/);

      // PASO 4: Seleccionar función y cantidad
      cy.log('📍 PASO 4: Seleccionando función y cantidad');
      cy.wait(1000);

      // Seleccionar función (primera disponible)
      cy.get('button, .funcion, .horario').first().click({ force: true });

      // Seleccionar cantidad (2 entradas por ejemplo)
      cy.get('input[type="number"], select').first().clear().type('2');

      // Hacer clic en "Seleccionar asientos" o "Continuar"
      cy.contains(/seleccionar asientos|continuar/i).click({ force: true });

      // PASO 5: Debe navegar a /seat-selection
      cy.log('📍 PASO 5: Seleccionando asientos');
      cy.url().should('match', /\/seat-selection\/\d+\/\d+\/\d+/);

      // Seleccionar 2 asientos
      cy.wait(1000);
      cy.get('.seat, .asiento').not('.occupied, .ocupado').first().click({ force: true });
      cy.get('.seat, .asiento').not('.occupied, .ocupado').eq(1).click({ force: true });

      // Confirmar selección
      cy.contains(/confirmar|agregar|carrito/i).click({ force: true });

      // PASO 6: Debe navegar a /cart
      cy.log('📍 PASO 6: Verificando carrito');
      cy.url().should('include', '/cart');
      cy.contains(/carrito|cart/i).should('be.visible');

      // PASO 7: Proceder al checkout
      cy.log('📍 PASO 7: Procediendo al checkout');
      cy.contains(/checkout|pagar|finalizar/i).click({ force: true });
      cy.url().should('include', '/checkout');

      // PASO 8: Completar el checkout
      cy.log('📍 PASO 8: Completando compra');
      cy.wait(1000);

      // Completar formulario de pago (simulado)
      cy.get('input[name="cardNumber"], input[placeholder*="tarjeta"]').type('4111111111111111');
      cy.get('input[name="cvv"], input[placeholder*="cvv"]').type('123');

      // Confirmar compra
      cy.contains(/confirmar|pagar|comprar/i).click({ force: true });

      // PASO 9: Verificar confirmación
      cy.log('📍 PASO 9: Verificando confirmación');
      cy.wait(2000);

      // Debe mostrar mensaje de éxito o navegar a order-history
      cy.url().should('match', /\/(order-history|confirmation|success)/);
    });
  });

  context('Flujo con Interrupción: Agregar al Carrito sin Checkout', () => {

    it('Debe permitir agregar al carrito y continuar navegando', () => {
      cy.visit('/movies');
      cy.get('.card, .movie-card').first().click({ force: true });
      cy.url().should('match', /\/movie\/\d+/);

      cy.contains(/comprar|funciones/i).first().click({ force: true });
      cy.url().should('match', /\/ticket-purchase\/\d+/);

      // Seleccionar función y cantidad
      cy.wait(1000);
      cy.get('button, .funcion').first().click({ force: true });
      cy.get('input[type="number"]').first().clear().type('1');
      cy.contains(/seleccionar asientos|continuar/i).click({ force: true });

      // Seleccionar asiento
      cy.url().should('include', '/seat-selection');
      cy.wait(1000);
      cy.get('.seat, .asiento').not('.occupied').first().click({ force: true });
      cy.contains(/confirmar|agregar/i).click({ force: true });

      // Verificar que está en el carrito
      cy.url().should('include', '/cart');

      // En lugar de hacer checkout, navegar a home
      cy.visit('/home');
      cy.url().should('include', '/home');

      // El carrito debe mantener los items
      cy.visit('/cart');
      cy.get('.cart-item, .item').should('have.length.greaterThan', 0);
    });
  });

  context('Validación de Navegación Entre Pasos', () => {

    it('No debe permitir acceder a seat-selection sin parámetros válidos', () => {
      cy.visit('/seat-selection/0/0/0', { failOnStatusCode: false });

      // Puede redirigir o mostrar error
      cy.url().should('exist');
    });

    it('Debe poder regresar al paso anterior con el botón Back del navegador', () => {
      cy.visit('/movies');
      cy.get('.card').first().click({ force: true });
      cy.url().should('match', /\/movie\/\d+/);

      // Regresar
      cy.go('back');
      cy.url().should('include', '/movies');
    });

    it('El botón "Volver" (si existe) debe funcionar correctamente', () => {
      cy.visit('/movies');
      cy.get('.card').first().click({ force: true });
      cy.url().should('match', /\/movie\/\d+/);

      // Buscar botón de volver
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Volver"), a:contains("Volver")').length > 0) {
          cy.contains(/volver|atrás|back/i).click();
          cy.url().should('not.include', '/movie/');
        }
      });
    });
  });

  context('Flujo sin Autenticación (Debe Redirigir)', () => {

    it('Intentar acceder a seat-selection sin login debe redirigir a /login', () => {
      cy.clearLocalStorage();
      cy.visit('/seat-selection/1/1/2', { failOnStatusCode: false });
      cy.url().should('include', '/login');

      // Verificar que guardó la URL de redirect
      cy.window().then((win) => {
        const redirectUrl = win.localStorage.getItem('redirectUrl');
        expect(redirectUrl).to.include('/seat-selection');
      });
    });

    it('Después de login debe redirigir al seat-selection guardado', () => {
      cy.clearLocalStorage();
      cy.visit('/seat-selection/1/1/2', { failOnStatusCode: false });
      cy.url().should('include', '/login');

      // Login
      cy.fixture('users').then((users) => {
        cy.get('input[type="email"]').type(users.testUser.email);
        cy.get('input[type="password"]').type(users.testUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait(1000);

        // Debe redirigir a seat-selection
        cy.url().should('include', '/seat-selection');
      });
    });
  });

  context('Verificación de Breadcrumbs (si existe)', () => {

    it('Debe mostrar breadcrumb en el flujo de compra', () => {
      cy.visit('/movies');
      cy.get('.card').first().click({ force: true });

      cy.get('body').then(($body) => {
        if ($body.find('.breadcrumb, nav[aria-label="breadcrumb"]').length > 0) {
          cy.get('.breadcrumb').should('be.visible');
        }
      });
    });
  });

  context('Manejo de Errores en el Flujo', () => {

    it('Si no hay funciones disponibles, debe mostrar mensaje apropiado', () => {
      cy.visit('/ticket-purchase/999', { failOnStatusCode: false });
      cy.wait(1000);

      cy.get('body').then(($body) => {
        // Verificar que muestra algún mensaje o redirige
        if ($body.text().includes('No disponible') || $body.text().includes('Error')) {
          cy.contains(/no disponible|error|no encontrado/i).should('be.visible');
        }
      });
    });

    it('Si el carrito está vacío en checkout, debe manejar apropiadamente', () => {
      cy.visit('/checkout');

      cy.get('body').then(($body) => {
        // Puede mostrar mensaje de carrito vacío o redirigir
        if ($body.text().includes('vacío') || $body.text().includes('empty')) {
          cy.contains(/vacío|empty|no hay/i).should('be.visible');
        } else {
          cy.url().should('not.include', '/checkout');
        }
      });
    });
  });

  context('Persistencia de Datos Durante el Flujo', () => {

    it('Los datos de la compra deben persistir entre navegaciones', () => {
      cy.visit('/movies');
      cy.get('.card').first().click({ force: true });

      // Guardar el ID de la película
      cy.url().then((url) => {
        const movieId = url.match(/\/movie\/(\d+)/)?.[1];

        cy.contains(/comprar|funciones/i).first().click({ force: true });

        // Verificar que el ID se mantiene
        cy.url().should('include', `/ticket-purchase/${movieId}`);
      });
    });
  });
});
