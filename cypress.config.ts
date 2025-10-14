import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    // Configuración de viewport
    viewportWidth: 1280,
    viewportHeight: 720,

    // Timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 10000,

    // Retry
    retries: {
      runMode: 2,
      openMode: 0
    },

    // Video y screenshots
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,

    // Variables de entorno para pruebas
    env: {
      apiUrl: 'http://localhost:3000/api',

      // Credenciales de prueba
      testUser: {
        email: 'test@parkyfilms.com',
        password: 'Test123!',
        nombre: 'Usuario Test'
      },

      testAdmin: {
        email: 'admin@parkyfilms.com',
        password: 'Admin123!',
        nombre: 'Admin Test'
      }
    },

    setupNodeEvents(on, config) {
      // Configuración de eventos personalizados

      // Task para limpiar datos de prueba
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },

        clearDatabase() {
          // Aquí podrías agregar lógica para limpiar la BD de pruebas
          console.log('🧹 Limpiando base de datos de prueba...');
          return null;
        }
      });

      return config;
    }
  },

  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.ts'
  }
});
