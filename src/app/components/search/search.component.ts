import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { Pelicula, MovieService } from '../../services/movie.service';

@Component({
  selector: 'app-search',
  standalone: false,
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit {
  peliculas: Pelicula[] = [];
  termino: string = '';
  
  // Propiedades para estado
  buscando = false;
  usingApi = true;
  errorBusqueda = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private movieService: MovieService // ✅ Solo usar MovieService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      console.log('Parámetros recibidos:', params);
      this.termino = params['termino'];
      console.log('Término de búsqueda:', this.termino);
      this.buscarPeliculas();
      this.scrollToTop();
    });
  }

  /**
   * Buscar películas usando MovieService (que ya maneja la API)
   */
  buscarPeliculas(): void {
    if (!this.termino.trim()) {
      this.peliculas = [];
      return;
    }

    this.buscando = true;
    this.errorBusqueda = false;

    // Usar el método actualizado de MovieService que ya maneja la API
    this.movieService.buscarPeliculas(this.termino).subscribe({
      next: (peliculas) => {
        console.log('✅ Búsqueda exitosa:', peliculas.length);
        this.peliculas = peliculas;
        this.buscando = false;
        this.usingApi = true;
        this.errorBusqueda = false;
      },
      error: (error) => {
        console.error('❌ Error en búsqueda:', error);
        this.peliculas = [];
        this.buscando = false;
        this.usingApi = false;
        this.errorBusqueda = true;
      }
    });
  }

  /**
   * Reintentar búsqueda
   */
  reintentarBusqueda(): void {
    this.buscarPeliculas();
  }
  
  /**
   * Ver película usando el ID correcto
   */
  verPelicula(pelicula: Pelicula) {
    // Usar el ID de la base de datos si existe, sino usar idx
    const movieId = pelicula.id || pelicula.idx;
    this.router.navigate(['/movie', movieId]);
  }

  /**
   * Volver a buscar - enfocar input de búsqueda
   */
  volverABuscar() {
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  /**
   * Scroll al inicio de la página
   */
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Obtener mensaje de estado
   */
  getStatusMessage(): string {
    if (this.buscando) return 'Buscando...';
    if (this.peliculas.length === 0) return 'No se encontraron resultados';
    return `${this.peliculas.length} resultado(s) encontrado(s)`;
  }

  /**
   * Mostrar advertencia de conexión
   */
  showConnectionWarning(): boolean {
    return !this.usingApi && this.errorBusqueda;
  }
}