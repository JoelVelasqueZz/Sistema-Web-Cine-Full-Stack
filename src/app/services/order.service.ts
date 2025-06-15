import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CartItem } from './cart.service';
import { AuthService } from './auth.service'; // 🆕 IMPORTAR
import { PayPalResult, PaypalSimulationService } from './paypal-simulation.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly API_URL = `http://localhost:3000/api/orders`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private paypalService: PaypalSimulationService // 🆕 INYECTAR
  ) {
    console.log('🆕 OrderService inicializado con autenticación');
  }

  // 🆕 MÉTODO PARA OBTENER HEADERS AUTENTICADOS
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    
    if (!token) {
      console.warn('⚠️ No hay token de autenticación para OrderService');
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== MÉTODOS DE CHECKOUT (CORREGIDOS) ====================

  /**
   * Inicializar proceso de checkout
   */
  initializeCheckout(cartItems: CartItem[]): Observable<CheckoutResponse> {
    const payload = { cartItems: this.formatCartItemsForAPI(cartItems) };
    const headers = this.getAuthHeaders(); // 🆕 AGREGAR HEADERS
    
    return this.http.post<ApiResponse<CheckoutData>>(`${this.API_URL}/checkout/initialize`, payload, { headers }).pipe(
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
    const headers = this.getAuthHeaders(); // 🆕 AGREGAR HEADERS
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/checkout/validate`, payload, { headers }).pipe(
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
    const headers = this.getAuthHeaders(); // 🆕 AGREGAR HEADERS
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/checkout/apply-points`, payload, { headers }).pipe(
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
 simulatePayPal(paypalOrderData: any): Observable<any> {
  // Convertir la Promise a Observable usando 'from'
  return from(new Promise((resolve) => {
    // Mostrar información en consola
    console.log('🎯 Simulando PayPal con datos:', paypalOrderData);
    
    // Usar el servicio de PayPal
    this.paypalService.simulatePayPalRedirect(paypalOrderData)
      .then((result: PayPalResult) => {
        console.log('✅ PayPal exitoso:', result);
        resolve({
          success: true,
          message: 'Pago con PayPal completado exitosamente',
          transactionId: result.transactionId,
          payerId: result.payerId,
          paymentStatus: result.paymentStatus,
          timestamp: result.timestamp
        });
      })
      .catch((error) => {
        console.error('❌ Error en PayPal:', error);
        resolve({
          success: false,
          message: error.error || 'Error en el proceso de PayPal',
          error: error
        });
      });
  })).pipe(
    // Convertir Promise a Observable
    map(result => result)
  );
}

  /**
   * Procesar pago final
   */
  processPayment(paymentData: PaymentData): Observable<PaymentResponse> {
    const headers = this.getAuthHeaders(); // 🆕 AGREGAR HEADERS
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/checkout/process`, paymentData, { headers }).pipe(
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

  // ==================== GESTIÓN DE ÓRDENES (CORREGIDAS) ====================

  /**
   * Obtener órdenes del usuario
   */
  getUserOrders(page: number = 1, limit: number = 20): Observable<Order[]> {
    const params = { page: page.toString(), limit: limit.toString() };
    const headers = this.getAuthHeaders(); // 🆕 AGREGAR HEADERS
    
    return this.http.get<ApiResponse<Order[]>>(`${this.API_URL}`, { headers, params }).pipe(
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
    const headers = this.getAuthHeaders(); // 🆕 AGREGAR HEADERS
    
    return this.http.get<ApiResponse<OrderDetails>>(`${this.API_URL}/${orderId}`, { headers }).pipe(
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
    const headers = this.getAuthHeaders(); // 🆕 AGREGAR HEADERS
    
    return this.http.get<ApiResponse<OrderStats>>(`${this.API_URL}/stats`, { headers }).pipe(
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
    const headers = this.getAuthHeaders(); // 🆕 AGREGAR HEADERS
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${orderId}/cancel`, {}, { headers }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('❌ Error al cancelar orden:', error);
        return of(false);
      })
    );
  }

  // ==================== MÉTODOS AUXILIARES (SIN CAMBIOS) ====================

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

// ==================== INTERFACES (SIN CAMBIOS) ====================

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