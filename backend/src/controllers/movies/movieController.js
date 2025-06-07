const Movie = require('../../models/Movie');

// Obtener todas las películas
const getAllMovies = async (req, res) => {
  try {
    const { genero, anio, search } = req.query;
    
    let movies;
    if (search) {
      movies = await Movie.search(search);
    } else {
      const filters = {};
      if (genero) filters.genero = genero;
      if (anio) filters.anio = parseInt(anio);
      
      movies = await Movie.findAll(filters);
    }

    res.json({
      success: true,
      data: movies,
      total: movies.length,
      message: movies.length > 0 ? 'Películas encontradas' : 'No hay películas disponibles'
    });
  } catch (error) {
    console.error('Error al obtener películas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las películas'
    });
  }
};

// Obtener película por ID
const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movieId = parseInt(id);
    if (isNaN(movieId) || movieId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID de película inválido'
      });
    }
    
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        error: 'Película no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    console.error('Error al obtener película:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la película'
    });
  }
};

// Crear nueva película
const createMovie = async (req, res) => {
  try {
    const movieData = req.body;
    
    // Validaciones básicas
    if (!movieData.titulo || !movieData.sinopsis || !movieData.director) {
      return res.status(400).json({
        success: false,
        error: 'Título, sinopsis y director son obligatorios'
      });
    }
    
    const newMovie = await Movie.create(movieData);
    
    res.status(201).json({
      success: true,
      data: newMovie,
      message: 'Película creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear película:', error);
    
    // Error de duplicado (título ya existe)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Ya existe una película con ese título'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error al crear la película'
    });
  }
};

// Actualizar película
const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const movieData = req.body;
    
    const movieId = parseInt(id);
    if (isNaN(movieId) || movieId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID de película inválido'
      });
    }
    
    const updatedMovie = await Movie.update(movieId, movieData);
    
    if (!updatedMovie) {
      return res.status(404).json({
        success: false,
        error: 'Película no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: updatedMovie,
      message: 'Película actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar película:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la película'
    });
  }
};

// Eliminar película
const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movieId = parseInt(id);
    if (isNaN(movieId) || movieId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID de película inválido'
      });
    }
    
    const deletedMovie = await Movie.delete(movieId);
    
    if (!deletedMovie) {
      return res.status(404).json({
        success: false,
        error: 'Película no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: `Película "${deletedMovie.titulo}" eliminada exitosamente`,
      data: deletedMovie
    });
  } catch (error) {
    console.error('Error al eliminar película:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la película'
    });
  }
};

// Obtener géneros disponibles
const getGenres = async (req, res) => {
  try {
    const genres = await Movie.getGenres();
    res.json({
      success: true,
      data: genres
    });
  } catch (error) {
    console.error('Error al obtener géneros:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los géneros'
    });
  }
};

// Obtener películas más populares
const getPopularMovies = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const movies = await Movie.getMostPopular(parseInt(limit));
    res.json({
      success: true,
      data: movies
    });
  } catch (error) {
    console.error('Error al obtener películas populares:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las películas populares'
    });
  }
};

// Obtener estadísticas de una película
const getMovieStats = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await Movie.getStats(id);
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Película no encontrada'
      });
    }
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las estadísticas'
    });
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getGenres,
  getPopularMovies,
  getMovieStats
};