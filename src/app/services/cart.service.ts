import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Pelicula, FuncionCine } from './movie.service';
import { ProductoBar, TamañoProducto, ExtraProducto } from './bar.service';

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

  // ==================== MÉTODOS PRINCIPALES ====================

  // OBTENER ITEMS DEL CARRITO
  getCartItems(): CartItem[] {
    return this.cartItems;
  }

  // MÉTODO GENÉRICO PARA AGREGAR AL CARRITO
  addToCart(item: any): boolean {
    try {
      // Determinar el tipo de item y procesarlo
      if (item.tipo === 'pelicula' || (item.pelicula && item.funcion)) {
        // Es una película
        this.addMovieToCart(item.pelicula, item.funcion, item.cantidad || 1);
      } else if (item.tipo === 'bar' || item.producto) {
        // Es un producto del bar
        this.addBarProductToCart(item);
      } else {
        console.error('Tipo de item no reconocido:', item);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      return false;
    }
  }

  // AGREGAR PELÍCULA AL CARRITO (método original)
  addMovieToCart(pelicula: Pelicula, funcion: FuncionCine, cantidad: number = 1): void {
    console.log('Agregando película al carrito:', pelicula.titulo, funcion);

    // Verificar si ya existe el item
    const existingItem = this.cartItems.find(item => 
      item.tipo === 'pelicula' &&
      item.pelicula?.titulo === pelicula.titulo && 
      item.funcion?.id === funcion.id
    );

    if (existingItem) {
      // Si existe, aumentar cantidad
      existingItem.cantidad += cantidad;
      existingItem.subtotal = existingItem.precio * existingItem.cantidad;
    } else {
      // Si no existe, crear nuevo item
      const cartItem: CartItem = {
        id: this.generateId(),
        tipo: 'pelicula',
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

  // AGREGAR PRODUCTO DEL BAR AL CARRITO
  addBarProductToCart(item: any): void {
    console.log('Agregando producto del bar al carrito:', item);

    const producto = item.producto;
    const cantidad = item.cantidad || 1;
    const opciones = item.opciones || {};

    // Crear clave única para identificar el item exacto (producto + opciones)
    const itemKey = this.generateBarItemKey(producto, opciones);

    // Verificar si ya existe el item exacto
    const existingItem = this.cartItems.find(cartItem => 
      cartItem.tipo === 'bar' &&
      cartItem.barProduct?.id === producto.id &&
      cartItem.itemKey === itemKey
    );

    if (existingItem) {
      // Si existe, aumentar cantidad
      existingItem.cantidad += cantidad;
      existingItem.subtotal = existingItem.precio * existingItem.cantidad;
    } else {
      // Si no existe, crear nuevo item
      const cartItem: CartItem = {
        id: this.generateId(),
        tipo: 'bar',
        barProduct: producto,
        barOptions: opciones,
        itemKey: itemKey,
        cantidad: cantidad,
        precio: item.precioTotal / cantidad, // Precio por unidad
        subtotal: item.precioTotal,
        nombre: this.generateBarItemName(producto, opciones)
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

  // ==================== MÉTODOS DE CONSULTA ====================

  // OBTENER TOTAL
  getTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.subtotal, 0);
  }

  // OBTENER CANTIDAD TOTAL DE ITEMS
  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.cantidad, 0);
  }

  // VERIFICAR SI UN ITEM ESTÁ EN EL CARRITO
  isInCart(tipo: string, itemId: number | string): boolean {
    if (tipo === 'pelicula') {
      return this.cartItems.some(item => 
        item.tipo === 'pelicula' && 
        item.pelicula?.titulo === itemId
      );
    } else if (tipo === 'bar') {
      return this.cartItems.some(item => 
        item.tipo === 'bar' && 
        item.barProduct?.id === itemId
      );
    }
    return false;
  }

  // OBTENER CANTIDAD DE UN ITEM EN EL CARRITO
  getItemQuantity(tipo: string, itemId: number | string): number {
    const items = this.cartItems.filter(item => {
      if (tipo === 'pelicula') {
        return item.tipo === 'pelicula' && item.pelicula?.titulo === itemId;
      } else if (tipo === 'bar') {
        return item.tipo === 'bar' && item.barProduct?.id === itemId;
      }
      return false;
    });

    return items.reduce((total, item) => total + item.cantidad, 0);
  }

  // OBTENER ITEMS POR TIPO
  getItemsByType(tipo: string): CartItem[] {
    return this.cartItems.filter(item => item.tipo === tipo);
  }

  // OBTENER RESUMEN DEL CARRITO
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

  // ==================== MÉTODOS DE VALIDACIÓN ====================

  // VALIDAR DISPONIBILIDAD
  checkAvailability(funcionId: string, cantidad: number): boolean {
    return cantidad <= 10; // Máximo 10 entradas por función
  }

  // VALIDAR CARRITO ANTES DE CHECKOUT
  validateCart(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.cartItems.length === 0) {
      errors.push('El carrito está vacío');
    }

    // Validar items de películas
    const peliculaItems = this.getItemsByType('pelicula');
    peliculaItems.forEach(item => {
      if (!item.pelicula || !item.funcion) {
        errors.push('Hay items de películas con datos incompletos');
      }
    });

    // Validar items del bar
    const barItems = this.getItemsByType('bar');
    barItems.forEach(item => {
      if (!item.barProduct || !item.barProduct.disponible) {
        errors.push(`El producto "${item.barProduct?.nombre || 'desconocido'}" no está disponible`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ==================== MÉTODOS DE COMPRA ====================

  // PROCESAR COMPRA
  processPurchase(): Promise<PurchaseResult> {
    return new Promise((resolve) => {
      // Validar carrito antes de procesar
      const validation = this.validateCart();
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
  }

  // ==================== MÉTODOS AUXILIARES ====================

  // GENERAR CLAVE ÚNICA PARA PRODUCTO DEL BAR
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

  // GENERAR NOMBRE DESCRIPTIVO PARA PRODUCTO DEL BAR
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

  // ACTUALIZAR CARRITO Y NOTIFICAR
  private updateCart(): void {
    this.cartSubject.next([...this.cartItems]);
    this.totalSubject.next(this.getTotal());
    this.saveCartToStorage();
  }

  // GUARDAR EN LOCALSTORAGE
  private saveCartToStorage(): void {
    try {
      localStorage.setItem('movieCart', JSON.stringify(this.cartItems));
    } catch (error) {
      console.error('Error guardando carrito:', error);
    }
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

  // GENERAR ID DE ORDEN
  private generateOrderId(): string {
    return 'ORD-' + Date.now().toString();
  }
}

// ==================== INTERFACES ACTUALIZADAS ====================

export interface CartItem {
  id: string;
  tipo: 'pelicula' | 'bar';
  
  // Para películas
  pelicula?: Pelicula;
  funcion?: FuncionCine;
  
  // Para productos del bar
  barProduct?: ProductoBar;
  barOptions?: {
    tamano?: TamañoProducto;
    extras?: ExtraProducto[];
    notas?: string;
  };
  itemKey?: string; // Clave única para identificar productos del bar con opciones
  nombre?: string; // Nombre descriptivo del item
  
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

export interface PurchaseResult {
  success: boolean;
  orderId: string;
  total: number;
  items: CartItem[];
  fecha: string;
  summary?: CartSummary;
  error?: string;
}