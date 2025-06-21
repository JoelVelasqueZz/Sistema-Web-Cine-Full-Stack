import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Pelicula, FuncionCine } from './movie.service';
import { ProductoBar, TamañoProducto, ExtraProducto } from './bar.service';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CartService {

  private readonly API_URL = environment.apiUrl;
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();
  private totalSubject = new BehaviorSubject<number>(0);
  public total$ = this.totalSubject.asObservable();

  constructor(private http: HttpClient) { 
    console.log('🆕 CartService actualizado con integración API');
    this.loadCartFromStorage();
  }

  // ==================== MÉTODOS PRINCIPALES ====================

  getCartItems(): CartItem[] {
    return this.cartItems;
  }

  // 🆕 MÉTODO MEJORADO: Agregar al carrito con validación
  addToCart(item: any): Observable<boolean> {
  try {
    console.log('🛒 CartService.addToCart recibió:', item);
    
    if (item.tipo === 'pelicula' || (item.pelicula && item.funcion)) {
      // 🆕 EXTRAER asientos_seleccionados del item
      const asientosSeleccionados = item.asientos_seleccionados || [];
      return this.addMovieToCartValidated(
        item.pelicula, 
        item.funcion, 
        item.cantidad || 1, 
        asientosSeleccionados
      );
    } else if (item.tipo === 'bar' || item.producto) {
      return this.addBarProductToCartValidated(item);
    } else {
      console.error('Tipo de item no reconocido:', item);
      return of(false);
    }
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    return of(false);
  }
}

  // 🆕 AGREGAR PELÍCULA CON VALIDACIÓN API
  private addMovieToCartValidated(pelicula: Pelicula, funcion: FuncionCine, cantidad: number = 1, asientosSeleccionados?: string[]): Observable<boolean> {
  return new Observable(observer => {
    // Validar disponibilidad (simulado por ahora, se puede conectar a API real)
    if (funcion.asientosDisponibles < cantidad) {
      observer.next(false);
      observer.complete();
      return;
    }

    // Verificar si ya existe el item
    const existingItem = this.cartItems.find(item => 
      item.tipo === 'pelicula' &&
      item.pelicula?.id === pelicula.id && 
      item.funcion?.id === funcion.id
    );

    if (existingItem) {
      // Si existe, aumentar cantidad
      const nuevaCantidad = existingItem.cantidad + cantidad;
      if (nuevaCantidad <= funcion.asientosDisponibles) {
        existingItem.cantidad = nuevaCantidad;
        existingItem.subtotal = existingItem.precio * existingItem.cantidad;
        
        // 🆕 ACTUALIZAR asientos si se proporcionan
        if (asientosSeleccionados && asientosSeleccionados.length > 0) {
          existingItem.asientos_seleccionados = [
            ...(existingItem.asientos_seleccionados || []),
            ...asientosSeleccionados
          ];
        }
      } else {
        observer.next(false);
        observer.complete();
        return;
      }
    } else {
      // Si no existe, crear nuevo item
      const cartItem: CartItem = {
        id: this.generateId(),
        tipo: 'pelicula',
        pelicula: pelicula,
        funcion: funcion,
        cantidad: cantidad,
        precio: funcion.precio,
        subtotal: funcion.precio * cantidad,
        // 🆕 AGREGAR asientos seleccionados
        asientos_seleccionados: asientosSeleccionados || []
      };
      this.cartItems.push(cartItem);
    }

    console.log('✅ Item de película agregado al carrito:', {
      pelicula: pelicula.titulo,
      funcion: funcion.id,
      cantidad: cantidad,
      asientos: asientosSeleccionados || []
    });

    this.updateCart();
    observer.next(true);
    observer.complete();
  });
}

  // 🆕 AGREGAR PRODUCTO DEL BAR CON VALIDACIÓN
  private addBarProductToCartValidated(item: any): Observable<boolean> {
    return new Observable(observer => {
      const producto = item.producto;
      const cantidad = item.cantidad || 1;
      const opciones = item.opciones || {};

      // Validar disponibilidad del producto
      if (!producto.disponible) {
        observer.next(false);
        observer.complete();
        return;
      }

      // Crear clave única para identificar el item exacto
      const itemKey = this.generateBarItemKey(producto, opciones);

      // Verificar si ya existe el item exacto
      const existingItem = this.cartItems.find(cartItem => 
        cartItem.tipo === 'bar' &&
        cartItem.barProduct?.id === producto.id &&
        cartItem.itemKey === itemKey
      );

      if (existingItem) {
        // Si existe, aumentar cantidad (máximo 10 por producto)
        const nuevaCantidad = existingItem.cantidad + cantidad;
        if (nuevaCantidad <= 10) {
          existingItem.cantidad = nuevaCantidad;
          existingItem.subtotal = existingItem.precio * existingItem.cantidad;
        } else {
          observer.next(false);
          observer.complete();
          return;
        }
      } else {
        // Si no existe, crear nuevo item
        const cartItem: CartItem = {
          id: this.generateId(),
          tipo: 'bar',
          barProduct: producto,
          barOptions: opciones,
          itemKey: itemKey,
          cantidad: cantidad,
          precio: item.precioTotal / cantidad,
          subtotal: item.precioTotal,
          nombre: this.generateBarItemName(producto, opciones)
        };
        this.cartItems.push(cartItem);
      }

      this.updateCart();
      observer.next(true);
      observer.complete();
    });
  }

  // MÉTODOS LEGACY PARA COMPATIBILIDAD
  addMovieToCart(pelicula: Pelicula, funcion: FuncionCine, cantidad: number = 1): void {
    this.addMovieToCartValidated(pelicula, funcion, cantidad).subscribe();
  }

  addBarProductToCart(item: any): void {
    this.addBarProductToCartValidated(item).subscribe();
  }

  // ==================== MÉTODOS DE GESTIÓN ====================

  removeFromCart(itemId: string): void {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    this.updateCart();
  }

  updateQuantity(itemId: string, nuevaCantidad: number): void {
    const item = this.cartItems.find(item => item.id === itemId);
    if (item) {
      if (nuevaCantidad <= 0) {
        this.removeFromCart(itemId);
      } else {
        // Validar límites
        const maxQuantity = item.tipo === 'pelicula' ? 
          (item.funcion?.asientosDisponibles || 20) : 10;
        
        item.cantidad = Math.min(nuevaCantidad, maxQuantity);
        item.subtotal = item.precio * item.cantidad;
        this.updateCart();
      }
    }
  }

  clearCart(): void {
    this.cartItems = [];
    this.updateCart();
  }

  // ==================== MÉTODOS DE CONSULTA ====================

  getTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.subtotal, 0);
  }

  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.cantidad, 0);
  }

  isInCart(tipo: string, itemId: number | string): boolean {
    if (tipo === 'pelicula') {
      return this.cartItems.some(item => 
        item.tipo === 'pelicula' && 
        item.pelicula?.id === itemId
      );
    } else if (tipo === 'bar') {
      return this.cartItems.some(item => 
        item.tipo === 'bar' && 
        item.barProduct?.id === itemId
      );
    }
    return false;
  }

  getItemQuantity(tipo: string, itemId: number | string): number {
    const items = this.cartItems.filter(item => {
      if (tipo === 'pelicula') {
        return item.tipo === 'pelicula' && item.pelicula?.id === itemId;
      } else if (tipo === 'bar') {
        return item.tipo === 'bar' && item.barProduct?.id === itemId;
      }
      return false;
    });

    return items.reduce((total, item) => total + item.cantidad, 0);
  }

  getItemsByType(tipo: string): CartItem[] {
    return this.cartItems.filter(item => item.tipo === tipo);
  }

  getCartSummary(): CartSummary {
    const peliculas = this.getItemsByType('pelicula');
    const productosBar = this.getItemsByType('bar');

    return {
      totalItems: this.getTotalItems(),
      totalPeliculas: peliculas.reduce((sum, item) => sum + item.cantidad, 0),
      totalProductosBar: productosBar.reduce((sum, item) => sum + item.cantidad, 0),
      subtotalPeliculas: peliculas.reduce((sum, item) => sum + item.subtotal, 0),
      subtotalBar: productosBar.reduce((sum, item) => sum + item.subtotal, 0),
      total: this.getTotal()
    };
  }

  // ==================== VALIDACIÓN MEJORADA ====================

  validateCart(): Observable<CartValidationResult> {
    return new Observable(observer => {
      const errors: string[] = [];

      if (this.cartItems.length === 0) {
        errors.push('El carrito está vacío');
        observer.next({ valid: false, errors });
        observer.complete();
        return;
      }

      // Validar items de películas
      const peliculaItems = this.getItemsByType('pelicula');
      peliculaItems.forEach(item => {
        if (!item.pelicula || !item.funcion) {
          errors.push('Hay items de películas con datos incompletos');
        }
        if (item.funcion && item.cantidad > item.funcion.asientosDisponibles) {
          errors.push(`No hay suficientes asientos para "${item.pelicula?.titulo}"`);
        }
      });

      // Validar items del bar
      const barItems = this.getItemsByType('bar');
      barItems.forEach(item => {
        if (!item.barProduct) {
          errors.push('Hay productos del bar con datos incompletos');
        }
        if (item.barProduct && !item.barProduct.disponible) {
          errors.push(`El producto "${item.barProduct.nombre}" no está disponible`);
        }
        if (item.cantidad > 10) {
          errors.push(`Cantidad máxima excedida para "${item.barProduct?.nombre}"`);
        }
      });

      observer.next({
        valid: errors.length === 0,
        errors
      });
      observer.complete();
    });
  }

  // 🆕 VALIDAR DISPONIBILIDAD CON API
  validateAvailabilityWithAPI(): Observable<boolean> {
    if (this.cartItems.length === 0) {
      return of(true);
    }

    const payload = { cartItems: this.formatCartItemsForAPI() };
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/checkout/validate`, payload).pipe(
      map(response => response.success && response.data.available),
      catchError(error => {
        console.error('❌ Error validando disponibilidad:', error);
        return of(true); // Asumir disponible si falla la API
      })
    );
  }

  // ==================== MÉTODOS DE COMPRA ACTUALIZADOS ====================

  // 🆕 PROCESAR COMPRA CON API BACKEND
  processPurchaseWithAPI(paymentData: any): Observable<PurchaseResult> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/checkout/process`, paymentData).pipe(
      map(response => {
        if (response.success) {
          this.clearCart(); // Limpiar carrito después de compra exitosa
          return {
            success: true,
            orderId: response.data.orderId,
            total: response.data.total,
            items: [...this.cartItems],
            fecha: response.data.fechaCreacion,
            summary: this.getCartSummary(),
            puntos: response.data.puntos
          };
        }
        return {
          success: false,
          orderId: '',
          total: 0,
          items: [],
          fecha: new Date().toISOString(),
          error: response.message || 'Error al procesar compra'
        };
      }),
      catchError(error => {
        console.error('❌ Error procesando compra:', error);
        return of({
          success: false,
          orderId: '',
          total: 0,
          items: [],
          fecha: new Date().toISOString(),
          error: error.error?.message || 'Error al procesar compra'
        });
      })
    );
  }

  // MÉTODO LEGACY PARA COMPATIBILIDAD
  processPurchase(): Promise<PurchaseResult> {
    return new Promise((resolve) => {
      // Validar carrito antes de procesar
      this.validateCart().subscribe(validation => {
        if (!validation.valid) {
          resolve({
            success: false,
            orderId: '',
            total: 0,
            items: [],
            fecha: new Date().toISOString(),
            error: validation.errors.join(', ')
          });
          return;
        }

        setTimeout(() => {
          const result: PurchaseResult = {
            success: true,
            orderId: this.generateOrderId(),
            total: this.getTotal(),
            items: [...this.cartItems],
            fecha: new Date().toISOString(),
            summary: this.getCartSummary()
          };
          
          this.clearCart();
          resolve(result);
        }, 2000);
      });
    });
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private generateBarItemKey(producto: ProductoBar, opciones: any): string {
    let key = `bar_${producto.id}`;
    
    if (opciones.tamano) {
      key += `_size_${opciones.tamano.nombre}`;
    }
    
    if (opciones.extras && opciones.extras.length > 0) {
      const extrasKey = opciones.extras
        .map((extra: ExtraProducto) => extra.nombre)
        .sort()
        .join('_');
      key += `_extras_${extrasKey}`;
    }
    
    return key;
  }

  private generateBarItemName(producto: ProductoBar, opciones: any): string {
    let nombre = producto.nombre;
    
    if (opciones.tamano) {
      nombre += ` (${opciones.tamano.nombre})`;
    }
    
    if (opciones.extras && opciones.extras.length > 0) {
      const extras = opciones.extras.map((extra: ExtraProducto) => extra.nombre).join(', ');
      nombre += ` + ${extras}`;
    }
    
    return nombre;
  }

  // 🆕 FORMATEAR ITEMS PARA API
  private formatCartItemsForAPI(): any[] {
    return this.cartItems.map(item => {
      const formattedItem: any = {
        tipo: item.tipo,
        cantidad: item.cantidad,
        precio: item.precio
      };

      if (item.tipo === 'pelicula' && item.pelicula && item.funcion) {
        formattedItem.pelicula = {
          id: item.pelicula.id,
          titulo: item.pelicula.titulo,
          poster: item.pelicula.poster
        };
        formattedItem.funcion = {
          id: item.funcion.id,
          fecha: item.funcion.fecha,
          hora: item.funcion.hora,
          sala: item.funcion.sala,
          precio: item.funcion.precio
        };
        formattedItem.asientos_seleccionados = item.asientos_seleccionados || [];
      }

      if (item.tipo === 'bar' && item.barProduct) {
        formattedItem.producto_id = item.barProduct.id;
        formattedItem.barProduct = {
          id: item.barProduct.id,
          nombre: item.barProduct.nombre,
          categoria: item.barProduct.categoria,
          precio: item.barProduct.precio
        };
        
        if (item.barOptions) {
          formattedItem.barOptions = {
            tamano: item.barOptions.tamano,
            extras: item.barOptions.extras,
            notas: item.barOptions.notas
          };
        }
      }

      return formattedItem;
    });
  }

  private updateCart(): void {
    this.cartSubject.next([...this.cartItems]);
    this.totalSubject.next(this.getTotal());
    this.saveCartToStorage();
  }

  private saveCartToStorage(): void {
    try {
      localStorage.setItem('movieCart', JSON.stringify(this.cartItems));
    } catch (error) {
      console.error('Error guardando carrito:', error);
    }
  }

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

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private generateOrderId(): string {
    return 'ORD-' + Date.now().toString();
  }

  // 🆕 MÉTODOS ADICIONALES PARA CHECKOUT MEJORADO

  /**
   * Calcular totales con impuestos y cargos
   */
  calculateTotalsWithTaxes(): CartTotals {
    const subtotal = this.getTotal();
    const serviceFee = subtotal * 0.05; // 5%
    const taxes = (subtotal + serviceFee) * 0.08; // 8%
    const total = subtotal + serviceFee + taxes;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      serviceFee: Math.round(serviceFee * 100) / 100,
      taxes: Math.round(taxes * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }

  /**
   * Verificar si hay cambios en la disponibilidad
   */
  checkForAvailabilityChanges(): Observable<AvailabilityChange[]> {
    return new Observable(observer => {
      const changes: AvailabilityChange[] = [];
      
      // Simular verificación de cambios
      this.cartItems.forEach(item => {
        if (item.tipo === 'pelicula' && item.funcion) {
          // Simular verificación de asientos
          if (Math.random() < 0.1) { // 10% chance de cambio
            changes.push({
              itemId: item.id,
              type: 'reduced_availability',
              message: `Asientos reducidos para ${item.pelicula?.titulo}`
            });
          }
        }
        
        if (item.tipo === 'bar' && item.barProduct) {
          // Simular verificación de stock
          if (Math.random() < 0.05) { // 5% chance de cambio
            changes.push({
              itemId: item.id,
              type: 'out_of_stock',
              message: `${item.barProduct.nombre} agotado`
            });
          }
        }
      });

      observer.next(changes);
      observer.complete();
    });
  }

  /**
   * Obtener resumen para email
   */
  getEmailSummary(): EmailCartSummary {
    const summary = this.getCartSummary();
    const totals = this.calculateTotalsWithTaxes();
    
    return {
      ...summary,
      ...totals,
      items: this.cartItems.map(item => ({
        tipo: item.tipo,
        nombre: item.tipo === 'pelicula' ? 
          item.pelicula?.titulo || 'Película' : 
          item.nombre || item.barProduct?.nombre || 'Producto',
        cantidad: item.cantidad,
        precio: item.precio,
        subtotal: item.subtotal,
        detalles: item.tipo === 'pelicula' && item.funcion ? 
          `${item.funcion.fecha} - ${item.funcion.hora}` : 
          item.barOptions ? this.generateBarItemName(item.barProduct!, item.barOptions) : ''
      }))
    };
  }
}

// ==================== INTERFACES ACTUALIZADAS ====================

export interface CartItem {
  id: string;
  tipo: 'pelicula' | 'bar';
  
  // Para películas
  pelicula?: Pelicula;
  funcion?: FuncionCine;
  asientos_seleccionados?: string[];
  
  // Para productos del bar
  barProduct?: ProductoBar;
  barOptions?: {
    tamano?: TamañoProducto;
    extras?: ExtraProducto[];
    notas?: string;
  };
  itemKey?: string;
  nombre?: string;
  
  // Propiedades comunes
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface CartSummary {
  totalItems: number;
  totalPeliculas: number;
  totalProductosBar: number;
  subtotalPeliculas: number;
  subtotalBar: number;
  total: number;
}

export interface CartTotals {
  subtotal: number;
  serviceFee: number;
  taxes: number;
  total: number;
}

export interface CartValidationResult {
  valid: boolean;
  errors: string[];
}

export interface AvailabilityChange {
  itemId: string;
  type: 'reduced_availability' | 'out_of_stock' | 'price_change';
  message: string;
}

export interface EmailCartSummary extends CartSummary, CartTotals {
  items: {
    tipo: string;
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
    detalles: string;
  }[];
}

export interface PurchaseResult {
  success: boolean;
  orderId: string;
  total: number;
  items: CartItem[];
  fecha: string;
  summary?: CartSummary;
  error?: string;
  puntos?: {
    ganados: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}