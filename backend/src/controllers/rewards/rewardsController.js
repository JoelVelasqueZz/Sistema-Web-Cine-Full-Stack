// src/controllers/rewards/rewardsController.js
const Reward = require('../../models/Reward');
const Redemption = require('../../models/Redemption');
const Points = require('../../models/Points');

class RewardsController {
  constructor() {
    this.pointsModel = new Points();
  }

  // ==================== OBTENER RECOMPENSAS ====================

  /**
   * Obtener todas las recompensas disponibles (público)
   */
  async getAllRewards(req, res) {
    try {
      const { categoria, limite } = req.query;
      
      console.log('🎁 Obteniendo todas las recompensas disponibles');
      
      let rewards;
      if (categoria) {
        rewards = await Reward.getByCategory(categoria);
      } else {
        rewards = await Reward.getAll();
      }
      
      // Aplicar límite si se especifica
      if (limite && !isNaN(limite)) {
        rewards = rewards.slice(0, parseInt(limite));
      }
      
      res.json({
        success: true,
        data: rewards,
        total: rewards.length,
        message: rewards.length > 0 ? 'Recompensas encontradas' : 'No hay recompensas disponibles'
      });
    } catch (error) {
      console.error('❌ Error al obtener recompensas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener recompensas',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  /**
   * Obtener recompensa por ID
   */
  async getRewardById(req, res) {
    try {
      const { id } = req.params;
      
      const rewardId = parseInt(id);
      if (isNaN(rewardId) || rewardId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'ID de recompensa inválido'
        });
      }
      
      console.log(`🔍 Obteniendo recompensa ${rewardId}`);
      
      const reward = await Reward.getById(rewardId);
      if (!reward) {
        return res.status(404).json({
          success: false,
          error: 'Recompensa no encontrada'
        });
      }
      
      // Si hay usuario autenticado, verificar si puede canjear
      let canRedeem = null;
      if (req.user?.id) {
        canRedeem = await Reward.canUserRedeem(req.user.id, rewardId);
      }
      
      res.json({
        success: true,
        data: {
          ...reward,
          canRedeem
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener recompensa:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener la recompensa'
      });
    }
  }

  /**
   * Obtener categorías de recompensas
   */
  async getCategories(req, res) {
    try {
      console.log('📂 Obteniendo categorías de recompensas');
      
      const categories = await Reward.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('❌ Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener las categorías'
      });
    }
  }

  // ==================== CANJE DE RECOMPENSAS ====================

  /**
   * Canjear una recompensa
   */
  async redeemReward(req, res) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      
      const rewardId = parseInt(id);
      if (isNaN(rewardId) || rewardId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'ID de recompensa inválido'
        });
      }
      
      console.log(`🎁 Usuario ${userId} canjeando recompensa ${rewardId}`);
      
      // Verificar si el usuario puede canjear
      const canRedeem = await Reward.canUserRedeem(userId, rewardId);
      if (!canRedeem.canRedeem) {
        return res.status(400).json({
          success: false,
          message: canRedeem.reason,
          data: {
            pointsNeeded: canRedeem.pointsNeeded || null
          }
        });
      }
      
      const reward = canRedeem.reward;
      
      // Crear el canje
      const redemption = await Redemption.create(userId, rewardId, reward.puntos_requeridos);
      
      console.log(`✅ Canje exitoso - Código: ${redemption.codigo_canje}`);
      
      res.json({
        success: true,
        message: '¡Recompensa canjeada exitosamente!',
        data: {
          codigo_canje: redemption.codigo_canje,
          puntos_usados: redemption.puntos_usados,
          fecha_expiracion: redemption.fecha_expiracion,
          recompensa: {
            nombre: reward.nombre,
            descripcion: reward.descripcion,
            tipo: reward.tipo,
            valor: reward.valor
          }
        }
      });
    } catch (error) {
      console.error('❌ Error al canjear recompensa:', error);
      
      if (error.message.includes('Puntos insuficientes') || 
          error.message.includes('Sin stock') ||
          error.message.includes('Límite')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al canjear recompensa',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  // ==================== HISTORIAL DE CANJES ====================

  /**
   * Obtener canjes del usuario
   */
  async getUserRedemptions(req, res) {
    try {
      const userId = req.user?.id;
      const { incluir_usados = 'true' } = req.query;
      
      console.log(`📋 Obteniendo canjes del usuario ${userId}`);
      
      const includeUsed = incluir_usados.toLowerCase() === 'true';
      const redemptions = await Redemption.getUserRedemptions(userId, includeUsed);
      
      res.json({
        success: true,
        data: redemptions,
        total: redemptions.length
      });
    } catch (error) {
      console.error('❌ Error al obtener canjes del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener canjes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  /**
   * Validar código de canje
   */
  async validateRedemptionCode(req, res) {
    try {
      const { codigo } = req.params;
      
      if (!codigo || codigo.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Código de canje requerido'
        });
      }
      
      console.log(`🔍 Validando código de canje: ${codigo}`);
      
      const validation = await Redemption.validateCode(codigo.trim().toUpperCase());
      
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('❌ Error al validar código:', error);
      res.status(500).json({
        success: false,
        message: 'Error al validar código',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  /**
   * Marcar código como usado (para administradores o sistema)
   */
  async markCodeAsUsed(req, res) {
    try {
      const { codigo } = req.params;
      
      if (!codigo || codigo.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Código de canje requerido'
        });
      }
      
      console.log(`✅ Marcando código como usado: ${codigo}`);
      
      const result = await Redemption.markAsUsed(codigo.trim().toUpperCase());
      
      res.json({
        success: true,
        message: 'Código marcado como utilizado',
        data: {
          codigo_canje: result.codigo_canje,
          fecha_uso: result.fecha_uso
        }
      });
    } catch (error) {
      console.error('❌ Error al marcar código como usado:', error);
      
      if (error.message.includes('no encontrado') || error.message.includes('utilizado')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al procesar código',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  // ==================== ADMINISTRACIÓN DE RECOMPENSAS ====================

  /**
   * Crear nueva recompensa (ADMIN)
   */
  async createReward(req, res) {
    try {
      const rewardData = req.body;
      
      // Validaciones básicas
      if (!rewardData.nombre || !rewardData.descripcion || !rewardData.categoria) {
        return res.status(400).json({
          success: false,
          error: 'Nombre, descripción y categoría son obligatorios'
        });
      }
      
      if (!rewardData.puntos_requeridos || rewardData.puntos_requeridos < 1) {
        return res.status(400).json({
          success: false,
          error: 'Puntos requeridos debe ser mayor a 0'
        });
      }
      
      console.log(`📝 Admin ${req.user.id} creando nueva recompensa: ${rewardData.nombre}`);
      
      const newReward = await Reward.create(rewardData);
      
      res.status(201).json({
        success: true,
        data: newReward,
        message: 'Recompensa creada exitosamente'
      });
    } catch (error) {
      console.error('❌ Error al crear recompensa:', error);
      res.status(500).json({
        success: false,
        error: 'Error al crear la recompensa'
      });
    }
  }

  /**
   * Actualizar recompensa (ADMIN)
   */
  async updateReward(req, res) {
    try {
      const { id } = req.params;
      const rewardData = req.body;
      
      const rewardId = parseInt(id);
      if (isNaN(rewardId) || rewardId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'ID de recompensa inválido'
        });
      }
      
      console.log(`📝 Admin ${req.user.id} actualizando recompensa ${rewardId}`);
      
      const updatedReward = await Reward.update(rewardId, rewardData);
      
      if (!updatedReward) {
        return res.status(404).json({
          success: false,
          error: 'Recompensa no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: updatedReward,
        message: 'Recompensa actualizada exitosamente'
      });
    } catch (error) {
      console.error('❌ Error al actualizar recompensa:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar la recompensa'
      });
    }
  }

  /**
   * Eliminar recompensa (ADMIN)
   */
  async deleteReward(req, res) {
    try {
      const { id } = req.params;
      
      const rewardId = parseInt(id);
      if (isNaN(rewardId) || rewardId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'ID de recompensa inválido'
        });
      }
      
      console.log(`🗑️ Admin ${req.user.id} eliminando recompensa ${rewardId}`);
      
      const deletedReward = await Reward.delete(rewardId);
      
      if (!deletedReward) {
        return res.status(404).json({
          success: false,
          error: 'Recompensa no encontrada'
        });
      }
      
      res.json({
        success: true,
        message: `Recompensa "${deletedReward.nombre}" eliminada exitosamente`,
        data: deletedReward
      });
    } catch (error) {
      console.error('❌ Error al eliminar recompensa:', error);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar la recompensa'
      });
    }
  }

  // ==================== ESTADÍSTICAS Y REPORTES (ADMIN) ====================

  /**
   * Obtener estadísticas de recompensas (ADMIN)
   */
  async getRewardsStats(req, res) {
    try {
      console.log('📊 Obteniendo estadísticas de recompensas');
      
      const [rewardsStats, redemptionsStats] = await Promise.all([
        Reward.getStats(),
        Redemption.getStats()
      ]);
      
      res.json({
        success: true,
        data: {
          recompensas: rewardsStats,
          canjes: redemptionsStats
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  /**
   * Obtener todos los canjes para administración (ADMIN)
   */
  async getAllRedemptions(req, res) {
    try {
      const { page = 1, limit = 20, recompensa_id } = req.query;
      
      console.log('📋 Admin obteniendo todos los canjes');
      
      let redemptions;
      if (recompensa_id) {
        redemptions = await Redemption.getByReward(parseInt(recompensa_id));
      } else {
        // Por ahora devolver todos, luego implementar paginación
        redemptions = await Redemption.getStats();
      }
      
      res.json({
        success: true,
        data: redemptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: Array.isArray(redemptions) ? redemptions.length : 0
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener canjes para admin:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener canjes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  /**
   * Verificar disponibilidad de puntos para canje
   */
  async checkRedeemAvailability(req, res) {
    try {
      const userId = req.user?.id;
      const { puntos } = req.query;
      
      if (!puntos || isNaN(puntos)) {
        return res.status(400).json({
          success: false,
          message: 'Cantidad de puntos requerida'
        });
      }
      
      const puntosRequeridos = parseInt(puntos);
      const userPoints = await this.pointsModel.getUserPoints(userId);
      const canUse = await this.pointsModel.canUsePoints(userId, puntosRequeridos);
      
      res.json({
        success: true,
        data: {
          puede_canjear: canUse,
          puntos_disponibles: userPoints.puntos_actuales || 0,
          puntos_requeridos: puntosRequeridos,
          diferencia: (userPoints.puntos_actuales || 0) - puntosRequeridos
        }
      });
    } catch (error) {
      console.error('❌ Error al verificar disponibilidad de canje:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar disponibilidad',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }
}

module.exports = new RewardsController();