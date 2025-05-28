import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Pelicula, MovieService } from '../../services/movie.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  sugerencias: Pelicula[] = [];
  mostrarSugerencias: boolean = false;
  sugerenciaSeleccionada: number = -1;
  terminoBusqueda: string = '';

  constructor(
    private router: Router,
    private movieService: MovieService,
    public authService: AuthService,
    public cartService: CartService
  ) {}

  onBuscarInput(event: any) {
    this.terminoBusqueda = event.target.value;
    
    if (this.terminoBusqueda.trim().length === 0) {
      this.sugerencias = [];
      this.mostrarSugerencias = false;
      return;
    }
    if (this.terminoBusqueda.trim().length >= 2) {
      this.sugerencias = this.movieService.buscarPeliculas(this.terminoBusqueda).slice(0, 5);
      this.mostrarSugerencias = this.sugerencias.length > 0;
      this.sugerenciaSeleccionada = -1;
    }
  }

  seleccionarSugerencia(pelicula: Pelicula) {
    this.cerrarSugerencias();
    this.router.navigate(['/movie', pelicula.idx]);
  }

  cerrarSugerencias() {
    this.mostrarSugerencias = false;
    this.sugerenciaSeleccionada = -1;
  }

  buscarPelicula(termino: string) {
    console.log('Término de búsqueda:', termino);
    
    if (!termino || termino.trim().length === 0) {
      console.log('Búsqueda vacía');
      return;
    }
    
    this.cerrarSugerencias();
    const terminoLimpio = termino.trim();
    console.log('Navegando a /buscar/' + terminoLimpio);
    
    this.router.navigate(['/buscar', terminoLimpio]).then(success => {
      console.log('Navegación exitosa:', success);
    }).catch(error => {
      console.error('Error en navegación:', error);
    });
  }

  // MÉTODOS DE NAVEGACIÓN PARA LOGIN/REGISTER
  goToLogin() {
    console.log('Navegando a login...');
    this.router.navigate(['/login']).then(success => {
      console.log('Navegación a login exitosa:', success);
    }).catch(error => {
      console.error('Error navegando a login:', error);
    });
  }

  goToRegister() {
    console.log('Navegando a registro...');
    this.router.navigate(['/register']).then(success => {
      console.log('Navegación a registro exitosa:', success);
    }).catch(error => {
      console.error('Error navegando a registro:', error);
    });
  }

  // MÉTODO PARA LOGOUT
  logout() {
    console.log('Cerrando sesión...');
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}