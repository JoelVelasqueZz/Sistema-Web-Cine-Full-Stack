// src/app/components/admin/admin-coming-soon/admin-coming-soon.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MovieService, ProximoEstreno } from '../../../services/movie.service'; // 🔄 USAR MOVIESERVICE EXISTENTE
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-coming-soon',
  templateUrl: './admin-coming-soon.component.html',
  styleUrls: ['./admin-coming-soon.component.css']
})
export class AdminComingSoonComponent implements OnInit, OnDestroy {
  estrenos: ProximoEstreno[] = [];
  estrenosFiltrados: ProximoEstreno[] = [];
  
  vistaActual: 'lista' | 'agregar' | 'editar' = 'lista';
  cargando = true;
  procesando = false;
  
  estrenoForm: Partial<ProximoEstreno> = {};
  estrenoEditandoIndex = -1;
  erroresValidacion: string[] = [];
  
  imageLoaded = false;
  imageError = false;
  
  filtroGenero = '';
  filtroAnio = '';
  terminoBusqueda = '';
  
  paginaActual = 1;
  estrenosPorPagina = 10;
  totalPaginas = 1;
  
  mostrarModalConfirmacion = false;
  estrenoParaEliminar = -1;
  
  estadisticas = {
    total: 0,
    porGenero: {} as { [key: string]: number },
    proximoEstreno: '',
    anioMasReciente: 0
  };
  
  readonly generosDisponibles = [
    'Acción', 'Aventura', 'Comedia', 'Drama', 'Terror', 'Romance', 
    'Ciencia Ficción', 'Fantasía', 'Animación', 'Misterio'
  ];
  
  readonly estudiosDisponibles = [
    'Disney', 'Marvel Studios', 'Warner Bros', 'Universal Pictures',
    'Paramount Pictures', 'Sony Pictures', 'Lionsgate', 'Netflix',
    'Amazon Studios', 'Apple TV+'
  ];

  // Nueva propiedad para manejar actores como texto
  actoresTexto: string = '';

  private subscriptions = new Subscription();

  constructor(
    private movieService: MovieService, // 🔄 USAR MOVIESERVICE EXISTENTE
    private adminService: AdminService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

 ngOnInit(): void {
  if (!this.authService.isAdmin()) {
    this.toastService.showError('No tienes permisos para gestionar próximos estrenos');
    this.router.navigate(['/home']);
    return;
  }

  // 🧪 TEMPORAL: Probar conexión API
  console.log('🧪 Probando conexión a API...');
  this.movieService.testComingSoonConnection();

  this.cargarEstrenos();
  
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

  // ==================== CARGAR DATOS ====================

  cargarEstrenos(): void {
  this.cargando = true;
  
  // 🔄 USAR MÉTODO HÍBRIDO DEL MOVIESERVICE
  this.movieService.getProximosEstrenosHybrid().subscribe(
    estrenos => {
      // ✅ YA NO NECESITAS MAPEAR idx aquí porque ya viene de la API
      this.estrenos = estrenos;
      
      this.aplicarFiltros();
      this.calcularEstadisticas();
      this.cargando = false;
      
      if (estrenos.length > 0) {
        this.toastService.showSuccess(`${estrenos.length} próximos estrenos cargados`);
      } else {
        this.toastService.showInfo('No hay próximos estrenos programados');
      }
    },
    error => {
      this.cargando = false;
      this.toastService.showError('Error al cargar próximos estrenos');
      console.error('Error cargando estrenos:', error);
      
      // 🔄 FALLBACK A DATOS LOCALES
      console.log('🔄 Usando datos locales como fallback');
      this.estrenos = this.movieService.getProximosEstrenos(); // Ya incluye idx
      this.aplicarFiltros();
      this.calcularEstadisticas();
    }
  );
}

  // ==================== CRUD OPERATIONS ====================

  private crearEstreno(): void {
    // 🔄 USAR MOVIESERVICE PARA CREAR
    this.movieService.addProximoEstreno(this.estrenoForm as Omit<ProximoEstreno, 'id'>).subscribe(
      success => {
        this.procesando = false;
        
        if (success) {
          this.toastService.showSuccess('Próximo estreno agregado exitosamente');
          this.cargarEstrenos();
          this.vistaActual = 'lista';
        } else {
          this.toastService.showError('Error al agregar el próximo estreno');
        }
      },
      error => {
        this.procesando = false;
        this.toastService.showError('Error de conexión al agregar estreno');
        console.error('Error creando estreno:', error);
      }
    );
  }

  private actualizarEstreno(): void {
    const estrenoSeleccionado = this.estrenos[this.estrenoEditandoIndex];
    
    if (!estrenoSeleccionado) {
      this.toastService.showError('No se pudo identificar el estreno a actualizar');
      this.procesando = false;
      return;
    }

    const estrenoId = estrenoSeleccionado.id || estrenoSeleccionado.idx;
    
    if (!estrenoId || estrenoId === 0) {
      this.toastService.showError('Error: ID de estreno inválido');
      this.procesando = false;
      return;
    }
    
    // 🔄 USAR MOVIESERVICE PARA ACTUALIZAR
    this.movieService.updateProximoEstreno(estrenoId, this.estrenoForm).subscribe(
      success => {
        this.procesando = false;
        
        if (success) {
          this.toastService.showSuccess('Próximo estreno actualizado exitosamente');
          this.cargarEstrenos();
          this.vistaActual = 'lista';
        } else {
          this.toastService.showError('Error al actualizar el próximo estreno');
        }
      },
      error => {
        this.procesando = false;
        this.toastService.showError('Error de conexión al actualizar estreno');
        console.error('Error actualizando estreno:', error);
      }
    );
  }

  eliminarEstreno(): void {
    if (this.estrenoParaEliminar >= 0) {
      this.procesando = true;
      
      const estrenoSeleccionado = this.estrenos[this.estrenoParaEliminar];
      
      if (!estrenoSeleccionado) {
        this.toastService.showError('No se pudo identificar el estreno a eliminar');
        this.procesando = false;
        return;
      }

      const estrenoId = estrenoSeleccionado.id || estrenoSeleccionado.idx;
      
      if (!estrenoId || estrenoId === 0) {
        this.toastService.showError('Error: ID de estreno inválido');
        this.procesando = false;
        return;
      }
      
      // 🔄 USAR MOVIESERVICE PARA ELIMINAR
      this.movieService.deleteProximoEstreno(estrenoId).subscribe(
        success => {
          this.procesando = false;
          
          if (success) {
            this.toastService.showSuccess('Próximo estreno eliminado exitosamente');
            this.cargarEstrenos();
            this.cerrarModalConfirmacion();
          } else {
            this.toastService.showError('Error al eliminar el próximo estreno');
            this.cerrarModalConfirmacion();
          }
        },
        error => {
          this.procesando = false;
          this.toastService.showError('Error de conexión al eliminar estreno');
          this.cerrarModalConfirmacion();
          console.error('Error eliminando estreno:', error);
        }
      );
    }
  }

  // ==================== VALIDACIÓN ====================

  guardarEstreno(): void {
    // 🔄 USAR VALIDACIÓN DEL MOVIESERVICE
    const validacion = this.movieService.validateProximoEstrenoData(this.estrenoForm);
    
    if (!validacion.valid) {
      this.erroresValidacion = validacion.errors;
      this.toastService.showError('Por favor corrige los errores en el formulario');
      return;
    }

    this.procesando = true;
    this.erroresValidacion = [];
    
    // Convertir actores de texto a array
    this.actualizarActores();
    
    const esAgregar = this.vistaActual === 'agregar';
    
    if (esAgregar) {
      this.crearEstreno();
    } else {
      this.actualizarEstreno();
    }
  }

  // ==================== RESTO DE MÉTODOS (IGUALES QUE ANTES) ====================

  private handleDataRefresh(event: any): void {
    if (event.detail.section === 'Gestión de Próximos Estrenos') {
      this.cargarEstrenos();
    }
  }

  actualizarActores(): void {
    if (this.actoresTexto.trim()) {
      this.estrenoForm.actores = this.actoresTexto.split(',').map(actor => actor.trim()).filter(actor => actor.length > 0);
    } else {
      this.estrenoForm.actores = [];
    }
  }

  // ... [Resto de métodos igual que en la implementación anterior]
  // getStatsArray(), getTableColumns(), getActions(), cambiarVista(), etc.
  
  getStatsArray() {
    return [
      { 
        value: this.estadisticas.total, 
        label: 'Total Estrenos', 
        bgClass: 'bg-primary text-white', 
        icon: 'fas fa-calendar-star'
      },
      { 
        value: this.getCantidadGeneros(), 
        label: 'Géneros Diferentes', 
        bgClass: 'bg-success text-white', 
        icon: 'fas fa-tags' 
      },
      { 
        value: this.getEstrenosProximoMes(), 
        label: 'Próximo Mes', 
        bgClass: 'bg-info text-white', 
        icon: 'fas fa-clock' 
      },
      { 
        value: this.estadisticas.anioMasReciente, 
        label: 'Año Más Lejano', 
        bgClass: 'bg-warning text-dark', 
        icon: 'fas fa-calendar' 
      }
    ];
  }

  getTableColumns() {
    return [
      { name: 'Estreno', width: '300' },
      { name: 'Género', width: '120' },
      { name: 'Fecha Estreno', width: '120' },
      { name: 'Director', width: '150' },
      { name: 'Estado', width: '100' },
      { name: 'Acciones', width: '150' }
    ];
  }

  getActions(estreno: ProximoEstreno) {
    return [
      { 
        icon: 'fas fa-eye', 
        class: 'btn-outline-info', 
        title: 'Ver detalles', 
        action: () => this.verEstreno(estreno) 
      },
      { 
        icon: 'fas fa-edit', 
        class: 'btn-outline-primary', 
        title: 'Editar estreno', 
        action: () => this.mostrarFormularioEditar(estreno) 
      },
      { 
        icon: 'fas fa-trash', 
        class: 'btn-outline-danger', 
        title: 'Eliminar estreno', 
        action: () => this.confirmarEliminarEstreno(estreno) 
      }
    ];
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

  mostrarFormularioEditar(estreno: ProximoEstreno): void {
    const indiceReal = this.estrenos.findIndex(e => 
      e.titulo === estreno.titulo && e.director === estreno.director
    );
    
    if (indiceReal !== -1) {
      this.estrenoForm = { 
        ...estreno,
        fechaEstreno: this.formatDateForInput(estreno.fechaEstreno)
      };
      
      // Convertir actores array a texto
      this.actoresTexto = estreno.actores ? estreno.actores.join(', ') : '';
      
      this.estrenoEditandoIndex = indiceReal;
      this.vistaActual = 'editar';
      this.erroresValidacion = [];
      this.imageError = false;
      this.imageLoaded = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.toastService.showError('No se pudo encontrar el estreno para editar');
    }
  }

  confirmarEliminarEstreno(estreno: ProximoEstreno): void {
    const indiceReal = this.estrenos.findIndex(e => 
      e.titulo === estreno.titulo && e.director === estreno.director
    );
    
    if (indiceReal !== -1) {
      this.estrenoParaEliminar = indiceReal;
      this.mostrarModalConfirmacion = true;
    } else {
      this.toastService.showError('No se pudo encontrar el estreno para eliminar');
    }
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.estrenoParaEliminar = -1;
  }

  verEstreno(estreno: ProximoEstreno): void {
    const estrenoId = estreno.id || estreno.idx;
    
    if (estrenoId) {
      this.router.navigate(['/coming-soon', estrenoId]);
    } else {
      this.toastService.showError('No se pudo encontrar el estreno');
    }
  }

  aplicarFiltros(): void {
    this.estrenosFiltrados = this.estrenos.filter(estreno => {
      const cumpleBusqueda = this.cumpleFiltroTexto(estreno);
      const cumpleGenero = !this.filtroGenero || estreno.genero === this.filtroGenero;
      const cumpleAnio = !this.filtroAnio || this.getAnioFromFecha(estreno.fechaEstreno) === parseInt(this.filtroAnio);
      
      return cumpleBusqueda && cumpleGenero && cumpleAnio;
    });
    this.calcularPaginacion();
  }

  private cumpleFiltroTexto(estreno: ProximoEstreno): boolean {
    if (!this.terminoBusqueda.trim()) return true;
    
    const termino = this.terminoBusqueda.toLowerCase();
    return [estreno.titulo, estreno.director, estreno.sinopsis]
      .some(campo => campo?.toLowerCase().includes(termino));
  }

  limpiarFiltros(): void {
    Object.assign(this, {
      terminoBusqueda: '',
      filtroGenero: '',
      filtroAnio: '',
      paginaActual: 1
    });
    
    this.aplicarFiltros();
    this.toastService.showInfo('Filtros limpiados');
  }

  hasActiveFilters(): boolean {
    return !!(this.terminoBusqueda || this.filtroGenero || this.filtroAnio);
  }

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.estrenosFiltrados.length / this.estrenosPorPagina);
    this.paginaActual = Math.min(this.paginaActual, Math.max(1, this.totalPaginas));
  }

  getEstrenosPaginaActual(): ProximoEstreno[] {
    const inicio = (this.paginaActual - 1) * this.estrenosPorPagina;
    return this.estrenosFiltrados.slice(inicio, inicio + this.estrenosPorPagina);
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
    const stats = this.estrenos.reduce((acc, estreno) => {
      acc.total++;
      const anio = this.getAnioFromFecha(estreno.fechaEstreno);
      acc.anioMasReciente = Math.max(acc.anioMasReciente, anio);
      acc.porGenero[estreno.genero] = (acc.porGenero[estreno.genero] || 0) + 1;
      return acc;
    }, {
      total: 0,
      anioMasReciente: 0,
      porGenero: {} as { [key: string]: number }
    });

    this.estadisticas = {
      total: stats.total,
      porGenero: stats.porGenero,
      proximoEstreno: this.getProximoEstreno(),
      anioMasReciente: stats.anioMasReciente
    };
  }

  resetearFormulario(): void {
    this.estrenoForm = {
      titulo: '',
      sinopsis: '',
      poster: '',
      fechaEstreno: '',
      estudio: '',
      genero: '',
      director: '',
      trailer: '',
      duracion: '',
      actores: []
    };
    this.actoresTexto = '';
    this.estrenoEditandoIndex = -1;
    this.erroresValidacion = [];
    this.imageError = false;
    this.imageLoaded = false;
  }

  // Métodos auxiliares
  getAniosDisponibles(): number[] {
    const anios = [...new Set(this.estrenos.map(e => this.getAnioFromFecha(e.fechaEstreno)))];
    return anios.sort((a, b) => a - b);
  }

  getAnioFromFecha(fecha: string): number {
    return new Date(fecha).getFullYear();
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  getCantidadGeneros(): number {
    return Object.keys(this.estadisticas.porGenero).length;
  }

  getEstrenosProximoMes(): number {
    const hoy = new Date();
    const proximoMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
    
    return this.estrenos.filter(e => {
      const fechaEstreno = new Date(e.fechaEstreno);
      return fechaEstreno >= hoy && fechaEstreno <= proximoMes;
    }).length;
  }

  getProximoEstreno(): string {
    const hoy = new Date();
    const proximosEstrenos = this.estrenos
      .filter(e => new Date(e.fechaEstreno) >= hoy)
      .sort((a, b) => new Date(a.fechaEstreno).getTime() - new Date(b.fechaEstreno).getTime());
    
    return proximosEstrenos.length > 0 ? proximosEstrenos[0].titulo : 'Ninguno';
  }

  getGeneroColor(genero: string): string {
    const colores: Record<string, string> = {
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

  getRangoElementos(): string {
    if (!this.estrenosFiltrados.length) return '0-0 de 0';
    
    const inicio = (this.paginaActual - 1) * this.estrenosPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.estrenosPorPagina, this.estrenosFiltrados.length);
    
    return `${inicio}-${fin} de ${this.estrenosFiltrados.length}`;
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
    this.estrenoForm.poster = url;
    this.imageError = false;
    this.imageLoaded = false;
  }

  getPosterExamples() {
    return [
      { url: 'assets/coming-soon/ejemplo.png', label: 'Assets', icon: 'fas fa-folder' },
      { url: 'https://via.placeholder.com/300x450/28a745/ffffff?text=Próximo+Estreno', label: 'URL Externa', icon: 'fas fa-globe' }
    ];
  }

  exportarEstrenos(): void {
    try {
      const datosExportar = {
        fechaExportacion: new Date().toISOString(),
        totalEstrenos: this.estrenos.length,
        estadisticas: this.estadisticas,
        fuente: 'API PostgreSQL con fallback local',
        estrenos: this.estrenos.map(({ titulo, director, genero, fechaEstreno, estudio }) => ({
          titulo, director, genero, fechaEstreno, estudio
        }))
      };
      
      const blob = new Blob([JSON.stringify(datosExportar, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      Object.assign(link, {
        href: url,
        download: `proximos-estrenos-export-${new Date().toISOString().split('T')[0]}.json`
      });
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.toastService.showSuccess('Lista de próximos estrenos exportada');
    } catch (error) {
      this.toastService.showError('Error al exportar la lista');
    }
  }

  trackEstrenoFn(index: number, estreno: ProximoEstreno): string {
    return estreno.titulo + estreno.director;
  }
}