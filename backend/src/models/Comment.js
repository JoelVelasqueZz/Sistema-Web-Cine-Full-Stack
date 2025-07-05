// backend/src/models/Comment.js
const db = require('../config/database');

class Comment {
    constructor() {
        this.tableName = 'comentarios';
    }

    // ==================== CRUD BÁSICO ====================
    
    /**
     * Crear nuevo comentario
     */
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

    /**
     * Obtener comentario por ID
     */
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

    /**
     * Actualizar comentario
     */
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

    /**
     * Eliminar comentario (hard delete)
     */
    async delete(id, usuario_id) {
        const query = `
            DELETE FROM ${this.tableName} 
            WHERE id = $1 AND usuario_id = $2
            RETURNING *
        `;
        
        const result = await db.query(query, [id, usuario_id]);
        return result.rows[0];
    }

    // ==================== MÉTODOS ESPECÍFICOS ====================

    /**
     * Obtener comentarios de una película
     */
    async getByMovie(pelicula_id, limit = 20, offset = 0) {
        const query = `
            SELECT c.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar
            FROM ${this.tableName} c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.pelicula_id = $1 AND c.estado = 'activo' AND c.tipo = 'pelicula'
            ORDER BY c.fecha_creacion DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await db.query(query, [pelicula_id, limit, offset]);
        return result.rows;
    }

    /**
     * Obtener comentarios del usuario
     */
    async getByUser(usuario_id, limit = 20, offset = 0) {
        const query = `
            SELECT c.*, p.titulo as pelicula_titulo, p.poster as pelicula_poster
            FROM ${this.tableName} c
            LEFT JOIN peliculas p ON c.pelicula_id = p.id
            WHERE c.usuario_id = $1 AND c.estado = 'activo'
            ORDER BY c.fecha_creacion DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await db.query(query, [usuario_id, limit, offset]);
        return result.rows;
    }

    /**
     * Obtener sugerencias del sistema
     */
    async getSystemFeedback(limit = 50, offset = 0) {
        const query = `
            SELECT c.*, u.nombre as usuario_nombre, u.email as usuario_email
            FROM ${this.tableName} c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.tipo IN ('sistema', 'sugerencia') AND c.estado = 'activo'
            ORDER BY c.fecha_creacion DESC
            LIMIT $1 OFFSET $2
        `;
        
        const result = await db.query(query, [limit, offset]);
        return result.rows;
    }

    /**
     * Verificar si el usuario ya comentó la película
     */
    async hasUserCommented(usuario_id, pelicula_id) {
        const query = `
            SELECT COUNT(*) as count
            FROM ${this.tableName}
            WHERE usuario_id = $1 AND pelicula_id = $2 AND tipo = 'pelicula'
        `;
        
        const result = await db.query(query, [usuario_id, pelicula_id]);
        return parseInt(result.rows[0].count) > 0;
    }

    /**
     * Obtener estadísticas de comentarios usando función de BD
     */
    async getStats() {
        const query = `SELECT obtener_estadisticas_comentarios() as stats`;
        const result = await db.query(query);
        return result.rows[0].stats;
    }

    /**
     * Obtener comentarios con estadísticas de película
     */
    async getMovieCommentsWithStats(pelicula_id) {
        const query = `SELECT obtener_comentarios_pelicula($1) as data`;
        const result = await db.query(query, [pelicula_id]);
        return result.rows[0].data;
    }

    // ==================== MÉTODOS ADMIN ====================

    /**
     * Obtener todos los comentarios (para admin)
     */
    async getAllForAdmin(filters = {}, limit = 50, offset = 0) {
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        // Filtros opcionales
        if (filters.tipo) {
            whereConditions.push(`c.tipo = $${paramIndex}`);
            params.push(filters.tipo);
            paramIndex++;
        }

        if (filters.estado) {
            whereConditions.push(`c.estado = $${paramIndex}`);
            params.push(filters.estado);
            paramIndex++;
        }

        if (filters.usuario_id) {
            whereConditions.push(`c.usuario_id = $${paramIndex}`);
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
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limit, offset);
        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Cambiar estado del comentario (admin)
     */
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

    /**
     * Destacar/quitar destaque de comentario (admin)
     */
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