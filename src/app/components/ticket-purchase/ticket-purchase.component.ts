import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService, Pelicula, FuncionCine } from '../../services/movie.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service'; // 🆕 AGREGAR
import { UserService } from '../../services/user.service'; // 🆕 AGREGAR

@Component({
  selector: 'app-ticket-purchase',
  standalone: false,
  templateUrl: './ticket-purchase.component.html',
  styleUrls: ['./ticket-purchase.component.css']
})
export class TicketPurchaseComponent implements OnInit {
  
  pelicula: Pelicula | null = null;
  peliculaIndex: number = -1; 
  funciones: FuncionCine[] = [];
  funcionSeleccionada: FuncionCine | null = null;
  cantidadEntradas: number = 1;
  cargando: boolean = true;
  agregandoCarrito: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,    
    private cartService: CartService,
    private toastService: ToastService,
    public authService: AuthService,    // 🆕 AGREGAR (público para template)
    private userService: UserService    // 🆕 AGREGAR
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    
    // Obtener ID de la película desde la ruta
    this.peliculaIndex = Number(this.route.snapshot.paramMap.get('id'));
    
    if (this.peliculaIndex >= 0) {
      // Cargar película
      this.pelicula = this.movieService.getPelicula(this.peliculaIndex);
      
      if (this.pelicula) {
        // Cargar funciones disponibles
        this.funciones = this.movieService.getFuncionesPelicula(this.peliculaIndex);
        console.log('Funciones cargadas:', this.funciones);
        
        // 🆕 AGREGAR AL HISTORIAL CUANDO SE VEA UNA PELÍCULA
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          this.userService.addToHistory(currentUser.id, {
            peliculaId: this.peliculaIndex,
            titulo: this.pelicula.titulo,
            poster: this.pelicula.poster,
            genero: this.pelicula.genero,
            anio: this.pelicula.anio,
            fechaVista: new Date().toISOString(),
            tipoAccion: 'vista'
          });
        }
        
      } else {
        console.error('Película no encontrada');
        this.router.navigate(['/movies']);
      }
    } else {
      console.error('ID de película inválido');
      this.router.navigate(['/movies']);
    }
    
    this.cargando = false;
  }

  seleccionarFuncion(funcion: FuncionCine): void {
    console.log('Función seleccionada:', funcion);
    this.funcionSeleccionada = funcion;
    this.cantidadEntradas = 1; // Reset cantidad
  }

  agregarAlCarrito(): void {
  if (!this.pelicula || !this.funcionSeleccionada) {
    console.error('Faltan datos para proceder');
    return;
  }

  this.agregandoCarrito = true;

  // Verificar disponibilidad
  if (!this.cartService.checkAvailability(this.funcionSeleccionada.id, this.cantidadEntradas)) {
    this.toastService.showWarning('No hay suficientes asientos disponibles');
    this.agregandoCarrito = false;
    return;
  }

  // Simular delay de procesamiento
  setTimeout(() => {
    this.agregandoCarrito = false;
    
    // SOLO navegar a selección de asientos
    console.log('Navegando a selección de asientos...');
    this.router.navigate([
      '/seat-selection', 
      this.peliculaIndex, 
      this.funcionSeleccionada!.id, 
      this.cantidadEntradas
    ]);
  }, 1000);
}

  cancelar(): void {
    if (this.pelicula) {
      // Usar el índice que obtuvimos de la ruta
      this.router.navigate(['/movie', this.peliculaIndex]);
    } else {
      this.router.navigate(['/movies']);
    }
  }

  incrementarCantidad(): void {
    if (this.cantidadEntradas < 20) {
      this.cantidadEntradas++;
    } else {
      this.toastService.showWarning('Máximo 20 entradas por función');
    }
  }

  decrementarCantidad(): void {
    if (this.cantidadEntradas > 1) {
      this.cantidadEntradas--;
    }
  }

  formatearFecha(fecha: string): string {
    const fechaObj = new Date(fecha + 'T00:00:00');
    return fechaObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}