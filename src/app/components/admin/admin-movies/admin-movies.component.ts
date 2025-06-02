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
  maxAnio: number = new Date().getFullYear() + 5;

  // Estados de vista
  vistaActual: 'lista' | 'agregar' | 'editar' = 'lista';
  cargando: boolean = true;
  procesando: boolean = false;
  
  // Formulario de película
  peliculaForm: Partial<Pelicula> = {};
  peliculaEditandoIndex: number = -1;
  erroresValidacion: string[] = [];
  
  // 🔥 NUEVAS PROPIEDADES para vista previa de imagen
  imageLoaded: boolean = false;
  imageError: boolean = false;
  
  // Filtros y búsqueda
  filtroGenero: string = '';
  filtroAnio: string = '';
  filtroRating: string = '';
  terminoBusqueda: string = '';
  
  // Paginación
  paginaActual: number = 1;
  peliculasPorPagina: number = 10;
  totalPaginas: number = 1;
  
  // Modal de confirmación
  mostrarModalConfirmacion: boolean = false;
  peliculaParaEliminar: number = -1;
  
  // Estadísticas
  estadisticas = {
    total: 0,
    porGenero: {} as { [key: string]: number },
    ratingPromedio: 0,
    anioMasReciente: 0
  };
  
  // Géneros disponibles
  generosDisponibles: string[] = [
    'Acción', 'Aventura', 'Comedia', 'Drama', 'Terror', 'Romance', 
    'Ciencia Ficción', 'Fantasía', 'Animación', 'Misterio'
  ];
  
  // Estudios disponibles
  estudiosDisponibles: string[] = [
    'assets/studios/disney.png',
    'assets/studios/marvel.png',
    'assets/studios/warner.png',
    'assets/studios/universal.png',
    'assets/studios/paramount.png',
    'assets/studios/sony.png',
    'assets/studios/lionsgate.png'
  ];

  private routeSubscription: Subscription = new Subscription();

  constructor(
    private movieService: MovieService,
    private adminService: AdminService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Verificar permisos de admin
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para gestionar películas');
      this.router.navigate(['/home']);
      return;
    }

    // Cargar datos iniciales
    this.cargarPeliculas();
    
    // Verificar si viene con acción específica desde query params
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        this.mostrarFormularioAgregar();
      }
    });

    // Escuchar evento de refresh desde admin-layout
    window.addEventListener('adminDataRefresh', this.handleDataRefresh.bind(this));

    console.log('Admin Movies inicializado');
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    window.removeEventListener('adminDataRefresh', this.handleDataRefresh.bind(this));
  }

  // ==================== CARGA DE DATOS ====================

  /**
   * Cargar todas las películas - CORREGIDO
   */
  cargarPeliculas(): void {
    this.cargando = true;
    
    try {
      // 🔥 CAMBIO: Usar adminService en lugar de movieService
      this.peliculas = this.adminService.getAllPeliculas();
      
      console.log('🎬 Películas cargadas:', this.peliculas);
      console.log('🎬 Cantidad:', this.peliculas.length);
      
      if (this.peliculas.length > 0) {
        console.log('🎬 Primera película:', this.peliculas[0]);
        
        // Agregar índices para facilitar el manejo
        this.peliculas = this.peliculas.map((pelicula, index) => ({
          ...pelicula,
          idx: index
        }));
      } else {
        console.warn('⚠️ No hay películas en el sistema');
      }
      
      this.aplicarFiltros();
      this.calcularEstadisticas();
      this.cargando = false;
      
      console.log(`✅ ${this.peliculas.length} películas cargadas exitosamente`);
    } catch (error) {
      console.error('❌ Error al cargar películas:', error);
      this.toastService.showError('Error al cargar las películas');
      this.cargando = false;
    }
  }

  /**
   * Manejar evento de refresh de datos
   */
  private handleDataRefresh(event: any): void {
    if (event.detail.section === 'Gestión de Películas') {
      this.cargarPeliculas();
    }
  }

  // ==================== GESTIÓN DE VISTA ====================

  /**
   * Cambiar vista actual
   */
  cambiarVista(vista: 'lista' | 'agregar' | 'editar'): void {
    this.vistaActual = vista;
    
    if (vista === 'lista') {
      this.resetearFormulario();
    }
  }

  /**
   * Mostrar formulario para agregar película
   */
  mostrarFormularioAgregar(): void {
    this.resetearFormulario();
    this.vistaActual = 'agregar';
    
    // Scroll hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Mostrar formulario para editar película - CORREGIDO
   */
  mostrarFormularioEditar(pelicula: Pelicula): void {
    // Buscar el índice real en el array original
    const indiceReal = this.peliculas.findIndex(p => 
      p.titulo === pelicula.titulo && p.director === pelicula.director
    );
    
    if (indiceReal !== -1) {
      this.peliculaForm = { ...pelicula };
      this.peliculaEditandoIndex = indiceReal;
      this.vistaActual = 'editar';
      this.erroresValidacion = [];
      
      // 🔥 RESETEAR estados de imagen
      this.imageError = false;
      this.imageLoaded = false;
      
      // Scroll hacia arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      console.log('✏️ Editando película:', pelicula.titulo, 'Índice:', indiceReal);
    } else {
      this.toastService.showError('No se pudo encontrar la película para editar');
    }
  }

  // ==================== CRUD DE PELÍCULAS ====================

  /**
   * Guardar película (crear o actualizar) - CORREGIDO
   */
  guardarPelicula(): void {
    // 🔥 CAMBIO: Usar adminService para validación
    const validacion = this.adminService.validatePeliculaData(this.peliculaForm);
    
    if (!validacion.valid) {
      this.erroresValidacion = validacion.errors;
      this.toastService.showError('Por favor corrige los errores en el formulario');
      return;
    }

    this.procesando = true;
    this.erroresValidacion = [];

    // Simular delay de procesamiento
    setTimeout(() => {
      try {
        let resultado: boolean;
        
        if (this.vistaActual === 'agregar') {
          // 🔥 CAMBIO: Usar adminService.createPelicula
          resultado = this.adminService.createPelicula(this.peliculaForm as Omit<Pelicula, 'idx'>);
          
          if (resultado) {
            this.toastService.showSuccess('Película agregada exitosamente');
            this.cargarPeliculas(); // Recargar lista
            this.vistaActual = 'lista';
          } else {
            this.toastService.showError('Error al agregar la película');
          }
          
        } else if (this.vistaActual === 'editar') {
          // 🔥 CAMBIO: Usar adminService.updatePelicula
          resultado = this.adminService.updatePelicula(this.peliculaEditandoIndex, this.peliculaForm);
          
          if (resultado) {
            this.toastService.showSuccess('Película actualizada exitosamente');
            this.cargarPeliculas(); // Recargar lista
            this.vistaActual = 'lista';
          } else {
            this.toastService.showError('Error al actualizar la película');
          }
        }
        
        this.procesando = false;
        
      } catch (error) {
        console.error('Error al guardar película:', error);
        this.toastService.showError('Error inesperado al guardar la película');
        this.procesando = false;
      }
    }, 1000);
  }

  /**
   * Confirmar eliminación de película - CORREGIDO
   */
  confirmarEliminarPelicula(pelicula: Pelicula): void {
    // Buscar el índice real en el array original
    const indiceReal = this.peliculas.findIndex(p => 
      p.titulo === pelicula.titulo && p.director === pelicula.director
    );
    
    if (indiceReal !== -1) {
      this.peliculaParaEliminar = indiceReal;
      this.mostrarModalConfirmacion = true;
      console.log('🗑️ Preparando eliminar:', pelicula.titulo, 'Índice:', indiceReal);
    } else {
      this.toastService.showError('No se pudo encontrar la película para eliminar');
    }
  }

  /**
   * Eliminar película confirmada - CORREGIDO
   */
  eliminarPelicula(): void {
    if (this.peliculaParaEliminar >= 0) {
      this.procesando = true;
      
      setTimeout(() => {
        // 🔥 CAMBIO: Usar adminService.deletePelicula
        const resultado = this.adminService.deletePelicula(this.peliculaParaEliminar);
        
        if (resultado) {
          this.toastService.showSuccess('Película eliminada exitosamente');
          this.cargarPeliculas(); // Recargar lista
        } else {
          this.toastService.showError('Error al eliminar la película');
        }
        
        this.cerrarModalConfirmacion();
        this.procesando = false;
      }, 1000);
    }
  }

  /**
   * Cerrar modal de confirmación
   */
  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.peliculaParaEliminar = -1;
  }

  // ==================== FILTROS Y BÚSQUEDA ====================

  /**
   * Aplicar filtros a la lista de películas
   */
  aplicarFiltros(): void {
    let peliculasFiltradas = [...this.peliculas];

    // Filtro por búsqueda de texto
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      peliculasFiltradas = peliculasFiltradas.filter(pelicula =>
        pelicula.titulo.toLowerCase().includes(termino) ||
        pelicula.director.toLowerCase().includes(termino) ||
        pelicula.sinopsis.toLowerCase().includes(termino)
      );
    }

    // Filtro por género
    if (this.filtroGenero) {
      peliculasFiltradas = peliculasFiltradas.filter(pelicula =>
        pelicula.genero === this.filtroGenero
      );
    }

    // Filtro por año
    if (this.filtroAnio) {
      const anio = parseInt(this.filtroAnio);
      peliculasFiltradas = peliculasFiltradas.filter(pelicula =>
        pelicula.anio === anio
      );
    }

    // Filtro por rating
    if (this.filtroRating) {
      const rating = parseFloat(this.filtroRating);
      peliculasFiltradas = peliculasFiltradas.filter(pelicula =>
        pelicula.rating >= rating
      );
    }

    this.peliculasFiltradas = peliculasFiltradas;
    this.calcularPaginacion();
    console.log('🔍 Películas filtradas:', this.peliculasFiltradas.length);
  }

  /**
   * Limpiar todos los filtros
   */
  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroGenero = '';
    this.filtroAnio = '';
    this.filtroRating = '';
    this.paginaActual = 1;
    
    this.aplicarFiltros();
    this.toastService.showInfo('Filtros limpiados');
  }

  // ==================== PAGINACIÓN ====================

  /**
   * Calcular paginación
   */
  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.peliculasFiltradas.length / this.peliculasPorPagina);
    
    // Ajustar página actual si es necesario
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = Math.max(1, this.totalPaginas);
    }
  }

  /**
   * Obtener películas de la página actual - SIMPLIFICADO
   */
  getPeliculasPaginaActual(): Pelicula[] {
    const inicio = (this.paginaActual - 1) * this.peliculasPorPagina;
    const fin = inicio + this.peliculasPorPagina;
    
    const resultado = this.peliculasFiltradas.slice(inicio, fin);
    
    console.log('📄 Mostrando películas:', inicio + 1, 'a', Math.min(fin, this.peliculasFiltradas.length));
    console.log('📄 Total filtradas:', this.peliculasFiltradas.length);
    
    return resultado;
  }

  /**
   * Cambiar página
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  /**
   * Obtener array de páginas para mostrar
   */
  getPaginasArray(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin = Math.min(this.totalPaginas, this.paginaActual + 2);
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Calcular estadísticas de películas
   */
  calcularEstadisticas(): void {
    this.estadisticas.total = this.peliculas.length;
    
    // Estadísticas por género
    this.estadisticas.porGenero = {};
    let sumaRatings = 0;
    let anioMasReciente = 0;
    
    this.peliculas.forEach(pelicula => {
      // Contar por género
      const genero = pelicula.genero;
      this.estadisticas.porGenero[genero] = (this.estadisticas.porGenero[genero] || 0) + 1;
      
      // Sumar ratings
      sumaRatings += pelicula.rating;
      
      // Año más reciente
      if (pelicula.anio > anioMasReciente) {
        anioMasReciente = pelicula.anio;
      }
    });
    
    // Rating promedio
    this.estadisticas.ratingPromedio = this.peliculas.length > 0 
      ? Math.round((sumaRatings / this.peliculas.length) * 10) / 10 
      : 0;
    
    this.estadisticas.anioMasReciente = anioMasReciente;
  }

  /**
   * Obtener géneros ordenados por popularidad
   */
  getGenerosOrdenados(): { genero: string; cantidad: number; porcentaje: number }[] {
    return Object.entries(this.estadisticas.porGenero)
      .map(([genero, cantidad]) => ({
        genero,
        cantidad,
        porcentaje: Math.round((cantidad / this.estadisticas.total) * 100)
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  // ==================== UTILIDADES ====================

  /**
   * Resetear formulario - ACTUALIZADO con imagen
   */
  resetearFormulario(): void {
    this.peliculaForm = {
      titulo: '',
      sinopsis: '',
      poster: '',
      fechaEstreno: '',
      estudio: '',
      genero: '',
      anio: new Date().getFullYear(),
      duracion: '',
      rating: 0,
      director: '',
      trailer: ''
    };
    this.peliculaEditandoIndex = -1;
    this.erroresValidacion = [];
    
    // 🔥 RESETEAR estados de imagen
    this.imageError = false;
    this.imageLoaded = false;
  }

  /**
   * Obtener años disponibles para filtro
   */
  getAniosDisponibles(): number[] {
    const anios = [...new Set(this.peliculas.map(p => p.anio))];
    return anios.sort((a, b) => b - a);
  }

  /**
   * Formatear duración para mostrar
   */
  formatearDuracion(duracion: string): string {
    return duracion || 'No especificada';
  }

  /**
   * Obtener clase CSS para rating
   */
  getRatingClass(rating: number): string {
    if (rating >= 8) return 'bg-success';
    if (rating >= 7) return 'bg-warning';
    if (rating >= 6) return 'bg-info';
    return 'bg-secondary';
  }

  /**
   * Obtener color para género
   */
  getGeneroColor(genero: string): string {
    const colores: { [key: string]: string } = {
      'Acción': 'danger',
      'Aventura': 'warning',
      'Comedia': 'success',
      'Drama': 'primary',
      'Terror': 'dark',
      'Romance': 'info',
      'Ciencia Ficción': 'secondary',
      'Fantasía': 'purple',
      'Animación': 'orange',
      'Misterio': 'indigo'
    };
    
    return colores[genero] || 'primary';
  }

  /**
   * Validar URL de imagen
   */
  validarImagenURL(url: string): boolean {
    const patron = /\.(jpg|jpeg|png|gif|webp)$/i;
    return patron.test(url) || url.startsWith('assets/');
  }

  /**
   * Validar ID de trailer de YouTube
   */
  validarTrailerYT(trailerId: string): boolean {
    return /^[a-zA-Z0-9_-]{11}$/.test(trailerId);
  }

  /**
   * Exportar lista de películas
   */
  exportarPeliculas(): void {
    try {
      const datosExportar = {
        fechaExportacion: new Date().toISOString(),
        totalPeliculas: this.peliculas.length,
        estadisticas: this.estadisticas,
        peliculas: this.peliculas.map(p => ({
          titulo: p.titulo,
          director: p.director,
          genero: p.genero,
          anio: p.anio,
          rating: p.rating,
          duracion: p.duracion
        }))
      };
      
      const blob = new Blob([JSON.stringify(datosExportar, null, 2)], 
        { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `peliculas-export-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.toastService.showSuccess('Lista de películas exportada');
      
    } catch (error) {
      console.error('Error al exportar:', error);
      this.toastService.showError('Error al exportar la lista');
    }
  }

  /**
   * Obtener información de rango de elementos mostrados
   */
  getRangoElementos(): string {
    const inicio = (this.paginaActual - 1) * this.peliculasPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.peliculasPorPagina, this.peliculasFiltradas.length);
    const total = this.peliculasFiltradas.length;
    
    return `${inicio}-${fin} de ${total}`;
  }

  /**
   * Obtener cantidad de géneros únicos
   */
  getCantidadGeneros(): number {
    return Object.keys(this.estadisticas.porGenero).length;
  }

  /**
   * Obtener nombre del estudio desde la URL
   */
  getEstudioNombre(estudioPath: string): string {
    try {
      const nombreArchivo = estudioPath.split('/').pop() || '';
      const nombreSinExtension = nombreArchivo.split('.')[0] || '';
      return nombreSinExtension.charAt(0).toUpperCase() + nombreSinExtension.slice(1);
    } catch (error) {
      return 'Estudio Desconocido';
    }
  }

  /**
   * Acceso a Object.keys para el template
   */
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  /**
   * Track function para ngFor optimizado
   */
  trackPeliculaFn(index: number, pelicula: Pelicula): string {
    return pelicula.titulo + pelicula.director; // Identificador único
  }

  // ==================== 🔥 NUEVOS MÉTODOS PARA VISTA PREVIA ====================

  /**
   * Manejar error de carga de imagen
   */
  onImageError(event: any): void {
    this.imageError = true;
    this.imageLoaded = false;
    console.log('Error al cargar imagen:', event);
  }
verPelicula(pelicula: Pelicula): void {
  // Buscar el índice real en el array original (igual que haces para editar/eliminar)
  const indiceReal = this.peliculas.findIndex(p => 
    p.titulo === pelicula.titulo && p.director === pelicula.director
  );
  
  if (indiceReal !== -1) {
    this.router.navigate(['/movie', indiceReal]);
    console.log('👁️ Navegando a detalles:', pelicula.titulo, 'Índice:', indiceReal);
  } else {
    this.toastService.showError('No se pudo encontrar la película');
  }
}
  /**
   * Manejar carga exitosa de imagen
   */
  onImageLoad(event: any): void {
    this.imageError = false;
    this.imageLoaded = true;
    console.log('Imagen cargada exitosamente');
  }

  /**
   * Establecer ejemplo de poster
   */
  setExamplePoster(url: string): void {
    this.peliculaForm.poster = url;
    this.imageError = false;
    this.imageLoaded = false;
  }
}