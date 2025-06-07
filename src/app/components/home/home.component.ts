import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Pelicula, MovieService } from '../../services/movie.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  i: number | undefined;
  
  constructor(
    private router: Router, 
    private movieService: MovieService
  ) {
    console.log('🏠 Home component inicializado');
  }

  verPelicula(idx: number) {
    this.router.navigate(['/movie', idx]);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}