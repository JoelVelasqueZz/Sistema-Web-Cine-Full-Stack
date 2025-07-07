// backend/src/models/Comment.js - CON RESPUESTAS
const db = require('../config/database');

class Comment {
    constructor() {
        this.tableName = 'comentarios';
        this.repliesTableName = 'respuestas_comentarios';
    }

    // ==================== CRUD BÁSICO ====================
    
    async create(comentarioData) {
        const {
            usuario_id,
            tipo,
            pelicula_id,
            titulo,
            contenido,
            puntuacion
        } = comentarioData;

        const query = `
            INSERT INTO ${this.tableName} 
            (usuario_id, tipo, pelicula_id, titulo, contenido, puntuacion)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [usuario_id, tipo, pelicula_id, titulo, contenido, puntuacion];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    async findById(id) {
        const query = `
            SELECT c.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar,
                   p.titulo as pelicula_titulo
            FROM ${this.tableName} c
            JOIN usuarios u ON c.usuario_id = u.id
            LEFT JOIN peliculas p ON c.pelicula_id = p.id
            WHERE c.id = $1
        `;
        
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    async update(id, usuario_id, updateData) {
        const { titulo, contenido, puntuacion } = updateData;
        
        const query = `
            UPDATE ${this.tableName} 
            SET titulo = $1, contenido = $2, puntuacion = $3, 
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $4 AND usuario_id = $5
            RETURNING *
        `;

        const values = [titulo, contenido, puntuacion, id, usuario_id];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    async delete(id, usuario_id) {
        const query = `
            DELETE FROM ${this.tableName} 
            WHERE id = $1 AND usuario_id = $2
            RETURNING *
        `;
        
        const result = await db.query(query, [id, usuario_id]);
        return result.rows[0];
    }

    // ==================== MÉTODOS DE RESPUESTAS ====================

    /**
     * 🆕 CREAR RESPUESTA A COMENTARIO
     */
    async createReply(replyData) {
        const { comentario_id, usuario_id, contenido } = replyData;

        const query = `
            INSERT INTO ${this.repliesTableName} 
            (comentario_id, usuario_id, contenido)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const values = [comentario_id, usuario_id, contenido];
        const result = await db.query(query, values);
        
        // Obtener la respuesta con información del usuario
        const fullReply = await this.getReplyById(result.rows[0].id);
        return fullReply;
    }

    /**
     * 🆕 OBTENER RESPUESTA POR ID CON INFORMACIÓN DEL USUARIO
     */
    async getReplyById(replyId) {
        const query = `
            SELECT r.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar
            FROM ${this.repliesTableName} r
            LEFT JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.id = $1
        `;
        
        const result = await db.query(query, [replyId]);
        return result.rows[0];
    }

    /**
     * 🆕 OBTENER RESPUESTAS DE UN COMENTARIO
     */
    async getReplies(comentario_id, limit = 10, offset = 0) {
        const query = `
            SELECT r.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar
            FROM ${this.repliesTableName} r
            LEFT JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.comentario_id = $1
            ORDER BY r.fecha_creacion ASC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await db.query(query, [comentario_id, limit, offset]);
        return result.rows;
    }

    /**
     * 🆕 ELIMINAR RESPUESTA
     */
    async deleteReply(replyId, usuario_id) {
        const query = `
            DELETE FROM ${this.repliesTableName} 
            WHERE id = $1 AND usuario_id = $2
            RETURNING *
        `;
        
        const result = await db.query(query, [replyId, usuario_id]);
        return result.rows[0];
    }

    /**
     * 🆕 CONTAR RESPUESTAS DE UN COMENTARIO
     */
    async getReplyCount(comentario_id) {
        const query = `
            SELECT COUNT(*) as count
            FROM ${this.repliesTableName}
            WHERE comentario_id = $1
        `;
        
        const result = await db.query(query, [comentario_id]);
        return parseInt(result.rows[0].count) || 0;
    }

    // ==================== MÉTODOS ESPECÍFICOS ACTUALIZADOS ====================

    async getByMovie(pelicula_id, limit = 20, offset = 0) {
        const query = `
            SELECT c.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar,
                   p.titulo as pelicula_titulo, p.poster as pelicula_poster
            FROM ${this.tableName} c
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            LEFT JOIN peliculas p ON c.pelicula_id = p.id
            WHERE c.pelicula_id = $1 AND c.estado = 'activo'
            ORDER BY c.fecha_creacion DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await db.query(query, [pelicula_id, limit, offset]);
        return result.rows;
    }

    /**
     * 🆕 MÉTODO ACTUALIZADO: Obtener comentarios de película con reacciones Y respuestas
     */
    async getByMovieWithReactionsAndReplies(pelicula_id, usuario_id = null, limit = 20, offset = 0) {
        const query = `
            SELECT 
                c.*, 
                u.nombre as usuario_nombre,
                u.avatar as usuario_avatar,
                p.titulo as pelicula_titulo, 
                p.poster as pelicula_poster,
                (SELECT COUNT(*) FROM comentarios_reacciones cr WHERE cr.comentario_id = c.id AND cr.tipo = 'like') as total_likes,
                (SELECT COUNT(*) FROM comentarios_reacciones cr WHERE cr.comentario_id = c.id AND cr.tipo = 'dislike') as total_dislikes,
                (SELECT COUNT(*) FROM ${this.repliesTableName} r WHERE r.comentario_id = c.id) as total_replies,
                ${usuario_id ? 
                    `(SELECT tipo FROM comentarios_reacciones cr WHERE cr.comentario_id = c.id AND cr.usuario_id = $4) as user_reaction` : 
                    'NULL as user_reaction'
                }
            FROM ${this.tableName} c
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            LEFT JOIN peliculas p ON c.pelicula_id = p.id
            WHERE c.pelicula_id = $1 AND c.estado = 'activo'
            ORDER BY c.fecha_creacion DESC
            LIMIT $2 OFFSET $3
        `;
        
        const params = usuario_id ? [pelicula_id, limit, offset, usuario_id] : [pelicula_id, limit, offset];
        const result = await db.query(query, params);
        return result.rows;
    }

    async getByMovieWithReactions(pelicula_id, usuario_id = null, limit = 20, offset = 0) {
        const query = `
            SELECT 
                c.*, 
                u.nombre as usuario_nombre,
                u.avatar as usuario_avatar,
                p.titulo as pelicula_titulo, 
                p.poster as pelicula_poster,
                (SELECT COUNT(*) FROM comentarios_reacciones cr WHERE cr.comentario_id = c.id AND cr.tipo = 'like') as total_likes,
                (SELECT COUNT(*) FROM comentarios_reacciones cr WHERE cr.comentario_id = c.id AND cr.tipo = 'dislike') as total_dislikes,
                (SELECT COUNT(*) FROM ${this.repliesTableName} r WHERE r.comentario_id = c.id) as total_replies,
                ${usuario_id ? 
                    `(SELECT tipo FROM comentarios_reacciones cr WHERE cr.comentario_id = c.id AND cr.usuario_id = $4) as user_reaction` : 
                    'NULL as user_reaction'
                }
            FROM ${this.tableName} c
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            LEFT JOIN peliculas p ON c.pelicula_id = p.id
            WHERE c.pelicula_id = $1 AND c.estado = 'activo'
            ORDER BY c.fecha_creacion DESC
            LIMIT $2 OFFSET $3
        `;
        
        const params = usuario_id ? [pelicula_id, limit, offset, usuario_id] : [pelicula_id, limit, offset];
        const result = await db.query(query, params);
        return result.rows;
    }

    async getByUser(usuario_id, limit = 20, offset = 0) {
        const query = `
            SELECT c.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar,
                   p.titulo as pelicula_titulo, p.poster as pelicula_poster
            FROM ${this.tableName} c
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            LEFT JOIN peliculas p ON c.pelicula_id = p.id
            WHERE c.usuario_id = $1 AND c.estado = 'activo'
            ORDER BY c.fecha_creacion DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await db.query(query, [usuario_id, limit, offset]);
        return result.rows;
    }

    async getByUserWithReactions(usuario_id, limit = 20, offset = 0) {
        const query = `
            SELECT 
                c.*, 
                u.nombre as usuario_nombre,
                u.avatar as usuario_avatar,
                p.titulo as pelicula_titulo, 
                p.poster as pelicula_poster,
                (SELECT COUNT(*) FROM comentarios_reacciones cr WHERE cr.comentario_id = c.id AND cr.tipo = 'like') as total_likes,
                (SELECT COUNT(*) FROM comentarios_reacciones cr WHERE cr.comentario_id = c.id AND cr.tipo = 'dislike') as total_dislikes,
                (SELECT COUNT(*) FROM ${this.repliesTableName} r WHERE r.comentario_id = c.id) as total_replies,
                (SELECT tipo FROM comentarios_reacciones cr WHERE cr.comentario_id = c.id AND cr.usuario_id = $1) as user_reaction
            FROM ${this.tableName} c
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            LEFT JOIN peliculas p ON c.pelicula_id = p.id
            WHERE c.usuario_id = $1 AND c.estado = 'activo'
            ORDER BY c.fecha_creacion DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await db.query(query, [usuario_id, limit, offset]);
        return result.rows;
    }

    async getSystemFeedback(limit = 50, offset = 0) {
        const query = `
            SELECT c.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar
            FROM ${this.tableName} c
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.tipo IN ('sistema', 'sugerencia') AND c.estado = 'activo'
            ORDER BY c.fecha_creacion DESC
            LIMIT $1 OFFSET $2
        `;
        
        const result = await db.query(query, [limit, offset]);
        return result.rows;
    }

    async getSystemFeedbackWithReactions(usuario_id = null, limit = 50, offset = 0) {
        const query = `
            SELECT 
                c.*, 
                u.nombre as usuario_nombre,
                u.avatar as usuario_avatar,
                (SELECT COUNT(*) FROM comentarios_reacciones cr WHERE cr.comentario_id = c.id AND cr.tipo = 'like') as total_likes,
                (SELECT COUNT(*) FROM comentarios_reacciones cr WHERE cr.comentario_id = c.id AND cr.tipo = 'dislike') as total_dislikes,
                (SELECT COUNT(*) FROM ${this.repliesTableName} r WHERE r.comentario_id = c.id) as total_replies,
                ${usuario_id ? 
                    `(SELECT tipo FROM comentarios_reacciones cr WHERE cr.comentario_id = c.id AND cr.usuario_id = $3) as user_reaction` : 
                    'NULL as user_reaction'
                }
            FROM ${this.tableName} c
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.tipo IN ('sistema', 'sugerencia') AND c.estado = 'activo'
            ORDER BY c.fecha_creacion DESC
            LIMIT $1 OFFSET $2
        `;
        
        const params = usuario_id ? [limit, offset, usuario_id] : [limit, offset];
        const result = await db.query(query, params);
        return result.rows;
    }

    async hasUserCommented(usuario_id, pelicula_id) {
        const query = `
            SELECT COUNT(*) as count
            FROM ${this.tableName}
            WHERE usuario_id = $1 AND pelicula_id = $2 AND tipo = 'pelicula'
        `;
        
        const result = await db.query(query, [usuario_id, pelicula_id]);
        return parseInt(result.rows[0].count) > 0;
    }

    async getSimpleMovieStats(pelicula_id) {
        try {
            console.log('📊 Obteniendo estadísticas simples para película:', pelicula_id);
            
            const query = `
                SELECT 
                    COUNT(*) as total_comentarios,
                    COALESCE(ROUND(AVG(puntuacion), 1), 0) as puntuacion_promedio,
                    COUNT(CASE WHEN puntuacion = 5 THEN 1 END) as estrellas_5,
                    COUNT(CASE WHEN puntuacion = 4 THEN 1 END) as estrellas_4,
                    COUNT(CASE WHEN puntuacion = 3 THEN 1 END) as estrellas_3,
                    COUNT(CASE WHEN puntuacion = 2 THEN 1 END) as estrellas_2,
                    COUNT(CASE WHEN puntuacion = 1 THEN 1 END) as estrellas_1
                FROM ${this.tableName}
                WHERE pelicula_id = $1 AND estado = 'activo' AND tipo = 'pelicula'
            `;
            
            const result = await db.query(query, [pelicula_id]);
            const stats = result.rows[0];
            
            return {
                pelicula_id: parseInt(pelicula_id),
                total_comentarios: parseInt(stats.total_comentarios) || 0,
                puntuacion_promedio: parseFloat(stats.puntuacion_promedio) || 0,
                distribucion_puntuaciones: {
                    '5_estrellas': parseInt(stats.estrellas_5) || 0,
                    '4_estrellas': parseInt(stats.estrellas_4) || 0,
                    '3_estrellas': parseInt(stats.estrellas_3) || 0,
                    '2_estrellas': parseInt(stats.estrellas_2) || 0,
                    '1_estrella': parseInt(stats.estrellas_1) || 0
                }
            };
        } catch (error) {
            console.error('Error en getSimpleMovieStats:', error);
            return {
                pelicula_id: parseInt(pelicula_id),
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
    }

    async getStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_comentarios,
                    COUNT(CASE WHEN tipo = 'pelicula' THEN 1 END) as total_resenas,
                    COUNT(CASE WHEN tipo = 'sugerencia' THEN 1 END) as total_sugerencias,
                    COUNT(CASE WHEN estado = 'activo' THEN 1 END) as comentarios_activos
                FROM ${this.tableName}
            `;
            
            const result = await db.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error en getStats:', error);
            return { total_comentarios: 0 };
        }
    }

    // ==================== MÉTODOS DE REACCIONES ====================

    async addReaction(comentario_id, usuario_id, tipo) {
        const checkQuery = `
            SELECT * FROM comentarios_reacciones 
            WHERE comentario_id = $1 AND usuario_id = $2
        `;
        
        const existingReaction = await db.query(checkQuery, [comentario_id, usuario_id]);
        
        if (existingReaction.rows.length > 0) {
            if (existingReaction.rows[0].tipo === tipo) {
                const deleteQuery = `
                    DELETE FROM comentarios_reacciones 
                    WHERE comentario_id = $1 AND usuario_id = $2
                    RETURNING *
                `;
                const result = await db.query(deleteQuery, [comentario_id, usuario_id]);
                return { action: 'removed', reaction: result.rows[0] };
            } else {
                const updateQuery = `
                    UPDATE comentarios_reacciones 
                    SET tipo = $1, fecha_creacion = CURRENT_TIMESTAMP
                    WHERE comentario_id = $2 AND usuario_id = $3
                    RETURNING *
                `;
                const result = await db.query(updateQuery, [tipo, comentario_id, usuario_id]);
                return { action: 'updated', reaction: result.rows[0] };
            }
        } else {
            const insertQuery = `
                INSERT INTO comentarios_reacciones (comentario_id, usuario_id, tipo)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            const result = await db.query(insertQuery, [comentario_id, usuario_id, tipo]);
            return { action: 'created', reaction: result.rows[0] };
        }
    }

    async getReactionStats(comentario_id) {
        const query = `
            SELECT 
                COUNT(CASE WHEN tipo = 'like' THEN 1 END) as totalLikes,
                COUNT(CASE WHEN tipo = 'dislike' THEN 1 END) as totalDislikes,
                COUNT(*) as totalReactions
            FROM comentarios_reacciones 
            WHERE comentario_id = $1
        `;
        
        const result = await db.query(query, [comentario_id]);
        const stats = result.rows[0];
        
        return {
            totalLikes: parseInt(stats.totallikes) || 0,
            totalDislikes: parseInt(stats.totaldislikes) || 0,
            totalReactions: parseInt(stats.totalreactions) || 0
        };
    }

    async getUserReaction(comentario_id, usuario_id) {
        const query = `
            SELECT tipo FROM comentarios_reacciones 
            WHERE comentario_id = $1 AND usuario_id = $2
        `;
        
        const result = await db.query(query, [comentario_id, usuario_id]);
        return result.rows.length > 0 ? result.rows[0].tipo : null;
    }

    // ==================== MÉTODOS ADMIN ====================

    async getAllForAdmin(filters = {}, limit = 50, offset = 0) {
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (filters.tipo) {
            whereConditions.push(`c.tipo = ${paramIndex}`);
            params.push(filters.tipo);
            paramIndex++;
        }

        if (filters.estado) {
            whereConditions.push(`c.estado = ${paramIndex}`);
            params.push(filters.estado);
            paramIndex++;
        }

        if (filters.usuario_id) {
            whereConditions.push(`c.usuario_id = ${paramIndex}`);
            params.push(filters.usuario_id);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        const query = `
            SELECT c.*, u.nombre as usuario_nombre, u.email as usuario_email,
                   p.titulo as pelicula_titulo
            FROM ${this.tableName} c
            JOIN usuarios u ON c.usuario_id = u.id
            LEFT JOIN peliculas p ON c.pelicula_id = p.id
            ${whereClause}
            ORDER BY c.fecha_creacion DESC
            LIMIT ${paramIndex} OFFSET ${paramIndex + 1}
        `;

        params.push(limit, offset);
        const result = await db.query(query, params);
        return result.rows;
    }

    async updateStatus(id, estado) {
        const query = `
            UPDATE ${this.tableName} 
            SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        
        const result = await db.query(query, [estado, id]);
        return result.rows[0];
    }

    async toggleFeatured(id) {
        const query = `
            UPDATE ${this.tableName} 
            SET es_destacado = NOT es_destacado,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = new Comment();