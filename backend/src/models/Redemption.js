// src/models/Redemption.js
const { query } = require('../config/database');
const crypto = require('crypto');

class Redemption {
    // Generar código único de canje
    static generateRedemptionCode() {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }

    // Crear un nuevo canje
    static async create(userId, rewardId, pointsUsed) {
        // Para este proyecto, vamos a usar transacciones manuales
        try {
            // Generar código único
            let redemptionCode;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;

            while (!isUnique && attempts < maxAttempts) {
                redemptionCode = this.generateRedemptionCode();
                const existingCode = await query(`
                    SELECT id FROM canjes_recompensas WHERE codigo_canje = $1
                `, [redemptionCode]);
                
                if (existingCode.rows.length === 0) {
                    isUnique = true;
                } else {
                    attempts++;
                }
            }

            if (!isUnique) {
                throw new Error('No se pudo generar un código único');
            }

            // Obtener información de la recompensa para calcular fecha de expiración
            const rewardResult = await query(`
                SELECT validez_dias FROM recompensas WHERE id = $1
            `, [rewardId]);

            if (rewardResult.rows.length === 0) {
                throw new Error('Recompensa no encontrada');
            }

            const validezDias = rewardResult.rows[0].validez_dias;
            const fechaExpiracion = new Date();
            fechaExpiracion.setDate(fechaExpiracion.getDate() + validezDias);

            // Crear el canje
            const redemptionResult = await query(`
                INSERT INTO canjes_recompensas (
                    usuario_id, recompensa_id, codigo_canje, 
                    puntos_usados, fecha_expiracion
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [userId, rewardId, redemptionCode, pointsUsed, fechaExpiracion]);

            // Descontar puntos del usuario
            await query(`
                UPDATE puntos_usuario 
                SET puntos_actuales = puntos_actuales - $1,
                    total_usados = total_usados + $1,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE usuario_id = $2
            `, [pointsUsed, userId]);

            // Registrar transacción de puntos
            const puntosAnteriores = await query(`
                SELECT puntos_actuales + $1 as puntos_anteriores 
                FROM puntos_usuario WHERE usuario_id = $2
            `, [pointsUsed, userId]);

            const puntosNuevos = await query(`
                SELECT puntos_actuales FROM puntos_usuario WHERE usuario_id = $1
            `, [userId]);

            await query(`
                INSERT INTO transacciones_puntos (
                    usuario_id, tipo, puntos, concepto, 
                    puntos_anteriores, puntos_nuevos, metadata
                ) VALUES ($1, 'uso', $2, $3, $4, $5, $6)
            `, [
                userId, 
                pointsUsed, 
                `Canje de recompensa - Código: ${redemptionCode}`,
                puntosAnteriores.rows[0].puntos_anteriores,
                puntosNuevos.rows[0].puntos_actuales,
                JSON.stringify({ codigo_canje: redemptionCode, recompensa_id: rewardId })
            ]);

            // Reducir stock de la recompensa si aplica
            await query(`
                UPDATE recompensas 
                SET stock = CASE 
                    WHEN stock IS NOT NULL AND stock > 0 
                    THEN stock - 1 
                    ELSE stock 
                END
                WHERE id = $1
            `, [rewardId]);

            return redemptionResult.rows[0];

        } catch (error) {
            throw new Error(`Error al crear canje: ${error.message}`);
        }
    }

    // Obtener canjes de un usuario
    static async getUserRedemptions(userId, includeUsed = true) {
        try {
            let query_sql = `
                SELECT 
                    cr.*,
                    r.nombre as recompensa_nombre,
                    r.descripcion as recompensa_descripcion,
                    r.imagen as recompensa_imagen,
                    r.tipo as recompensa_tipo,
                    r.valor as recompensa_valor,
                    r.categoria as recompensa_categoria
                FROM canjes_recompensas cr
                JOIN recompensas r ON cr.recompensa_id = r.id
                WHERE cr.usuario_id = $1
            `;

            if (!includeUsed) {
                query_sql += ' AND cr.usado = false';
            }

            query_sql += ' ORDER BY cr.fecha_canje DESC';

            const result = await query(query_sql, [userId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener canjes del usuario: ${error.message}`);
        }
    }

    // Obtener canje por código
    static async getByCode(codigo) {
        try {
            const result = await query(`
                SELECT 
                    cr.*,
                    r.nombre as recompensa_nombre,
                    r.descripcion as recompensa_descripcion,
                    r.imagen as recompensa_imagen,
                    r.tipo as recompensa_tipo,
                    r.valor as recompensa_valor,
                    r.categoria as recompensa_categoria,
                    u.nombre as usuario_nombre,
                    u.email as usuario_email
                FROM canjes_recompensas cr
                JOIN recompensas r ON cr.recompensa_id = r.id
                JOIN usuarios u ON cr.usuario_id = u.id
                WHERE cr.codigo_canje = $1
            `, [codigo]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al obtener canje por código: ${error.message}`);
        }
    }

    // Marcar canje como usado
    static async markAsUsed(codigo) {
        try {
            const result = await query(`
                UPDATE canjes_recompensas 
                SET usado = true, fecha_uso = CURRENT_TIMESTAMP
                WHERE codigo_canje = $1 AND usado = false
                RETURNING *
            `, [codigo]);
            
            if (result.rows.length === 0) {
                throw new Error('Código no encontrado o ya utilizado');
            }
            
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al marcar canje como usado: ${error.message}`);
        }
    }

    // Validar código de canje
    static async validateCode(codigo) {
        try {
            const redemption = await this.getByCode(codigo);
            
            if (!redemption) {
                return { valid: false, reason: 'Código no encontrado' };
            }

            if (redemption.usado) {
                return { 
                    valid: false, 
                    reason: 'Código ya utilizado',
                    usedDate: redemption.fecha_uso
                };
            }

            const now = new Date();
            const expirationDate = new Date(redemption.fecha_expiracion);
            
            if (now > expirationDate) {
                return { 
                    valid: false, 
                    reason: 'Código expirado',
                    expirationDate: redemption.fecha_expiracion
                };
            }

            return { valid: true, redemption };
        } catch (error) {
            throw new Error(`Error al validar código: ${error.message}`);
        }
    }

    // Obtener estadísticas de canjes (ADMIN)
    static async getStats() {
        try {
            const result = await query(`
                SELECT 
                    COUNT(*) as total_canjes,
                    COUNT(CASE WHEN usado = true THEN 1 END) as canjes_usados,
                    COUNT(CASE WHEN usado = false AND fecha_expiracion > CURRENT_TIMESTAMP THEN 1 END) as canjes_activos,
                    COUNT(CASE WHEN usado = false AND fecha_expiracion <= CURRENT_TIMESTAMP THEN 1 END) as canjes_expirados,
                    SUM(puntos_usados) as total_puntos_canjeados,
                    AVG(puntos_usados) as promedio_puntos_canje
                FROM canjes_recompensas
            `);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al obtener estadísticas de canjes: ${error.message}`);
        } {
            throw new Error(`Error al obtener estadísticas de canjes: ${error.message}`);
        }
    }

    // Obtener canjes por recompensa (ADMIN)
    static async getByReward(rewardId) {
        try {
            const result = await query(`
                SELECT 
                    cr.*,
                    u.nombre as usuario_nombre,
                    u.email as usuario_email
                FROM canjes_recompensas cr
                JOIN usuarios u ON cr.usuario_id = u.id
                WHERE cr.recompensa_id = $1
                ORDER BY cr.fecha_canje DESC
            `, [rewardId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener canjes por recompensa: ${error.message}`);
        }
    }

    // Limpiar canjes expirados (función de mantenimiento)
    static async cleanupExpired() {
        try {
            const result = await query(`
                SELECT COUNT(*) as expired_count
                FROM canjes_recompensas 
                WHERE usado = false AND fecha_expiracion <= CURRENT_TIMESTAMP
            `);
            
            return {
                expiredCount: parseInt(result.rows[0].expired_count),
                message: `Se encontraron ${result.rows[0].expired_count} canjes expirados`
            };
        } catch (error) {
            throw new Error(`Error al limpiar canjes expirados: ${error.message}`);
        }
    }
}

module.exports = Redemption;