import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Pelicula, FuncionCine } from './movie.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();
  private totalSubject = new BehaviorSubject<number>(0);
  public total$ = this.totalSubject.asObservable();

  constructor() { 
    console.log('Servicio del carrito listo!');
    this.loadCartFromStorage();
  }

  // OBTENER ITEMS DEL CARRITO
  getCartItems(): CartItem[] {
    return this.cartItems;
  }

  // AGREGAR ENTRADA AL CARRITO
  addToCart(pelicula: Pelicula, funcion: FuncionCine, cantidad: number = 1): void {
    console.log('Agregando al carrito:', pelicula.titulo, funcion);

    // Verificar si ya existe el item
    const existingItem = this.cartItems.find(item => 
      item.pelicula.titulo === pelicula.titulo && 
      item.funcion.id === funcion.id
    );

    if (existingItem) {
      // Si existe, aumentar cantidad
      existingItem.cantidad += cantidad;
      existingItem.subtotal = existingItem.precio * existingItem.cantidad;
    } else {
      // Si no existe, crear nuevo item
      const cartItem: CartItem = {
        id: this.generateId(),
        pelicula: pelicula,
        funcion: funcion,
        cantidad: cantidad,
        precio: funcion.precio,
        subtotal: funcion.precio * cantidad
      };
      this.cartItems.push(cartItem);
    }

    this.updateCart();
  }

  // REMOVER ITEM DEL CARRITO
  removeFromCart(itemId: string): void {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    this.updateCart();
  }

  // ACTUALIZAR CANTIDAD
  updateQuantity(itemId: string, nuevaCantidad: number): void {
    const item = this.cartItems.find(item => item.id === itemId);
    if (item) {
      if (nuevaCantidad <= 0) {
        this.removeFromCart(itemId);
      } else {
        item.cantidad = nuevaCantidad;
        item.subtotal = item.precio * nuevaCantidad;
        this.updateCart();
      }
    }
  }

  // LIMPIAR CARRITO
  clearCart(): void {
    this.cartItems = [];
    this.updateCart();
  }

  // OBTENER TOTAL
  getTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.subtotal, 0);
  }

  // OBTENER CANTIDAD TOTAL DE ITEMS
  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.cantidad, 0);
  }

  // ACTUALIZAR CARRITO Y NOTIFICAR
  private updateCart(): void {
    this.cartSubject.next([...this.cartItems]);
    this.totalSubject.next(this.getTotal());
    this.saveCartToStorage();
  }

  // GUARDAR EN LOCALSTORAGE
  private saveCartToStorage(): void {
    localStorage.setItem('movieCart', JSON.stringify(this.cartItems));
  }

  // CARGAR DE LOCALSTORAGE
  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem('movieCart');
    if (savedCart) {
      try {
        this.cartItems = JSON.parse(savedCart);
        this.updateCart();
      } catch (error) {
        console.error('Error cargando carrito:', error);
        this.cartItems = [];
      }
    }
  }

  // GENERAR ID ÚNICO
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // VALIDAR DISPONIBILIDAD
  checkAvailability(funcionId: string, cantidad: number): boolean {
    return cantidad <= 10; // Máximo 10 entradas por función
  }

  // PROCESAR COMPRA
  processPurchase(): Promise<PurchaseResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const result: PurchaseResult = {
          success: true,
          orderId: this.generateOrderId(),
          total: this.getTotal(),
          items: [...this.cartItems],
          fecha: new Date().toISOString()
        };
        
        this.clearCart();
        resolve(result);
      }, 2000);
    });
  }

  private generateOrderId(): string {
    return 'ORD-' + Date.now().toString();
  }
}

// INTERFACES
export interface CartItem {
  id: string;
  pelicula: Pelicula;
  funcion: FuncionCine;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface PurchaseResult {
  success: boolean;
  orderId: string;
  total: number;
  items: CartItem[];
  fecha: string;
  error?: string;
}