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
  },

  // 🆕 Configuración de OAuth
  oauth: {
    // Google OAuth
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    },
    
    // Facebook OAuth
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback'
    },
    
    // GitHub OAuth
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback'
    }
  },

  // 🆕 URLs del frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:4200',
    successRedirect: process.env.FRONTEND_SUCCESS_REDIRECT || '/home',
    errorRedirect: process.env.FRONTEND_ERROR_REDIRECT || '/login'
  },

  // 🆕 Configuración de sesiones
  session: {
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
  }
};