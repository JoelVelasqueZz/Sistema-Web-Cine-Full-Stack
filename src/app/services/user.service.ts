import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Usuario } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // 🔗 API Configuration
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {
    console.log('🔐 UserService conectado a API:', this.API_URL);
  }

  // ==================== MÉTODOS DE API ====================

  /**
   * Obtener todos los usuarios (solo admin)
   */
  getAllUsers(): Observable<Usuario[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.API_URL}/users`, { headers }).pipe(
      map(response => {
        console.log('📡 Usuarios obtenidos de BD:', response.data?.length || 0);
        return (response.data || []).map((user: any) => this.convertApiToLocal(user));
      }),
      catchError(error => {
        console.error('❌ Error al obtener usuarios:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener usuario por ID
   */
  getUserById(id: number): Observable<Usuario | null> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.API_URL}/users/${id}`, { headers }).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('📡 Usuario obtenido:', response.data.nombre);
          return this.convertApiToLocal(response.data);
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Error al obtener usuario:', error);
        return of(null);
      })
    );
  }

  /**
   * Actualizar perfil de usuario
   */
  updateProfile(userId: number, profileData: UpdateProfileData): Observable<boolean> {
    const headers = this.getAuthHeaders();
    const body = {
      nombre: profileData.nombre,
      email: profileData.email,
      avatar: profileData.avatar
    };

    return this.http.put<any>(`${this.API_URL}/users/${userId}`, body, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Perfil actualizado:', response.data?.nombre);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al actualizar perfil:', error);
        return of(false);
      })
    );
  }

  /**
   * Cambiar rol de usuario (solo admin)
   */
  changeUserRole(userId: number, newRole: 'admin' | 'cliente'): Observable<boolean> {
    const headers = this.getAuthHeaders();
    const body = { role: newRole };

    return this.http.put<any>(`${this.API_URL}/users/${userId}`, body, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log(`✅ Rol cambiado a ${newRole} para usuario ID: ${userId}`);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al cambiar rol:', error);
        return of(false);
      })
    );
  }

  /**
   * Cambiar estado de usuario (solo admin)
   */
  toggleUserStatus(userId: number): Observable<boolean> {
    const headers = this.getAuthHeaders();

    return this.http.patch<any>(`${this.API_URL}/users/${userId}/status`, {}, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log(`✅ Estado cambiado para usuario ID: ${userId}`);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al cambiar estado:', error);
        return of(false);
      })
    );
  }

  /**
   * Eliminar usuario (solo admin)
   */
  deleteUser(userId: number): Observable<boolean> {
    const headers = this.getAuthHeaders();

    return this.http.delete<any>(`${this.API_URL}/users/${userId}`, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log(`✅ Usuario eliminado ID: ${userId}`);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al eliminar usuario:', error);
        return of(false);
      })
    );
  }

  /**
   * Buscar usuarios
   */
  searchUsers(searchTerm: string): Observable<Usuario[]> {
    const headers = this.getAuthHeaders();
    const encodedTerm = encodeURIComponent(searchTerm);
    
    return this.http.get<any>(`${this.API_URL}/users/search?q=${encodedTerm}`, { headers }).pipe(
      map(response => {
        console.log(`🔍 ${response.data?.length || 0} usuarios encontrados para "${searchTerm}"`);
        return (response.data || []).map((user: any) => this.convertApiToLocal(user));
      }),
      catchError(error => {
        console.error('❌ Error en búsqueda de usuarios:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener estadísticas de usuarios (solo admin)
   */
  getUsersStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.API_URL}/users/stats`, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('📊 Estadísticas de usuarios obtenidas');
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Error al obtener estadísticas:', error);
        return of(null);
      })
    );
  }

  // ==================== MÉTODOS DE FAVORITAS (API) ====================

  /**
   * Obtener favoritas del usuario desde la API
   */
  getUserFavorites(userId: number): Observable<PeliculaFavorita[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.API_URL}/favorites`, { headers }).pipe(
      map(response => {
        console.log('📡 Favoritas obtenidas de BD:', response.data?.length || 0);
        return (response.data || []).map((fav: any) => this.convertApiFavoriteToLocal(fav));
      }),
      catchError(error => {
        console.error('❌ Error al obtener favoritas:', error);
        // Fallback a localStorage si falla la API
        return of(this.getUserFavoritesLocal(userId));
      })
    );
  }

  /**
   * Agregar a favoritas usando API
   */
  addToFavorites(userId: number, pelicula: PeliculaFavorita): Observable<boolean> {
    const headers = this.getAuthHeaders();
    const body = { peliculaId: pelicula.peliculaId };

    return this.http.post<any>(`${this.API_URL}/favorites`, body, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Película agregada a favoritas en BD:', pelicula.titulo);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al agregar a favoritas:', error);
        // Fallback a localStorage si falla la API
        return of(this.addToFavoritesLocal(userId, pelicula));
      })
    );
  }

  /**
   * Remover de favoritas usando API
   */
  removeFromFavorites(userId: number, peliculaId: number): Observable<boolean> {
    const headers = this.getAuthHeaders();

    return this.http.delete<any>(`${this.API_URL}/favorites/${peliculaId}`, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Película removida de favoritas en BD');
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al remover de favoritas:', error);
        // Fallback a localStorage si falla la API
        return of(this.removeFromFavoritesLocal(userId, peliculaId));
      })
    );
  }

  /**
   * Verificar si está en favoritas
   */
  isInFavorites(userId: number, peliculaId: number): Observable<boolean> {
    const headers = this.getAuthHeaders();

    return this.http.get<any>(`${this.API_URL}/favorites/check/${peliculaId}`, { headers }).pipe(
      map(response => {
        if (response.success) {
          return response.data.isFavorite;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al verificar favorita:', error);
        // Fallback a localStorage
        return of(this.isInFavoritesLocal(userId, peliculaId));
      })
    );
  }

  /**
   * Limpiar todas las favoritas
   */
  clearAllFavorites(userId: number): Observable<boolean> {
    const headers = this.getAuthHeaders();

    return this.http.delete<any>(`${this.API_URL}/favorites/clear`, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Todas las favoritas limpiadas en BD');
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al limpiar favoritas:', error);
        return of(false);
      })
    );
  }

  // ==================== MÉTODOS LOCALES (FALLBACK) ====================

  /**
   * Obtener favoritas del localStorage (fallback)
   */
  private getUserFavoritesLocal(userId: number): PeliculaFavorita[] {
    const favoritesKey = `favorites_${userId}`;
    const favorites = localStorage.getItem(favoritesKey);
    
    if (favorites) {
      try {
        return JSON.parse(favorites);
      } catch (error) {
        console.error('Error al obtener favoritas locales:', error);
        return [];
      }
    }
    return [];
  }

  /**
   * Agregar a favoritas local (fallback)
   */
  private addToFavoritesLocal(userId: number, pelicula: PeliculaFavorita): boolean {
    try {
      const favorites = this.getUserFavoritesLocal(userId);
      
      const yaExiste = favorites.some(fav => fav.peliculaId === pelicula.peliculaId);
      if (yaExiste) {
        console.log('La película ya está en favoritas locales');
        return false;
      }

      favorites.push({
        ...pelicula,
        fechaAgregada: new Date().toISOString()
      });

      const favoritesKey = `favorites_${userId}`;
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
      
      console.log('Película agregada a favoritas locales:', pelicula.titulo);
      return true;
    } catch (error) {
      console.error('Error al agregar a favoritas locales:', error);
      return false;
    }
  }

  /**
   * Remover de favoritas local (fallback)
   */
  private removeFromFavoritesLocal(userId: number, peliculaId: number): boolean {
    try {
      const favorites = this.getUserFavoritesLocal(userId);
      const nuevasFavoritas = favorites.filter(fav => fav.peliculaId !== peliculaId);
      
      const favoritesKey = `favorites_${userId}`;
      localStorage.setItem(favoritesKey, JSON.stringify(nuevasFavoritas));
      
      console.log('Película removida de favoritas locales');
      return true;
    } catch (error) {
      console.error('Error al remover de favoritas locales:', error);
      return false;
    }
  }

  /**
   * Verificar favoritas local (fallback)
   */
  private isInFavoritesLocal(userId: number, peliculaId: number): boolean {
    const favorites = this.getUserFavoritesLocal(userId);
    return favorites.some(fav => fav.peliculaId === peliculaId);
  }

  /**
   * Convertir favorita de API a formato local
   */
  private convertApiFavoriteToLocal(apiFav: any): PeliculaFavorita {
    return {
      peliculaId: apiFav.pelicula_id,
      titulo: apiFav.titulo,
      poster: apiFav.poster,
      genero: apiFav.genero,
      anio: apiFav.anio,
      rating: parseFloat(apiFav.rating?.toString() || '0'),
      fechaAgregada: apiFav.fecha_agregada
    };
  }

  // ==================== MÉTODOS LOCALES (HISTORIAL) ====================

  /**
   * Obtener historial del usuario (local por ahora)
   */
  getUserHistory(userId: number): HistorialItem[] {
    const historyKey = `history_${userId}`;
    const history = localStorage.getItem(historyKey);
    
    if (history) {
      try {
        return JSON.parse(history).sort((a: HistorialItem, b: HistorialItem) => 
          new Date(b.fechaVista).getTime() - new Date(a.fechaVista).getTime()
        );
      } catch (error) {
        console.error('Error al obtener historial:', error);
        return [];
      }
    }
    return [];
  }

  /**
   * Agregar al historial (local por ahora)
   */
  addToHistory(userId: number, historialItem: HistorialItem): boolean {
    try {
      const history = this.getUserHistory(userId);
      
      const yaExiste = history.some(item => 
        item.peliculaId === historialItem.peliculaId &&
        this.isSameDay(new Date(item.fechaVista), new Date(historialItem.fechaVista))
      );

      if (!yaExiste) {
        history.unshift({
          ...historialItem,
          fechaVista: new Date().toISOString()
        });

        const historialLimitado = history.slice(0, 50);
        const historyKey = `history_${userId}`;
        localStorage.setItem(historyKey, JSON.stringify(historialLimitado));
        
        console.log('Agregado al historial:', historialItem.titulo);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al agregar al historial:', error);
      return false;
    }
  }

  /**
   * Limpiar historial
   */
  clearHistory(userId: number): boolean {
    try {
      const historyKey = `history_${userId}`;
      localStorage.removeItem(historyKey);
      console.log('Historial limpiado');
      return true;
    } catch (error) {
      console.error('Error al limpiar historial:', error);
      return false;
    }
  }

  /**
   * Obtener estadísticas del usuario
   */
  getUserStats(userId: number): UserStats {
    const favorites = this.getUserFavoritesLocal(userId); // Usar método local para stats
    const history = this.getUserHistory(userId);
    
    // Contar géneros favoritos
    const generos: { [key: string]: number } = {};
    [...favorites, ...history].forEach(item => {
      if (item.genero) {
        generos[item.genero] = (generos[item.genero] || 0) + 1;
      }
    });

    const generoFavorito = Object.keys(generos).reduce((a, b) => 
      generos[a] > generos[b] ? a : b, 'Ninguno'
    );

    return {
      totalFavoritas: favorites.length,
      totalVistas: history.length,
      generoFavorito: generoFavorito,
      ultimaActividad: history.length > 0 ? history[0].fechaVista : null
    };
  }

  // ==================== MÉTODOS PRIVADOS ====================

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
   * Convertir usuario de API a formato local
   */
  private convertApiToLocal(apiUser: any): Usuario {
    return {
      id: apiUser.id,
      nombre: apiUser.nombre,
      email: apiUser.email,
      role: apiUser.role as 'admin' | 'cliente',
      avatar: apiUser.avatar,
      fechaRegistro: apiUser.fecha_registro,
      isActive: apiUser.is_active
    };
  }

  /**
   * Verificar si dos fechas son del mismo día
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}

// ==================== INTERFACES ====================

export interface UpdateProfileData {
  nombre?: string;
  email?: string;
  avatar?: string;
}

export interface PeliculaFavorita {
  peliculaId: number;
  titulo: string;
  poster: string;
  genero: string;
  anio: number;
  rating: number;
  fechaAgregada: string;
}

export interface HistorialItem {
  peliculaId: number;
  titulo: string;
  poster: string;
  genero: string;
  anio: number;
  fechaVista: string;
  tipoAccion: 'vista' | 'comprada';
}

export interface UserStats {
  totalFavoritas: number;
  totalVistas: number;
  generoFavorito: string;
  ultimaActividad: string | null;
}