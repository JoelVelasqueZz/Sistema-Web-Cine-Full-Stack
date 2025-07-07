// backend/src/controllers/comments/commentController.js - CORREGIDO COMPLETO
const Comment = require('../../models/Comment');
const { validationResult } = require('express-validator');

class CommentController {
    
    // ==================== MÉTODOS PÚBLICOS ====================

    /**
     * Crear nuevo comentario
     */
    async create(req, res) {
        try {
            // 🔥 VERIFICAR AUTENTICACIÓN PRIMERO
            if (!req.user || !req.user.id) {
                console.error('❌ Usuario no autenticado:', {
                    hasReqUser: !!req.user,
                    userId: req.user?.id,
                    headers: req.headers.authorization ? 'Present' : 'Missing'
                });
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            // Validar errores de entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: errors.array()
                });
            }

            const { tipo, pelicula_id, titulo, contenido, puntuacion } = req.body;
            const usuario_id = req.user.id;

            console.log('📝 Datos del comentario:', {
                usuario_id,
                tipo,
                pelicula_id,
                titulo: titulo?.substring(0, 50),
                puntuacion
            });

            // Validar que si es comentario de película, incluya puntuación
            if (tipo === 'pelicula' && (!puntuacion || puntuacion < 1 || puntuacion > 5)) {
                return res.status(400).json({
                    success: false,
                    message: 'Las reseñas de películas requieren puntuación entre 1 y 5 estrellas'
                });
            }

            // Verificar si ya comentó esta película
            if (tipo === 'pelicula') {
                const hasCommented = await Comment.hasUserCommented(usuario_id, pelicula_id);
                if (hasCommented) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya has comentado esta película. Puedes editar tu comentario existente.'
                    });
                }
            }

            const comentarioData = {
                usuario_id,
                tipo,
                pelicula_id: tipo === 'pelicula' ? pelicula_id : null,
                titulo,
                contenido,
                puntuacion: tipo === 'pelicula' ? puntuacion : null
            };

            const nuevoComentario = await Comment.create(comentarioData);

            res.status(201).json({
                success: true,
                message: 'Comentario creado exitosamente',
                data: nuevoComentario
            });

        } catch (error) {
            console.error('Error al crear comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener comentarios de una película - SIN REACCIONES (MÉTODO SIMPLE)
     */
    async getByMovie(req, res) {
        try {
            const { pelicula_id } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            const offset = (page - 1) * limit;
            const comentarios = await Comment.getByMovie(pelicula_id, parseInt(limit), offset);

            // 🔥 USAR MÉTODO SIMPLE SOLAMENTE
            let stats;
            try {
                stats = await Comment.getSimpleMovieStats(pelicula_id);
            } catch (error) {
                console.error('❌ Error en getSimpleMovieStats:', error);
                stats = {
                    total_comentarios: 0,
                    puntuacion_promedio: 0,
                    distribucion_puntuaciones: {
                        '5_estrellas': 0,
                        '4_estrellas': 0,
                        '3_estrellas': 0,
                        '2_estrellas': 0,
                        '1_estrella': 0
                    }
                };
            }

            res.json({
                success: true,
                data: {
                    comentarios,
                    estadisticas: stats,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: stats.total_comentarios || 0
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener comentarios de película:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * 🆕 OBTENER COMENTARIOS DE PELÍCULA CON REACCIONES
     */
    async getByMovieWithReactions(req, res) {
        try {
            const { pelicula_id } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const usuario_id = req.user?.id; // Usuario opcional 
            
            const offset = (page - 1) * limit;
            
            // Usar método con reacciones
            const comentarios = await Comment.getByMovieWithReactions(
                pelicula_id, 
                usuario_id, 
                parseInt(limit), 
                offset
            );

            // Obtener estadísticas
            let stats;
            try {
                stats = await Comment.getSimpleMovieStats(pelicula_id);
            } catch (error) {
                console.error('❌ Error con función de stats:', error);
                stats = await Comment.getSimpleMovieStats(pelicula_id);
            }

            res.json({
                success: true,
                data: {
                    comentarios,
                    estadisticas: stats,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: stats.total_comentarios || 0
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener comentarios de película:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * 🆕 OBTENER MIS COMENTARIOS CON REACCIONES
     */
    async getMyCommentsWithReactions(req, res) {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const usuario_id = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            
            const offset = (page - 1) * limit;
            const comentarios = await Comment.getByUserWithReactions(usuario_id, parseInt(limit), offset);

            res.json({
                success: true,
                data: {
                    comentarios,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: comentarios.length
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener comentarios del usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * 🆕 OBTENER SUGERENCIAS CON REACCIONES
     */
    async getSystemFeedbackWithReactions(req, res) {
        try {
            const { page = 1, limit = 50 } = req.query;
            const usuario_id = req.user?.id; // Usuario opcional
            const offset = (page - 1) * limit;
            
            const sugerencias = await Comment.getSystemFeedbackWithReactions(
                usuario_id,
                parseInt(limit), 
                offset
            );

            res.json({
                success: true,
                data: {
                    sugerencias,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: sugerencias.length
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener sugerencias:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // ==================== RESTO DE MÉTODOS ====================
    
    async getById(req, res) {
        try {
            const { id } = req.params;
            const comentario = await Comment.findById(id);

            if (!comentario) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            res.json({
                success: true,
                data: comentario
            });

        } catch (error) {
            console.error('Error al obtener comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async getMyComments(req, res) {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const usuario_id = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            
            const offset = (page - 1) * limit;
            const comentarios = await Comment.getByUser(usuario_id, parseInt(limit), offset);

            res.json({
                success: true,
                data: {
                    comentarios,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: comentarios.length
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener comentarios del usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async getSystemFeedback(req, res) {
        try {
            const { page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;
            
            const sugerencias = await Comment.getSystemFeedback(parseInt(limit), offset);

            res.json({
                success: true,
                data: {
                    sugerencias,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: sugerencias.length
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener sugerencias:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async update(req, res) {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const { titulo, contenido, puntuacion } = req.body;
            const usuario_id = req.user.id;

            const comentarioActualizado = await Comment.update(id, usuario_id, {
                titulo,
                contenido,
                puntuacion
            });

            if (!comentarioActualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado o no tienes permisos para editarlo'
                });
            }

            res.json({
                success: true,
                message: 'Comentario actualizado exitosamente',
                data: comentarioActualizado
            });

        } catch (error) {
            console.error('Error al actualizar comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async delete(req, res) {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { id } = req.params;
            const usuario_id = req.user.id;

            const comentarioEliminado = await Comment.delete(id, usuario_id);

            if (!comentarioEliminado) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado o no tienes permisos para eliminarlo'
                });
            }

            res.json({
                success: true,
                message: 'Comentario eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error al eliminar comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * 🆕 AGREGAR REACCIÓN A COMENTARIO
     */
    async addReaction(req, res) {
        try {
            // Verificar autenticación
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { id: comentario_id } = req.params;
            const { tipo } = req.body;
            const usuario_id = req.user.id;

            // Validar tipo de reacción
            if (!tipo || !['like', 'dislike'].includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de reacción inválido. Debe ser "like" o "dislike"'
                });
            }

            // Verificar que el comentario existe
            const comentario = await Comment.findById(comentario_id);
            if (!comentario) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            // Agregar/actualizar reacción
            const reactionResult = await Comment.addReaction(comentario_id, usuario_id, tipo);
            
            // Obtener estadísticas actualizadas
            const stats = await Comment.getReactionStats(comentario_id);

            res.json({
                success: true,
                message: `Reacción ${reactionResult.action === 'removed' ? 'eliminada' : 'agregada'} exitosamente`,
                data: {
                    action: reactionResult.action,
                    reaction: reactionResult.reaction,
                    stats: stats
                }
            });

        } catch (error) {
            console.error('Error al agregar reacción:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * 🆕 OBTENER ESTADÍSTICAS DE REACCIONES
     */
    async getReactionStats(req, res) {
        try {
            const { id: comentario_id } = req.params;
            const usuario_id = req.user?.id; // Opcional

            const stats = await Comment.getReactionStats(comentario_id); 
            let userReaction = null;

            if (usuario_id) {
                userReaction = await Comment.getUserReaction(comentario_id, usuario_id);
            }

            res.json({
                success: true,
                data: {
                    ...stats,
                    userReaction
                }
            });

        } catch (error) {
            console.error('Error al obtener estadísticas de reacciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // ==================== MÉTODOS ADMIN ====================

    async getAllForAdmin(req, res) {
        try {
            const { tipo, estado, usuario_id, page = 1, limit = 50 } = req.query;
            const filters = {};
            
            if (tipo) filters.tipo = tipo;
            if (estado) filters.estado = estado;
            if (usuario_id) filters.usuario_id = usuario_id;

            const offset = (page - 1) * limit;
            const comentarios = await Comment.getAllForAdmin(filters, parseInt(limit), offset);

            // Usar método simple para stats
            let stats;
            try {
                stats = await Comment.getStats();
            } catch (error) {
                console.error('❌ Error en getStats, usando fallback:', error);
                stats = { total_comentarios: comentarios.length };
            }

            res.json({
                success: true,
                data: {
                    comentarios,
                    estadisticas: stats,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: comentarios.length
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener comentarios (admin):', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            if (!['activo', 'oculto', 'moderacion', 'rechazado'].includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido'
                });
            }

            const comentarioActualizado = await Comment.updateStatus(id, estado);

            if (!comentarioActualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            res.json({
                success: true,
                message: `Estado cambiado a: ${estado}`,
                data: comentarioActualizado
            });

        } catch (error) {
            console.error('Error al cambiar estado del comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async toggleFeatured(req, res) {
        try {
            const { id } = req.params;

            const comentarioActualizado = await Comment.toggleFeatured(id);

            if (!comentarioActualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            const mensaje = comentarioActualizado.es_destacado 
                ? 'Comentario destacado' 
                : 'Destaque removido';

            res.json({
                success: true,
                message: mensaje,
                data: comentarioActualizado
            });

        } catch (error) {
            console.error('Error al cambiar destaque del comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

// 🔥 SOLUCIÓN: Crear instancia y hacer bind de los métodos
const commentController = new CommentController();

// 🔥 CRITICAL: Bind de todos los métodos para preservar el contexto 'this'
module.exports = {
    // Métodos básicos
    create: commentController.create.bind(commentController),
    getById: commentController.getById.bind(commentController),
    getByMovie: commentController.getByMovie.bind(commentController),
    getMyComments: commentController.getMyComments.bind(commentController),
    getSystemFeedback: commentController.getSystemFeedback.bind(commentController),
    update: commentController.update.bind(commentController),
    delete: commentController.delete.bind(commentController),
    
    // 🆕 Métodos con reacciones
    getByMovieWithReactions: commentController.getByMovieWithReactions.bind(commentController),
    getMyCommentsWithReactions: commentController.getMyCommentsWithReactions.bind(commentController),
    getSystemFeedbackWithReactions: commentController.getSystemFeedbackWithReactions.bind(commentController),
    addReaction: commentController.addReaction.bind(commentController),
    getReactionStats: commentController.getReactionStats.bind(commentController),
    
    // Métodos admin
    getAllForAdmin: commentController.getAllForAdmin.bind(commentController),
    updateStatus: commentController.updateStatus.bind(commentController),
    toggleFeatured: commentController.toggleFeatured.bind(commentController)
};