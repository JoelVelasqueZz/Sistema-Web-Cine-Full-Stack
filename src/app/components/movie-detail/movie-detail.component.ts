import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService } from '../../services/movie.service';
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

  constructor(
    private activatedRoute: ActivatedRoute, 
    private _movieService: MovieService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    this.activatedRoute.params.subscribe(params => {
      this.peliculaIndex = +params['id']; // Convertir a número
      this.pelicula = this._movieService.getPelicula(this.peliculaIndex);
      console.log(this.pelicula);

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
  
}