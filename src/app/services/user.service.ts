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

  // ==================== MÉTODOS LOCALES (FAVORITAS/HISTORIAL) ====================

  /**
   * Obtener favoritas del usuario (local por ahora)
   */
  getUserFavorites(userId: number): PeliculaFavorita[] {
    const favoritesKey = `favorites_${userId}`;
    const favorites = localStorage.getItem(favoritesKey);
    
    if (favorites) {
      try {
        return JSON.parse(favorites);
      } catch (error) {
        console.error('Error al obtener favoritas:', error);
        return [];
      }
    }
    return [];
  }

  /**
   * Agregar a favoritas (local por ahora)
   */
  addToFavorites(userId: number, pelicula: PeliculaFavorita): boolean {
    try {
      const favorites = this.getUserFavorites(userId);
      
      const yaExiste = favorites.some(fav => fav.peliculaId === pelicula.peliculaId);
      if (yaExiste) {
        console.log('La película ya está en favoritas');
        return false;
      }

      favorites.push({
        ...pelicula,
        fechaAgregada: new Date().toISOString()
      });

      const favoritesKey = `favorites_${userId}`;
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
      
      console.log('Película agregada a favoritas:', pelicula.titulo);
      return true;
    } catch (error) {
      console.error('Error al agregar a favoritas:', error);
      return false;
    }
  }

  /**
   * Remover de favoritas (local por ahora)
   */
  removeFromFavorites(userId: number, peliculaId: number): boolean {
    try {
      const favorites = this.getUserFavorites(userId);
      const nuevasFavoritas = favorites.filter(fav => fav.peliculaId !== peliculaId);
      
      const favoritesKey = `favorites_${userId}`;
      localStorage.setItem(favoritesKey, JSON.stringify(nuevasFavoritas));
      
      console.log('Película removida de favoritas');
      return true;
    } catch (error) {
      console.error('Error al remover de favoritas:', error);
      return false;
    }
  }

  /**
   * Verificar si está en favoritas
   */
  isInFavorites(userId: number, peliculaId: number): boolean {
    const favorites = this.getUserFavorites(userId);
    return favorites.some(fav => fav.peliculaId === peliculaId);
  }

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
    const favorites = this.getUserFavorites(userId);
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