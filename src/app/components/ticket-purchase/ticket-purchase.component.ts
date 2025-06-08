import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService, Pelicula } from '../../services/movie.service';
import { FunctionService, FuncionCine } from '../../services/function.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-ticket-purchase',
  standalone: false,
  templateUrl: './ticket-purchase.component.html',
  styleUrls: ['./ticket-purchase.component.css']
})
export class TicketPurchaseComponent implements OnInit {
  
  pelicula: Pelicula | null = null;
  peliculaId: number = -1; 
  funciones: FuncionCine[] = [];
  funcionesFuturas: FuncionCine[] = [];
  funcionSeleccionada: FuncionCine | null = null;
  cantidadEntradas: number = 1;
  cargando: boolean = true;
  cargandoFunciones: boolean = false;
  agregandoCarrito: boolean = false;
  errorConexion: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,    
    private functionService: FunctionService, // 🆕 AGREGAR
    private cartService: CartService,
    private toastService: ToastService,
    public authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.errorConexion = false;
    
    // Obtener ID de la película desde la ruta
    this.peliculaId = Number(this.route.snapshot.paramMap.get('id'));
    
    if (this.peliculaId > 0) {
      // 🔧 USAR MovieService de la API
      this.movieService.getPeliculaById(this.peliculaId).subscribe({
        next: (pelicula) => {
          if (pelicula) {
            this.pelicula = pelicula;
            console.log('✅ Película cargada:', pelicula.titulo);
            
            // Agregar al historial
            this.agregarAlHistorial();
            
            // Cargar funciones de la API
            this.cargarFuncionesAPI();
          } else {
            console.error('Película no encontrada');
            this.toastService.showError('Película no encontrada');
            this.router.navigate(['/movies']);
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar película:', error);
          this.errorConexion = true;
          this.cargando = false;
          this.toastService.showError('Error al cargar la película');
        }
      });
    } else {
      console.error('ID de película inválido');
      this.toastService.showError('ID de película inválido');
      this.router.navigate(['/movies']);
    }
  }

  // 🆕 MÉTODO NUEVO: Cargar funciones desde la API
  private cargarFuncionesAPI(): void {
    this.cargandoFunciones = true;
    
    this.functionService.getFunctionsByMovie(this.peliculaId).subscribe({
      next: (funciones) => {
        console.log('✅ Funciones cargadas desde API:', funciones.length);
        this.funciones = funciones;
        
        // Filtrar solo funciones futuras
        this.funcionesFuturas = funciones.filter(funcion => !this.functionService.isPastFunction(funcion));
        
        console.log(`📅 Funciones futuras disponibles: ${this.funcionesFuturas.length}`);
        
        this.cargandoFunciones = false;
        this.cargando = false;
        
        if (this.funcionesFuturas.length === 0) {
          this.toastService.showInfo('No hay funciones disponibles para esta película');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar funciones:', error);
        this.cargandoFunciones = false;
        this.cargando = false;
        this.errorConexion = true;
        this.toastService.showError('Error al cargar las funciones disponibles');
        
        // Fallback: usar array vacío
        this.funciones = [];
        this.funcionesFuturas = [];
      }
    });
  }

  private agregarAlHistorial(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && this.pelicula) {
      this.userService.addToHistory(currentUser.id, {
        peliculaId: this.peliculaId,
        titulo: this.pelicula.titulo,
        poster: this.pelicula.poster,
        genero: this.pelicula.genero,
        anio: this.pelicula.anio,
        fechaVista: new Date().toISOString(),
        tipoAccion: 'vista'
      });
    }
  }

  seleccionarFuncion(funcion: FuncionCine): void {
    console.log('Función seleccionada:', funcion);
    this.funcionSeleccionada = funcion;
    this.cantidadEntradas = 1; // Reset cantidad
  }

  agregarAlCarrito(): void {
    if (!this.pelicula || !this.funcionSeleccionada) {
      console.error('Faltan datos para proceder');
      this.toastService.showError('Por favor selecciona una función');
      return;
    }

    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated) {
      this.toastService.showWarning('Debes iniciar sesión para comprar entradas');
      this.router.navigate(['/login']);
      return;
    }

    this.agregandoCarrito = true;

    // Verificar disponibilidad de asientos
    if (this.funcionSeleccionada.asientosDisponibles < this.cantidadEntradas) {
      this.toastService.showWarning(`Solo hay ${this.funcionSeleccionada.asientosDisponibles} asientos disponibles`);
      this.agregandoCarrito = false;
      return;
    }

    // Simular delay de procesamiento
    setTimeout(() => {
      this.agregandoCarrito = false;
      
      // Navegar a selección de asientos con los datos reales
      console.log('Navegando a selección de asientos...');
      console.log('Datos:', {
        peliculaId: this.peliculaId,
        funcionId: this.funcionSeleccionada!.id,
        cantidad: this.cantidadEntradas,
        funcionData: this.funcionSeleccionada
      });

      // 🔧 USAR ID REAL DE LA FUNCIÓN (UUID)
      this.router.navigate([
        '/seat-selection', 
        this.peliculaId, 
        this.funcionSeleccionada!.id, 
        this.cantidadEntradas
      ]);
    }, 1000);
  }

  cancelar(): void {
    this.router.navigate(['/movie', this.peliculaId]);
  }

  incrementarCantidad(): void {
    const maxAsientos = this.funcionSeleccionada?.asientosDisponibles || 20;
    const limite = Math.min(20, maxAsientos);
    
    if (this.cantidadEntradas < limite) {
      this.cantidadEntradas++;
    } else {
      this.toastService.showWarning(`Máximo ${limite} entradas disponibles`);
    }
  }

  decrementarCantidad(): void {
    if (this.cantidadEntradas > 1) {
      this.cantidadEntradas--;
    }
  }

  // 🔧 USAR FORMATEO DEL FunctionService
  formatearFecha(fecha: string): string {
    return this.functionService.formatDateForDisplay(fecha);
  }

  formatearPrecio(precio: number): string {
    return this.functionService.formatPrice(precio);
  }

  // 🆕 NUEVOS MÉTODOS AUXILIARES

  getFuncionesDisponibles(): FuncionCine[] {
    return this.funcionesFuturas;
  }

  getFuncionesAgrupadas(): { [fecha: string]: FuncionCine[] } {
    return this.functionService.groupFunctionsByDate(this.funcionesFuturas);
  }

  getFechasDisponibles(): string[] {
    return this.functionService.getAvailableDates(this.funcionesFuturas);
  }

  isPastFunction(funcion: FuncionCine): boolean {
    return this.functionService.isPastFunction(funcion);
  }

  getAsientosDisponiblesTexto(asientos: number): string {
    if (asientos === 0) return 'Agotado';
    if (asientos <= 10) return `Quedan ${asientos}`;
    return `${asientos} disponibles`;
  }

  getAsientosDisponiblesClass(asientos: number): string {
    if (asientos === 0) return 'text-danger';
    if (asientos <= 10) return 'text-warning';
    return 'text-success';
  }

  // 🆕 MÉTODO PARA RECARGAR DATOS
  reintentarConexion(): void {
    this.toastService.showInfo('Reintentando conexión...');
    this.cargarDatos();
  }

  // 🆕 MÉTODO PARA TRACK FUNCTIONS
  trackFunction(index: number, funcion: FuncionCine): string {
    return funcion.id;
  }

  getTotal(): number {
    if (!this.funcionSeleccionada) return 0;
    return this.funcionSeleccionada.precio * this.cantidadEntradas;
  }

  // 🆕 AGREGAR MÉTODO PARA ACCEDER A Math EN EL TEMPLATE
  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }
}