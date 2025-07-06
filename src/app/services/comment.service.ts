// frontend/src/app/services/comment.service.ts - CORREGIDO
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Comment {
  id: number;
  usuario_id: number;
  tipo: 'pelicula' | 'sistema' | 'sugerencia';
  pelicula_id?: number;
  titulo: string;
  contenido: string;
  puntuacion?: number;
  estado: 'activo' | 'oculto' | 'moderacion' | 'rechazado';
  es_destacado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario_nombre?: string;
  usuario_avatar?: string;
  pelicula_titulo?: string;
  pelicula_poster?: string;
}

export interface CommentStats {
  total_comentarios: number;
  puntuacion_promedio: number;
  distribucion_puntuaciones: {
    '5_estrellas': number;
    '4_estrellas': number;
    '3_estrellas': number;
    '2_estrellas': number;
    '1_estrella': number;
  };
}

export interface CreateCommentData {
  tipo: 'pelicula' | 'sistema' | 'sugerencia';
  pelicula_id?: number;
  titulo: string;
  contenido: string;
  puntuacion?: number;
}

export interface UpdateCommentData {
  titulo?: string;
  contenido?: string;
  puntuacion?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  // ==================== MÉTODOS PÚBLICOS ====================

  /**
   * Crear nuevo comentario
   */
  create(commentData: CreateCommentData): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(`${this.apiUrl}`, commentData);
  }

  /**
   * Obtener comentario por ID
   */
  getById(id: number): Observable<ApiResponse<Comment>> {
    return this.http.get<ApiResponse<Comment>>(`${this.apiUrl}/${id}`);
  }

  /**
   * 🔥 MÉTODO CORREGIDO: getByMovie
   * Este método es el que usa tu componente
   */
  getByMovie(peliculaId: number, page: number = 1, limit: number = 20): Observable<ApiResponse<{
    comentarios: Comment[];
    estadisticas: CommentStats;
    pagination: any;
  }>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/movie/${peliculaId}`, { params });
  }

  /**
   * Obtener comentarios del usuario actual
   */
  getMyComments(page: number = 1, limit: number = 20): Observable<ApiResponse<{
    comentarios: Comment[];
    pagination: any;
  }>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/user/my-comments`, { params });
  }

  /**
   * 🔥 MÉTODO CORREGIDO: getSystemFeedback
   * Este método es el que usa tu componente
   */
  getSystemFeedback(page: number = 1, limit: number = 50): Observable<ApiResponse<{
    sugerencias: Comment[];
    pagination: any;
  }>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/system/feedback`, { params });
  }

  /**
   * 🔥 MÉTODO CORREGIDO: update
   * Este método es el que usa tu componente
   */
  update(id: number, updateData: UpdateCommentData): Observable<ApiResponse<Comment>> {
    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl}/${id}`, updateData);
  }

  /**
   * 🔥 MÉTODO CORREGIDO: delete
   * Este método es el que usa tu componente
   */
  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  // ==================== MÉTODOS ADMIN ====================

  /**
   * Obtener todos los comentarios (admin)
   */
  getAllForAdmin(filters: {
    tipo?: string;
    estado?: string;
    usuario_id?: number;
    page?: number;
    limit?: number;
  } = {}): Observable<ApiResponse<{
    comentarios: Comment[];
    estadisticas: any;
    pagination: any;
  }>> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof typeof filters];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/admin/all`, { params });
  }

  /**
   * Cambiar estado del comentario (admin)
   */
  updateStatus(id: number, estado: string): Observable<ApiResponse<Comment>> {
    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl}/admin/${id}/status`, { estado });
  }

  /**
   * Destacar/quitar destaque de comentario (admin)
   */
  toggleFeatured(id: number): Observable<ApiResponse<Comment>> {
    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl}/admin/${id}/featured`, {});
  }

  // ==================== MÉTODOS AUXILIARES QUE USA TU COMPONENTE ====================

  /**
   * 🔥 MÉTODO CORREGIDO: getStarsArray
   * Obtener array de estrellas para mostrar rating
   */
  getStarsArray(rating: number): { filled: boolean; half: boolean }[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      stars.push({
        filled: i <= fullStars,
        half: i === fullStars + 1 && hasHalfStar
      });
    }

    return stars;
  }

  /**
   * 🔥 MÉTODO CORREGIDO: formatDate
   * Formatear fecha para mostrar
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener texto del estado
   */
  getStatusText(estado: string): string {
    const statusMap = {
      'activo': 'Activo',
      'oculto': 'Oculto',
      'moderacion': 'En moderación',
      'rechazado': 'Rechazado'
    };
    return statusMap[estado as keyof typeof statusMap] || estado;
  }

  /**
   * Obtener clase CSS para el estado
   */
  getStatusClass(estado: string): string {
    const classMap = {
      'activo': 'badge-success',
      'oculto': 'badge-secondary',
      'moderacion': 'badge-warning',
      'rechazado': 'badge-danger'
    };
    return classMap[estado as keyof typeof classMap] || 'badge-secondary';
  }

  /**
   * Obtener texto del tipo de comentario
   */
  getTypeText(tipo: string): string {
    const typeMap = {
      'pelicula': 'Reseña de película',
      'sistema': 'Comentario del sistema',
      'sugerencia': 'Sugerencia'
    };
    return typeMap[tipo as keyof typeof typeMap] || tipo;
  }

  /**
   * 🔥 MÉTODO CORREGIDO: getTypeIcon
   * Obtener icono para el tipo de comentario
   */
  getTypeIcon(tipo: 'pelicula' | 'sistema' | 'sugerencia' | string): string {
    const iconMap: Record<'pelicula' | 'sistema' | 'sugerencia', string> = {
      'pelicula': 'fas fa-film',
      'sistema': 'fas fa-cog',
      'sugerencia': 'fas fa-lightbulb'
    };
    return iconMap[tipo as 'pelicula' | 'sistema' | 'sugerencia'] || 'fas fa-comment';
  }
}