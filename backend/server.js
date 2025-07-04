const express = require('express');
const cors = require('cors');
const session = require('express-session'); // 🆕 NUEVO PARA OAUTH
const passport = require('passport'); // 🆕 NUEVO PARA OAUTH
require('dotenv').config();

// 🆕 IMPORTAR CONFIGURACIÓN DE PASSPORT
require('./src/config/passport');

const { connectDB } = require('./src/config/database');
const routes = require('./src/routes');
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CONFIGURACIÓN CORS PARA RAILWAY ====================
// 🌐 Origins permitidos (dinámico según entorno)
const allowedOrigins = [
  'http://localhost:4200',                                          // Angular dev local
  'http://localhost:3000',                                          // Backup local
  'http://127.0.0.1:4200',                                          // IP local
  process.env.FRONTEND_URL,                                         // Frontend dinámico
  process.env.BACKEND_URL,                                          // Backend dinámico
  process.env.CORS_ORIGIN,                                          // CORS origin específico
  'https://parky-films.up.railway.app',                             // Frontend Railway (backup)
  'https://webcinenew-production.up.railway.app'                     // Backend Railway (backup)
].filter(Boolean)

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, mobile apps)
    if (!origin) {
      console.log('✅ CORS: Request sin origin permitido');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Origin permitido:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin bloqueado:', origin);
      console.log('🔍 Origins permitidos:', allowedOrigins);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,                    // Permite cookies y headers de auth
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'Cache-Control'
  ],
  exposedHeaders: ['Authorization'],     // Headers que el cliente puede leer
  maxAge: 86400                         // Cache preflight por 24 horas
};

// ==================== MIDDLEWARES ====================

// 🛡️ CORS con configuración específica
app.use(cors(corsOptions));

// 🔧 Headers adicionales para asegurar CORS (redundancia)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  
  // 🚨 IMPORTANTE: Responder a OPTIONS (preflight requests)
  if (req.method === 'OPTIONS') {
    console.log('🔄 Preflight request recibido para:', req.url);
    res.sendStatus(200);
  } else {
    next();
  }
});

// 🆕 CONFIGURACIÓN DE SESIONES PARA OAUTH
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS en producción
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// 🆕 INICIALIZAR PASSPORT PARA OAUTH
app.use(passport.initialize());
app.use(passport.session());

// 📊 Parse JSON y URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 🔍 Log de requests (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
    next();
  });
}

// ==================== RUTAS ====================

// 🏥 Health check en la raíz
app.get('/', (req, res) => {
  res.json({ 
    message: '🎬 ParkyFilms Backend API - Railway Ready with OAuth!', // 🆕 ACTUALIZADO
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled',
    allowedOrigins: allowedOrigins,
    // 🆕 INFORMACIÓN OAUTH
    oauth: {
      google: !!process.env.GOOGLE_CLIENT_ID,
      facebook: !!process.env.FACEBOOK_CLIENT_ID,
      github: !!process.env.GITHUB_CLIENT_ID
    },
    timestamp: new Date().toISOString()
  });
});

// 🏥 Health check específico
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ParkyFilms API',
    version: '1.0.0',
    // 🆕 ESTADO OAUTH
    oauth_status: {
      google: process.env.GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ No configurado',
      facebook: process.env.FACEBOOK_CLIENT_ID ? '✅ Configurado' : '❌ No configurado',
      github: process.env.GITHUB_CLIENT_ID ? '✅ Configurado' : '❌ No configurado'
    }
  });
});

// 🔐 Rutas principales de la API
app.use('/api', routes);

// 🔍 Test endpoint para verificar CORS
app.get('/api/test', (req, res) => {
  res.json({
    message: 'CORS Test exitoso!',
    origin: req.headers.origin,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 🆕 TEST OAUTH ENDPOINTS (para verificar que funcionen)
app.get('/api/test/oauth', (req, res) => {
  res.json({
    message: 'OAuth Test endpoint',
    oauth_providers: {
      google: {
        configured: !!process.env.GOOGLE_CLIENT_ID,
        auth_url: process.env.GOOGLE_CLIENT_ID ? '/api/auth/google' : 'Not configured'
      },
      facebook: {
        configured: !!process.env.FACEBOOK_CLIENT_ID,
        auth_url: process.env.FACEBOOK_CLIENT_ID ? '/api/auth/facebook' : 'Not configured'
      },
      github: {
        configured: !!process.env.GITHUB_CLIENT_ID,
        auth_url: process.env.GITHUB_CLIENT_ID ? '/api/auth/github' : 'Not configured'
      }
    },
    callback_urls: {
      google: '/api/auth/google/callback',
      facebook: '/api/auth/facebook/callback',
      github: '/api/auth/github/callback'
    }
  });
});

// ==================== ERROR HANDLERS ====================

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler global
app.use((error, req, res, next) => {
  console.error('💥 Error global:', error);
  
  // Error de CORS
  if (error.message === 'No permitido por CORS') {
    return res.status(403).json({
      error: 'CORS: Origin no permitido',
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ==================== INICIALIZAR SERVIDOR ====================

async function startServer() {
  try {
    // Conectar a la base de datos
    await connectDB();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🚀 ParkyFilms Backend - Railway Ready with OAuth!'); // 🆕 ACTUALIZADO
      console.log('='.repeat(60));
      console.log(`📡 Puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
      console.log(`🎯 API: http://localhost:${PORT}/api`);
      console.log(`🧪 OAuth Test: http://localhost:${PORT}/api/test/oauth`); // 🆕 NUEVO
      console.log('🛡️ CORS Origins permitidos:');
      allowedOrigins.forEach(origin => console.log(`   ✅ ${origin}`));
      console.log('🔍 Variables de entorno:');
      console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL}`);
      console.log(`   BACKEND_URL: ${process.env.BACKEND_URL}`);
      console.log(`   CORS_ORIGIN: ${process.env.CORS_ORIGIN}`);
      console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Configurado ✅' : 'No configurado ❌'}`);
      // 🆕 INFORMACIÓN OAUTH
      console.log('🔐 OAuth Providers:');
      console.log(`   Google: ${process.env.GOOGLE_CLIENT_ID ? 'Configurado ✅' : 'No configurado ❌'}`);
      console.log(`   Facebook: ${process.env.FACEBOOK_CLIENT_ID ? 'Configurado ✅' : 'No configurado ❌'}`);
      console.log(`   GitHub: ${process.env.GITHUB_CLIENT_ID ? 'Configurado ✅' : 'No configurado ❌'}`);
      console.log('='.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Error al inicializar servidor:', error);
    process.exit(1);
  }
}

// Manejo graceful de shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

startServer();