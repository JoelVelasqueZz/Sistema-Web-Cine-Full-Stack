// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Ruta de prueba inicial
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a ParkyFilms API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
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

// ==================== RUTAS DE MÓDULOS ====================

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

// 🆕 NUEVA LÍNEA - Rutas de productos del bar
router.use('/bar', require('./bar'));

// Aquí iremos agregando las otras rutas (COMENTADAS)
// router.use('/orders', require('./orders'));
// router.use('/points', require('./points'));
// router.use('/rewards', require('./rewards'));
// router.use('/admin', require('./admin'));

module.exports = router;