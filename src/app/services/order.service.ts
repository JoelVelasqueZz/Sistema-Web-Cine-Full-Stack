import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CartItem } from './cart.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly API_URL = `http://localhost:3000/api/orders`;

  constructor(private http: HttpClient) {
    console.log('🆕 OrderService inicializado');
  }

  // ==================== MÉTODOS DE CHECKOUT ====================

  /**
   * Inicializar proceso de checkout
   */
  initializeCheckout(cartItems: CartItem[]): Observable<CheckoutResponse> {
    const payload = { cartItems: this.formatCartItemsForAPI(cartItems) };
    
    return this.http.post<ApiResponse<CheckoutData>>(`${this.API_URL}/checkout/initialize`, payload).pipe(
      map(response => {
        if (response.success) {
          return {
            success: true,
            data: response.data,
            message: 'Checkout inicializado'
          };
        }
        return {
          success: false,
          data: null,
          message: response.message || 'Error al inicializar checkout'
        };
      }),
      catchError(error => {
        console.error('❌ Error al inicializar checkout:', error);
        return of({
          success: false,
          data: null,
          message: error.error?.message || 'Error de conexión'
        });
      })
    );
  }

  /**
   * Validar disponibilidad de items
   */
  validateAvailability(cartItems: CartItem[]): Observable<AvailabilityResponse> {
    const payload = { cartItems: this.formatCartItemsForAPI(cartItems) };
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/checkout/validate`, payload).pipe(
      map(response => ({
        success: response.success,
        available: response.data?.available || false,
        items: response.data?.items || [],
        errors: response.data?.errors || []
      })),
      catchError(error => {
        console.error('❌ Error al validar disponibilidad:', error);
        return of({
          success: false,
          available: false,
          items: [],
          errors: ['Error de conexión']
        });
      })
    );
  }

  /**
   * Aplicar puntos al checkout
   */
  applyPointsToCheckout(puntosAUsar: number, total: number): Observable<PointsApplicationResponse> {
    const payload = { puntosAUsar, total };
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/checkout/apply-points`, payload).pipe(
      map(response => {
        if (response.success) {
          return {
            success: true,
            puntosAplicados: response.data.puntosAplicados,
            descuento: response.data.descuento,
            nuevoTotal: response.data.nuevoTotal,
            message: 'Puntos aplicados correctamente'
          };
        }
        return {
          success: false,
          puntosAplicados: 0,
          descuento: 0,
          nuevoTotal: total,
          message: response.message || 'Error al aplicar puntos'
        };
      }),
      catchError(error => {
        console.error('❌ Error al aplicar puntos:', error);
        return of({
          success: false,
          puntosAplicados: 0,
          descuento: 0,
          nuevoTotal: total,
          message: error.error?.message || 'Error al aplicar puntos'
        });
      })
    );
  }

  /**
   * Simular proceso de PayPal
   */
  simulatePayPal(orderData: any, returnUrl?: string, cancelUrl?: string): Observable<PayPalSimulationResponse> {
    const payload = { orderData, returnUrl, cancelUrl };
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/checkout/paypal/simulate`, payload).pipe(
      map(response => {
        if (response.success) {
          return {
            success: true,
            transactionId: response.data.transactionId,
            payerId: response.data.payerId,
            paymentStatus: response.data.paymentStatus,
            amount: response.data.amount,
            message: 'Simulación de PayPal exitosa'
          };
        }
        return {
          success: false,
          transactionId: '',
          payerId: '',
          paymentStatus: '',
          amount: '',
          message: response.message || 'Error en simulación de PayPal'
        };
      }),
      catchError(error => {
        console.error('❌ Error en simulación PayPal:', error);
        return of({
          success: false,
          transactionId: '',
          payerId: '',
          paymentStatus: '',
          amount: '',
          message: error.error?.message || 'Error en PayPal'
        });
      })
    );
  }

  /**
   * Procesar pago final
   */
  processPayment(paymentData: PaymentData): Observable<PaymentResponse> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/checkout/process`, paymentData).pipe(
      map(response => {
        if (response.success) {
          return {
            success: true,
            orderId: response.data.orderId,
            total: response.data.total,
            fecha: response.data.fechaCreacion,
            puntos: response.data.puntos,
            confirmacion: response.data.confirmacion,
            message: response.message || 'Pago procesado exitosamente'
          };
        }
        return {
          success: false,
          orderId: '',
          total: 0,
          fecha: '',
          puntos: null,
          confirmacion: null,
          message: response.message || 'Error al procesar pago'
        };
      }),
      catchError(error => {
        console.error('❌ Error al procesar pago:', error);
        return of({
          success: false,
          orderId: '',
          total: 0,
          fecha: '',
          puntos: null,
          confirmacion: null,
          message: error.error?.message || 'Error al procesar pago'
        });
      })
    );
  }

  // ==================== GESTIÓN DE ÓRDENES ====================

  /**
   * Obtener órdenes del usuario
   */
  getUserOrders(page: number = 1, limit: number = 20): Observable<Order[]> {
    const params = { page: page.toString(), limit: limit.toString() };
    
    return this.http.get<ApiResponse<Order[]>>(`${this.API_URL}`, { params }).pipe(
      map(response => response.success ? response.data : []),
      catchError(error => {
        console.error('❌ Error al obtener órdenes:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener orden específica por ID
   */
  getOrderById(orderId: string): Observable<OrderDetails | null> {
    return this.http.get<ApiResponse<OrderDetails>>(`${this.API_URL}/${orderId}`).pipe(
      map(response => response.success ? response.data : null),
      catchError(error => {
        console.error('❌ Error al obtener orden:', error);
        return of(null);
      })
    );
  }

  /**
   * Obtener estadísticas de órdenes del usuario
   */
  getOrderStats(): Observable<OrderStats> {
    return this.http.get<ApiResponse<OrderStats>>(`${this.API_URL}/stats`).pipe(
      map(response => response.success ? response.data : this.getDefaultOrderStats()),
      catchError(error => {
        console.error('❌ Error al obtener estadísticas de órdenes:', error);
        return of(this.getDefaultOrderStats());
      })
    );
  }

  /**
   * Cancelar orden
   */
  cancelOrder(orderId: string): Observable<boolean> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${orderId}/cancel`, {}).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('❌ Error al cancelar orden:', error);
        return of(false);
      })
    );
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Formatear items del carrito para la API
   */
  private formatCartItemsForAPI(cartItems: CartItem[]): any[] {
    return cartItems.map(item => {
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
        // 🔧 CORREGIDO: Solo agregar si existe la propiedad
        if ('asientos_seleccionados' in item) {
          formattedItem.asientos_seleccionados = item.asientos_seleccionados || [];
        }
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

  /**
   * Calcular totales del carrito
   */
  calculateTotals(cartItems: CartItem[]): OrderTotals {
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
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
   * Obtener estadísticas por defecto
   */
  private getDefaultOrderStats(): OrderStats {
    return {
      totalOrdenes: 0,
      ordenesCompletadas: 0,
      ordenesPendientes: 0,
      ordenesCanceladas: 0,
      totalIngresos: 0,
      ticketPromedio: 0
    };
  }
}

// ==================== INTERFACES ====================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}

export interface CheckoutData {
  user: {
    id: number;
    points: number;
  };
  cart: {
    items: any[];
    summary: {
      totalItems: number;
      totalPeliculas: number;
      totalProductosBar: number;
    };
  };
  totals: OrderTotals;
  points: {
    available: number;
    toEarn: number;
    value: number;
  };
  paymentMethods: string[];
}

export interface CheckoutResponse {
  success: boolean;
  data: CheckoutData | null;
  message: string;
}

export interface AvailabilityResponse {
  success: boolean;
  available: boolean;
  items: any[];
  errors: string[];
}

export interface PointsApplicationResponse {
  success: boolean;
  puntosAplicados: number;
  descuento: number;
  nuevoTotal: number;
  message: string;
}

export interface PayPalSimulationResponse {
  success: boolean;
  transactionId: string;
  payerId: string;
  paymentStatus: string;
  amount: string;
  message: string;
}

export interface PaymentData {
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string;
  metodo_pago: 'tarjeta' | 'paypal';
  cartItems: any[];
  
  // Para tarjeta
  tarjeta?: {
    numero: string;
    cvv: string;
    mes_expiracion: string;
    anio_expiracion: string;
  };
  
  // Para PayPal
  paypal?: {
    transaction_id: string;
    payer_id: string;
    status: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  orderId: string;
  total: number;
  fecha: string;
  puntos: {
    ganados: number;
    total: number;
  } | null;
  confirmacion: {
    numeroOrden: string;
    email: string;
    nombre: string;
    items: number;
    fecha: string;
  } | null;
  message: string;
}

export interface Order {
  id: string;
  total: number;
  subtotal: number;
  estado: 'pendiente' | 'completada' | 'cancelada' | 'reembolsada';
  metodo_pago: string;
  fecha_creacion: string;
  total_entradas: number;
  total_productos_bar: number;
}

export interface OrderDetails extends Order {
  impuestos: number;
  cargo_servicio: number;
  email_cliente: string;
  nombre_cliente: string;
  telefono_cliente?: string;
  items_peliculas: any[];
  items_bar: any[];
}

export interface OrderStats {
  totalOrdenes: number;
  ordenesCompletadas: number;
  ordenesPendientes: number;
  ordenesCanceladas: number;
  totalIngresos: number;
  ticketPromedio: number;
}

export interface OrderTotals {
  subtotal: number;
  serviceFee: number;
  taxes: number;
  total: number;
}