import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService, Pelicula } from '../../services/movie.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-movie-detail',
  standalone: false,
  templateUrl: './movie-detail.component.html',
  styleUrl: './movie-detail.component.css'
})
export class MovieDetailComponent {
  pelicula: any = {};
  peliculaIndex: number = -1;
  mostrarModal: boolean = false;
  trailerUrl: SafeResourceUrl = '';

  // 🔥 PROPIEDADES PARA EDICIÓN DE PELÍCULAS (ADMIN)
  peliculaEditando: Pelicula | null = null;
  guardandoEdicion: boolean = false;
  errorEdicion: string = '';
  exitoEdicion: string = '';

  constructor(
    private activatedRoute: ActivatedRoute, 
    private _movieService: MovieService,
    private router: Router,
    private sanitizer: DomSanitizer,
    public authService: AuthService,    // 🔥 AGREGAR (público para template)
    private toastService: ToastService  // 🔥 AGREGAR
  ) {
    this.activatedRoute.params.subscribe(params => {
      this.peliculaIndex = +params['id']; // Convertir a número
      this.pelicula = this._movieService.getPelicula(this.peliculaIndex);
      console.log('Película cargada:', this.pelicula);
      console.log('Índice de película:', this.peliculaIndex);

      // Obtener URL del trailer si existe
      if (this.pelicula && this.pelicula.trailer) {
        const url = this._movieService.getTrailerUrl(this.peliculaIndex);
        this.trailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
      
      // cuando no existe la película, redirigir a la lista de películas
      if (!this.pelicula) {
        this.router.navigate(['/movies']);
      }
    });
  }
  
  // ==================== MÉTODOS EXISTENTES ====================
  
  // Método para verificar si la película tiene trailer
  tieneTrailer(): boolean {
    return this.pelicula && this.pelicula.trailer;
  }

  comprarEntradas() {
    if (this.pelicula) {
      console.log('Navegando a ticket-purchase con índice:', this.peliculaIndex);
      this.router.navigate(['/ticket-purchase', this.peliculaIndex]);
    }
  }

  // ==================== MÉTODOS DE ADMINISTRACIÓN ====================

  /**
   * Editar película (solo admin)
   */
  editarPelicula(): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    if (!this.pelicula) {
      this.toastService.showError('Película no encontrada');
      return;
    }

    // Preparar datos para edición
    this.peliculaEditando = { ...this.pelicula }; // Clonar objeto
    this.errorEdicion = '';
    this.exitoEdicion = '';
    this.guardandoEdicion = false;

    console.log('Editando película:', this.peliculaEditando);
  }

  /**
   * Guardar cambios de edición
   */
  guardarEdicionPelicula(formulario: any): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    if (!formulario.valid || !this.peliculaEditando) {
      this.errorEdicion = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.guardandoEdicion = true;
    this.errorEdicion = '';
    this.exitoEdicion = '';

    // Validar datos
    const validacion = this._movieService.validatePeliculaData(this.peliculaEditando);
    if (!validacion.valid) {
      this.errorEdicion = validacion.errors.join(', ');
      this.guardandoEdicion = false;
      return;
    }

    // Simular delay de guardado
    setTimeout(() => {
      const exito = this._movieService.updatePelicula(this.peliculaIndex, this.peliculaEditando!);
      
      if (exito) {
        this.exitoEdicion = `Película "${this.peliculaEditando!.titulo}" actualizada exitosamente`;
        this.toastService.showSuccess(`Película actualizada exitosamente`);
        
        // Recargar datos de la película
        this.recargarPelicula();
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          this.cerrarModalEdicion();
          this.resetearEdicion();
        }, 2000);
        
      } else {
        this.errorEdicion = 'Error al actualizar la película. Por favor intenta de nuevo.';
        this.toastService.showError('Error al actualizar la película');
      }
      
      this.guardandoEdicion = false;
    }, 1500);
  }

  /**
   * Confirmar eliminación de película
   */
  confirmarEliminarPelicula(): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    if (!this.pelicula) {
      this.toastService.showError('Película no encontrada');
      return;
    }

    const confirmar = confirm(
      `¿Estás seguro de que quieres eliminar la película "${this.pelicula.titulo}"?\n\n` +
      `Esta acción no se puede deshacer y también eliminará todas las funciones asociadas.\n` +
      `Serás redirigido a la lista de películas.`
    );

    if (confirmar) {
      this.eliminarPelicula();
    }
  }

  /**
   * Eliminar película
   */
  private eliminarPelicula(): void {
    const tituloPelicula = this.pelicula.titulo;
    
    const exito = this._movieService.deletePelicula(this.peliculaIndex);
    
    if (exito) {
      this.toastService.showSuccess(`Película "${tituloPelicula}" eliminada exitosamente`);
      
      // Redirigir a la lista de películas después de eliminar
      setTimeout(() => {
        this.router.navigate(['/movies']);
      }, 1500);
      
    } else {
      this.toastService.showError('Error al eliminar la película');
    }
  }

  /**
   * Gestionar funciones de la película
   */
  gestionarFunciones(): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    // TODO: Implementar gestión de funciones
    this.toastService.showInfo('Gestión de funciones próximamente disponible');
    console.log('Gestionar funciones para película:', this.pelicula.titulo);
  }

  /**
   * Agregar nueva función
   */
  agregarFuncion(): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    // TODO: Implementar modal para agregar función
    this.toastService.showInfo('Función para agregar horarios próximamente disponible');
    console.log('Agregar función para película:', this.pelicula.titulo);
  }

  /**
   * Ver todas las funciones
   */
  verTodasLasFunciones(): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    const funciones = this._movieService.getFuncionesPelicula(this.peliculaIndex);
    console.log('Funciones de la película:', funciones);
    
    if (funciones.length > 0) {
      this.toastService.showInfo(`Esta película tiene ${funciones.length} funciones programadas`);
    } else {
      this.toastService.showWarning('Esta película no tiene funciones programadas');
    }
  }

  /**
   * Ver estadísticas de la película
   */
  verEstadisticas(): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    // Simular estadísticas
    const stats = {
      vistas: Math.floor(Math.random() * 1000) + 100,
      favoritas: Math.floor(Math.random() * 200) + 10,
      funciones: this.getFuncionesCount(),
      rating: this.pelicula.rating
    };

    const mensaje = `Estadísticas de "${this.pelicula.titulo}":\n\n` +
                   `• Vistas: ${stats.vistas}\n` +
                   `• En favoritas: ${stats.favoritas} usuarios\n` +
                   `• Funciones programadas: ${stats.funciones}\n` +
                   `• Rating promedio: ${stats.rating}/10`;

    alert(mensaje);
    console.log('Estadísticas:', stats);
  }

  /**
   * Obtener cantidad de funciones
   */
  getFuncionesCount(): number {
    const funciones = this._movieService.getFuncionesPelicula(this.peliculaIndex);
    return funciones.length;
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Recargar datos de la película desde el servicio
   */
  private recargarPelicula(): void {
    this.pelicula = this._movieService.getPelicula(this.peliculaIndex);
    
    // Actualizar trailer URL si cambió
    if (this.pelicula && this.pelicula.trailer) {
      const url = this._movieService.getTrailerUrl(this.peliculaIndex);
      this.trailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } else {
      this.trailerUrl = '';
    }
  }

  /**
   * Resetear datos de edición
   */
  private resetearEdicion(): void {
    this.peliculaEditando = null;
    this.errorEdicion = '';
    this.exitoEdicion = '';
    this.guardandoEdicion = false;
  }

  /**
   * Cerrar modal de edición programáticamente
   */
  private cerrarModalEdicion(): void {
    const modalElement = document.getElementById('modalEditarPelicula');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (modal) {
              modal.hide();
            }
          }
        }
      }