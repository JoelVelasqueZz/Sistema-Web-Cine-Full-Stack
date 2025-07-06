// frontend/src/app/components/comments/comments.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommentService, Comment, CommentStats, CreateCommentData } from '../../services/comment.service';
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
    this.loadSystemFeedback();
    return;
  }
  
  if (!this.peliculaId) return;
  
  this.loading = true;
  this.commentService.getByMovie(this.peliculaId!, this.currentPage, this.limit)
    .subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.comentarios = response.data.comentarios || [];
          this.estadisticas = response.data.estadisticas;
          this.totalPages = response.data.pagination?.totalPages || 1;
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error cargando comentarios:', error);
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
      next: (response: any) => { // 🔥 Cambiado: agregado tipo any explícito
        if (response.success && response.data) {
          this.comentarios = response.data.sugerencias || [];
          this.totalPages = response.data.pagination?.totalPages || 1;
        }
        this.loading = false;
      },
      error: (error: any) => { // 🔥 Cambiado: agregado tipo any explícito
        console.error('Error cargando feedback:', error);
        this.loading = false;
      }
    });
}
submitComment(): void {
  if (!this.nuevoComentario.titulo.trim() || !this.nuevoComentario.contenido.trim()) {
    return;
  }

  this.commentService.create(this.nuevoComentario)
    .subscribe({
      next: (response: any) => {
        if (response.success) {
          this.resetForm();
          // 🔥 CORRECCIÓN: Recargar según el tipo
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
          // 🔥 CORRECCIÓN: Recargar según el tipo
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
          // 🔥 CORRECCIÓN: Recargar según el tipo
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

  // ==================== CREAR COMENTARIO ====================

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
          // 🔥 CORRECCIÓN: Recargar según el tipo
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

  // ==================== EDITAR COMENTARIO ====================

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
          // 🔥 CORRECCIÓN: Recargar según el tipo
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

  // ==================== ELIMINAR COMENTARIO ====================

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
            this.loadComments();
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

  // ==================== PAGINACIÓN ====================

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadComments();
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

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

  // Setter para puntuación con estrellas
  setRating(rating: number) {
    this.nuevoComentario.puntuacion = rating;
  }

  setEditRating(rating: number) {
    this.editForm.puntuacion = rating;
  }

  // ==================== TRACK BY FUNCTION ==================== 
  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }
}