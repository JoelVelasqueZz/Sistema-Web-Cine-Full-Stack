const express = require('express');
const router = express.Router();
const {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkIfFavorite,
  clearAllFavorites,
  getFavoritesStats
} = require('../controllers/favorites/favoritesController');

const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ==================== RUTAS ESPECÍFICAS PRIMERO ====================

// GET /api/favorites/stats - Estadísticas de favoritas del usuario
router.get('/stats', getFavoritesStats);

// DELETE /api/favorites/clear - Limpiar todas las favoritas
router.delete('/clear', clearAllFavorites);

// GET /api/favorites/check/:peliculaId - Verificar si está en favoritas
router.get('/check/:peliculaId', checkIfFavorite);

// ==================== RUTAS GENERALES ====================

// GET /api/favorites - Obtener favoritas del usuario
router.get('/', getUserFavorites);

// POST /api/favorites - Agregar película a favoritas
router.post('/', addToFavorites);

// DELETE /api/favorites/:peliculaId - Remover película de favoritas
router.delete('/:peliculaId', removeFromFavorites);

module.exports = router;