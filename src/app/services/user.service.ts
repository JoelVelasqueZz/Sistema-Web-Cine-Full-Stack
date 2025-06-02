import { Injectable } from '@angular/core';
import { Usuario } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor() {
    console.log('UserService listo para usar!');
  }

  // 🔹 GESTIÓN DE PERFIL
  updateProfile(userId: number, profileData: UpdateProfileData): boolean {
    try {
      // Obtener usuarios del localStorage si es necesario
      // Por ahora trabajamos con el usuario actual en AuthService
      console.log('Actualizando perfil del usuario:', userId, profileData);
      
      // Aquí podrías actualizar en una base de datos real
      // Por ahora solo simulamos que funciona
      return true;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return false;
    }
  }

  // 🔹 GESTIÓN DE FAVORITAS
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

  addToFavorites(userId: number, pelicula: PeliculaFavorita): boolean {
    try {
      const favorites = this.getUserFavorites(userId);
      
      // Verificar si ya está en favoritas
      const yaExiste = favorites.some(fav => fav.peliculaId === pelicula.peliculaId);
      if (yaExiste) {
        console.log('La película ya está en favoritas');
        return false;
      }

      // Agregar a favoritas
      favorites.push({
        ...pelicula,
        fechaAgregada: new Date().toISOString()
      });

      // Guardar en localStorage
      const favoritesKey = `favorites_${userId}`;
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
      
      console.log('Película agregada a favoritas:', pelicula.titulo);
      return true;
    } catch (error) {
      console.error('Error al agregar a favoritas:', error);
      return false;
    }
  }

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

  isInFavorites(userId: number, peliculaId: number): boolean {
    const favorites = this.getUserFavorites(userId);
    return favorites.some(fav => fav.peliculaId === peliculaId);
  }

  // 🔹 GESTIÓN DE HISTORIAL
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

  addToHistory(userId: number, historialItem: HistorialItem): boolean {
    try {
      const history = this.getUserHistory(userId);
      
      // Verificar si ya existe (misma película y fecha similar)
      const yaExiste = history.some(item => 
        item.peliculaId === historialItem.peliculaId &&
        this.isSameDay(new Date(item.fechaVista), new Date(historialItem.fechaVista))
      );

      if (!yaExiste) {
        // Agregar al inicio del historial
        history.unshift({
          ...historialItem,
          fechaVista: new Date().toISOString()
        });

        // Mantener solo los últimos 50 registros
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

  // 🔹 MÉTODOS AUXILIARES
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  // 🔹 ESTADÍSTICAS DE USUARIO
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
}

// 🔹 INTERFACES
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