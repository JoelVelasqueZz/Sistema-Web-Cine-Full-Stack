import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Pelicula, MovieService } from '../../services/movie.service';

@Component({
  selector: 'app-movie-list',
  standalone: false,
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.css'
})
export class MovieListComponent {
scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });

}
   peliculas:Pelicula[] = [];
  constructor(private _movieService:MovieService, private router:Router) {

  }

  ngOnInit():void{
    this.peliculas=this._movieService.getPeliculas();
     console.log(this.peliculas);
  }
  verPelicula(idx: number){
    //console.log(idx);
    this.router.navigate(['/movie', idx]);
  }
}
