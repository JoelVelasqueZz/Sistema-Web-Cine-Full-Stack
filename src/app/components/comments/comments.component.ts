// frontend/src/app/components/comments/comments.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommentService, Comment, CommentStats, CreateCommentData, CommentReply, CreateReplyData } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-comments',
  standalone: false,
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css']
})
export class CommentsComponent implements OnInit {
  @Input() peliculaId?: number;
  @Input() tipo: 'pelicula' | 'sistema' | 'sugerencia' = 'pelicula';
  @Input() showCreateForm: boolean = true;

  // Estado del componente
  comentarios: Comment[] = [];
  estadisticas?: CommentStats;
  loading = false;
  submitting = false;
  
  // Formulario de nuevo comentario
  showForm = false;
  nuevoComentario: CreateCommentData = {
    tipo: 'pelicula',
    titulo: '',
    contenido: '',
    puntuacion: 5
  };

  // Edición
  editingComment: Comment | null = null;
  editForm: any = {};

  // 🆕 ESTADO PARA RESPUESTAS
  repliesVisible: { [commentId: number]: boolean } = {};
  repliesData: { [commentId: number]: CommentReply[] } = {};
  loadingReplies: { [commentId: number]: boolean } = {};
  showReplyForm: { [commentId: number]: boolean } = {};
  replyForm: { [commentId: number]: CreateReplyData } = {};
  submittingReply: { [commentId: number]: boolean } = {};

  // Paginación
  currentPage = 1;
  totalPages = 1;
  limit = 10;

  // Usuario actual
  currentUser: any = null;

  constructor(
    private commentService: CommentService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.nuevoComentario.tipo = this.tipo;
    this.nuevoComentario.pelicula_id = this.peliculaId;
    
    this.loadComments();
  }

  // ==================== CARGAR DATOS ====================

  loadComments(): void {
    if (this.tipo === 'sugerencia' || this.tipo === 'sistema') {
      this.loadSystemFeedbackWithReactions();
      return;
    }
    
    if (!this.peliculaId) return;
    
    this.loading = true;
    this.commentService.getByMovieWithReactions(this.peliculaId!, this.currentPage, this.limit)
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.comentarios = response.data.comentarios || [];
            this.estadisticas = response.data.estadisticas;
            this.totalPages = response.data.pagination?.totalPages || 1;
            
            console.log('📊 Comentarios con reacciones cargados:', this.comentarios.length);
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error cargando comentarios:', error);
          this.loading = false;
        }
      });
  }

  loadSystemFeedbackWithReactions(): void {
    this.loading = true;
    this.commentService.getSystemFeedbackWithReactions(this.currentPage, this.limit)
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.comentarios = response.data.sugerencias || [];
            this.totalPages = response.data.pagination?.totalPages || 1;
            
            console.log('📊 Sugerencias con reacciones cargadas:', this.comentarios.length);
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error cargando feedback:', error);
          this.loading = false;
        }
      });
  }

  loadMovieComments() {
    this.commentService.getByMovie(this.peliculaId!, this.currentPage, this.limit)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.comentarios = response.data.comentarios;
            this.estadisticas = response.data.estadisticas;
            this.totalPages = Math.ceil(response.data.pagination.total / this.limit);
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading movie comments:', error);
          this.toastService.showError('Error al cargar comentarios');
          this.loading = false;
        }
      });
  }

  loadSystemFeedback(): void {
    this.loading = true;
    this.commentService.getSystemFeedback(this.currentPage, this.limit)
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.comentarios = response.data.sugerencias || [];
            this.totalPages = response.data.pagination?.totalPages || 1;
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error cargando feedback:', error);
          this.loading = false;
        }
      });
  }

  // ==================== 🆕 MÉTODOS DE RESPUESTAS ====================

  /**
   * 🆕 Alternar visibilidad de respuestas
   */
  toggleReplies(commentId: number): void {
    if (!this.repliesVisible[commentId]) {
      // Si no están visibles, cargarlas
      this.loadReplies(commentId);
    }
    
    this.repliesVisible[commentId] = !this.repliesVisible[commentId];
  }

  /**
   * 🆕 Cargar respuestas de un comentario
   */
  loadReplies(commentId: number): void {
    if (this.repliesData[commentId]) {
      // Ya están cargadas
      return;
    }

    this.loadingReplies[commentId] = true;
    
    this.commentService.getReplies(commentId, 1, 10)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.repliesData[commentId] = response.data.respuestas || [];
            console.log(`💬 Respuestas cargadas para comentario ${commentId}:`, this.repliesData[commentId].length);
          }
          this.loadingReplies[commentId] = false;
        },
        error: (error) => {
          console.error('Error cargando respuestas:', error);
          this.toastService.showError('Error al cargar respuestas');
          this.loadingReplies[commentId] = false;
        }
      });
  }

  /**
   * 🆕 Mostrar/ocultar formulario de respuesta
   */
  toggleReplyForm(commentId: number): void {
    if (!this.currentUser) {
      this.toastService.showWarning('Debes iniciar sesión para responder');
      return;
    }

    this.showReplyForm[commentId] = !this.showReplyForm[commentId];
    
    if (this.showReplyForm[commentId]) {
      // Inicializar formulario
      this.replyForm[commentId] = {
        contenido: ''
      };
    } else {
      // Limpiar formulario
      delete this.replyForm[commentId];
    }
  }

  /**
   * 🆕 Crear respuesta a comentario
   */
  createReply(commentId: number): void {
    if (!this.currentUser) {
      this.toastService.showWarning('Debes iniciar sesión para responder');
      return;
    }

    const replyData = this.replyForm[commentId];
    if (!replyData || !replyData.contenido.trim()) {
      this.toastService.showWarning('El contenido de la respuesta es requerido');
      return;
    }

    if (replyData.contenido.length < 3) {
      this.toastService.showWarning('La respuesta debe tener al menos 3 caracteres');
      return;
    }

    this.submittingReply[commentId] = true;

    this.commentService.createReply(commentId, replyData)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.showSuccess('Respuesta enviada exitosamente');
            
            // Actualizar contador de respuestas
            const comment = this.comentarios.find(c => c.id === commentId);
            if (comment) {
              comment.total_replies = (comment.total_replies || 0) + 1;
            }

            // Recargar respuestas
            delete this.repliesData[commentId];
            this.loadReplies(commentId);
            this.repliesVisible[commentId] = true;

            // Ocultar formulario
            this.showReplyForm[commentId] = false;
            delete this.replyForm[commentId];
          } else {
            this.toastService.showError(response.message || 'Error al enviar respuesta');
          }
          this.submittingReply[commentId] = false;
        },
        error: (error) => {
          console.error('Error creando respuesta:', error);
          this.toastService.showError('Error al enviar respuesta');
          this.submittingReply[commentId] = false;
        }
      });
  }

  /**
   * 🆕 Eliminar respuesta
   */
  deleteReply(replyId: number, commentId: number): void {
    if (!confirm('¿Estás seguro de que quieres eliminar esta respuesta?')) {
      return;
    }

    this.commentService.deleteReply(replyId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.showSuccess('Respuesta eliminada exitosamente');
            
            // Actualizar contador de respuestas
            const comment = this.comentarios.find(c => c.id === commentId);
            if (comment && comment.total_replies) {
              comment.total_replies = comment.total_replies - 1;
            }

            // Recargar respuestas
            delete this.repliesData[commentId];
            this.loadReplies(commentId);
          } else {
            this.toastService.showError(response.message || 'Error al eliminar respuesta');
          }
        },
        error: (error) => {
          console.error('Error eliminando respuesta:', error);
          this.toastService.showError('Error al eliminar respuesta');
        }
      });
  }

  /**
   * 🆕 Verificar si el usuario puede editar una respuesta
   */
  canEditReply(reply: CommentReply): boolean {
    return this.currentUser && this.currentUser.id === reply.usuario_id;
  }

  // ==================== MÉTODOS EXISTENTES (SIN CAMBIOS) ====================

  submitComment(): void {
    if (!this.nuevoComentario.titulo.trim() || !this.nuevoComentario.contenido.trim()) {
      return;
    }

    this.commentService.create(this.nuevoComentario)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.resetForm();
            if (this.tipo === 'sugerencia' || this.tipo === 'sistema') {
              this.loadSystemFeedback();
            } else {
              this.loadComments();
            }
            this.toastService.showSuccess('Comentario creado exitosamente');
          }
        },
        error: (error: any) => {
          console.error('Error creando comentario:', error);
          this.toastService.showError('Error al crear comentario');
        }
      });
  }

  updateComment(): void {
    if (!this.editingComment || !this.editForm.titulo?.trim() || !this.editForm.contenido?.trim()) {
      return;
    }

    this.commentService.update(this.editingComment.id, this.editForm)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.cancelEdit();
            if (this.tipo === 'sugerencia' || this.tipo === 'sistema') {
              this.loadSystemFeedback();
            } else {
              this.loadComments();
            }
            this.toastService.showSuccess('Comentario actualizado exitosamente');
          }
        },
        error: (error: any) => {
          console.error('Error actualizando comentario:', error);
          this.toastService.showError('Error al actualizar comentario');
        }
      });
  }

  confirmDelete(comment: any): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      return;
    }

    this.commentService.delete(comment.id)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            if (this.tipo === 'sugerencia' || this.tipo === 'sistema') {
              this.loadSystemFeedback();
            } else {
              this.loadComments();
            }
            this.toastService.showSuccess('Comentario eliminado exitosamente');
          }
        },
        error: (error: any) => {
          console.error('Error eliminando comentario:', error);
          this.toastService.showError('Error al eliminar comentario');
        }
      });
  }

  toggleForm() {
    if (!this.currentUser) {
      this.toastService.showWarning('Debes iniciar sesión para comentar');
      return;
    }
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  createComment() {
    if (!this.currentUser) {
      this.toastService.showWarning('Debes iniciar sesión para comentar');
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.submitting = true;

    this.commentService.create(this.nuevoComentario)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.showSuccess('Comentario creado exitosamente');
            this.resetForm();
            this.showForm = false;
            if (this.tipo === 'sugerencia' || this.tipo === 'sistema') {
              this.loadSystemFeedback();
            } else {
              this.loadComments();
            }
          } else {
            this.toastService.showError(response.message || 'Error al crear comentario');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error creating comment:', error);
          if (error.error?.message) {
            this.toastService.showError(error.error.message);
          } else {
            this.toastService.showError('Error al crear comentario');
          }
          this.submitting = false;
        }
      });
  }

  validateForm(): boolean {
    if (!this.nuevoComentario.titulo.trim()) {
      this.toastService.showWarning('El título es requerido');
      return false;
    }

    if (this.nuevoComentario.titulo.length < 3) {
      this.toastService.showWarning('El título debe tener al menos 3 caracteres');
      return false;
    }

    if (!this.nuevoComentario.contenido.trim()) {
      this.toastService.showWarning('El contenido es requerido');
      return false;
    }

    if (this.nuevoComentario.contenido.length < 10) {
      this.toastService.showWarning('El contenido debe tener al menos 10 caracteres');
      return false;
    }

    if (this.tipo === 'pelicula' && (!this.nuevoComentario.puntuacion || this.nuevoComentario.puntuacion < 1 || this.nuevoComentario.puntuacion > 5)) {
      this.toastService.showWarning('Debes seleccionar una puntuación entre 1 y 5 estrellas');
      return false;
    }

    return true;
  }

  resetForm() {
    this.nuevoComentario = {
      tipo: this.tipo,
      pelicula_id: this.peliculaId,
      titulo: '',
      contenido: '',
      puntuacion: 5
    };
  }

  startEdit(comment: Comment) {
    if (!this.canEditComment(comment)) {
      this.toastService.showWarning('No tienes permisos para editar este comentario');
      return;
    }

    this.editingComment = comment;
    this.editForm = {
      titulo: comment.titulo,
      contenido: comment.contenido,
      puntuacion: comment.puntuacion
    };
  }

  cancelEdit() {
    this.editingComment = null;
    this.editForm = {};
  }

  saveEdit() {
    if (!this.editingComment) return;

    this.submitting = true;

    this.commentService.update(this.editingComment.id, this.editForm)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.showSuccess('Comentario actualizado exitosamente');
            this.cancelEdit();
            if (this.tipo === 'sugerencia' || this.tipo === 'sistema') {
              this.loadSystemFeedback();
            } else {
              this.loadComments();
            }
          } else {
            this.toastService.showError(response.message || 'Error al actualizar comentario');
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error updating comment:', error);
          this.toastService.showError('Error al actualizar comentario');
          this.submitting = false;
        }
      });
  }

  toggleReaction(commentId: number, tipo: 'like' | 'dislike'): void {
    if (!this.isAuthenticated()) {
      this.toastService.showWarning('Debes iniciar sesión para reaccionar');
      return;
    }

    const comment = this.comentarios.find(c => c.id === commentId);
    if (!comment) return;

    const wasUserReaction = comment.user_reaction === tipo;
    const previousReaction = comment.user_reaction;
    
    if (wasUserReaction) {
      comment.user_reaction = null;
      if (tipo === 'like') {
        comment.total_likes = (comment.total_likes || 0) - 1;
      } else {
        comment.total_dislikes = (comment.total_dislikes || 0) - 1;
      }
    } else {
      comment.user_reaction = tipo;
      
      if (previousReaction) {
        if (previousReaction === 'like') {
          comment.total_likes = (comment.total_likes || 0) - 1;
        } else {
          comment.total_dislikes = (comment.total_dislikes || 0) - 1;
        }
      }
      
      if (tipo === 'like') {
        comment.total_likes = (comment.total_likes || 0) + 1;
      } else {
        comment.total_dislikes = (comment.total_dislikes || 0) + 1;
      }
    }

    this.commentService.addReaction(commentId, tipo)
      .subscribe({
        next: (response) => {
          if (response.success) {
            comment.total_likes = response.data.stats.totalLikes;
            comment.total_dislikes = response.data.stats.totalDislikes;
            
            if (response.data.action === 'removed') {
              this.toastService.showInfo('Reacción eliminada');
            } else {
              this.toastService.showSuccess(`¡${tipo === 'like' ? 'Me gusta' : 'No me gusta'}!`);
            }
          }
        },
        error: (error) => {
          comment.user_reaction = previousReaction;
          if (previousReaction === 'like') {
            comment.total_likes = (comment.total_likes || 0) + 1;
          } else if (previousReaction === 'dislike') {
            comment.total_dislikes = (comment.total_dislikes || 0) + 1;
          }
          
          console.error('Error al reaccionar:', error);
          this.toastService.showError('Error al procesar reacción');
        }
      });
  }

  isAuthenticated(): boolean {
    return this.commentService.isAuthenticated();
  }

  getReactionButtonClass(comment: Comment, tipo: 'like' | 'dislike'): string {
    const isActive = comment.user_reaction === tipo;
    
    if (tipo === 'like') {
      return isActive ? 'btn-success' : 'btn-outline-success';
    } else {
      return isActive ? 'btn-danger' : 'btn-outline-danger';
    }
  }

  isReactionActive(comment: Comment, tipo: 'like' | 'dislike'): boolean {
    return comment.user_reaction === tipo;
  }

  deleteComment(comment: Comment) {
    if (!this.canEditComment(comment)) {
      this.toastService.showWarning('No tienes permisos para eliminar este comentario');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer.')) {
      return;
    }

    this.commentService.delete(comment.id)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.showSuccess('Comentario eliminado exitosamente');
            if (this.tipo === 'sugerencia' || this.tipo === 'sistema') {
              this.loadSystemFeedback();
            } else {
              this.loadComments();
            }
          } else {
            this.toastService.showError(response.message || 'Error al eliminar comentario');
          }
        },
        error: (error) => {
          console.error('Error deleting comment:', error);
          this.toastService.showError('Error al eliminar comentario');
        }
      });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadComments();
    }
  }

  canEditComment(comment: Comment): boolean {
    return this.currentUser && this.currentUser.id === comment.usuario_id;
  }

  getStars(rating: number): { filled: boolean; half: boolean }[] {
    return this.commentService.getStarsArray(rating);
  }

  formatDate(dateString: string): string {
    return this.commentService.formatDate(dateString);
  }

  getTypeIcon(tipo: string): string {
    return this.commentService.getTypeIcon(tipo);
  }

  getTypeText(tipo: string): string {
    return this.commentService.getTypeText(tipo);
  }

  setRating(rating: number) {
    this.nuevoComentario.puntuacion = rating;
  }

  setEditRating(rating: number) {
    this.editForm.puntuacion = rating;
  }

  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }

  // 🆕 TRACK BY PARA RESPUESTAS
  trackByReplyId(index: number, reply: CommentReply): number {
    return reply.id;
  }
}