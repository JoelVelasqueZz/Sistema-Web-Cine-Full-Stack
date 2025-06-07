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
    // ✅ USAR EL MÉTODO QUE YA MANEJA LA API
    this.movieService.buscarPeliculas(this.terminoBusqueda).subscribe({
      next: (peliculas: Pelicula[]) => {
        console.log('📡 Sugerencias de API:', peliculas.length);
        this.sugerencias = peliculas.slice(0, 5);
        this.mostrarSugerencias = this.sugerencias.length > 0;
        this.sugerenciaSeleccionada = -1;
      },
      error: (error) => {
        console.error('❌ Error en sugerencias:', error);
        this.sugerencias = [];
        this.mostrarSugerencias = false;
      }
    });
  }
}

  seleccionarSugerencia(pelicula: Pelicula) {
  this.cerrarSugerencias();
  // Usar el ID de la base de datos si existe, sino idx como fallback
  const movieId = pelicula.id || pelicula.idx;
  console.log('🎬 Navegando a película con ID:', movieId);
  this.router.navigate(['/movie', movieId]);
}

  cerrarSugerencias() {
    this.mostrarSugerencias = false;
    this.sugerenciaSeleccionada = -1;
  }

  buscarPelicula(termino: string) {
  console.log('🔍 Término de búsqueda:', termino);
  
  if (!termino || termino.trim().length === 0) {
    console.log('⚠️ Búsqueda vacía');
    return;
  }
  
  this.cerrarSugerencias();
  const terminoLimpio = termino.trim();
  console.log('🧭 Navegando a /buscar/' + terminoLimpio);
  
  this.router.navigate(['/buscar', terminoLimpio]).then(success => {
    if (success) {
      console.log('✅ Navegación exitosa');
      // Limpiar el input después de buscar
      this.terminoBusqueda = '';
    }
  }).catch(error => {
    console.error('❌ Error en navegación:', error);
  });
}

  // MÉTODO PARA LOGOUT
  logout() {
    console.log('Cerrando sesión...');
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}