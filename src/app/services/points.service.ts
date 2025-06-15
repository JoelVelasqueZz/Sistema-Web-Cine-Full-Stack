import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PointsService {

  private readonly API_URL = `http://localhost:3000/api/points`;
  private userPointsSubject = new BehaviorSubject<number>(0);
  public userPoints$ = this.userPointsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('🆕 PointsService actualizado con API backend');
    this.loadUserPoints();
  }

  // ==================== MÉTODOS PRINCIPALES DE PUNTOS ====================

  /**
   * Obtener puntos actuales del usuario desde la API
   */
  getUserPoints(): Observable<UserPointsResponse> {
    return this.http.get<ApiResponse<UserPointsData>>(`${this.API_URL}`).pipe(
      map(response => {
        if (response.success && response.data) {
          this.userPointsSubject.next(response.data.puntos_actuales || 0);
          return {
            puntosActuales: response.data.puntos_actuales || 0,
            totalGanados: response.data.total_ganados || 0,
            totalUsados: response.data.total_usados || 0
          };
        }
        return { puntosActuales: 0, totalGanados: 0, totalUsados: 0 };
      }),
      catchError(error => {
        console.error('❌ Error al obtener puntos del usuario:', error);
        return of({ puntosActuales: 0, totalGanados: 0, totalUsados: 0 });
      })
    );
  }

  /**
   * Obtener estadísticas completas de puntos
   */
  getUserPointsStats(): Observable<PointsStats> {
    return this.http.get<ApiResponse<PointsStats>>(`${this.API_URL}/stats`).pipe(
      map(response => response.success ? response.data : this.getDefaultStats()),
      catchError(error => {
        console.error('❌ Error al obtener estadísticas de puntos:', error);
        return of(this.getDefaultStats());
      })
    );
  }

  /**
   * Obtener historial de transacciones de puntos
   */
  getPointsHistory(page: number = 1, limit: number = 20): Observable<PointsTransaction[]> {
    const params = { page: page.toString(), limit: limit.toString() };
    
    return this.http.get<ApiResponse<PointsTransaction[]>>(`${this.API_URL}/history`, { params }).pipe(
      map(response => response.success ? response.data : []),
      catchError(error => {
        console.error('❌ Error al obtener historial de puntos:', error);
        return of([]);
      })
    );
  }

  /**
   * Usar puntos del usuario
   */
  usePoints(puntos: number, concepto: string, metadata?: any): Observable<boolean> {
    const payload = { puntos, concepto, metadata };
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/use`, payload).pipe(
      map(response => {
        if (response.success) {
          this.loadUserPoints(); // Recargar puntos después de usar
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al usar puntos:', error);
        return of(false);
      })
    );
  }

  /**
   * Verificar si el usuario puede usar cierta cantidad de puntos
   */
  canUsePoints(puntos: number): Observable<boolean> {
    const params = { puntos: puntos.toString() };
    
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/check`, { params }).pipe(
      map(response => response.success && response.data.puede_usar),
      catchError(error => {
        console.error('❌ Error al verificar puntos:', error);
        return of(false);
      })
    );
  }

  // ==================== SISTEMA DE REFERIDOS ====================

  /**
   * Obtener código de referido del usuario
   */
  getReferralCode(): Observable<string> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/referral/code`).pipe(
      map(response => response.success ? response.data.codigo : ''),
      catchError(error => {
        console.error('❌ Error al obtener código de referido:', error);
        return of('');
      })
    );
  }

  /**
   * Crear código de referido para el usuario
   */
  createReferralCode(): Observable<string> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/referral/create`, {}).pipe(
      map(response => response.success ? response.data.codigo : ''),
      catchError(error => {
        console.error('❌ Error al crear código de referido:', error);
        return of('');
      })
    );
  }

  /**
   * Aplicar código de referido
   */
  applyReferralCode(codigo: string): Observable<ReferralResult> {
    const payload = { codigo };
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/referral/apply`, payload).pipe(
      map(response => {
        if (response.success) {
          this.loadUserPoints(); // Recargar puntos después de aplicar código
          return {
            success: true,
            message: response.message || 'Código aplicado exitosamente',
            puntosGanados: response.data?.puntos_ganados || 0
          };
        }
        return {
          success: false,
          message: response.message || 'Error al aplicar código',
          puntosGanados: 0
        };
      }),
      catchError(error => {
        console.error('❌ Error al aplicar código de referido:', error);
        return of({
          success: false,
          message: error.error?.message || 'Error al aplicar código de referido',
          puntosGanados: 0
        });
      })
    );
  }

  /**
   * Obtener lista de usuarios referidos
   */
  getUserReferrals(): Observable<ReferralRecord[]> {
    return this.http.get<ApiResponse<ReferralRecord[]>>(`${this.API_URL}/referral/list`).pipe(
      map(response => response.success ? response.data : []),
      catchError(error => {
        console.error('❌ Error al obtener referidos:', error);
        return of([]);
      })
    );
  }

  // ==================== PUNTOS DE BIENVENIDA ====================

  /**
   * Otorgar puntos de bienvenida
   */
  giveWelcomePoints(): Observable<boolean> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/welcome`, {}).pipe(
      map(response => {
        if (response.success) {
          this.loadUserPoints(); // Recargar puntos después de otorgar bienvenida
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al otorgar puntos de bienvenida:', error);
        return of(false);
      })
    );
  }

  // ==================== CONFIGURACIÓN DEL SISTEMA ====================

  /**
   * Obtener configuración del sistema de puntos
   */
  getSystemConfig(): Observable<PointsConfig> {
    return this.http.get<ApiResponse<PointsConfig>>(`${this.API_URL}/config`).pipe(
      map(response => response.success ? response.data : this.getDefaultConfig()),
      catchError(error => {
        console.error('❌ Error al obtener configuración:', error);
        return of(this.getDefaultConfig());
      })
    );
  }

  /**
   * Calcular valor en dólares de una cantidad de puntos
   */
  getPointsValue(puntos: number): Observable<number> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/value/${puntos}`).pipe(
      map(response => response.success ? response.data.valor_dolares : 0),
      catchError(error => {
        console.error('❌ Error al calcular valor de puntos:', error);
        return of(0);
      })
    );
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Cargar puntos del usuario al inicializar
   */
  private loadUserPoints(): void {
    this.getUserPoints().subscribe();
  }

  /**
   * Obtener estadísticas por defecto
   */
  private getDefaultStats(): PointsStats {
  return {
    puntosActuales: 0,
    totalGanados: 0,
    totalUsados: 0,
    valorEnDolares: 0,
    ultimaActividad: null,
    totalReferidos: 0 // 🆕 AGREGAR ESTA LÍNEA
  };
}

  /**
   * Obtener configuración por defecto
   */
  private getDefaultConfig(): PointsConfig {
    return {
      puntos_por_dolar: 1,
      puntos_bienvenida: 50,
      puntos_referido: 100,
      puntos_nuevo_usuario: 25
    };
  }

  // ==================== MÉTODOS LEGACY (PARA COMPATIBILIDAD) ====================

  /**
   * Métodos legacy para mantener compatibilidad con código existente
   */
  getUserPoints_Legacy(userId: number): number {
    // Retorna el valor actual del BehaviorSubject
    return this.userPointsSubject.value;
  }

  getPointsConfig_Legacy() {
    return {
      puntosPorDolar: 1,
      puntosBienvenida: 50,
      puntosReferido: 100,
      puntosNuevoUsuario: 25
    };
  }

  getUserReferralCode_Legacy(userId: number): string {
    // Para mantener compatibilidad, pero se debe migrar a getReferralCode()
    return 'REF' + userId + Date.now().toString().slice(-4);
  }

  processPointsForPurchase_Legacy(userId: number, totalCompra: number, items: any[]): number {
    // Este método ahora se maneja en el backend durante el checkout
    return Math.floor(totalCompra * 1); // 1 punto por dólar
  }

  getPointsValue_Legacy(puntos: number): number {
    return puntos / 1; // 1 punto = $1
  }

  getUserPointsStats_Legacy(userId: number): PointsStats {
    return this.getDefaultStats();
  }
}

// ==================== INTERFACES ====================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: any;
}

export interface UserPointsData {
  puntos_actuales: number;
  total_ganados: number;
  total_usados: number;
}

export interface UserPointsResponse {
  puntosActuales: number;
  totalGanados: number;
  totalUsados: number;
}

export interface PointsStats {
  puntosActuales: number;
  totalGanados: number;
  totalUsados: number;
  valorEnDolares: number;
  ultimaActividad: string | null;
  totalReferidos: number; // 🆕 AGREGAR ESTA LÍNEA (sin ?)
}

export interface PointsTransaction {
  id: number;
  tipo: 'ganancia' | 'uso';
  puntos: number;
  concepto: string;
  puntosAnteriores: number;
  puntosNuevos: number;
  metadata?: any;
  fecha: string;
}

export interface ReferralRecord {
  id: number;
  referido: {
    id: number;
    nombre: string;
    email: string;
  };
  codigoUsado: string;
  puntosOtorgados: number;
  fechaReferido: string;
}

export interface ReferralResult {
  success: boolean;
  message: string;
  puntosGanados: number;
}

export interface PointsConfig {
  puntos_por_dolar: number;
  puntos_bienvenida: number;
  puntos_referido: number;
  puntos_nuevo_usuario: number;
}