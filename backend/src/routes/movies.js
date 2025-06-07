const express = require('express');
const router = express.Router();
const {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getGenres,
  getPopularMovies,
  getMovieStats
} = require('../controllers/movies/movieController');

// Rutas públicas (no necesitan autenticación)

// GET /api/movies - Obtener todas las películas (con filtros opcionales)
// Ejemplos: 
// /api/movies
// /api/movies?genero=Acción
// /api/movies?anio=2024
// /api/movies?search=avengers
router.get('/', getAllMovies);

// GET /api/movies/genres - Obtener todos los géneros disponibles
router.get('/genres', getGenres);

// GET /api/movies/popular - Obtener películas más populares
router.get('/popular', getPopularMovies);

// GET /api/movies/:id - Obtener película por ID
router.get('/:id', getMovieById);

// GET /api/movies/:id/stats - Obtener estadísticas de una película
router.get('/:id/stats', getMovieStats);

// Rutas para administradores (por ahora sin autenticación, después la agregamos)

// POST /api/movies - Crear nueva película
router.post('/', createMovie);

// PUT /api/movies/:id - Actualizar película
router.put('/:id', updateMovie);

// DELETE /api/movies/:id - Eliminar película (soft delete)
router.delete('/:id', deleteMovie);

module.exports = router;