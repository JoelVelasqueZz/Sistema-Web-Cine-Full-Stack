// backend/src/controllers/favorites/favoritesController.js
const { query } = require('../../config/database');

// Obtener favoritas del usuario
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id; // Del middleware de autenticación
    
    console.log(`📡 Obteniendo favoritas del usuario ID: ${userId}`);
    
    const sql = `
      SELECT 
        f.id,
        f.pelicula_id,
        f.fecha_agregada,
        p.titulo,
        p.poster,
        p.genero,
        p.anio,
        p.rating,
        p.director,
        p.duracion
      FROM favoritas f
      JOIN peliculas p ON f.pelicula_id = p.id
      WHERE f.usuario_id = $1 AND p.activo = true
      ORDER BY f.fecha_agregada DESC
    `;
    
    const result = await query(sql, [userId]);
    
    console.log(`✅ ${result.rows.length} favoritas encontradas`);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error al obtener favoritas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Agregar película a favoritas
const addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { peliculaId } = req.body;
    
    // Validar datos
    if (!peliculaId || isNaN(peliculaId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de película inválido'
      });
    }

    console.log(`📡 Agregando película ${peliculaId} a favoritas del usuario ${userId}`);
    
    // Verificar que la película existe
    const peliculaExists = await query(
      'SELECT id FROM peliculas WHERE id = $1 AND activo = true',
      [peliculaId]
    );
    
    if (peliculaExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Película no encontrada'
      });
    }
    
    // Verificar si ya está en favoritas
    const alreadyFavorite = await query(
      'SELECT id FROM favoritas WHERE usuario_id = $1 AND pelicula_id = $2',
      [userId, peliculaId]
    );
    
    if (alreadyFavorite.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'La película ya está en favoritas'
      });
    }
    
    // Agregar a favoritas
    const insertSql = `
      INSERT INTO favoritas (usuario_id, pelicula_id, fecha_agregada)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING id, usuario_id, pelicula_id, fecha_agregada
    `;
    
    const result = await query(insertSql, [userId, peliculaId]);
    
    console.log(`✅ Película agregada a favoritas: ID ${result.rows[0].id}`);
    
    res.status(201).json({
      success: true,
      message: 'Película agregada a favoritas',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error al agregar a favoritas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Remover película de favoritas
const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { peliculaId } = req.params;
    
    // Validar ID
    if (!peliculaId || isNaN(peliculaId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de película inválido'
      });
    }

    console.log(`📡 Removiendo película ${peliculaId} de favoritas del usuario ${userId}`);
    
    // Remover de favoritas
    const deleteSql = `
      DELETE FROM favoritas 
      WHERE usuario_id = $1 AND pelicula_id = $2
      RETURNING id, pelicula_id
    `;
    
    const result = await query(deleteSql, [userId, peliculaId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'La película no está en favoritas'
      });
    }
    
    console.log(`✅ Película removida de favoritas: ${peliculaId}`);
    
    res.json({
      success: true,
      message: 'Película removida de favoritas',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error al remover de favoritas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Verificar si una película está en favoritas
const checkIfFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { peliculaId } = req.params;
    
    // Validar ID
    if (!peliculaId || isNaN(peliculaId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de película inválido'
      });
    }
    
    const sql = `
      SELECT id FROM favoritas 
      WHERE usuario_id = $1 AND pelicula_id = $2
    `;
    
    const result = await query(sql, [userId, peliculaId]);
    
    res.json({
      success: true,
      data: {
        isFavorite: result.rows.length > 0,
        peliculaId: parseInt(peliculaId)
      }
    });

  } catch (error) {
    console.error('❌ Error al verificar favorita:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Limpiar todas las favoritas del usuario
const clearAllFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`📡 Limpiando todas las favoritas del usuario ${userId}`);
    
    const deleteSql = `
      DELETE FROM favoritas 
      WHERE usuario_id = $1
      RETURNING COUNT(*) as deleted_count
    `;
    
    const result = await query(deleteSql, [userId]);
    
    console.log(`✅ Favoritas limpiadas del usuario ${userId}`);
    
    res.json({
      success: true,
      message: 'Todas las favoritas han sido eliminadas',
      data: {
        deletedCount: result.rowCount || 0
      }
    });

  } catch (error) {
    console.error('❌ Error al limpiar favoritas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de favoritas del usuario
const getFavoritesStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sql = `
      SELECT 
        COUNT(*) as total_favoritas,
        COUNT(DISTINCT p.genero) as generos_diferentes,
        p.genero as genero_favorito,
        COUNT(*) as count
      FROM favoritas f
      JOIN peliculas p ON f.pelicula_id = p.id
      WHERE f.usuario_id = $1 AND p.activo = true
      GROUP BY p.genero
      ORDER BY count DESC
      LIMIT 1
    `;
    
    const result = await query(sql, [userId]);
    
    // También obtener total general
    const totalSql = `
      SELECT COUNT(*) as total
      FROM favoritas f
      JOIN peliculas p ON f.pelicula_id = p.id
      WHERE f.usuario_id = $1 AND p.activo = true
    `;
    
    const totalResult = await query(totalSql, [userId]);
    
    res.json({
      success: true,
      data: {
        totalFavoritas: parseInt(totalResult.rows[0]?.total || 0),
        generoFavorito: result.rows[0]?.genero_favorito || 'Ninguno'
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkIfFavorite,
  clearAllFavorites,
  getFavoritesStats
};