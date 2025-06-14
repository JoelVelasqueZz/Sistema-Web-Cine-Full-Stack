// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Ruta de prueba inicial
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a ParkyFilms API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    // 🆕 AGREGADO: Lista de endpoints disponibles
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      movies: '/api/movies',
      functions: '/api/functions',
      favorites: '/api/favorites',
      history: '/api/history',
      comingSoon: '/api/coming-soon',
      bar: '/api/bar',
      orders: '/api/orders', // 🆕 NUEVO
      points: '/api/points', // 🆕 NUEVO
      // rewards: '/api/rewards', // Para futuro
      // admin: '/api/admin' // Para futuro
    }
  });
});

// Ruta de prueba para la base de datos
router.get('/test-db', async (req, res, next) => {
  try {
    const { query } = require('../config/database');
    
    // Probar la conexión con una consulta simple
    const result = await query('SELECT NOW() as servidor_tiempo, version() as version_postgresql');
    
    res.json({
      success: true,
      message: '✅ Conexión a base de datos exitosa',
      data: {
        servidor_tiempo: result.rows[0].servidor_tiempo,
        version_postgresql: result.rows[0].version_postgresql.split(' ')[0] + ' ' + result.rows[0].version_postgresql.split(' ')[1]
      }
    });
  } catch (error) {
    next(error);
  }
});

// 🆕 NUEVA RUTA: Health check para monitoreo
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Parky Films API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      auth: 'OK',
      movies: 'OK',
      functions: 'OK',
      favorites: 'OK',
      history: 'OK',
      comingSoon: 'OK',
      bar: 'OK',
      orders: 'OK', // 🆕 NUEVO
      points: 'OK', // 🆕 NUEVO
      database: 'OK'
    }
  });
});

// ==================== RUTAS DE MÓDULOS EXISTENTES ====================

// Rutas de autenticación
router.use('/auth', require('./auth'));

// Rutas de usuarios
router.use('/users', require('./users'));

// Rutas de películas
router.use('/movies', require('./movies'));

// Rutas de funciones de cine
router.use('/functions', require('./functions'));

// Rutas de favoritas
router.use('/favorites', require('./favorites'));

// Rutas de historial
router.use('/history', require('./history'));

// Rutas de próximos estrenos
router.use('/coming-soon', require('./comingSoon'));

// Rutas de productos del bar
router.use('/bar', require('./bar'));

// ==================== 🆕 NUEVAS RUTAS - SISTEMA DE ÓRDENES Y PUNTOS ====================

// 🆕 NUEVA - Rutas de órdenes y checkout
router.use('/orders', require('./orders'));

// 🆕 NUEVA - Rutas de puntos y referidos
router.use('/points', require('./points'));

// ==================== RUTAS FUTURAS (COMENTADAS) ====================
// Estas se pueden activar cuando las implementes

// Rutas de recompensas
// router.use('/rewards', require('./rewards'));

// Rutas de administración
// router.use('/admin', require('./admin'));

// ==================== MANEJO DE RUTAS NO ENCONTRADAS ====================

// 🆕 AGREGADO: Middleware para rutas no encontradas
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    requested_url: req.originalUrl,
    method: req.method,
    available_endpoints: [
      '/api',
      '/api/health',
      '/api/test-db',
      '/api/auth',
      '/api/users',
      '/api/movies',
      '/api/functions',
      '/api/favorites',
      '/api/history',
      '/api/coming-soon',
      '/api/bar',
      '/api/orders', // 🆕 NUEVO
      '/api/points'  // 🆕 NUEVO
    ],
    suggestion: 'Verifica la URL y el método HTTP'
  });
});

module.exports = router;