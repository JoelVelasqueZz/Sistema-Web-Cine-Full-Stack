import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service'; // ← AGREGAR IMPORT

@Component({
  selector: 'app-shopping-cart',
  standalone: false,
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css']
})
export class ShoppingCartComponent implements OnInit, OnDestroy {

  cartItems: CartItem[] = [];
  cargando: boolean = true;
  procesandoPago: boolean = false;
  private cartSubscription: Subscription = new Subscription();

  constructor(
    private cartService: CartService,
    private router: Router,
    private toastService: ToastService // ← AGREGAR AQUÍ
  ) {}

  ngOnInit(): void {
    this.cargarCarrito();
  }

  ngOnDestroy(): void {
    this.cartSubscription.unsubscribe();
  }

  cargarCarrito(): void {
    this.cargando = true;
    
    // Suscribirse a los cambios del carrito
    this.cartSubscription = this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.cargando = false;
      console.log('Carrito actualizado:', this.cartItems);
    });
  }

  incrementarCantidad(item: CartItem): void {
    if (item.cantidad < 10) {
      this.cartService.updateQuantity(item.id, item.cantidad + 1);
    } else {
      // ✅ NUEVO: Toast cuando llega al límite
      this.toastService.showWarning('Máximo 10 entradas por función');
    }
  }

  decrementarCantidad(item: CartItem): void {
    if (item.cantidad > 1) {
      this.cartService.updateQuantity(item.id, item.cantidad - 1);
    }
  }

  eliminarItem(itemId: string): void {
    // ✅ CAMBIO: Confirm por Toast + eliminación directa
    this.cartService.removeFromCart(itemId);
    this.toastService.showInfo('Entrada eliminada del carrito');
  }

  limpiarCarrito(): void {
    // Mostrar modal de Bootstrap
    const modalElement = document.getElementById('limpiarCarritoModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  confirmarLimpiarCarrito(): void {
    this.cartService.clearCart();
    
    // ✅ NUEVO: Toast de confirmación
    this.toastService.showSuccess('Carrito vaciado completamente');
    
    // Cerrar modal
    const modalElement = document.getElementById('limpiarCarritoModal');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  procederAlPago(): void {
    if (this.cartItems.length === 0) {
      // ✅ CAMBIO: Alert por Toast
      this.toastService.showWarning('Tu carrito está vacío');
      return;
    }

    this.procesandoPago = true;

    // Simular validación
    setTimeout(() => {
      this.procesandoPago = false;
      this.router.navigate(['/checkout']);
    }, 1500);
  }

  // MÉTODOS DE CÁLCULO
  getTotalItems(): number {
    return this.cartService.getTotalItems();
  }

  getTotal(): number {
    return this.cartService.getTotal();
  }

  getServiceFee(): number {
    // Cargo por servicio del 5%
    return this.getTotal() * 0.05;
  }

  getTaxes(): number {
    // Impuestos del 8%
    return (this.getTotal() + this.getServiceFee()) * 0.08;
  }

  getFinalTotal(): number {
    return this.getTotal() + this.getServiceFee() + this.getTaxes();
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