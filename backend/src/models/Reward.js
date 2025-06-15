// src/models/Reward.js
const { query } = require('../config/database');

class Reward {
    // Obtener todas las recompensas activas
    static async getAll() {
        try {
            const result = await query(`
                SELECT * FROM recompensas 
                WHERE disponible = true 
                ORDER BY puntos_requeridos ASC
            `);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener recompensas: ${error.message}`);
        }
    }

    // Obtener recompensas por categoría
    static async getByCategory(categoria) {
        try {
            const result = await query(`
                SELECT * FROM recompensas 
                WHERE categoria = $1 AND disponible = true 
                ORDER BY puntos_requeridos ASC
            `, [categoria]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener recompensas por categoría: ${error.message}`);
        }
    }

    // Obtener recompensa por ID
    static async getById(id) {
        try {
            const result = await query(`
                SELECT * FROM recompensas WHERE id = $1
            `, [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al obtener recompensa: ${error.message}`);
        }
    }

    // Crear nueva recompensa (ADMIN)
    static async create(rewardData) {
        const {
            nombre,
            descripcion,
            categoria,
            puntos_requeridos,
            imagen,
            disponible = true,
            stock = 0,
            tipo,
            valor = 0,
            limite_por_usuario = 1,
            validez_dias = 30,
            terminos = []
        } = rewardData;

        try {
            const result = await query(`
                INSERT INTO recompensas (
                    nombre, descripcion, categoria, puntos_requeridos, 
                    imagen, disponible, stock, tipo, valor, 
                    limite_por_usuario, validez_dias, terminos
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `, [
                nombre, descripcion, categoria, puntos_requeridos,
                imagen, disponible, stock, tipo, valor,
                limite_por_usuario, validez_dias, terminos
            ]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al crear recompensa: ${error.message}`);
        }
    }

    // Actualizar recompensa (ADMIN)
    static async update(id, rewardData) {
        const {
            nombre,
            descripcion,
            categoria,
            puntos_requeridos,
            imagen,
            disponible,
            stock,
            tipo,
            valor,
            limite_por_usuario,
            validez_dias,
            terminos
        } = rewardData;

        try {
            const result = await query(`
                UPDATE recompensas SET 
                    nombre = COALESCE($1, nombre),
                    descripcion = COALESCE($2, descripcion),
                    categoria = COALESCE($3, categoria),
                    puntos_requeridos = COALESCE($4, puntos_requeridos),
                    imagen = COALESCE($5, imagen),
                    disponible = COALESCE($6, disponible),
                    stock = COALESCE($7, stock),
                    tipo = COALESCE($8, tipo),
                    valor = COALESCE($9, valor),
                    limite_por_usuario = COALESCE($10, limite_por_usuario),
                    validez_dias = COALESCE($11, validez_dias),
                    terminos = COALESCE($12, terminos)
                WHERE id = $13
                RETURNING *
            `, [
                nombre, descripcion, categoria, puntos_requeridos,
                imagen, disponible, stock, tipo, valor,
                limite_por_usuario, validez_dias, terminos, id
            ]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al actualizar recompensa: ${error.message}`);
        }
    }

    // Eliminar recompensa (ADMIN)
    static async delete(id) {
        try {
            const result = await query(`
                DELETE FROM recompensas WHERE id = $1 RETURNING *
            `, [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al eliminar recompensa: ${error.message}`);
        }
    }

    // Verificar si el usuario puede canjear una recompensa
    static async canUserRedeem(userId, rewardId) {
        try {
            const reward = await this.getById(rewardId);
            if (!reward) {
                return { canRedeem: false, reason: 'Recompensa no encontrada' };
            }

            if (!reward.disponible) {
                return { canRedeem: false, reason: 'Recompensa no disponible' };
            }

            if (reward.stock !== null && reward.stock <= 0) {
                return { canRedeem: false, reason: 'Sin stock disponible' };
            }

            // Verificar puntos del usuario
            const userPointsResult = await query(`
                SELECT puntos_actuales FROM puntos_usuario WHERE usuario_id = $1
            `, [userId]);

            const userPoints = userPointsResult.rows[0]?.puntos_actuales || 0;
            if (userPoints < reward.puntos_requeridos) {
                return { 
                    canRedeem: false, 
                    reason: 'Puntos insuficientes',
                    pointsNeeded: reward.puntos_requeridos - userPoints
                };
            }

            // Verificar límite por usuario
            const userRedemptionsResult = await query(`
                SELECT COUNT(*) as canjes_usuario 
                FROM canjes_recompensas 
                WHERE usuario_id = $1 AND recompensa_id = $2
            `, [userId, rewardId]);

            const userRedemptions = parseInt(userRedemptionsResult.rows[0].canjes_usuario);
            if (userRedemptions >= reward.limite_por_usuario) {
                return { 
                    canRedeem: false, 
                    reason: 'Límite de canjes alcanzado para esta recompensa' 
                };
            }

            return { canRedeem: true, reward };
        } catch (error) {
            throw new Error(`Error al verificar canje: ${error.message}`);
        }
    }

    // Obtener categorías disponibles
    static async getCategories() {
        try {
            const result = await query(`
                SELECT DISTINCT categoria 
                FROM recompensas 
                WHERE disponible = true 
                ORDER BY categoria
            `);
            return result.rows.map(row => row.categoria);
        } catch (error) {
            throw new Error(`Error al obtener categorías: ${error.message}`);
        }
    }

    // Obtener estadísticas de recompensas (ADMIN)
    static async getStats() {
        try {
            const result = await query(`
                SELECT 
                    COUNT(*) as total_recompensas,
                    COUNT(CASE WHEN disponible = true THEN 1 END) as recompensas_activas,
                    COUNT(CASE WHEN stock > 0 THEN 1 END) as con_stock,
                    SUM(CASE WHEN stock IS NOT NULL THEN stock ELSE 0 END) as stock_total,
                    AVG(puntos_requeridos) as puntos_promedio
                FROM recompensas
            `);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }
}

module.exports = Reward;