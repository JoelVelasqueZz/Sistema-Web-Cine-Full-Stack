import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PointsService {

  // Configuración del sistema de puntos
  private readonly PUNTOS_POR_DOLAR = 1;
  private readonly PUNTOS_BIENVENIDA = 50;
  private readonly PUNTOS_REFERIDO = 100; // Para quien refiere
  private readonly PUNTOS_NUEVO_USUARIO = 25; // Para el nuevo usuario

  constructor(private authService: AuthService) {
    console.log('Servicio de puntos inicializado!');
  }

  // ==================== GESTIÓN DE PUNTOS PRINCIPALES ====================

  /**
   * Obtener puntos actuales del usuario
   */
  getUserPoints(userId: number): number {
    const pointsKey = `user_points_${userId}`;
    const points = localStorage.getItem(pointsKey);
    return points ? parseInt(points) : 0;
  }

  /**
   * Agregar puntos al usuario
   */
  addPoints(userId: number, puntos: number, concepto: string, metadata?: any): boolean {
    try {
      const puntosActuales = this.getUserPoints(userId);
      const nuevosPuntos = puntosActuales + puntos;
      
      // Actualizar puntos
      const pointsKey = `user_points_${userId}`;
      localStorage.setItem(pointsKey, nuevosPuntos.toString());
      
      // Registrar transacción
      this.addPointsTransaction(userId, {
        tipo: 'ganancia',
        puntos: puntos,
        concepto: concepto,
        fecha: new Date().toISOString(),
        puntosAnteriores: puntosActuales,
        puntosNuevos: nuevosPuntos,
        metadata: metadata
      });

      console.log(`+${puntos} puntos agregados a usuario ${userId}: ${concepto}`);
      return true;
    } catch (error) {
      console.error('Error al agregar puntos:', error);
      return false;
    }
  }

  /**
   * Usar/canjear puntos del usuario
   */
  usePoints(userId: number, puntos: number, concepto: string, metadata?: any): boolean {
    try {
      const puntosActuales = this.getUserPoints(userId);
      
      if (puntosActuales < puntos) {
        console.log('Puntos insuficientes');
        return false;
      }
      
      const nuevosPuntos = puntosActuales - puntos;
      
      // Actualizar puntos
      const pointsKey = `user_points_${userId}`;
      localStorage.setItem(pointsKey, nuevosPuntos.toString());
      
      // Registrar transacción
      this.addPointsTransaction(userId, {
        tipo: 'uso',
        puntos: puntos,
        concepto: concepto,
        fecha: new Date().toISOString(),
        puntosAnteriores: puntosActuales,
        puntosNuevos: nuevosPuntos,
        metadata: metadata
      });

      console.log(`-${puntos} puntos usados por usuario ${userId}: ${concepto}`);
      return true;
    } catch (error) {
      console.error('Error al usar puntos:', error);
      return false;
    }
  }

  // ==================== SISTEMA DE REFERIDOS ====================

  /**
   * Generar código de referido para el usuario
   */
  generateReferralCode(userId: number): string {
    const user = this.authService.findUserById(userId);
    if (!user) return '';
    
    // Generar código único basado en nombre y ID
    const nombre = user.nombre.replace(/\s+/g, '').toUpperCase();
    const codigo = `${nombre.substring(0, 3)}${userId}${Date.now().toString().slice(-3)}`;
    
    // Guardar código del usuario
    const codesKey = `referral_codes`;
    const codes = this.getReferralCodes();
    codes[codigo] = userId;
    localStorage.setItem(codesKey, JSON.stringify(codes));
    
    // Guardar código personal del usuario
    localStorage.setItem(`user_referral_code_${userId}`, codigo);
    
    return codigo;
  }

  /**
   * Obtener código de referido del usuario
   */
  getUserReferralCode(userId: number): string {
    let codigo = localStorage.getItem(`user_referral_code_${userId}`);
    if (!codigo) {
      codigo = this.generateReferralCode(userId);
    }
    return codigo;
  }

  /**
   * Validar y aplicar código de referido
   */
  applyReferralCode(newUserId: number, referralCode: string): boolean {
    try {
      const codes = this.getReferralCodes();
      const referrerId = codes[referralCode.toUpperCase()];
      
      if (!referrerId) {
        console.log('Código de referido inválido');
        return false;
      }
      
      if (referrerId === newUserId) {
        console.log('No puedes usar tu propio código de referido');
        return false;
      }
      
      // Verificar que el nuevo usuario no haya usado ya un código
      const hasUsedCode = localStorage.getItem(`used_referral_${newUserId}`);
      if (hasUsedCode) {
        console.log('El usuario ya usó un código de referido');
        return false;
      }
      
      // Otorgar puntos al referidor
      this.addPoints(
        referrerId, 
        this.PUNTOS_REFERIDO, 
        'Referido exitoso',
        { referredUserId: newUserId, referralCode }
      );
      
      // Otorgar puntos al nuevo usuario
      this.addPoints(
        newUserId, 
        this.PUNTOS_NUEVO_USUARIO, 
        'Bienvenida por código de referido',
        { referrerId, referralCode }
      );
      
      // Marcar código como usado
      localStorage.setItem(`used_referral_${newUserId}`, referralCode);
      
      // Registrar referido
      this.addReferralRecord(referrerId, newUserId, referralCode);
      
      console.log(`Código de referido aplicado: ${referralCode}`);
      return true;
    } catch (error) {
      console.error('Error al aplicar código de referido:', error);
      return false;
    }
  }

  /**
   * Obtener usuarios referidos por un usuario
   */
  getUserReferrals(userId: number): ReferralRecord[] {
    const referralsKey = `user_referrals_${userId}`;
    const referrals = localStorage.getItem(referralsKey);
    
    if (referrals) {
      try {
        return JSON.parse(referrals);
      } catch (error) {
        console.error('Error al obtener referidos:', error);
        return [];
      }
    }
    return [];
  }

  // ==================== PUNTOS POR COMPRAS ====================

  /**
   * Calcular y otorgar puntos por compra
   */
  processPointsForPurchase(userId: number, totalCompra: number, items: any[]): number {
    const puntosGanados = Math.floor(totalCompra * this.PUNTOS_POR_DOLAR);
    
    if (puntosGanados > 0) {
      this.addPoints(
        userId,
        puntosGanados,
        'Compra realizada',
        { 
          totalCompra, 
          items: items.map(item => ({
            tipo: item.tipo,
            nombre: item.tipo === 'pelicula' ? item.pelicula?.titulo : item.barProduct?.nombre,
            cantidad: item.cantidad,
            precio: item.subtotal
          }))
        }
      );
    }
    
    return puntosGanados;
  }

  /**
   * Dar puntos de bienvenida a nuevo usuario
   */
  giveWelcomePoints(userId: number): boolean {
    const welcomeKey = `welcome_points_${userId}`;
    const alreadyGiven = localStorage.getItem(welcomeKey);
    
    if (!alreadyGiven) {
      const success = this.addPoints(
        userId,
        this.PUNTOS_BIENVENIDA,
        'Puntos de bienvenida',
        { isWelcomeBonus: true }
      );
      
      if (success) {
        localStorage.setItem(welcomeKey, 'true');
      }
      
      return success;
    }
    
    return false;
  }

  // ==================== HISTORIAL DE TRANSACCIONES ====================

  /**
   * Obtener historial de transacciones de puntos
   */
  getPointsHistory(userId: number): PointsTransaction[] {
    const historyKey = `points_history_${userId}`;
    const history = localStorage.getItem(historyKey);
    
    if (history) {
      try {
        return JSON.parse(history).sort((a: PointsTransaction, b: PointsTransaction) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      } catch (error) {
        console.error('Error al obtener historial de puntos:', error);
        return [];
      }
    }
    return [];
  }

  /**
   * Obtener estadísticas de puntos del usuario
   */
  getUserPointsStats(userId: number): PointsStats {
    const history = this.getPointsHistory(userId);
    const referrals = this.getUserReferrals(userId);
    
    const totalGanados = history
      .filter(t => t.tipo === 'ganancia')
      .reduce((sum, t) => sum + t.puntos, 0);
      
    const totalUsados = history
      .filter(t => t.tipo === 'uso')
      .reduce((sum, t) => sum + t.puntos, 0);
    
    const puntosActuales = this.getUserPoints(userId);
    
    return {
      puntosActuales,
      totalGanados,
      totalUsados,
      totalReferidos: referrals.length,
      ultimaActividad: history.length > 0 ? history[0].fecha : null
    };
  }

  // ==================== MÉTODOS AUXILIARES PRIVADOS ====================

  private addPointsTransaction(userId: number, transaction: PointsTransaction): void {
    const historyKey = `points_history_${userId}`;
    const history = this.getPointsHistory(userId);
    
    history.unshift(transaction);
    
    // Mantener solo los últimos 100 registros
    const limitedHistory = history.slice(0, 100);
    
    localStorage.setItem(historyKey, JSON.stringify(limitedHistory));
  }

  private getReferralCodes(): { [code: string]: number } {
    const codesKey = `referral_codes`;
    const codes = localStorage.getItem(codesKey);
    
    if (codes) {
      try {
        return JSON.parse(codes);
      } catch (error) {
        console.error('Error al obtener códigos de referido:', error);
        return {};
      }
    }
    return {};
  }

  private addReferralRecord(referrerId: number, referredUserId: number, code: string): void {
    const referralsKey = `user_referrals_${referrerId}`;
    const referrals = this.getUserReferrals(referrerId);
    
    const referredUser = this.authService.findUserById(referredUserId);
    
    const newReferral: ReferralRecord = {
      userId: referredUserId,
      userName: referredUser?.nombre || 'Usuario',
      userEmail: referredUser?.email || '',
      fecha: new Date().toISOString(),
      codigo: code,
      puntosGanados: this.PUNTOS_REFERIDO
    };
    
    referrals.push(newReferral);
    localStorage.setItem(referralsKey, JSON.stringify(referrals));
  }

  // ==================== MÉTODOS PÚBLICOS ADICIONALES ====================

  /**
   * Verificar si el usuario puede usar cierta cantidad de puntos
   */
  canUsePoints(userId: number, puntos: number): boolean {
    return this.getUserPoints(userId) >= puntos;
  }

  /**
   * Obtener valor en dólares de los puntos
   */
  getPointsValue(puntos: number): number {
    return puntos / this.PUNTOS_POR_DOLAR;
  }

  /**
   * Obtener configuración del sistema de puntos
   */
  getPointsConfig() {
    return {
      puntosPorDolar: this.PUNTOS_POR_DOLAR,
      puntosBienvenida: this.PUNTOS_BIENVENIDA,
      puntosReferido: this.PUNTOS_REFERIDO,
      puntosNuevoUsuario: this.PUNTOS_NUEVO_USUARIO
    };
  }
}

// ==================== INTERFACES ====================

export interface PointsTransaction {
  tipo: 'ganancia' | 'uso';
  puntos: number;
  concepto: string;
  fecha: string;
  puntosAnteriores: number;
  puntosNuevos: number;
  metadata?: any;
}

export interface ReferralRecord {
  userId: number;
  userName: string;
  userEmail: string;
  fecha: string;
  codigo: string;
  puntosGanados: number;
}

export interface PointsStats {
  puntosActuales: number;
  totalGanados: number;
  totalUsados: number;
  totalReferidos: number;
  ultimaActividad: string | null;
}