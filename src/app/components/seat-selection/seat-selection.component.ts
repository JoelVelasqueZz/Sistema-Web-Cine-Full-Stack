import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService, Pelicula, FuncionCine, Seat } from '../../services/movie.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service'; // ← NUEVO IMPORT

@Component({
  selector: 'app-seat-selection',
  standalone: false,
  templateUrl: './seat-selection.component.html',
  styleUrls: ['./seat-selection.component.css']
})
export class SeatSelectionComponent implements OnInit {
  pelicula: Pelicula | null = null;
  peliculaIndex: number = -1;
  funcion: FuncionCine | null = null;
  funcionId: string = '';
  cantidad: number = 1;
  
  seats: Seat[] = [];
  selectedSeats: Seat[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private cartService: CartService,
    private toastService: ToastService // ← AGREGAR AQUÍ
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    // Obtener parámetros de la ruta
    this.peliculaIndex = Number(this.route.snapshot.paramMap.get('movieId'));
    this.funcionId = this.route.snapshot.paramMap.get('funcionId') || '';
    this.cantidad = Number(this.route.snapshot.paramMap.get('cantidad')) || 1;

    // Cargar película
    this.pelicula = this.movieService.getPelicula(this.peliculaIndex);
    
    // Cargar función - Manejar undefined
    const funcionEncontrada = this.movieService.getFuncion(this.funcionId);
    this.funcion = funcionEncontrada || null;
    
    if (!this.pelicula || !this.funcion) {
      console.error('Película o función no encontrada');
      this.router.navigate(['/movies']);
      return;
    }

    // Generar asientos
    this.seats = this.movieService.generateSeatsForFunction(this.funcionId);
    console.log('Asientos generados:', this.seats);
  }

  // MANEJO DE ASIENTOS
  toggleSeat(seat: Seat): void {
    // No permitir seleccionar asientos ocupados o deshabilitados
    if (seat.isOccupied || seat.isDisabled) {
      return;
    }

    if (seat.isSelected) {
      // Deseleccionar asiento
      seat.isSelected = false;
      this.selectedSeats = this.selectedSeats.filter(s => s.id !== seat.id);
    } else {
      // Verificar límite de cantidad
      if (this.selectedSeats.length >= this.cantidad) {
        // ✅ CAMBIO: Alert por Toast
        this.toastService.showWarning(`Solo puedes seleccionar ${this.cantidad} asiento(s)`);
        return;
      }
      
      // Seleccionar asiento
      seat.isSelected = true;
      this.selectedSeats.push(seat);
    }

    console.log('Asientos seleccionados:', this.selectedSeats);
  }

  // UTILIDADES DE ASIENTOS
  getUniqueRows(): string[] {
    const rows = [...new Set(this.seats.map(seat => seat.row))];
    return rows.sort();
  }

  getSeatsByRow(row: string): Seat[] {
    return this.seats.filter(seat => seat.row === row).sort((a, b) => a.number - b.number);
  }

  isSeatAvailable(seat: Seat): boolean {
    return !seat.isOccupied && !seat.isDisabled && !seat.isSelected;
  }

  getSeatTooltip(seat: Seat): string {
    if (seat.isDisabled) return 'No disponible';
    if (seat.isOccupied) return 'Ocupado';
    if (seat.isSelected) return 'Seleccionado';
    if (seat.isVip) return `VIP - $${seat.price.toFixed(2)}`;
    return `$${seat.price.toFixed(2)}`;
  }

  // CÁLCULOS DE PRECIOS
  getTotalPrice(): number {
    return this.selectedSeats.reduce((total, seat) => total + seat.price, 0);
  }

  hasVipSeats(): boolean {
    return this.selectedSeats.some(seat => seat.isVip);
  }

  getNormalSeats(): Seat[] {
    return this.selectedSeats.filter(seat => !seat.isVip);
  }

  getVipSeats(): Seat[] {
    return this.selectedSeats.filter(seat => seat.isVip);
  }

  getNormalPrice(): number {
    return this.getNormalSeats().reduce((total, seat) => total + seat.price, 0);
  }

  getVipPrice(): number {
    return this.funcion ? this.funcion.precio * 1.5 : 0;
  }

  getVipTotalPrice(): number {
    return this.getVipSeats().reduce((total, seat) => total + seat.price, 0);
  }

  // ACCIONES
  limpiarSeleccion(): void {
    this.selectedSeats.forEach(seat => seat.isSelected = false);
    this.selectedSeats = [];
    // ✅ NUEVO: Toast informativo
    this.toastService.showInfo('Selección de asientos limpiada');
  }

  cancelar(): void {
    this.router.navigate(['/ticket-purchase', this.peliculaIndex]);
  }

  confirmarSeleccion(): void {
    if (this.selectedSeats.length === 0) {
      // ✅ CAMBIO: Alert por Toast
      this.toastService.showWarning('Debes seleccionar al menos un asiento');
      return;
    }

    if (this.selectedSeats.length !== this.cantidad) {
      // ✅ CAMBIO: Alert por Toast
      this.toastService.showWarning(`Debes seleccionar exactamente ${this.cantidad} asiento(s)`);
      return;
    }

    if (!this.pelicula || !this.funcion) {
      // ✅ CAMBIO: Alert por Toast
      this.toastService.showError('Error: Información de película o función no disponible');
      return;
    }

    // Crear objeto de compra con asientos específicos
    const purchaseData = {
      pelicula: this.pelicula,
      funcion: {
        ...this.funcion,
        asientosSeleccionados: this.selectedSeats.map(s => s.id),
        precioTotal: this.getTotalPrice()
      },
      cantidad: this.selectedSeats.length,
      asientos: this.selectedSeats
    };

    // Agregar al carrito
    this.cartService.addToCart(
      this.pelicula, 
      purchaseData.funcion, 
      this.selectedSeats.length
    );

    // Marcar asientos como ocupados (simulación)
    this.movieService.updateOccupiedSeats(
      this.funcionId, 
      this.selectedSeats.map(s => s.id)
    );

    // ✅ NUEVO: Toast de éxito
    this.toastService.showSuccess(`¡${this.selectedSeats.length} asiento(s) agregado(s) al carrito!`);

    // Navegar al carrito
    this.router.navigate(['/cart']);
  }

  formatearFecha(fecha: string): string {
    const fechaObj = new Date(fecha + 'T00:00:00');
    return fechaObj.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}