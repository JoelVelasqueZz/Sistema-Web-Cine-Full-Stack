import { Injectable } from '@angular/core';
import { PointsService } from './points.service';

@Injectable({
  providedIn: 'root'
})
export class RewardsService {

  private recompensas: Recompensa[] = [
    // 🎬 RECOMPENSAS DE PELÍCULAS
    {
      id: 1,
      nombre: 'Entrada Gratis',
      descripcion: 'Una entrada gratuita para cualquier función estándar',
      categoria: 'peliculas',
      puntosRequeridos: 850,
      imagen: 'assets/recompensas/gratis.png',
      disponible: true,
      stock: 50,
      tipo: 'descuento',
      valor: 8.50,
      limitePorUsuario: 5,
      validezDias: 30,
      terminos: [
        'Válido para funciones en horarios estándar (lunes a jueves)',
        'No aplicable para estrenos o funciones VIP',
        'Sujeto a disponibilidad de asientos'
      ]
    },
    {
      id: 2,
      nombre: 'Entrada VIP Gratis',
      descripcion: 'Una entrada gratuita para sala VIP con asientos premium',
      categoria: 'peliculas',
      puntosRequeridos: 1200,
      imagen: 'assets/recompensas/vip.png',
      disponible: true,
      stock: 20,
      tipo: 'descuento',
      valor: 12.00,
      limitePorUsuario: 2,
      validezDias: 30,
      terminos: [
        'Válido para salas VIP con asientos reclinables',
        'Incluye servicio premium',
        'Sujeto a disponibilidad'
      ]
    },
    {
      id: 3,
      nombre: 'Descuento 50% Entrada',
      descripcion: '50% de descuento en tu próxima entrada',
      categoria: 'peliculas',
      puntosRequeridos: 425,
      imagen: 'assets/recompensas/50.png',
      disponible: true,
      stock: 100,
      tipo: 'descuento',
      valor: 4.25,
      limitePorUsuario: 10,
      validezDias: 15,
      terminos: [
        'Aplicable a cualquier función',
        'No acumulable con otras promociones',
        'Válido por 15 días desde el canje'
      ]
    },

    // 🍿 RECOMPENSAS DEL BAR
    {
      id: 4,
      nombre: 'Combo Popcorn + Bebida',
      descripcion: 'Popcorn grande + bebida mediana gratis',
      categoria: 'bar',
      puntosRequeridos: 650,
      imagen: 'assets/recompensas/popcorn.png',
      disponible: true,
      stock: 75,
      tipo: 'producto',
      valor: 6.50,
      limitePorUsuario: 8,
      validezDias: 20,
      terminos: [
        'Combo incluye popcorn grande y bebida mediana',
        'Válido en todas las funciones',
        'Recoger en el mostrador del bar'
      ]
    },
    {
      id: 5,
      nombre: 'Dulces Premium',
      descripcion: 'Selección de dulces premium (3 productos)',
      categoria: 'bar',
      puntosRequeridos: 450,
      imagen: 'assets/recompensas/dulces.png',
      disponible: true,
      stock: 60,
      tipo: 'producto',
      valor: 4.50,
      limitePorUsuario: 6,
      validezDias: 25,
      terminos: [
        'Incluye 3 productos de dulcería premium',
        'Selección disponible según stock',
        'Válido en horario de funciones'
      ]
    },
    {
      id: 6,
      nombre: 'Descuento 25% Bar',
      descripcion: '25% de descuento en productos del bar',
      categoria: 'bar',
      puntosRequeridos: 300,
      imagen: 'assets/recompensas/25.png',
      disponible: true,
      stock: 150,
      tipo: 'descuento',
      valor: 0, // Porcentaje
      limitePorUsuario: 15,
      validezDias: 10,
      terminos: [
        'Descuento aplicable en todos los productos del bar',
        'Máximo descuento de $15 por compra',
        'No válido para combos ya promocionales'
      ]
    },

    // 🎁 RECOMPENSAS ESPECIALES
    {
      id: 7,
      nombre: 'Experiencia Completa',
      descripcion: '2 entradas + combo grande + descuento estacionamiento',
      categoria: 'especial',
      puntosRequeridos: 2000,
      imagen: 'assets/recompensas/completa.png',
      disponible: true,
      stock: 15,
      tipo: 'paquete',
      valor: 25.00,
      limitePorUsuario: 1,
      validezDias: 45,
      terminos: [
        'Incluye 2 entradas estándar para cualquier función',
        'Combo grande: 2 popcorns + 2 bebidas + dulces',
        'Descuento 50% en estacionamiento',
        'Válido por 45 días desde el canje'
      ]
    },
    {
      id: 8,
      nombre: 'Entrada Estreno',
      descripcion: 'Entrada para función de estreno + poster exclusivo',
      categoria: 'especial',
      puntosRequeridos: 1500,
      imagen: 'assets/recompensas/estreno.png',
      disponible: true,
      stock: 30,
      tipo: 'experiencia',
      valor: 15.00,
      limitePorUsuario: 2,
      validezDias: 60,
      terminos: [
        'Válido para funciones de estreno los primeros 3 días',
        'Incluye poster exclusivo de la película',
        'Sujeto a disponibilidad de funciones de estreno'
      ]
    },

    // 💳 DESCUENTOS Y CÓDIGOS
    {
      id: 9,
      nombre: 'Código 15% Descuento',
      descripcion: 'Código de 15% descuento para tu próxima compra online',
      categoria: 'descuentos',
      puntosRequeridos: 200,
      imagen: 'assets/recompensas/15.png',
      disponible: true,
      stock: 200,
      tipo: 'codigo',
      valor: 0, // Porcentaje
      limitePorUsuario: 20,
      validezDias: 7,
      terminos: [
        'Código válido solo para compras online',
        'Aplicable a entradas y productos del bar',
        'Máximo descuento de $10 por compra'
      ]
    },
    {
      id: 10,
      nombre: 'Puntos Bonus x2',
      descripcion: 'Duplica los puntos en tu próxima compra',
      categoria: 'especial',
      puntosRequeridos: 500,
      imagen: 'assets/recompensas/bonus.png',
      disponible: true,
      stock: 80,
      tipo: 'bonus',
      valor: 0,
      limitePorUsuario: 3,
      validezDias: 14,
      terminos: [
        'Duplica los puntos ganados en tu próxima compra',
        'Válido para compras de mínimo $10',
        'Aplicable una sola vez por usuario'
      ]
    }
  ];

  constructor(private pointsService: PointsService) {
    console.log('Servicio de recompensas inicializado!');
  }

  // ==================== OBTENER RECOMPENSAS ====================

  /**
   * Obtener todas las recompensas disponibles
   */
  getAllRewards(): Recompensa[] {
    return this.recompensas.filter(r => r.disponible && r.stock > 0);
  }

  /**
   * Obtener recompensas por categoría
   */
  getRewardsByCategory(categoria: string): Recompensa[] {
    return this.getAllRewards().filter(r => r.categoria === categoria);
  }

  /**
   * Obtener una recompensa específica
   */
  getReward(rewardId: number): Recompensa | null {
    return this.recompensas.find(r => r.id === rewardId) || null;
  }

  /**
   * Obtener categorías disponibles
   */
  getCategories(): string[] {
    const categories = [...new Set(this.recompensas.map(r => r.categoria))];
    return categories;
  }

  /**
   * Obtener recompensas que el usuario puede canjear
   */
  getAffordableRewards(userId: number): Recompensa[] {
    const userPoints = this.pointsService.getUserPoints(userId);
    return this.getAllRewards().filter(r => r.puntosRequeridos <= userPoints);
  }

  // ==================== CANJE DE RECOMPENSAS ====================

  /**
   * Canjear una recompensa
   */
  redeemReward(userId: number, rewardId: number): RedeemResult {
    try {
      const recompensa = this.getReward(rewardId);
      
      if (!recompensa) {
        return {
          success: false,
          message: 'Recompensa no encontrada',
          canjeId: ''
        };
      }

      // Validaciones
      const validation = this.validateRedemption(userId, recompensa);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message,
          canjeId: ''
        };
      }

      // Usar puntos
      const pointsUsed = this.pointsService.usePoints(
        userId,
        recompensa.puntosRequeridos,
        `Canje: ${recompensa.nombre}`,
        { rewardId: rewardId, rewardName: recompensa.nombre }
      );

      if (!pointsUsed) {
        return {
          success: false,
          message: 'Error al procesar los puntos',
          canjeId: ''
        };
      }

      // Reducir stock
      recompensa.stock--;

      // Registrar canje
      const canje = this.createRedemptionRecord(userId, recompensa);
      
      return {
        success: true,
        message: `¡Recompensa "${recompensa.nombre}" canjeada exitosamente!`,
        canjeId: canje.id,
        canje: canje
      };

    } catch (error) {
      console.error('Error al canjear recompensa:', error);
      return {
        success: false,
        message: 'Error interno al procesar el canje',
        canjeId: ''
      };
    }
  }

  /**
   * Validar si el usuario puede canjear una recompensa
   */
  validateRedemption(userId: number, recompensa: Recompensa): ValidationResult {
    // Verificar si está disponible
    if (!recompensa.disponible) {
      return { valid: false, message: 'Esta recompensa no está disponible' };
    }

    // Verificar stock
    if (recompensa.stock <= 0) {
      return { valid: false, message: 'Esta recompensa está agotada' };
    }

    // Verificar puntos suficientes
    const userPoints = this.pointsService.getUserPoints(userId);
    if (userPoints < recompensa.puntosRequeridos) {
      const faltantes = recompensa.puntosRequeridos - userPoints;
      return { 
        valid: false, 
        message: `Te faltan ${faltantes} puntos para canjear esta recompensa` 
      };
    }

    // Verificar límite por usuario
    const userRedemptions = this.getUserRedemptions(userId);
    const sameRewardCount = userRedemptions.filter(r => r.recompensaId === recompensa.id).length;
    
    if (sameRewardCount >= recompensa.limitePorUsuario) {
      return { 
        valid: false, 
        message: `Has alcanzado el límite de ${recompensa.limitePorUsuario} canjes para esta recompensa` 
      };
    }

    return { valid: true, message: 'Validación exitosa' };
  }

  // ==================== HISTORIAL DE CANJES ====================

  /**
   * Obtener canjes del usuario
   */
  getUserRedemptions(userId: number): CanjeRecompensa[] {
    const redemptionsKey = `user_redemptions_${userId}`;
    const redemptions = localStorage.getItem(redemptionsKey);
    
    if (redemptions) {
      try {
        return JSON.parse(redemptions).sort((a: CanjeRecompensa, b: CanjeRecompensa) => 
          new Date(b.fechaCanje).getTime() - new Date(a.fechaCanje).getTime()
        );
      } catch (error) {
        console.error('Error al obtener canjes:', error);
        return [];
      }
    }
    return [];
  }

  /**
   * Obtener canjes activos (no expirados ni usados)
   */
  getActiveRedemptions(userId: number): CanjeRecompensa[] {
    const redemptions = this.getUserRedemptions(userId);
    const now = new Date();
    
    return redemptions.filter(canje => {
      const expiry = new Date(canje.fechaExpiracion);
      return !canje.usado && expiry > now;
    });
  }

  /**
   * Marcar canje como usado
   */
  markRedemptionAsUsed(userId: number, canjeId: string): boolean {
    try {
      const redemptions = this.getUserRedemptions(userId);
      const canje = redemptions.find(r => r.id === canjeId);
      
      if (canje && !canje.usado) {
        canje.usado = true;
        canje.fechaUso = new Date().toISOString();
        
        const redemptionsKey = `user_redemptions_${userId}`;
        localStorage.setItem(redemptionsKey, JSON.stringify(redemptions));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al marcar canje como usado:', error);
      return false;
    }
  }

  // ==================== MÉTODOS AUXILIARES PRIVADOS ====================

  private createRedemptionRecord(userId: number, recompensa: Recompensa): CanjeRecompensa {
    const now = new Date();
    const expiry = new Date(now.getTime() + (recompensa.validezDias * 24 * 60 * 60 * 1000));
    
    const canje: CanjeRecompensa = {
      id: this.generateCanjeId(),
      recompensaId: recompensa.id,
      nombreRecompensa: recompensa.nombre,
      descripcion: recompensa.descripcion,
      tipo: recompensa.tipo,
      valor: recompensa.valor,
      codigo: this.generateRedemptionCode(),
      fechaCanje: now.toISOString(),
      fechaExpiracion: expiry.toISOString(),
      usado: false,
      puntosUsados: recompensa.puntosRequeridos
    };

    // Guardar canje
    const redemptionsKey = `user_redemptions_${userId}`;
    const redemptions = this.getUserRedemptions(userId);
    redemptions.unshift(canje);
    
    // Mantener solo los últimos 50 canjes
    const limitedRedemptions = redemptions.slice(0, 50);
    localStorage.setItem(redemptionsKey, JSON.stringify(limitedRedemptions));
    
    return canje;
  }

  private generateCanjeId(): string {
    return 'CANJE-' + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ==================== MÉTODOS ADICIONALES ====================

  /**
   * Buscar recompensas por nombre
   */
  searchRewards(query: string): Recompensa[] {
    const searchTerm = query.toLowerCase();
    return this.getAllRewards().filter(r => 
      r.nombre.toLowerCase().includes(searchTerm) ||
      r.descripcion.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Obtener recompensas ordenadas por puntos
   */
  getRewardsSortedByPoints(ascending: boolean = true): Recompensa[] {
    const rewards = this.getAllRewards();
    return rewards.sort((a, b) => 
      ascending ? a.puntosRequeridos - b.puntosRequeridos : b.puntosRequeridos - a.puntosRequeridos
    );
  }

  /**
   * Obtener estadísticas de canjes del usuario
   */
  getUserRedemptionStats(userId: number): RedemptionStats {
    const redemptions = this.getUserRedemptions(userId);
    const active = this.getActiveRedemptions(userId);
    
    const totalPuntosUsados = redemptions.reduce((sum, r) => sum + r.puntosUsados, 0);
    const totalCanjes = redemptions.length;
    const canjesUsados = redemptions.filter(r => r.usado).length;
    
    // Recompensas más canjeadas
    const recompensasFrecuentes: { [key: string]: number } = {};
    redemptions.forEach(r => {
      recompensasFrecuentes[r.nombreRecompensa] = (recompensasFrecuentes[r.nombreRecompensa] || 0) + 1;
    });
    
    const recompensaFavorita = Object.keys(recompensasFrecuentes).reduce((a, b) => 
      recompensasFrecuentes[a] > recompensasFrecuentes[b] ? a : b, 'Ninguna'
    );

    return {
      totalCanjes,
      canjesActivos: active.length,
      canjesUsados,
      totalPuntosUsados,
      recompensaFavorita,
      ultimoCanje: redemptions.length > 0 ? redemptions[0].fechaCanje : null
    };
  }

  /**
   * Verificar si una recompensa está disponible para el usuario
   */
  isRewardAvailableForUser(userId: number, rewardId: number): boolean {
    const recompensa = this.getReward(rewardId);
    if (!recompensa) return false;
    
    const validation = this.validateRedemption(userId, recompensa);
    return validation.valid;
  }

  /**
   * Obtener próximas recompensas que el usuario puede alcanzar
   */
  getUpcomingRewards(userId: number, limit: number = 5): Recompensa[] {
    const userPoints = this.pointsService.getUserPoints(userId);
    
    return this.getAllRewards()
      .filter(r => r.puntosRequeridos > userPoints)
      .sort((a, b) => a.puntosRequeridos - b.puntosRequeridos)
      .slice(0, limit);
  }

  /**
   * Calcular tiempo estimado para alcanzar una recompensa
   */
  getTimeToReward(userId: number, rewardId: number): string {
    const recompensa = this.getReward(rewardId);
    if (!recompensa) return 'Recompensa no encontrada';
    
    const userPoints = this.pointsService.getUserPoints(userId);
    const puntosNecesarios = recompensa.puntosRequeridos - userPoints;
    
    if (puntosNecesarios <= 0) return 'Ya puedes canjear esta recompensa';
    
    // Estimar basado en promedio de puntos por compra ($15 promedio = 15 puntos)
    const puntosPromedioPorCompra = 15;
    const comprasNecesarias = Math.ceil(puntosNecesarios / puntosPromedioPorCompra);
    
    if (comprasNecesarias === 1) return '1 compra más';
    return `${comprasNecesarias} compras más`;
  }
}

// ==================== INTERFACES ====================

export interface Recompensa {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: 'peliculas' | 'bar' | 'especial' | 'descuentos';
  puntosRequeridos: number;
  imagen: string;
  disponible: boolean;
  stock: number;
  tipo: 'descuento' | 'producto' | 'paquete' | 'experiencia' | 'codigo' | 'bonus';
  valor: number; // Valor en dólares o porcentaje según el tipo
  limitePorUsuario: number;
  validezDias: number;
  terminos: string[];
}

export interface CanjeRecompensa {
  id: string;
  recompensaId: number;
  nombreRecompensa: string;
  descripcion: string;
  tipo: string;
  valor: number;
  codigo: string;
  fechaCanje: string;
  fechaExpiracion: string;
  fechaUso?: string;
  usado: boolean;
  puntosUsados: number;
}

export interface RedeemResult {
  success: boolean;
  message: string;
  canjeId: string;
  canje?: CanjeRecompensa;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
}

export interface RedemptionStats {
  totalCanjes: number;
  canjesActivos: number;
  canjesUsados: number;
  totalPuntosUsados: number;
  recompensaFavorita: string;
  ultimoCanje: string | null;
}