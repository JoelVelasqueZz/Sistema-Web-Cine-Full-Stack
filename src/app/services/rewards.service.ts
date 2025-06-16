import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { PointsService } from './points.service';

@Injectable({
  providedIn: 'root'
})
export class RewardsService {

  private readonly API_URL = 'http://localhost:3000/api/rewards';
  
  // Cache local para mejor performance
  private rewardsCache = new BehaviorSubject<Recompensa[]>([]);
  public rewards$ = this.rewardsCache.asObservable();
  
  private userRedemptionsCache = new BehaviorSubject<CanjeRecompensa[]>([]);
  public userRedemptions$ = this.userRedemptionsCache.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private pointsService: PointsService
  ) {
    console.log('🏆 RewardsService conectado a API:', this.API_URL);
    this.initializeService();
  }

  // ==================== INICIALIZACIÓN ====================

  private initializeService(): void {
    // Cargar recompensas si el usuario está autenticado
    if (this.authService.isLoggedIn()) {
      this.loadAllRewards();
      this.loadUserRedemptions();
    }

    // Suscribirse a cambios de autenticación
    this.authService.authStatus$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.loadAllRewards();
        this.loadUserRedemptions();
      } else {
        this.rewardsCache.next([]);
        this.userRedemptionsCache.next([]);
      }
    });
  }

  // ==================== OBTENER RECOMPENSAS (API) ====================

  /**
   * Cargar todas las recompensas desde la API
   */
  loadAllRewards(): void {
    this.getAllRewardsFromAPI().subscribe({
      next: (rewards) => {
        this.rewardsCache.next(rewards);
        console.log(`✅ ${rewards.length} recompensas cargadas desde API`);
      },
      error: (error) => {
        console.error('❌ Error cargando recompensas:', error);
        // Fallback a datos mock si la API falla
        this.rewardsCache.next(this.getMockRewards());
      }
    });
  }

  /**
   * Obtener todas las recompensas desde la API
   */
  private getAllRewardsFromAPI(): Observable<Recompensa[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<Recompensa[]>>(`${this.API_URL}`, { headers }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.map(reward => this.transformApiReward(reward));
        }
        return [];
      }),
      catchError(error => {
        console.error('❌ Error en API de recompensas:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener todas las recompensas (desde cache o API)
   */
  getAllRewards(): Recompensa[] {
    return this.rewardsCache.value.filter(r => r.disponible && r.stock > 0);
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
    return this.rewardsCache.value.find(r => r.id === rewardId) || null;
  }

  /**
   * Obtener categorías disponibles desde la API
   */
  getCategories(): Observable<string[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<string[]>>(`${this.API_URL}/categories`, { headers }).pipe(
      map(response => response.success ? response.data : ['peliculas', 'bar', 'especial', 'descuentos']),
      catchError(error => {
        console.error('❌ Error obteniendo categorías:', error);
        return of(['peliculas', 'bar', 'especial', 'descuentos']);
      })
    );
  }

  /**
   * Buscar recompensas
   */
  searchRewards(query: string): Recompensa[] {
    const searchTerm = query.toLowerCase();
    return this.getAllRewards().filter(r => 
      r.nombre.toLowerCase().includes(searchTerm) ||
      r.descripcion.toLowerCase().includes(searchTerm)
    );
  }

  // ==================== CANJE DE RECOMPENSAS (API) ====================

  /**
   * Canjear una recompensa mediante la API
   */
  redeemReward(rewardId: number): Observable<RedeemResult> {
    if (!this.authService.isLoggedIn()) {
      return of({
        success: false,
        message: 'Debes iniciar sesión para canjear recompensas',
        canjeId: ''
      });
    }

    const headers = this.getAuthHeaders();
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/redeem/${rewardId}`, {}, { headers }).pipe(
      map(response => {
        if (response.success && response.data) {
          // Actualizar cache local
          this.loadAllRewards();
          this.loadUserRedemptions();
          
          // Refrescar puntos del usuario
          this.pointsService.refreshPoints();
          
          return {
            success: true,
            message: response.message || 'Recompensa canjeada exitosamente',
            canjeId: response.data.canje?.id || '',
            canje: response.data.canje ? this.transformApiRedemption(response.data.canje) : undefined
          };
        }
        
        return {
          success: false,
          message: response.message || 'Error al canjear recompensa',
          canjeId: ''
        };
      }),
      catchError(error => {
        console.error('❌ Error canjeando recompensa:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error al procesar el canje',
          canjeId: ''
        });
      })
    );
  }

  /**
   * Validar si el usuario puede canjear una recompensa
   */
  validateRedemption(recompensa: Recompensa): Observable<ValidationResult> {
    if (!this.authService.isLoggedIn()) {
      return of({ valid: false, message: 'Debes iniciar sesión' });
    }

    // Verificaciones básicas
    if (!recompensa.disponible) {
      return of({ valid: false, message: 'Esta recompensa no está disponible' });
    }

    if (recompensa.stock <= 0) {
      return of({ valid: false, message: 'Esta recompensa está agotada' });
    }

    // Verificar puntos con el servicio de puntos
    return this.pointsService.getUserPoints().pipe(
      map(response => {
        const userPoints = response.puntosActuales;
        
        if (userPoints < recompensa.puntosRequeridos) {
          const faltantes = recompensa.puntosRequeridos - userPoints;
          return { 
            valid: false, 
            message: `Te faltan ${faltantes} puntos para canjear esta recompensa` 
          };
        }

        // Verificar límite por usuario
        const userRedemptions = this.userRedemptionsCache.value;
        const sameRewardCount = userRedemptions.filter(r => r.recompensaId === recompensa.id).length;
        
        if (sameRewardCount >= recompensa.limitePorUsuario) {
          return { 
            valid: false, 
            message: `Has alcanzado el límite de ${recompensa.limitePorUsuario} canjes para esta recompensa` 
          };
        }

        return { valid: true, message: 'Validación exitosa' };
      }),
      catchError(error => {
        console.error('❌ Error en validación:', error);
        return of({ valid: false, message: 'Error al validar puntos' });
      })
    );
  }

  // ==================== HISTORIAL DE CANJES (API) ====================

  /**
   * Cargar canjes del usuario desde la API
   */
  loadUserRedemptions(): void {
    this.getUserRedemptionsFromAPI().subscribe({
      next: (redemptions) => {
        this.userRedemptionsCache.next(redemptions);
        console.log(`✅ ${redemptions.length} canjes del usuario cargados`);
      },
      error: (error) => {
        console.error('❌ Error cargando canjes del usuario:', error);
        this.userRedemptionsCache.next([]);
      }
    });
  }

  /**
   * Obtener canjes del usuario desde la API
   */
  private getUserRedemptionsFromAPI(): Observable<CanjeRecompensa[]> {
    if (!this.authService.isLoggedIn()) {
      return of([]);
    }

    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/my/redemptions`, { headers }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.map(redemption => this.transformApiRedemption(redemption));
        }
        return [];
      }),
      catchError(error => {
        console.error('❌ Error obteniendo canjes del usuario:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener canjes del usuario (desde cache)
   */
  getUserRedemptions(): CanjeRecompensa[] {
    return this.userRedemptionsCache.value;
  }

  /**
   * Obtener canjes activos (no expirados ni usados)
   */
  getActiveRedemptions(): CanjeRecompensa[] {
    const redemptions = this.userRedemptionsCache.value;
    const now = new Date();
    
    return redemptions.filter(canje => {
      const expiry = new Date(canje.fechaExpiracion);
      return !canje.usado && expiry > now;
    });
  }

  /**
   * Marcar canje como usado mediante la API
   */
  markRedemptionAsUsed(canjeId: string): Observable<boolean> {
    if (!this.authService.isLoggedIn()) {
      return of(false);
    }

    const headers = this.getAuthHeaders();
    
    return this.http.patch<ApiResponse<any>>(`${this.API_URL}/use/${canjeId}`, {}, { headers }).pipe(
      map(response => {
        if (response.success) {
          // Actualizar cache local
          this.loadUserRedemptions();
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error marcando canje como usado:', error);
        return of(false);
      })
    );
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Obtener headers de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Transformar recompensa de API a formato frontend
   */
  private transformApiReward(apiReward: any): Recompensa {
    return {
      id: apiReward.id,
      nombre: apiReward.nombre,
      descripcion: apiReward.descripcion,
      categoria: apiReward.categoria,
      puntosRequeridos: apiReward.puntos_requeridos,
      imagen: apiReward.imagen || 'assets/recompensas/default.png',
      disponible: apiReward.disponible,
      stock: apiReward.stock,
      tipo: apiReward.tipo,
      valor: parseFloat(apiReward.valor) || 0,
      limitePorUsuario: apiReward.limite_por_usuario || 1,
      validezDias: apiReward.validez_dias || 30,
      terminos: apiReward.terminos || []
    };
  }

  /**
   * Transformar canje de API a formato frontend
   */
  private transformApiRedemption(apiRedemption: any): CanjeRecompensa {
    return {
      id: apiRedemption.id,
      recompensaId: apiRedemption.recompensa_id,
      nombreRecompensa: apiRedemption.recompensa?.nombre || apiRedemption.nombre_recompensa || 'Recompensa desconocida',
      descripcion: apiRedemption.recompensa?.descripcion || apiRedemption.descripcion || '',
      tipo: apiRedemption.recompensa?.tipo || apiRedemption.tipo || 'producto',
      valor: parseFloat(apiRedemption.recompensa?.valor || apiRedemption.valor) || 0,
      codigo: apiRedemption.codigo_canje,
      fechaCanje: apiRedemption.fecha_canje,
      fechaExpiracion: apiRedemption.fecha_expiracion,
      fechaUso: apiRedemption.fecha_uso,
      usado: apiRedemption.usado,
      puntosUsados: apiRedemption.puntos_usados
    };
  }

  /**
   * Datos mock como fallback si la API falla
   */
  private getMockRewards(): Recompensa[] {
    return [
      {
        id: 1,
        nombre: 'Entrada Gratis',
        descripcion: 'Una entrada gratuita para cualquier función estándar',
        categoria: 'peliculas',
        puntosRequeridos: 850,
        imagen: 'assets/recompensas/entrada-gratis.png',
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
        nombre: 'Combo Popcorn + Bebida',
        descripcion: 'Popcorn grande + bebida mediana gratis',
        categoria: 'bar',
        puntosRequeridos: 650,
        imagen: 'assets/recompensas/combo-popcorn.png',
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
      }
    ];
  }

  // ==================== MÉTODOS PARA HELPERS ====================

  /**
   * Formatear fecha para mostrar
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Verificar si un canje está expirado
   */
  isExpired(fechaExpiracion: string): boolean {
    return new Date(fechaExpiracion) <= new Date();
  }

  /**
   * Verificar si un canje está activo
   */
  isActive(canje: CanjeRecompensa): boolean {
    return !canje.usado && !this.isExpired(canje.fechaExpiracion);
  }

  /**
   * Obtener recompensas que el usuario puede canjear
   */
  getAffordableRewards(): Observable<Recompensa[]> {
    return this.pointsService.getUserPoints().pipe(
      map(response => {
        const userPoints = response.puntosActuales;
        return this.getAllRewards().filter(r => r.puntosRequeridos <= userPoints);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo recompensas disponibles:', error);
        return of([]);
      })
    );
  }

  /**
   * Refrescar cache de recompensas
   */
  refreshRewards(): void {
    this.loadAllRewards();
    this.loadUserRedemptions();
  }

  /**
   * Verificar si el servicio está disponible
   */
  isServiceAvailable(): Observable<boolean> {
    return this.http.get<any>(`${this.API_URL}/health`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}

// ==================== INTERFACES ====================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: any;
}

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
  valor: number;
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