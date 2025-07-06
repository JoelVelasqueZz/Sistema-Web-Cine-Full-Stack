// frontend/src/app/services/comment.service.ts - CON AUTENTICACIÓN
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
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

  // 🔥 MÉTODO PARA OBTENER HEADERS CON TOKEN
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.warn('⚠️ No hay token de autenticación para comentarios');
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }

    console.log('🔑 Enviando comentario con token:', token.substring(0, 20) + '...');
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== MÉTODOS PÚBLICOS CON AUTENTICACIÓN ====================

  /**
   * 🔥 CREAR COMENTARIO CON TOKEN
   */
  create(commentData: CreateCommentData): Observable<ApiResponse<Comment>> {
    const headers = this.getAuthHeaders();
    
    console.log('📝 Enviando comentario:', {
      tipo: commentData.tipo,
      titulo: commentData.titulo?.substring(0, 30),
      hasToken: headers.has('Authorization')
    });
    
    return this.http.post<ApiResponse<Comment>>(`${this.apiUrl}`, commentData, { headers });
  }

  /**
   * 🔥 OBTENER COMENTARIO POR ID CON TOKEN
   */
  getById(id: number): Observable<ApiResponse<Comment>> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<Comment>>(`${this.apiUrl}/${id}`, { headers });
  }

  /**
   * OBTENER COMENTARIOS DE PELÍCULA (PÚBLICO - SIN TOKEN)
   */
  getByMovie(peliculaId: number, page: number = 1, limit: number = 20): Observable<ApiResponse<{
    comentarios: Comment[];
    estadisticas: CommentStats;
    pagination: any;
  }>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    // Este endpoint es público, no necesita token
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/movie/${peliculaId}`, { params });
  }

  /**
   * 🔥 OBTENER MIS COMENTARIOS CON TOKEN
   */
  getMyComments(page: number = 1, limit: number = 20): Observable<ApiResponse<{
    comentarios: Comment[];
    pagination: any;
  }>> {
    const headers = this.getAuthHeaders();
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/user/my-comments`, { params, headers });
  }

  /**
   * 🔥 OBTENER SUGERENCIAS DEL SISTEMA CON TOKEN
   */
  getSystemFeedback(page: number = 1, limit: number = 50): Observable<ApiResponse<{
    sugerencias: Comment[];
    pagination: any;
  }>> {
    const headers = this.getAuthHeaders();
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/system/feedback`, { params, headers });
  }

  /**
   * 🔥 ACTUALIZAR COMENTARIO CON TOKEN
   */
  update(id: number, updateData: UpdateCommentData): Observable<ApiResponse<Comment>> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl}/${id}`, updateData, { headers });
  }

  /**
   * 🔥 ELIMINAR COMENTARIO CON TOKEN
   */
  delete(id: number): Observable<ApiResponse<any>> {
    const headers = this.getAuthHeaders();
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`, { headers });
  }

  // ==================== MÉTODOS ADMIN CON TOKEN ====================

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
    const headers = this.getAuthHeaders();
    
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof typeof filters];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/admin/all`, { params, headers });
  }

  /**
   * Cambiar estado del comentario (admin)
   */
  updateStatus(id: number, estado: string): Observable<ApiResponse<Comment>> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl}/admin/${id}/status`, { estado }, { headers });
  }

  /**
   * Destacar/quitar destaque de comentario (admin)
   */
  toggleFeatured(id: number): Observable<ApiResponse<Comment>> {
    const headers = this.getAuthHeaders();
    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl}/admin/${id}/featured`, {}, { headers });
  }

  // ==================== MÉTODOS AUXILIARES (SIN CAMBIOS) ====================

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

  getStatusText(estado: string): string {
    const statusMap = {
      'activo': 'Activo',
      'oculto': 'Oculto',
      'moderacion': 'En moderación',
      'rechazado': 'Rechazado'
    };
    return statusMap[estado as keyof typeof statusMap] || estado;
  }

  getStatusClass(estado: string): string {
    const classMap = {
      'activo': 'badge-success',
      'oculto': 'badge-secondary',
      'moderacion': 'badge-warning',
      'rechazado': 'badge-danger'
    };
    return classMap[estado as keyof typeof classMap] || 'badge-secondary';
  }

  getTypeText(tipo: string): string {
    const typeMap = {
      'pelicula': 'Reseña de película',
      'sistema': 'Comentario del sistema',
      'sugerencia': 'Sugerencia'
    };
    return typeMap[tipo as keyof typeof typeMap] || tipo;
  }

  getTypeIcon(tipo: 'pelicula' | 'sistema' | 'sugerencia' | string): string {
    const iconMap: Record<'pelicula' | 'sistema' | 'sugerencia', string> = {
      'pelicula': 'fas fa-film',
      'sistema': 'fas fa-cog',
      'sugerencia': 'fas fa-lightbulb'
    };
    return iconMap[tipo as 'pelicula' | 'sistema' | 'sugerencia'] || 'fas fa-comment';
  }

  // 🔥 MÉTODO PARA VERIFICAR SI EL USUARIO ESTÁ AUTENTICADO
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const isAuth = localStorage.getItem('is_authenticated') === 'true';
    
    return !!(token && isAuth);
  }

  // 🔥 MÉTODO PARA DEBUGGING
  debugAuth(): void {
    console.log('🔍 DEBUG CommentService:', {
      hasToken: !!localStorage.getItem('auth_token'),
      isAuthenticated: localStorage.getItem('is_authenticated'),
      currentUser: localStorage.getItem('current_user') ? 'Present' : 'Missing'
    });
  }
}