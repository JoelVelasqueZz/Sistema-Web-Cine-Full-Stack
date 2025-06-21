const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { connectDB } = require('./src/config/database');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Seguridad
app.use(helmet());

// CORS configuración para Railway
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    /\.up\.railway\.app$/,
    'http://localhost:4200',
    'https://localhost:4200'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middlewares básicos 
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy para Railway
app.set('trust proxy', 1);

// Rutas principales
app.use('/api', routes);

// Health check para Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ParkyFilms API',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    message: '🎬 ParkyFilms API está funcionando',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    message: 'La ruta solicitada no existe'
  });
});

// Inicializar servidor con base de datos
async function startServer() {
  try {
    await connectDB();
    console.log('✅ Base de datos conectada exitosamente');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor ParkyFilms ejecutándose en puerto ${PORT}`);
      console.log(`📡 API disponible en: http://localhost:${PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al inicializar servidor:', error);
    process.exit(1);
  }
}

startServer();