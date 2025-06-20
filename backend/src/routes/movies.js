// routes/movies.js - ORDEN CORREGIDO
const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const { authenticateToken } = require('../middleware/auth');
const recommendationsController = require('../controllers/movies/recommendationsController');
const {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getGenres,
  getPopularMovies,
  getMovieStats,
  searchMovies
} = require('../controllers/movies/movieController');

// ✅ RUTAS ESPECÍFICAS PRIMERO (antes de /:id)

// GET /api/movies/search?q=termino - Buscar películas
router.get('/search', searchMovies);

// GET /api/movies/genres - Obtener todos los géneros disponibles
router.get('/genres', getGenres);

// GET /api/movies/popular - Obtener películas más populares
router.get('/popular', getPopularMovies);

// 🎯 NUEVA: GET /api/movies/recommendations - Obtener recomendaciones (DEBE IR ANTES DE /:id)
router.get('/recommendations', authenticateToken, recommendationsController.getUserRecommendations);

// ✅ RUTAS GENERALES DESPUÉS

// GET /api/movies - Obtener todas las películas (con filtros opcionales)
router.get('/', getAllMovies);

// GET /api/movies/:id - Obtener película por ID
router.get('/:id', getMovieById);

// GET /api/movies/:id/stats - Obtener estadísticas de una película
router.get('/:id/stats', getMovieStats);

// Rutas para administradores

// POST /api/movies - Crear nueva película
router.post('/', createMovie);

// PUT /api/movies/:id - Actualizar película
router.put('/:id', updateMovie);

// DELETE /api/movies/:id - Eliminar película (soft delete)
router.delete('/:id', deleteMovie);

module.exports = router;