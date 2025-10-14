# Pruebas E2E de Navegación - Parky Films

Documentación completa de las pruebas End-to-End (E2E) implementadas con Cypress para validar la navegación de la aplicación según los requisitos de **Ingeniería de Software II**.

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Estructura de Pruebas](#estructura-de-pruebas)
- [Ejecución de Pruebas](#ejecución-de-pruebas)
- [Tipos de Pruebas](#tipos-de-pruebas)
- [Configuración](#configuración)
- [Comandos Personalizados](#comandos-personalizados)
- [Fixtures](#fixtures)
- [Mejores Prácticas](#mejores-prácticas)
- [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Angular**: 17+
- **Backend**: Node.js + Express corriendo en `http://localhost:3000`
- **Frontend**: Angular corriendo en `http://localhost:4200`

## Instalación

Las dependencias de Cypress ya están instaladas. Si necesitas reinstalarlas:

```bash
npm install --save-dev cypress cypress-axe axe-core
```

## Estructura de Pruebas

```
ProyectoCine/
├─ cypress/
│  ├─ e2e/
│  │  ├─ 01-navigation-syntax/       # Sintaxis de Navegación
│  │  │  ├─ routes-validity.cy.ts
│  │  │  ├─ routes-with-params.cy.ts
│  │  │  └─ html-links.cy.ts
│  │  │
│  │  ├─ 02-navigation-semantics/    # Semántica de Navegación
│  │  │  └─ login-logout.cy.ts
│  │  │
│  │  ├─ 03-complete-flows/          # Flujos Completos
│  │  │  └─ ticket-purchase-flow.cy.ts
│  │  │
│  │  ├─ 04-guards-security/         # Seguridad (Guards)
│  │  │  ├─ auth-guard.cy.ts
│  │  │  └─ admin-guard.cy.ts
│  │  │
│  │  ├─ 05-accessibility/           # Accesibilidad
│  │  │  └─ keyboard-navigation.cy.ts
│  │  │
│  │  └─ 06-performance/             # Rendimiento
│  │     └─ route-loading-time.cy.ts
│  │
│  ├─ fixtures/                      # Datos de Prueba
│  │  ├─ users.json
│  │  ├─ routes.json
│  │  └─ movies.json
│  │
│  ├─ support/
│  │  ├─ commands.ts                 # Comandos Personalizados
│  │  └─ e2e.ts                      # Configuración Global
│  │
│  └─ cypress.config.ts              # Configuración Principal
│
├─ package.json                      # Scripts NPM
└─ README_E2E.md                     # Esta documentación
```

---

## Ejecución de Pruebas

### Modo Interactivo (Con UI)

Abre la interfaz gráfica de Cypress:

```bash
npm run cypress
# o
npm run e2e
```

### Modo Headless (Sin UI - Para CI/CD)

Ejecuta todas las pruebas en modo headless:

```bash
npm run e2e:run
# o
npm run cypress:headless
```

### Ejecutar Pruebas por Categoría

```bash
# Solo pruebas de sintaxis de navegación
npm run e2e:syntax

# Solo pruebas de semántica
npm run e2e:semantics

# Solo flujos completos
npm run e2e:flows

# Solo pruebas de seguridad (guards)
npm run e2e:security

# Solo pruebas de accesibilidad
npm run e2e:a11y

# Solo pruebas de rendimiento
npm run e2e:perf
```

### Ejecutar Todas las Pruebas (Unit + E2E)

```bash
npm run test:all
```

---

## Tipos de Pruebas

### 1. Sintaxis de Navegación

**Objetivo**: Verificar que todas las rutas definidas en `app-routing.module.ts` sean válidas.

**Archivos**:
- `routes-validity.cy.ts`: Valida rutas públicas, protegidas y redirecciones
- `routes-with-params.cy.ts`: Valida rutas con parámetros dinámicos (`:id`, `:movieId`, etc.)
- `html-links.cy.ts`: Valida que todos los enlaces HTML sean correctos

**Pruebas Incluidas**:
- Todas las rutas públicas deben cargar correctamente
- Rutas protegidas sin login deben redirigir a `/login`
- Rutas con parámetros deben manejar IDs válidos e inválidos
- Enlaces del navbar deben apuntar a rutas válidas
- No debe haber enlaces rotos (404)

### 2. Semántica de Navegación

**Objetivo**: Verificar que los botones y enlaces naveguen a las rutas correctas semánticamente.

**Archivos**:
- `login-logout.cy.ts`: Flujo de login/logout completo

**Pruebas Incluidas**:
- "Iniciar Sesión" → lleva a `/login`
- "Cerrar Sesión" → lleva a `/home` y limpia el token
- Login exitoso de usuario → `/home`
- Login exitoso de admin → `/admin`
- Login fallido → permanece en `/login`
- RedirectUrl debe funcionar correctamente

### 3. Flujos Completos

**Objetivo**: Verificar flujos de navegación end-to-end completos.

**Archivos**:
- `ticket-purchase-flow.cy.ts`: Flujo completo de compra de entradas

**Flujo Probado**:
```
/home → /movies → /movie/:id → /ticket-purchase/:id →
/seat-selection → /cart → /checkout → /order-history
```

**Pruebas Incluidas**:
- Flujo completo de compra exitoso
- Interrupción de flujo (agregar al carrito sin checkout)
- Navegación con botón "Atrás"
- Persistencia de datos durante el flujo

### 4. Seguridad (Guards)

**Objetivo**: Verificar que los guards protejan correctamente las rutas.

**Archivos**:
- `auth-guard.cy.ts`: Pruebas del AuthGuard
- `admin-guard.cy.ts`: Pruebas del AdminGuard

**Pruebas Incluidas**:

#### AuthGuard
- Rutas protegidas sin login → redirigen a `/login`
- Usuario autenticado → acceso permitido
- RedirectUrl se guarda y se usa correctamente
- Token expirado/inválido → redirige a login

#### AdminGuard
- Usuario normal → bloqueado de `/admin/*`
- Admin → acceso completo a `/admin/*`
- Muestra mensajes apropiados ("Acceso denegado")
- No se puede bypasear manipulando localStorage

### 5. Accesibilidad

**Objetivo**: Verificar navegación por teclado (WCAG 2.1).

**Archivos**:
- `keyboard-navigation.cy.ts`: Navegación con Tab, Enter, Esc

**Pruebas Incluidas**:
- Navegación con Tab en navbar
- Foco visible en elementos activos
- Activar enlaces con Enter
- Navegación por formularios con Tab
- Orden lógico de tabulación
- No debe haber tab traps

### 6. Rendimiento

**Objetivo**: Verificar tiempos de carga (< 3 segundos).

**Archivos**:
- `route-loading-time.cy.ts`: Medición de tiempos de carga

**Pruebas Incluidas**:
- Rutas públicas cargan en < 3s
- Rutas con parámetros cargan en < 3s
- Navegación entre rutas es rápida
- Time to Interactive < 3s
- Llamadas a API < 2s

---

## Configuración

### cypress.config.ts

```typescript
baseUrl: 'http://localhost:4200'
viewportWidth: 1280
viewportHeight: 720
defaultCommandTimeout: 10000
pageLoadTimeout: 30000
video: true
screenshotOnRunFailure: true
```

### Variables de Entorno

Configuradas en `cypress.config.ts` → `env`:

```javascript
env: {
  apiUrl: 'http://localhost:3000/api',
  testUser: {
    email: 'test@parkyfilms.com',
    password: 'Test123!'
  },
  testAdmin: {
    email: 'admin@parkyfilms.com',
    password: 'Admin123!'
  }
}
```

---

## Comandos Personalizados

Ubicados en `cypress/support/commands.ts`:

### Autenticación

```typescript
cy.login(email, password)           // Login manual
cy.loginAsAdmin()                   // Login rápido como admin
cy.loginAsTestUser()                // Login rápido como usuario test
cy.logout()                         // Cerrar sesión
cy.checkLoggedIn()                  // Verificar si está logueado
```

### Navegación

```typescript
cy.waitForPageLoad()                // Esperar carga completa
cy.checkRouteExists(route)          // Verificar que ruta existe
cy.measureLoadTime(route, maxTime)  // Medir tiempo de carga
cy.navigateWithKeyboard(selector)   // Navegar con Enter
```

### Accesibilidad

```typescript
cy.injectAxe()                      // Inyectar axe-core
cy.checkA11y()                      // Verificar accesibilidad
```

---

## Fixtures

### users.json

```json
{
  "testUser": { ... },   // Usuario de prueba normal
  "testAdmin": { ... },  // Admin de prueba
  "invalidUser": { ... } // Credenciales inválidas
}
```

### routes.json

```json
{
  "publicRoutes": [ ... ],
  "protectedRoutes": [ ... ],
  "adminRoutes": [ ... ],
  "routesWithParams": [ ... ]
}
```

---

## Mejores Prácticas

### 1. Antes de Ejecutar Pruebas

```bash
# Terminal 1: Iniciar backend
cd backend
npm start

# Terminal 2: Iniciar frontend
npm run dev

# Terminal 3: Ejecutar pruebas
npm run e2e
```

### 2. Limpiar Estado

Las pruebas limpian automáticamente `localStorage` y cookies:

```typescript
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
});
```

### 3. Usuarios de Prueba

**IMPORTANTE**: Antes de ejecutar las pruebas, asegúrate de que existan estos usuarios en tu base de datos:

```sql
-- Usuario normal
INSERT INTO usuarios (nombre, email, password, role)
VALUES ('Usuario Test', 'test@parkyfilms.com', 'hashed_password', 'cliente');

-- Admin
INSERT INTO usuarios (nombre, email, password, role)
VALUES ('Admin Test', 'admin@parkyfilms.com', 'hashed_password', 'admin');
```

### 4. Ignorar Errores Conocidos

Configurado en `cypress/support/e2e.ts`:

```typescript
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver')) return false;
  return true;
});
```

---

## Troubleshooting

### Problema: "Cannot find module 'cypress'"

**Solución**:
```bash
npm install --save-dev cypress
```

### Problema: Pruebas fallan por timeout

**Solución**: Aumenta el timeout en `cypress.config.ts`:
```typescript
defaultCommandTimeout: 15000
pageLoadTimeout: 45000
```

### Problema: Backend no responde

**Solución**: Verifica que el backend esté corriendo en `http://localhost:3000`:
```bash
cd backend
npm start
```

### Problema: Frontend no carga

**Solución**: Verifica que Angular esté corriendo en `http://localhost:4200`:
```bash
npm run dev
```

### Problema: Credenciales incorrectas

**Solución**: Verifica que los usuarios de prueba existan en la base de datos.

### Problema: Rutas admin fallan

**Solución**: Verifica que el usuario admin tenga `role='admin'` en la base de datos.

---

## Cobertura de Pruebas

| Categoría | Archivos | Pruebas | Estado |
|-----------|----------|---------|--------|
| Sintaxis | 3 | ~50 | ✅ Completo |
| Semántica | 1 | ~30 | ✅ Completo |
| Flujos | 1 | ~25 | ✅ Completo |
| Seguridad | 2 | ~60 | ✅ Completo |
| Accesibilidad | 1 | ~15 | ✅ Completo |
| Rendimiento | 1 | ~10 | ✅ Completo |
| **TOTAL** | **9** | **~190** | **✅** |

---

## Integración CI/CD

Para integrar con GitHub Actions, GitLab CI, etc.:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Start backend
        run: npm start --prefix backend &
      - name: Start frontend
        run: npm run dev &
      - name: Wait for services
        run: sleep 10
      - name: Run Cypress
        run: npm run e2e:run
      - name: Upload videos
        uses: actions/upload-artifact@v2
        if: failure()
        with:
          name: cypress-videos
          path: cypress/videos
```

---

## Recursos Adicionales

- [Documentación de Cypress](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [cypress-axe (Accesibilidad)](https://github.com/component-driven/cypress-axe)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Contacto y Soporte

Para reportar problemas o sugerencias sobre las pruebas E2E:

1. Crear un issue en el repositorio
2. Contactar al equipo de QA
3. Revisar la documentación de Cypress

---

**Última actualización**: Octubre 2025
**Versión**: 1.0.0
**Autor**: Equipo de Desarrollo Parky Films
