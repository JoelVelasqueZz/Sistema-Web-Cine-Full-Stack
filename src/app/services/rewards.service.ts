import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

// ==================== INTERFACES ====================
export interface Reward {
  id?: number;
  nombre: string;
  descripcion: string;
  categoria: 'peliculas' | 'bar' | 'especial' | 'descuentos';
  tipo: 'descuento' | 'producto' | 'paquete' | 'experiencia' | 'codigo' | 'bonus';
  puntos_requeridos: number;
  valor?: number;
  stock?: number | null;
  limite_por_usuario?: number;
  validez_dias?: number;
  imagen_url?: string;
  disponible: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface RewardsStats {
  totalRecompensas: number;
  recompensasActivas: number;
  totalCanjes: number;
  puntosCanjeados: number;
  categoriaPopular: string;
  recompensaPopular: string;
}

export interface RedemptionCode {
  id: number;
  codigo: string;
  recompensa: Reward;
  usuario_id: number;
  fecha_canje: string;
  fecha_vencimiento: string;
  usado: boolean;
  fecha_uso?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: any;
}

@Injectable({
  providedIn: 'root'
})
export class RewardsService {

  private readonly API_URL = `http://localhost:3000/api/rewards`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('🆕 RewardsService inicializado');
  }

  // ==================== MÉTODOS DE AUTENTICACIÓN ====================

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    
    if (!token) {
      console.warn('⚠️ No hay token de autenticación para RewardsService');
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== MÉTODOS PÚBLICOS DE RECOMPENSAS ====================

  /**
   * Obtener todas las recompensas disponibles
   */
  getAllRewards(): Observable<Reward[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<Reward[]>>(`${this.API_URL}`, { headers }).pipe(
      map(response => response.success ? response.data : []),
      catchError(error => {
        console.error('❌ Error al obtener recompensas:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener recompensa por ID
   */
  getRewardById(id: number): Observable<Reward | null> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<Reward>>(`${this.API_URL}/${id}`, { headers }).pipe(
      map(response => response.success ? response.data : null),
      catchError(error => {
        console.error('❌ Error al obtener recompensa:', error);
        return of(null);
      })
    );
  }

  /**
   * Obtener categorías de recompensas
   */
  getCategories(): Observable<string[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<string[]>>(`${this.API_URL}/categories`, { headers }).pipe(
      map(response => response.success ? response.data : ['peliculas', 'bar', 'especial', 'descuentos']),
      catchError(error => {
        console.error('❌ Error al obtener categorías:', error);
        return of(['peliculas', 'bar', 'especial', 'descuentos']);
      })
    );
  }

  /**
   * Obtener estadísticas de recompensas
   */
  getRewardsStats(): Observable<RewardsStats> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<RewardsStats>>(`${this.API_URL}/admin/stats`, { headers }).pipe(
      map(response => response.success ? response.data : this.getDefaultStats()),
      catchError(error => {
        console.error('❌ Error al obtener estadísticas:', error);
        return of(this.getDefaultStats());
      })
    );
  }

  // ==================== MÉTODOS DE CANJE ====================

  /**
   * Canjear una recompensa
   */
  redeemReward(rewardId: number): Observable<{ success: boolean; codigo?: string; message: string }> {
    const headers = this.getAuthHeaders();
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/redeem/${rewardId}`, {}, { headers }).pipe(
      map(response => ({
        success: response.success,
        codigo: response.data?.codigo,
        message: response.message || (response.success ? 'Recompensa canjeada exitosamente' : 'Error al canjear recompensa')
      })),
      catchError(error => {
        console.error('❌ Error al canjear recompensa:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error al canjear recompensa'
        });
      })
    );
  }

  /**
   * Obtener canjes del usuario
   */
  getUserRedemptions(incluirUsados: boolean = true): Observable<RedemptionCode[]> {
    const headers = this.getAuthHeaders();
    const params = { incluir_usados: incluirUsados.toString() };
    
    return this.http.get<ApiResponse<RedemptionCode[]>>(`${this.API_URL}/my/redemptions`, { headers, params }).pipe(
      map(response => response.success ? response.data : []),
      catchError(error => {
        console.error('❌ Error al obtener canjes:', error);
        return of([]);
      })
    );
  }

  /**
   * Validar código de canje
   */
  validateRedemptionCode(codigo: string): Observable<{ valid: boolean; redemption?: RedemptionCode; message: string }> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/validate/${codigo}`, { headers }).pipe(
      map(response => ({
        valid: response.success,
        redemption: response.data?.redemption,
        message: response.message || (response.success ? 'Código válido' : 'Código inválido')
      })),
      catchError(error => {
        console.error('❌ Error al validar código:', error);
        return of({
          valid: false,
          message: error.error?.message || 'Error al validar código'
        });
      })
    );
  }

  /**
   * Marcar código como usado
   */
  markCodeAsUsed(codigo: string): Observable<{ success: boolean; message: string }> {
    const headers = this.getAuthHeaders();
    
    return this.http.patch<ApiResponse<any>>(`${this.API_URL}/use/${codigo}`, {}, { headers }).pipe(
      map(response => ({
        success: response.success,
        message: response.message || (response.success ? 'Código marcado como usado' : 'Error al usar código')
      })),
      catchError(error => {
        console.error('❌ Error al marcar código como usado:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error al usar código'
        });
      })
    );
  }

  /**
   * Verificar disponibilidad de puntos para canje
   */
  checkRedeemAvailability(puntos: number): Observable<{ available: boolean; message: string }> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/check/${puntos}`, { headers }).pipe(
      map(response => ({
        available: response.success && response.data?.available,
        message: response.message || (response.success ? 'Puntos suficientes' : 'Puntos insuficientes')
      })),
      catchError(error => {
        console.error('❌ Error al verificar disponibilidad:', error);
        return of({
          available: false,
          message: error.error?.message || 'Error al verificar puntos'
        });
      })
    );
  }

  // ==================== MÉTODOS DE ADMINISTRACIÓN ====================

  /**
   * Crear nueva recompensa (ADMIN)
   */
  createReward(rewardData: Partial<Reward>): Observable<boolean> {
    if (!this.authService.isAdmin()) {
      console.error('❌ Usuario no tiene permisos de administrador');
      return of(false);
    }

    const headers = this.getAuthHeaders();
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}`, rewardData, { headers }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('❌ Error al crear recompensa:', error);
        return of(false);
      })
    );
  }

  /**
   * Actualizar recompensa (ADMIN)
   */
  updateReward(id: number, rewardData: Partial<Reward>): Observable<boolean> {
    if (!this.authService.isAdmin()) {
      console.error('❌ Usuario no tiene permisos de administrador');
      return of(false);
    }

    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/${id}`, rewardData, { headers }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('❌ Error al actualizar recompensa:', error);
        return of(false);
      })
    );
  }

  /**
   * Eliminar recompensa (ADMIN)
   */
  deleteReward(id: number): Observable<boolean> {
    if (!this.authService.isAdmin()) {
      console.error('❌ Usuario no tiene permisos de administrador');
      return of(false);
    }

    const headers = this.getAuthHeaders();
    
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`, { headers }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('❌ Error al eliminar recompensa:', error);
        return of(false);
      })
    );
  }

  /**
   * Obtener todos los canjes para administración (ADMIN)
   */
  getAllRedemptions(page: number = 1, limit: number = 50, recompensaId?: number): Observable<RedemptionCode[]> {
    if (!this.authService.isAdmin()) {
      console.error('❌ Usuario no tiene permisos de administrador');
      return of([]);
    }

    const headers = this.getAuthHeaders();
    const params: any = { page: page.toString(), limit: limit.toString() };
    
    if (recompensaId) {
      params.recompensa_id = recompensaId.toString();
    }
    
    return this.http.get<ApiResponse<RedemptionCode[]>>(`${this.API_URL}/admin/redemptions`, { headers, params }).pipe(
      map(response => response.success ? response.data : []),
      catchError(error => {
        console.error('❌ Error al obtener canjes:', error);
        return of([]);
      })
    );
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Verificar si el servicio está disponible
   */
  isServiceAvailable(): Observable<boolean> {
    return this.http.get<any>(`${this.API_URL}/health`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Formatear categoría para mostrar
   */
  formatCategory(categoria: string): string {
    const categorias: { [key: string]: string } = {
      'peliculas': 'Películas',
      'bar': 'Bar & Comida',
      'especial': 'Especiales',
      'descuentos': 'Descuentos'
    };
    
    return categorias[categoria] || categoria;
  }

  /**
   * Formatear tipo para mostrar
   */
  formatType(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'descuento': 'Descuento %',
      'producto': 'Producto Gratis',
      'paquete': 'Paquete Especial',
      'experiencia': 'Experiencia VIP',
      'codigo': 'Código Promocional',
      'bonus': 'Bonus Extra'
    };
    
    return tipos[tipo] || tipo;
  }

  /**
   * Obtener ícono de categoría
   */
  getCategoryIcon(categoria: string): string {
    const iconos: { [key: string]: string } = {
      'peliculas': 'fas fa-film',
      'bar': 'fas fa-utensils',
      'especial': 'fas fa-star',
      'descuentos': 'fas fa-percent'
    };
    
    return iconos[categoria] || 'fas fa-tag';
  }

  /**
   * Obtener ícono de tipo
   */
  getTypeIcon(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'descuento': 'fas fa-percent',
      'producto': 'fas fa-gift',
      'paquete': 'fas fa-box',
      'experiencia': 'fas fa-crown',
      'codigo': 'fas fa-ticket-alt',
      'bonus': 'fas fa-plus-circle'
    };
    
    return iconos[tipo] || 'fas fa-question';
  }

  /**
   * Verificar si una recompensa está disponible
   */
  isRewardAvailable(reward: Reward): boolean {
    if (!reward.disponible) {
      return false;
    }
    
    if (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Calcular valor en dólares de puntos
   */
  getPointsValue(puntos: number): number {
    // 100 puntos = $1
    return puntos / 100;
  }

  /**
   * Obtener estadísticas por defecto
   */
  private getDefaultStats(): RewardsStats {
    return {
      totalRecompensas: 0,
      recompensasActivas: 0,
      totalCanjes: 0,
      puntosCanjeados: 0,
      categoriaPopular: 'N/A',
      recompensaPopular: 'N/A'
    };
  }

  /**
   * Filtrar recompensas por categoría
   */
  filterByCategory(rewards: Reward[], categoria: string): Reward[] {
    if (!categoria) {
      return rewards;
    }
    return rewards.filter(reward => reward.categoria === categoria);
  }

  /**
   * Filtrar recompensas por disponibilidad
   */
  filterByAvailability(rewards: Reward[], onlyAvailable: boolean = true): Reward[] {
    if (!onlyAvailable) {
      return rewards;
    }
    return rewards.filter(reward => this.isRewardAvailable(reward));
  }

  /**
   * Ordenar recompensas por puntos requeridos
   */
  sortByPoints(rewards: Reward[], ascending: boolean = true): Reward[] {
    return [...rewards].sort((a, b) => {
      return ascending ? 
        a.puntos_requeridos - b.puntos_requeridos : 
        b.puntos_requeridos - a.puntos_requeridos;
    });
  }

  /**
   * Buscar recompensas por término
   */
  searchRewards(rewards: Reward[], searchTerm: string): Reward[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return rewards;
    }

    const term = searchTerm.toLowerCase().trim();
    return rewards.filter(reward =>
      reward.nombre.toLowerCase().includes(term) ||
      reward.descripcion.toLowerCase().includes(term) ||
      reward.categoria.toLowerCase().includes(term) ||
      reward.tipo.toLowerCase().includes(term)
    );
  }

  /**
   * Validar datos de recompensa antes de enviar
   */
  validateRewardData(reward: Partial<Reward>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validaciones básicas
    if (!reward.nombre || reward.nombre.trim().length < 3) {
      errors.push('El nombre debe tener al menos 3 caracteres');
    }

    if (!reward.descripcion || reward.descripcion.trim().length < 10) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    }

    if (!reward.categoria) {
      errors.push('Debe seleccionar una categoría');
    }

    if (!reward.tipo) {
      errors.push('Debe seleccionar un tipo');
    }

    if (!reward.puntos_requeridos || reward.puntos_requeridos <= 0) {
      errors.push('Los puntos requeridos deben ser mayor a 0');
    }

    // Validaciones específicas por tipo
    if (['descuento', 'producto', 'paquete'].includes(reward.tipo || '')) {
      if (!reward.valor || reward.valor <= 0) {
        errors.push('El valor debe ser mayor a 0 para este tipo de recompensa');
      }
    }

    if (['producto', 'paquete', 'experiencia'].includes(reward.tipo || '')) {
      if (reward.stock !== null && reward.stock !== undefined && reward.stock < 0) {
        errors.push('El stock no puede ser negativo');
      }
    }

    if (reward.limite_por_usuario && reward.limite_por_usuario <= 0) {
      errors.push('El límite por usuario debe ser mayor a 0');
    }

    if (reward.validez_dias && reward.validez_dias <= 0) {
      errors.push('La validez en días debe ser mayor a 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generar código de canje único
   */
  generateRedemptionCode(rewardId: number, userId: number): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `RW${rewardId}U${userId}${timestamp}${random}`.toUpperCase();
  }

  /**
   * Formatear fecha de vencimiento
   */
  formatExpirationDate(fecha: string): string {
    const date = new Date(fecha);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Vencido';
    } else if (diffDays === 0) {
      return 'Vence hoy';
    } else if (diffDays === 1) {
      return 'Vence mañana';
    } else if (diffDays <= 7) {
      return `Vence en ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES');
    }
  }

  /**
   * Verificar si un código está vencido
   */
  isCodeExpired(fechaVencimiento: string): boolean {
    return new Date(fechaVencimiento) < new Date();
  }

  /**
   * Obtener recompensas por categoría para métricas
   */
  getRewardsByCategory(rewards: Reward[]): { [key: string]: number } {
    const categoryCounts: { [key: string]: number } = {};
    
    rewards.forEach(reward => {
      categoryCounts[reward.categoria] = (categoryCounts[reward.categoria] || 0) + 1;
    });
    
    return categoryCounts;
  }

  /**
   * Calcular estadísticas locales de recompensas
   */
  calculateLocalStats(rewards: Reward[]): RewardsStats {
    const activas = rewards.filter(r => r.disponible).length;
    const totalPuntos = rewards.reduce((sum, r) => sum + r.puntos_requeridos, 0);
    const categoryCounts = this.getRewardsByCategory(rewards);
    const categoriaPopular = Object.keys(categoryCounts).reduce((a, b) => 
      categoryCounts[a] > categoryCounts[b] ? a : b, 'N/A'
    );

    return {
      totalRecompensas: rewards.length,
      recompensasActivas: activas,
      totalCanjes: 0, // Este dato viene del backend
      puntosCanjeados: 0, // Este dato viene del backend
      categoriaPopular,
      recompensaPopular: rewards.length > 0 ? rewards[0].nombre : 'N/A'
    };
  }
}