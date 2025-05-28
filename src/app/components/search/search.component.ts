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

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private movieService: MovieService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      console.log('Parámetros recibidos:', params);
      this.termino = params['termino'];
      console.log('Término de búsqueda:', this.termino);

      this.peliculas = this.movieService.buscarPeliculas(this.termino);
      console.log('Resultados obtenidos:', this.peliculas);
      
      // Scroll to top cuando se cargan nuevos resultados
      this.scrollToTop();
    });
  }
  
  verPelicula(idx: number) {
    this.router.navigate(['/movie', idx]);
  }

  volverABuscar() {
    // Focus en el input de búsqueda del navbar
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}