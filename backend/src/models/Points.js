const pool = require('../config/database');

class Points {
  constructor() {
    this.pool = pool;
    this.PUNTOS_POR_DOLAR = 1;
    this.PUNTOS_BIENVENIDA = 50;
    this.PUNTOS_REFERIDO = 100;
    this.PUNTOS_NUEVO_USUARIO = 25;
  }

  async getUserPoints(userId) {
    try {
      const query = `
        SELECT puntos_actuales, total_ganados, total_usados, fecha_actualizacion
        FROM puntos_usuario 
        WHERE usuario_id = $1
      `;
      
      const result = await this.pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return await this.createUserPointsRecord(userId);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error al obtener puntos del usuario:', error);
      throw error;
    }
  }

  async createUserPointsRecord(userId) {
    try {
      const query = `
        INSERT INTO puntos_usuario (usuario_id, puntos_actuales, total_ganados, total_usados)
        VALUES ($1, 0, 0, 0)
        ON CONFLICT (usuario_id) DO NOTHING
        RETURNING puntos_actuales, total_ganados, total_usados, fecha_actualizacion
      `;
      
      const result = await this.pool.query(query, [userId]);
      
      return result.rows.length > 0 ? result.rows[0] : {
        puntos_actuales: 0,
        total_ganados: 0,
        total_usados: 0,
        fecha_actualizacion: new Date()
      };
    } catch (error) {
      console.error('Error al crear registro de puntos:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS FALTANTES ====================

  async getUserPointsStats(userId) {
    try {
      const points = await this.getUserPoints(userId);
      
      return {
        puntos_actuales: points.puntos_actuales || 0,
        total_ganados: points.total_ganados || 0,
        total_usados: points.total_usados || 0,
        valor_en_dolares: this.getPointsValue(points.puntos_actuales || 0),
        ultima_actividad: points.fecha_actualizacion
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de puntos:', error);
      throw error;
    }
  }

  async getPointsHistory(userId, limit = 20, offset = 0) {
    try {
      // Por ahora devolver array vacío, luego implementaremos la tabla
      return [];
    } catch (error) {
      console.error('Error al obtener historial de puntos:', error);
      throw error;
    }
  }

  async createReferralCode(userId) {
    try {
      // Generar código simple por ahora
      const codigo = `REF${userId}${Date.now().toString().slice(-4)}`;
      
      return {
        success: true,
        codigo: codigo,
        message: 'Código creado exitosamente'
      };
    } catch (error) {
      console.error('Error al crear código de referido:', error);
      throw error;
    }
  }

  async applyReferralCode(newUserId, referralCode) {
    try {
      // Simulado por ahora
      return {
        success: true,
        puntos_referidor: this.PUNTOS_REFERIDO,
        puntos_nuevo_usuario: this.PUNTOS_NUEVO_USUARIO,
        message: 'Código de referido aplicado exitosamente'
      };
    } catch (error) {
      console.error('Error al aplicar código de referido:', error);
      throw error;
    }
  }

  async getUserReferrals(userId) {
    try {
      // Por ahora devolver array vacío
      return [];
    } catch (error) {
      console.error('Error al obtener referidos:', error);
      throw error;
    }
  }

  async giveWelcomePoints(userId) {
    try {
      // Verificar si ya recibió puntos de bienvenida (simulado)
      return {
        success: true,
        puntos_agregados: this.PUNTOS_BIENVENIDA,
        puntos_nuevos: this.PUNTOS_BIENVENIDA,
        message: 'Puntos de bienvenida otorgados'
      };
    } catch (error) {
      console.error('Error al dar puntos de bienvenida:', error);
      throw error;
    }
  }

  async addPoints(userId, puntos, concepto, metadata = null) {
    try {
      // Simulado por ahora
      return {
        success: true,
        puntos_agregados: puntos,
        puntos_anteriores: 0,
        puntos_nuevos: puntos,
        transaccion_id: Date.now()
      };
    } catch (error) {
      console.error('Error al agregar puntos:', error);
      throw error;
    }
  }

  async usePoints(userId, puntos, concepto, metadata = null) {
    try {
      const userPoints = await this.getUserPoints(userId);
      
      if ((userPoints.puntos_actuales || 0) < puntos) {
        throw new Error(`Puntos insuficientes. Tienes ${userPoints.puntos_actuales}, necesitas ${puntos}`);
      }
      
      return {
        success: true,
        puntos_usados: puntos,
        puntos_anteriores: userPoints.puntos_actuales,
        puntos_nuevos: (userPoints.puntos_actuales || 0) - puntos,
        transaccion_id: Date.now()
      };
    } catch (error) {
      console.error('Error al usar puntos:', error);
      throw error;
    }
  }

  async canUsePoints(userId, puntos) {
    try {
      const userPoints = await this.getUserPoints(userId);
      return (userPoints.puntos_actuales || 0) >= puntos;
    } catch (error) {
      console.error('Error al verificar puntos disponibles:', error);
      return false;
    }
  }

  async getPointsAnalytics(startDate = null, endDate = null) {
    try {
      // Por ahora devolver datos simulados
      return [];
    } catch (error) {
      console.error('Error al obtener analytics de puntos:', error);
      throw error;
    }
  }

  async getTopUsersPoints(limit = 10) {
    try {
      // Por ahora devolver array vacío
      return [];
    } catch (error) {
      console.error('Error al obtener top usuarios por puntos:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS EXISTENTES ====================

  getPointsValue(puntos) {
    return puntos / this.PUNTOS_POR_DOLAR;
  }

  async getSystemConfig() {
    return {
      puntos_por_dolar: this.PUNTOS_POR_DOLAR,
      puntos_bienvenida: this.PUNTOS_BIENVENIDA,
      puntos_referido: this.PUNTOS_REFERIDO,
      puntos_nuevo_usuario: this.PUNTOS_NUEVO_USUARIO
    };
  }

  async processPointsForPurchase(userId, totalCompra, orderDetails = null) {
  try {
    const puntosGanados = Math.floor(totalCompra * this.PUNTOS_POR_DOLAR);
    
    if (puntosGanados > 0) {
      console.log(`Otorgando ${puntosGanados} puntos al usuario ${userId}`);
      
      // 🔧 IMPLEMENTAR ACTUALIZACIÓN REAL EN BD:
      const updateQuery = `
        INSERT INTO puntos_usuario (usuario_id, puntos_actuales, total_ganados, total_usados)
        VALUES ($1, $2, $2, 0)
        ON CONFLICT (usuario_id) 
        DO UPDATE SET 
          puntos_actuales = puntos_usuario.puntos_actuales + $2,
          total_ganados = puntos_usuario.total_ganados + $2,
          fecha_actualizacion = CURRENT_TIMESTAMP
        RETURNING puntos_actuales, total_ganados
      `;
      
      const result = await this.pool.query(updateQuery, [userId, puntosGanados]);
      
      return {
        success: true,
        puntos_agregados: puntosGanados,
        puntos_nuevos: result.rows[0].puntos_actuales,
        total_ganados: result.rows[0].total_ganados
      };
    }
    
    return {
      success: true,
      puntos_agregados: 0,
      message: 'No se generaron puntos para esta compra'
    };
    
  } catch (error) {
    console.error('Error al procesar puntos por compra:', error);
    throw error;
  }
}
}

module.exports = Points;