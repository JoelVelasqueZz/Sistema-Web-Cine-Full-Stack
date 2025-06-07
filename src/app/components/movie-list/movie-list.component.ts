import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Pelicula, MovieService } from '../../services/movie.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-movie-list',
  standalone: false,
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.css'
})
export class MovieListComponent implements OnInit {
  peliculas: Pelicula[] = [];
  peliculasOriginales: Pelicula[] = [];
  peliculasFiltradas: Pelicula[] = [];
  filtroActivo: string = 'ninguno';
  
  generoSeleccionado: string = 'todos';
  generosDisponibles: string[] = [];
  
  // Estados de carga
  cargando = true;
  errorConexion = false;

  constructor(
    private movieService: MovieService, // 🔧 Solo MovieService
    private router: Router,
    private route: ActivatedRoute,
    public authService: AuthService,
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarPeliculas();
    this.verificarParametrosURL();
  }

  // 🔧 MÉTODO CORREGIDO: Usar solo MovieService
  cargarPeliculas(): void {
    this.cargando = true;
    this.errorConexion = false;

    // Usar MovieService (que ya conecta con la API internamente)
    this.movieService.getPeliculas().subscribe(
      peliculas => {
        console.log('✅ Películas cargadas:', peliculas.length);
        
        this.peliculasOriginales = peliculas;
        this.peliculas = [...this.peliculasOriginales];
        this.peliculasFiltradas = [...this.peliculas];
        this.extraerGeneros();
        this.cargando = false;
        this.errorConexion = false;

        if (peliculas.length === 0) {
          this.toastService.showInfo('No hay películas disponibles');
        }
      },
      error => {
        console.error('❌ Error al cargar películas:', error);
        this.errorConexion = true;
        this.cargando = false;
        this.toastService.showError('Error al cargar las películas');
        
        // Usar array vacío como fallback
        this.peliculasOriginales = [];
        this.peliculas = [];
        this.peliculasFiltradas = [];
        this.extraerGeneros();
      }
    );
  }

  // 🔧 MÉTODO: Reintentar conexión
  reintentarConexion(): void {
    this.toastService.showInfo('Reintentando conexión...');
    this.cargarPeliculas();
  }

  // NUEVO: Verificar si una película está en favoritas
  isInFavorites(peliculaIndex: number): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    return this.userService.isInFavorites(currentUser.id, peliculaIndex);
  }

  // NUEVO: Toggle favoritas
  toggleFavorite(peliculaIndex: number, event: Event): void {
    event.stopPropagation();
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.showWarning('Debes iniciar sesión para agregar favoritas');
      this.router.navigate(['/login']);
      return;
    }

    const pelicula = this.peliculas.find(p => p.idx === peliculaIndex || p.id === peliculaIndex);
    if (!pelicula) return;

    const isCurrentlyFavorite = this.isInFavorites(peliculaIndex);
    
    if (isCurrentlyFavorite) {
      const success = this.userService.removeFromFavorites(currentUser.id, peliculaIndex);
      if (success) {
        this.toastService.showSuccess(`"${pelicula.titulo}" removida de favoritas`);
      } else {
        this.toastService.showError('Error al remover de favoritas');
      }
    } else {
      const peliculaFavorita = {
        peliculaId: peliculaIndex,
        titulo: pelicula.titulo,
        poster: pelicula.poster,
        genero: pelicula.genero,
        anio: pelicula.anio,
        rating: pelicula.rating,
        fechaAgregada: new Date().toISOString()
      };
      
      const success = this.userService.addToFavorites(currentUser.id, peliculaFavorita);
      if (success) {
        this.toastService.showSuccess(`"${pelicula.titulo}" agregada a favoritas`);
      } else {
        this.toastService.showWarning('La película ya está en favoritas');
      }
    }
  }

  // MÉTODOS EXISTENTES (MANTENER TODOS)
  extraerGeneros(): void {
    const generosEnPeliculas = [...new Set(this.peliculasOriginales.map(p => p.genero).filter(g => g))];
    const generosPredefinidos = ['Acción', 'Aventura', 'Romance', 'Comedia', 'Terror', 'Fantasía', 'Misterio', 'Drama', 'Ciencia Ficción'];
    const todosLosGeneros = [...new Set([...generosEnPeliculas, ...generosPredefinidos])];
    this.generosDisponibles = todosLosGeneros.sort();
  }

  verificarParametrosURL(): void {
    this.route.queryParams.subscribe(params => {
      if (params['genre']) {
        this.filtrarPorGenero(params['genre']);
      }
    });
  }

  filtrarPorGenero(genero: string): void {
    this.generoSeleccionado = genero;
    this.aplicarFiltrosCombinados();
  }

  private aplicarFiltrosCombinados(): void {
    let peliculasBase: Pelicula[];
    
    if (this.generoSeleccionado === 'todos') {
      peliculasBase = [...this.peliculasOriginales];
    } else {
      peliculasBase = this.peliculasOriginales.filter(pelicula => 
        pelicula.genero && pelicula.genero.toLowerCase() === this.generoSeleccionado.toLowerCase()
      );
    }

    switch (this.filtroActivo) {
      case 'rating':
        this.peliculas = peliculasBase.sort((a, b) => b.rating - a.rating);
        break;
      case 'recientes':
        this.peliculas = peliculasBase.sort((a, b) => {
          const fechaA = new Date(a.fechaEstreno).getTime();
          const fechaB = new Date(b.fechaEstreno).getTime();
          return fechaB - fechaA;
        });
        break;
      case 'alfabetico':
        this.peliculas = peliculasBase.sort((a, b) => {
          return a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' });
        });
        break;
      default:
        this.peliculas = peliculasBase;
    }
    
    this.peliculasFiltradas = [...this.peliculas];
  }

  aplicarFiltro(tipoFiltro: string): void {
    this.filtroActivo = tipoFiltro;
    this.aplicarFiltrosCombinados();
  }

  limpiarFiltros(): void {
    this.filtroActivo = 'ninguno';
    this.generoSeleccionado = 'todos';
    this.peliculas = [...this.peliculasOriginales];
    this.peliculasFiltradas = [...this.peliculas];
  }

  hayFiltrosActivos(): boolean {
    return this.filtroActivo !== 'ninguno' || this.generoSeleccionado !== 'todos';
  }

  contarPeliculasPorGenero(genero: string): number {
    if (genero === 'todos') {
      return this.peliculasOriginales.length;
    }
    const count = this.peliculasOriginales.filter(p => 
      p.genero && p.genero.toLowerCase() === genero.toLowerCase()
    ).length;
    return count;
  }

  getNombreGenero(): string {
    return this.generoSeleccionado === 'todos' ? 'Todos los géneros' : this.generoSeleccionado;
  }

  getNombreFiltro(): string {
    switch (this.filtroActivo) {
      case 'rating': return 'Mejor Rating';
      case 'recientes': return 'Más Recientes';
      case 'alfabetico': return 'Orden Alfabético';
      default: return 'Sin filtro';
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  verPelicula(idx: number): void {
    this.router.navigate(['/movie', idx]);
  }

  // MÉTODOS PARA LA INTERFAZ
  getConnectionStatusClass(): string {
    if (this.cargando) return 'text-info';
    if (this.errorConexion) return 'text-danger';
    return 'text-success';
  }

  getConnectionStatusText(): string {
    if (this.cargando) return 'Cargando...';
    if (this.errorConexion) return 'Error de conexión';
    return 'Conectado al servidor';
  }
}