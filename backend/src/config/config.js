// Configuración general de la aplicación
module.exports = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  }, 

  // Configuración de la base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'parkyfilms',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Configuración de CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
  },

  // Configuración de email (opcional)
  email: {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD
  },

  // Configuración de PayPal (opcional)
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox'
  }
};