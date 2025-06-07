import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MovieService, Pelicula } from '../../../services/movie.service';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-movies',
  standalone: false,
  templateUrl: './admin-movies.component.html',
  styleUrls: ['./admin-movies.component.css']
})
export class AdminMoviesComponent implements OnInit, OnDestroy {
  peliculas: Pelicula[] = [];
  peliculasFiltradas: Pelicula[] = [];
  maxAnio = new Date().getFullYear() + 5;
  
  vistaActual: 'lista' | 'agregar' | 'editar' = 'lista';
  cargando = true;
  procesando = false;
  
  peliculaForm: Partial<Pelicula> = {};
  peliculaEditandoIndex = -1;
  erroresValidacion: string[] = [];
  
  imageLoaded = false;
  imageError = false;
  
  filtroGenero = '';
  filtroAnio = '';
  filtroRating = '';
  terminoBusqueda = '';
  
  paginaActual = 1;
  peliculasPorPagina = 10;
  totalPaginas = 1;
  
  mostrarModalConfirmacion = false;
  peliculaParaEliminar = -1;
  
  estadisticas = {
    total: 0,
    porGenero: {} as { [key: string]: number },
    ratingPromedio: 0,
    anioMasReciente: 0
  };
  
  readonly generosDisponibles = [
    'Acción', 'Aventura', 'Comedia', 'Drama', 'Terror', 'Romance', 
    'Ciencia Ficción', 'Fantasía', 'Animación', 'Misterio'
  ];
  
  readonly estudiosDisponibles = [
    'assets/studios/disney.png', 'assets/studios/marvel.png', 'assets/studios/warner.png',
    'assets/studios/universal.png', 'assets/studios/paramount.png', 'assets/studios/sony.png',
    'assets/studios/lionsgate.png'
  ];

  connectionStatus = 'connected'; // Siempre conectado con nueva API
  private subscriptions = new Subscription();

  constructor(
    private movieService: MovieService,
    private adminService: AdminService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para gestionar películas');
      this.router.navigate(['/home']);
      return;
    }

    this.cargarPeliculas();
    
    this.subscriptions.add(
      this.route.queryParams.subscribe(params => {
        if (params['action'] === 'add') {
          this.mostrarFormularioAgregar();
        }
      })
    );

    window.addEventListener('adminDataRefresh', this.handleDataRefresh.bind(this));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    window.removeEventListener('adminDataRefresh', this.handleDataRefresh.bind(this));
  }

  cargarPeliculas(): void {
    this.cargando = true;
    this.connectionStatus = 'connected';
    
    // 🔄 ACTUALIZADO: Usar AdminService con Observables
    this.adminService.getAllPeliculas().subscribe(
      peliculas => {
        this.peliculas = peliculas.map((pelicula, index) => ({ 
          ...pelicula, 
          idx: pelicula.id || index
        }));
        
        this.aplicarFiltros();
        this.calcularEstadisticas();
        this.cargando = false;
        
        if (peliculas.length > 0) {
          this.toastService.showSuccess(`${peliculas.length} películas cargadas desde el servidor`);
        } else {
          this.toastService.showInfo('No hay películas en el servidor');
        }
      },
      error => {
        this.cargando = false;
        this.toastService.showError('Error al cargar películas desde el servidor');
        console.error('Error cargando películas:', error);
      }
    );
  }

  recargarPeliculas(): void {
    this.cargarPeliculas();
  }

  getStatsArray() {
    return [
      { 
        value: this.estadisticas.total, 
        label: 'Total Películas', 
        bgClass: 'bg-primary text-white', 
        icon: 'fas fa-film',
        extra: '(API)'
      },
      { value: this.estadisticas.ratingPromedio, label: 'Rating Promedio', bgClass: 'bg-success text-white', icon: 'fas fa-star' },
      { value: this.getCantidadGeneros(), label: 'Géneros Diferentes', bgClass: 'bg-info text-white', icon: 'fas fa-tags' },
      { value: this.estadisticas.anioMasReciente, label: 'Año Más Reciente', bgClass: 'bg-warning text-dark', icon: 'fas fa-calendar' }
    ];
  }

  getTableColumns() {
    return [
      { name: 'Película', width: '300' },
      { name: 'Género', width: '120' },
      { name: 'Año', width: '80' },
      { name: 'Rating', width: '100' },
      { name: 'Duración', width: '120' },
      { name: 'Acciones', width: '150' }
    ];
  }

  getActions(pelicula: Pelicula) {
    return [
      { icon: 'fas fa-eye', class: 'btn-outline-info', title: 'Ver detalles', action: () => this.verPelicula(pelicula) },
      { icon: 'fas fa-edit', class: 'btn-outline-primary', title: 'Editar película', action: () => this.mostrarFormularioEditar(pelicula) },
      { icon: 'fas fa-trash', class: 'btn-outline-danger', title: 'Eliminar película', action: () => this.confirmarEliminarPelicula(pelicula) }
    ];
  }

  getPosterExamples() {
    return [
      { url: 'assets/movies/ejemplo.png', label: 'Assets', icon: 'fas fa-folder' },
      { url: 'https://via.placeholder.com/300x450/007bff/ffffff?text=Poster', label: 'URL Externa', icon: 'fas fa-globe' }
    ];
  }

  private handleDataRefresh(event: any): void {
    if (event.detail.section === 'Gestión de Películas') {
      this.cargarPeliculas();
    }
  }

  cambiarVista(vista: 'lista' | 'agregar' | 'editar'): void {
    this.vistaActual = vista;
    if (vista === 'lista') {
      this.resetearFormulario();
    }
  }

  mostrarFormularioAgregar(): void {
    this.resetearFormulario();
    this.vistaActual = 'agregar';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  mostrarFormularioEditar(pelicula: Pelicula): void {
    const indiceReal = this.peliculas.findIndex(p => 
      p.titulo === pelicula.titulo && p.director === pelicula.director
    );
    
    if (indiceReal !== -1) {
      this.peliculaForm = { ...pelicula };
      this.peliculaEditandoIndex = indiceReal;
      this.vistaActual = 'editar';
      this.erroresValidacion = [];
      this.imageError = false;
      this.imageLoaded = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.toastService.showError('No se pudo encontrar la película para editar');
    }
  }

  guardarPelicula(): void {
    const validacion = this.adminService.validatePeliculaData(this.peliculaForm);
    
    if (!validacion.valid) {
      this.erroresValidacion = validacion.errors;
      this.toastService.showError('Por favor corrige los errores en el formulario');
      return;
    }

    this.procesando = true;
    this.erroresValidacion = [];
    
    const esAgregar = this.vistaActual === 'agregar';
    
    if (esAgregar) {
      this.crearPelicula();
    } else {
      this.actualizarPelicula();
    }
  }

  private crearPelicula(): void {
    // 🔄 ACTUALIZADO: Usar AdminService Observable
    this.adminService.createPelicula(this.peliculaForm as Omit<Pelicula, 'idx' | 'id'>).subscribe(
      success => {
        this.procesando = false;
        
        if (success) {
          this.toastService.showSuccess('Película agregada exitosamente');
          this.cargarPeliculas();
          this.vistaActual = 'lista';
        } else {
          this.toastService.showError('Error al agregar la película');
        }
      },
      error => {
        this.procesando = false;
        this.toastService.showError('Error de conexión al agregar película');
        console.error('Error creando película:', error);
      }
    );
  }

  private actualizarPelicula(): void {
    const peliculaSeleccionada = this.peliculas[this.peliculaEditandoIndex];
    
    if (!peliculaSeleccionada) {
      this.toastService.showError('No se pudo identificar la película a actualizar');
      this.procesando = false;
      return;
    }

    const peliculaId = peliculaSeleccionada.id || peliculaSeleccionada.idx;
    
    if (!peliculaId || peliculaId === 0) {
      this.toastService.showError('Error: ID de película inválido');
      this.procesando = false;
      return;
    }
    
    // 🔄 ACTUALIZADO: Usar AdminService Observable
    this.adminService.updatePelicula(peliculaId, this.peliculaForm).subscribe(
      success => {
        this.procesando = false;
        
        if (success) {
          this.toastService.showSuccess('Película actualizada exitosamente');
          this.cargarPeliculas();
          this.vistaActual = 'lista';
        } else {
          this.toastService.showError('Error al actualizar la película');
        }
      },
      error => {
        this.procesando = false;
        this.toastService.showError('Error de conexión al actualizar película');
        console.error('Error actualizando película:', error);
      }
    );
  }

  confirmarEliminarPelicula(pelicula: Pelicula): void {
    const indiceReal = this.peliculas.findIndex(p => 
      p.titulo === pelicula.titulo && p.director === pelicula.director
    );
    
    if (indiceReal !== -1) {
      this.peliculaParaEliminar = indiceReal;
      this.mostrarModalConfirmacion = true;
    } else {
      this.toastService.showError('No se pudo encontrar la película para eliminar');
    }
  }

  eliminarPelicula(): void {
    if (this.peliculaParaEliminar >= 0) {
      this.procesando = true;
      
      const peliculaSeleccionada = this.peliculas[this.peliculaParaEliminar];
      
      if (!peliculaSeleccionada) {
        this.toastService.showError('No se pudo identificar la película a eliminar');
        this.procesando = false;
        return;
      }

      const peliculaId = peliculaSeleccionada.id || peliculaSeleccionada.idx;
      
      if (!peliculaId || peliculaId === 0) {
        this.toastService.showError('Error: ID de película inválido');
        this.procesando = false;
        return;
      }
      
      // 🔄 ACTUALIZADO: Usar AdminService Observable
      this.adminService.deletePelicula(peliculaId).subscribe(
        success => {
          this.procesando = false;
          
          if (success) {
            this.toastService.showSuccess('Película eliminada exitosamente');
            this.cargarPeliculas();
            this.cerrarModalConfirmacion();
          } else {
            this.toastService.showError('Error al eliminar la película');
            this.cerrarModalConfirmacion();
          }
        },
        error => {
          this.procesando = false;
          this.toastService.showError('Error de conexión al eliminar película');
          this.cerrarModalConfirmacion();
          console.error('Error eliminando película:', error);
        }
      );
    }
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.peliculaParaEliminar = -1;
  }

  verPelicula(pelicula: Pelicula): void {
    const peliculaId = pelicula.id || pelicula.idx;
    
    if (peliculaId) {
      this.router.navigate(['/movie', peliculaId]);
    } else {
      this.toastService.showError('No se pudo encontrar la película');
    }
  }

  aplicarFiltros(): void {
    this.peliculasFiltradas = this.peliculas.filter(pelicula => {
      const cumpleBusqueda = this.cumpleFiltroTexto(pelicula);
      const cumpleGenero = !this.filtroGenero || pelicula.genero === this.filtroGenero;
      const cumpleAnio = !this.filtroAnio || pelicula.anio === parseInt(this.filtroAnio);
      const cumpleRating = !this.filtroRating || pelicula.rating >= parseFloat(this.filtroRating);
      
      return cumpleBusqueda && cumpleGenero && cumpleAnio && cumpleRating;
    });
    this.calcularPaginacion();
  }

  private cumpleFiltroTexto(pelicula: Pelicula): boolean {
    if (!this.terminoBusqueda.trim()) return true;
    
    const termino = this.terminoBusqueda.toLowerCase();
    return [pelicula.titulo, pelicula.director, pelicula.sinopsis]
      .some(campo => campo.toLowerCase().includes(termino));
  }

  limpiarFiltros(): void {
    Object.assign(this, {
      terminoBusqueda: '',
      filtroGenero: '',
      filtroAnio: '',
      filtroRating: '',
      paginaActual: 1
    });
    
    this.aplicarFiltros();
    this.toastService.showInfo('Filtros limpiados');
  }

  hasActiveFilters(): boolean {
    return !!(this.terminoBusqueda || this.filtroGenero || this.filtroAnio || this.filtroRating);
  }

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.peliculasFiltradas.length / this.peliculasPorPagina);
    this.paginaActual = Math.min(this.paginaActual, Math.max(1, this.totalPaginas));
  }

  getPeliculasPaginaActual(): Pelicula[] {
    const inicio = (this.paginaActual - 1) * this.peliculasPorPagina;
    return this.peliculasFiltradas.slice(inicio, inicio + this.peliculasPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  getPaginasArray(): number[] {
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin = Math.min(this.totalPaginas, this.paginaActual + 2);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  }

  calcularEstadisticas(): void {
    const stats = this.peliculas.reduce((acc, pelicula) => {
      acc.total++;
      acc.sumaRatings += pelicula.rating;
      acc.anioMasReciente = Math.max(acc.anioMasReciente, pelicula.anio);
      acc.porGenero[pelicula.genero] = (acc.porGenero[pelicula.genero] || 0) + 1;
      return acc;
    }, {
      total: 0,
      sumaRatings: 0,
      anioMasReciente: 0,
      porGenero: {} as { [key: string]: number }
    });

    this.estadisticas = {
      total: stats.total,
      porGenero: stats.porGenero,
      ratingPromedio: stats.total > 0 ? Math.round((stats.sumaRatings / stats.total) * 10) / 10 : 0,
      anioMasReciente: stats.anioMasReciente
    };
  }

  resetearFormulario(): void {
    this.peliculaForm = {
      titulo: '', sinopsis: '', poster: '', fechaEstreno: '', estudio: '',
      genero: '', anio: new Date().getFullYear(), duracion: '', rating: 0,
      director: '', trailer: ''
    };
    this.peliculaEditandoIndex = -1;
    this.erroresValidacion = [];
    this.imageError = false;
    this.imageLoaded = false;
  }

  getAniosDisponibles(): number[] {
    const anios = [...new Set(this.peliculas.map(p => p.anio))];
    return anios.sort((a, b) => b - a);
  }

  formatearDuracion(duracion: string): string { 
    return duracion || 'No especificada'; 
  }

  getRatingClass(rating: number): string {
    if (rating >= 8) return 'bg-success';
    if (rating >= 7) return 'bg-warning';
    if (rating >= 6) return 'bg-info';
    return 'bg-secondary';
  }

  getGeneroColor(genero: string): string {
    const colores: Record<string, string> = {
      'Acción': 'danger', 'Aventura': 'warning', 'Comedia': 'success', 'Drama': 'primary',
      'Terror': 'dark', 'Romance': 'info', 'Ciencia Ficción': 'secondary', 'Fantasía': 'purple',
      'Animación': 'orange', 'Misterio': 'indigo'
    };
    return colores[genero] || 'primary';
  }

  exportarPeliculas(): void {
    try {
      const datosExportar = {
        fechaExportacion: new Date().toISOString(),
        totalPeliculas: this.peliculas.length,
        estadisticas: this.estadisticas,
        fuente: 'API PostgreSQL',
        peliculas: this.peliculas.map(({ titulo, director, genero, anio, rating, duracion }) => ({
          titulo, director, genero, anio, rating, duracion
        }))
      };
      
      const blob = new Blob([JSON.stringify(datosExportar, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      Object.assign(link, {
        href: url,
        download: `peliculas-export-${new Date().toISOString().split('T')[0]}.json`
      });
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.toastService.showSuccess('Lista de películas exportada');
    } catch (error) {
      this.toastService.showError('Error al exportar la lista');
    }
  }

  getRangoElementos(): string {
    if (!this.peliculasFiltradas.length) return '0-0 de 0';
    
    const inicio = (this.paginaActual - 1) * this.peliculasPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.peliculasPorPagina, this.peliculasFiltradas.length);
    
    return `${inicio}-${fin} de ${this.peliculasFiltradas.length}`;
  }

  getCantidadGeneros(): number { 
    return Object.keys(this.estadisticas.porGenero).length; 
  }

  getEstudioNombre(estudioPath: string): string {
    try {
      const nombreArchivo = estudioPath.split('/').pop() || '';
      const nombreSinExtension = nombreArchivo.split('.')[0] || '';
      return nombreSinExtension.charAt(0).toUpperCase() + nombreSinExtension.slice(1);
    } catch (error) {
      return 'Estudio Desconocido';
    }
  }

  trackPeliculaFn(index: number, pelicula: Pelicula): string {
    return pelicula.titulo + pelicula.director;
  }

  onImageError(event: any): void {
    this.imageError = true;
    this.imageLoaded = false;
  }

  onImageLoad(event: any): void {
    this.imageError = false;
    this.imageLoaded = true;
  }

  setExamplePoster(url: string): void {
    this.peliculaForm.poster = url;
    this.imageError = false;
    this.imageLoaded = false;
  }

  getConnectionStatusClass(): string {
    return 'text-success'; // Siempre conectado
  }

  getConnectionStatusIcon(): string {
    return 'fas fa-wifi';
  }

  getConnectionStatusText(): string {
    return 'Conectado al servidor PostgreSQL';
  }

  sincronizarDatos(): void {
    this.toastService.showInfo('Recargando datos desde el servidor...');
    this.cargarPeliculas();
  }
}