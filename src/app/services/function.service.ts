import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FunctionService {

  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {
    console.log('🎬 FunctionService conectado a API:', this.API_URL);
  }

  // ==================== MÉTODOS PÚBLICOS ====================

  /**
   * Obtener todas las funciones
   */
  getAllFunctions(): Observable<FuncionCine[]> {
    return this.http.get<any>(`${this.API_URL}/functions`).pipe(
      map(response => {
        console.log('📡 Funciones obtenidas de BD:', response.data?.length || 0);
        return (response.data || []).map((func: any) => this.convertApiToLocal(func));
      }),
      catchError(error => {
        console.error('❌ Error al obtener funciones:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener funciones por película
   */
  getFunctionsByMovie(peliculaId: number): Observable<FuncionCine[]> {
    return this.http.get<any>(`${this.API_URL}/functions/movie/${peliculaId}`).pipe(
      map(response => {
        console.log(`📡 ${response.data?.length || 0} funciones encontradas para película ${peliculaId}`);
        return (response.data || []).map((func: any) => this.convertApiToLocal(func));
      }),
      catchError(error => {
        console.error('❌ Error al obtener funciones por película:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener función por ID
   */
  getFunctionById(funcionId: string): Observable<FuncionCine | null> {
    return this.http.get<any>(`${this.API_URL}/functions/${funcionId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('📡 Función obtenida:', response.data.pelicula_titulo);
          return this.convertApiToLocal(response.data);
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Error al obtener función:', error);
        return of(null);
      })
    );
  }

  /**
   * Obtener funciones por fecha
   */
  getFunctionsByDate(fecha: string): Observable<FuncionCine[]> {
    return this.http.get<any>(`${this.API_URL}/functions/date/${fecha}`).pipe(
      map(response => {
        console.log(`📡 ${response.data?.length || 0} funciones encontradas para ${fecha}`);
        return (response.data || []).map((func: any) => this.convertApiToLocal(func));
      }),
      catchError(error => {
        console.error('❌ Error al obtener funciones por fecha:', error);
        return of([]);
      })
    );
  }

  // ==================== MÉTODOS ADMIN ====================

  /**
   * Crear nueva función (solo admin)
   */
  createFunction(funcionData: CreateFunctionData): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    const body = {
      peliculaId: funcionData.peliculaId,
      fecha: funcionData.fecha,
      hora: funcionData.hora,
      sala: funcionData.sala,
      precio: funcionData.precio,
      formato: funcionData.formato || '2D',
      asientosDisponibles: funcionData.asientosDisponibles || 50
    };

    return this.http.post<any>(`${this.API_URL}/functions`, body, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Función creada:', response.data.id);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al crear función:', error);
        return of(false);
      })
    );
  }

  /**
   * Actualizar función (solo admin)
   */
  updateFunction(funcionId: string, funcionData: Partial<CreateFunctionData>): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<any>(`${this.API_URL}/functions/${funcionId}`, funcionData, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Función actualizada:', funcionId);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al actualizar función:', error);
        return of(false);
      })
    );
  }

  /**
   * Eliminar función (solo admin)
   */
  deleteFunction(funcionId: string): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    return this.http.delete<any>(`${this.API_URL}/functions/${funcionId}`, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Función eliminada:', funcionId);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al eliminar función:', error);
        return of(false);
      })
    );
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Obtener headers con token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.warn('⚠️ No hay token de autenticación');
      return new HttpHeaders();
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Convertir función de API a formato local
   */
  private convertApiToLocal(apiFunc: any): FuncionCine {
    return {
      id: apiFunc.id,
      peliculaId: apiFunc.pelicula_id,
      fecha: this.formatDateFromAPI(apiFunc.fecha),
      hora: this.formatTimeFromAPI(apiFunc.hora),
      sala: apiFunc.sala,
      precio: parseFloat(apiFunc.precio.toString()),
      asientosDisponibles: apiFunc.asientos_disponibles,
      formato: apiFunc.formato,
      activo: apiFunc.activo,
      fechaCreacion: apiFunc.fecha_creacion,
      
      // Información de la película (si está disponible)
      pelicula: apiFunc.pelicula_titulo ? {
        titulo: apiFunc.pelicula_titulo,
        poster: apiFunc.pelicula_poster,
        genero: apiFunc.pelicula_genero,
        rating: parseFloat(apiFunc.pelicula_rating?.toString() || '0'),
        duracion: apiFunc.pelicula_duracion,
        director: apiFunc.pelicula_director,
        sinopsis: apiFunc.pelicula_sinopsis
      } : undefined
    };
  }

  /**
   * Formatear fecha desde API (YYYY-MM-DDTHH:mm:ss.sssZ -> YYYY-MM-DD)
   */
  private formatDateFromAPI(dateString: string): string {
    return new Date(dateString).toISOString().split('T')[0];
  }

  /**
   * Formatear hora desde API (HH:mm:ss -> HH:mm)
   */
  private formatTimeFromAPI(timeString: string): string {
    return timeString.substring(0, 5); // Tomar solo HH:mm
  }

  // ==================== MÉTODOS UTILITARIOS ====================

  /**
   * Verificar si una función es pasada
   */
  isPastFunction(funcion: FuncionCine): boolean {
    const funcionDateTime = new Date(`${funcion.fecha}T${funcion.hora}`);
    return funcionDateTime < new Date();
  }

  /**
   * Agrupar funciones por fecha
   */
  groupFunctionsByDate(funciones: FuncionCine[]): { [fecha: string]: FuncionCine[] } {
    return funciones.reduce((groups, funcion) => {
      const fecha = funcion.fecha;
      if (!groups[fecha]) {
        groups[fecha] = [];
      }
      groups[fecha].push(funcion);
      return groups;
    }, {} as { [fecha: string]: FuncionCine[] });
  }

  /**
   * Obtener fechas disponibles
   */
  getAvailableDates(funciones: FuncionCine[]): string[] {
    const fechas = [...new Set(funciones.map(f => f.fecha))];
    return fechas.sort();
  }

  /**
   * Formatear precio para mostrar
   */
  formatPrice(precio: number): string {
    return `$${precio.toFixed(2)}`;
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDateForDisplay(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formatear hora para mostrar
   */
  formatTimeForDisplay(hora: string): string {
    return hora; // Ya está en formato HH:mm
  }

  getSeatsForFunction(funcionId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/functions/${funcionId}/seats`).pipe(
      map(response => {
        if (response.success) {
          console.log(`🪑 ${response.data?.length || 0} asientos obtenidos para función ${funcionId}`);
          return response;
        }
        return { success: false, data: [] };
      }),
      catchError(error => {
        console.error('❌ Error al obtener asientos:', error);
        return of({ success: false, data: [] });
      })
    );
  }

  /**
   * Reservar asientos (usuario autenticado)
   */
  reserveSeats(funcionId: string, seatIds: number[]): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    const body = { seatIds };
    
    return this.http.post<any>(`${this.API_URL}/functions/${funcionId}/seats/reserve`, body, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Asientos reservados:', response.data.asientosReservados?.length || 0);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al reservar asientos:', error);
        return of(false);
      })
    );
  }

  /**
   * Liberar asientos (usuario autenticado)
   */
  releaseSeats(funcionId: string, seatIds: number[]): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    const body = { seatIds };
    
    return this.http.post<any>(`${this.API_URL}/functions/${funcionId}/seats/release`, body, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Asientos liberados:', response.data.asientos_liberados?.length || 0);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al liberar asientos:', error);
        return of(false);
      })
    );
  }
}

// ==================== INTERFACES ====================

export interface FuncionCine {
  id: string;
  peliculaId: number;
  fecha: string;        // YYYY-MM-DD
  hora: string;         // HH:mm
  sala: string;
  precio: number;
  asientosDisponibles: number;
  formato: string;      // '2D', '3D', 'IMAX', '4DX'
  activo: boolean;
  fechaCreacion: string;
  pelicula?: {
    titulo: string;
    poster: string;
    genero: string;
    rating: number;
    duracion: string;
    director?: string;
    sinopsis?: string;
  };
}

export interface CreateFunctionData {
  peliculaId: number;
  fecha: string;        // YYYY-MM-DD
  hora: string;         // HH:mm
  sala: string;
  precio: number;
  formato?: string;     // Opcional, default '2D'
  asientosDisponibles?: number; // Opcional, default 50
}