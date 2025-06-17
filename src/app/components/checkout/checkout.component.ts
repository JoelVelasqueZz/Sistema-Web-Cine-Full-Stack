import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService, CartItem } from '../../services/cart.service';
import { OrderService, CheckoutData, PaymentData } from '../../services/order.service';
import { PointsService } from '../../services/points.service';
import { ToastService } from '../../services/toast.service';
import { EmailService } from '../../services/email.service';
import { PaypalSimulationService, PayPalResult } from '../../services/paypal-simulation.service';
import { AuthService } from '../../services/auth.service'; 
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-checkout', 
  standalone: false,
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  procesandoPago: boolean = false;
  inicializandoCheckout: boolean = true;
  
  datosCheckout = {
    nombre: '',
    email: '',
    telefono: '',
    metodoPago: 'tarjeta',
    numeroTarjeta: '',
    mesExpiracion: '',
    anioExpiracion: '',
    cvv: '',
    aceptaTerminos: false
  };

  // Variables de validación
  validacionTarjeta = { valid: false, tipo: '', message: '' };
  validacionFecha = { valid: false, message: '' };
  validacionCVV = { valid: false, message: '' };

  // Datos del checkout desde la API
  checkoutData: CheckoutData | null = null;
  
  // Cálculos
  subtotal: number = 0;
  serviceFee: number = 0;
  taxes: number = 0;
  total: number = 0;

  // Sistema de puntos
  userPoints: number = 0;
  pointsToEarn: number = 0;
  userId: number = 0;
  usandoPuntos: boolean = false;
  puntosAUsar: number = 0;
  descuentoPuntos: number = 0;
  aplicandoPuntos: boolean = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private pointsService: PointsService,
    private router: Router,
    private toastService: ToastService,
    private emailService: EmailService,
    private paypalService: PaypalSimulationService,
    public authService: AuthService,
    private userService: UserService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.inicializarCheckout();
  }
  
  // ==================== INICIALIZACIÓN ====================

  inicializarCheckout(): void {
    this.cartItems = this.cartService.getCartItems();
    
    if (this.cartItems.length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.loadUserData();
    this.inicializandoCheckout = true;
    
    this.orderService.initializeCheckout(this.cartItems).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.checkoutData = response.data;
          this.procesarDatosCheckout(response.data);
          this.toastService.showSuccess('Checkout inicializado correctamente');
        } else {
          this.toastService.showError(response.message || 'Error al inicializar checkout');
          this.fallbackToLocalCalculation();
        }
        this.inicializandoCheckout = false;
      },
      error: (error) => {
        console.error('❌ Error inicializando checkout:', error);
        this.toastService.showWarning('Usando cálculo local por error de conexión');
        this.fallbackToLocalCalculation();
        this.inicializandoCheckout = false;
      }
    });
  }

  private procesarDatosCheckout(data: CheckoutData): void {
    this.subtotal = data.totals.subtotal;
    this.serviceFee = data.totals.serviceFee;
    this.taxes = data.totals.taxes;
    this.total = data.totals.total;
    this.userPoints = data.points.available;
    this.pointsToEarn = data.points.toEarn;

    console.log('✅ Checkout inicializado:', {
      total: this.total,
      puntos: this.userPoints,
      puntosAGanar: this.pointsToEarn
    });
  }

  private fallbackToLocalCalculation(): void {
    this.subtotal = this.cartService.getTotal();
    this.serviceFee = this.subtotal * 0.05;
    this.taxes = (this.subtotal + this.serviceFee) * 0.08;
    this.total = this.subtotal + this.serviceFee + this.taxes;
    this.pointsToEarn = Math.floor(this.total * 1);
  }

  private loadUserData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userId = currentUser.id;
      
      this.pointsService.getUserPoints().subscribe({
        next: (response) => {
          this.userPoints = response.puntosActuales;
        },
        error: (error) => {
          console.error('❌ Error cargando puntos:', error);
          this.userPoints = this.pointsService.getUserPoints_Legacy(this.userId);
        }
      });
    }
  }

  // ==================== GESTIÓN DE PUNTOS ====================

  aplicarPuntos(): void {
    if (this.puntosAUsar <= 0 || this.puntosAUsar > this.userPoints) {
      this.toastService.showWarning('Cantidad de puntos inválida');
      return;
    }

    this.aplicandoPuntos = true;

    this.orderService.applyPointsToCheckout(this.puntosAUsar, this.total).subscribe({
      next: (response) => {
        if (response.success) {
          this.descuentoPuntos = response.descuento;
          this.total = response.nuevoTotal;
          this.usandoPuntos = true;
          
          this.toastService.showSuccess(
            `¡${this.puntosAUsar} puntos aplicados! Descuento: ${this.descuentoPuntos.toFixed(2)}`
          );
        } else {
          this.toastService.showError(response.message);
        }
        this.aplicandoPuntos = false;
      },
      error: (error) => {
        console.error('❌ Error aplicando puntos:', error);
        this.toastService.showError('Error al aplicar puntos');
        this.aplicandoPuntos = false;
      }
    });
  }

  quitarPuntos(): void {
    this.usandoPuntos = false;
    this.puntosAUsar = 0;
    this.descuentoPuntos = 0;
    
    if (this.checkoutData) {
      this.total = this.checkoutData.totals.total;
    } else {
      this.total = this.subtotal + this.serviceFee + this.taxes;
    }
    
    this.toastService.showInfo('Puntos removidos del checkout');
  }

  getMaxPointsToUse(): number {
    return Math.min(this.userPoints, Math.floor(this.total));
  }

  getUserPointsValue(): number {
    return this.userPoints / 1; // 1 punto = $1
  }

  showPointsUsageInfo(): void {
    const modalElement = document.getElementById('pointsUsageModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // ==================== VALIDACIÓN DE TARJETAS ====================

  onNumeroTarjetaChange(): void {
    const numero = this.datosCheckout.numeroTarjeta.replace(/\s/g, '');
    const formatted = numero.replace(/(.{4})/g, '$1 ').trim();
    this.datosCheckout.numeroTarjeta = formatted;
    this.validacionTarjeta = this.validarNumeroTarjeta(numero);
    
    if (this.datosCheckout.cvv) {
      this.onCVVChange();
    }
  }

  onFechaExpiracionChange(): void {
    this.validacionFecha = this.validarFechaExpiracion(
      this.datosCheckout.mesExpiracion, 
      this.datosCheckout.anioExpiracion
    );
  }

  onCVVChange(): void {
    this.validacionCVV = this.validarCVV(this.datosCheckout.cvv, this.validacionTarjeta.tipo);
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  getYearsArray(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  }

  getCVVPlaceholder(): string {
    return this.validacionTarjeta.tipo === 'American Express' ? '1234' : '123';
  }

  getCVVMaxLength(): number {
    return this.validacionTarjeta.tipo === 'American Express' ? 4 : 3;
  }

  isFormValid(): boolean {
    const basicInfo = !!this.datosCheckout.nombre.trim() && 
                     !!this.datosCheckout.email.trim() && 
                     this.datosCheckout.aceptaTerminos;

    if (this.datosCheckout.metodoPago === 'paypal') {
      return basicInfo;
    }

    return basicInfo && 
           this.validacionTarjeta.valid && 
           this.validacionFecha.valid && 
           this.validacionCVV.valid;
  }

  // ==================== PROCESAMIENTO DE PAGO ====================

  procesarPago(): void {
    if (!this.isFormValid()) {
      this.toastService.showWarning('Por favor completa todos los campos requeridos');
      return;
    }

    this.procesandoPago = true;

    this.orderService.validateAvailability(this.cartItems).subscribe({
      next: (validation) => {
        if (validation.available) {
          if (this.datosCheckout.metodoPago === 'paypal') {
            this.procesarPayPal();
          } else {
            this.procesarTarjeta();
          }
        } else {
          this.procesandoPago = false;
          this.toastService.showError('Algunos items ya no están disponibles');
          console.log('Items no disponibles:', validation.errors);
        }
      },
      error: (error) => {
        console.error('❌ Error validando disponibilidad:', error);
        if (this.datosCheckout.metodoPago === 'paypal') {
          this.procesarPayPal();
        } else {
          this.procesarTarjeta();
        }
      }
    });
  }

  procesarTarjeta(): void {
    console.log('Procesando pago con tarjeta...');
    this.toastService.showInfo('Procesando pago con tarjeta...');
    
    setTimeout(() => {
      this.finalizarPago();
    }, 2000);
  }

 procesarPayPal(): void {
  console.log('🚀 Iniciando proceso PayPal...');
  
  // Verificar si PayPal está disponible
  if (!this.paypalService.isPayPalAvailable()) {
    this.procesandoPago = false;
    this.toastService.showError('❌ PayPal no está disponible. ' + this.paypalService.getPopupInstructions());
    return;
  }
  
  this.toastService.showInfo('🔄 Abriendo PayPal...');
  
  const paypalOrderData = {
    orderId: this.generateTempOrderId(),
    total: this.total.toFixed(2),
    email: this.datosCheckout.email,
    items: this.cartItems,
    timestamp: new Date().toISOString()
  };
  
  // Llamar directamente al servicio de PayPal
  this.paypalService.simulatePayPalRedirect(paypalOrderData)
    .then((result: PayPalResult) => {
      console.log('✅ PayPal completado:', result);
      this.toastService.showSuccess('✅ Pago con PayPal exitoso!');
      
      // Finalizar pago con los datos de PayPal
      this.finalizarPago({
        transactionId: result.transactionId,
        payerId: result.payerId,
        paymentStatus: result.paymentStatus,
        timestamp: result.timestamp
      });
    })
    .catch((error) => {
      console.error('❌ Error en PayPal:', error);
      this.procesandoPago = false;
      
      if (error.error?.includes('popup')) {
        this.toastService.showError('❌ ' + error.error + ' Verifica la configuración de tu navegador.');
      } else {
        this.toastService.showError('❌ ' + (error.error || 'Error en el proceso de PayPal'));
      }
    });
}

  finalizarPago(paypalData?: any): void {
    const paymentData: PaymentData = {
      nombre_cliente: this.datosCheckout.nombre,
      email_cliente: this.datosCheckout.email,
      telefono_cliente: this.datosCheckout.telefono,
      metodo_pago: this.datosCheckout.metodoPago as 'tarjeta' | 'paypal',
      cartItems: this.cartItems
    };

    if (this.datosCheckout.metodoPago === 'tarjeta') {
      paymentData.tarjeta = {
        numero: this.datosCheckout.numeroTarjeta.replace(/\s/g, ''),
        cvv: this.datosCheckout.cvv,
        mes_expiracion: this.datosCheckout.mesExpiracion,
        anio_expiracion: this.datosCheckout.anioExpiracion
      };
    }

    if (paypalData) {
      paymentData.paypal = {
        transaction_id: paypalData.transactionId,
        payer_id: paypalData.payerId,
        status: paypalData.paymentStatus
      };
    }

    this.orderService.processPayment(paymentData).subscribe({
      next: (response) => {
        if (response.success) {
          this.pagoExitoso(response, paypalData);
        } else {
          this.procesandoPago = false;
          this.toastService.showError(response.message);
        }
      },
      error: (error) => {
        console.error('❌ Error procesando pago:', error);
        this.procesandoPago = false;
        this.toastService.showError('Error al procesar el pago');
      }
    });
  }

  pagoExitoso(paymentResponse: any, paypalData?: any): void {
  this.procesandoPago = false;

  this.cartService.clearCart();

  const currentUser = this.authService.getCurrentUser();
  if (currentUser) {
    // 🔧 CORRECCIÓN: Usar HTTP calls para guardar en historial por "comprada"
    this.cartItems
      .filter(item => item.tipo === 'pelicula' && item.pelicula)
      .forEach((item) => {
        // 🆕 USAR HTTP POST al backend para guardar historial
        this.http.post(`http://localhost:3000/api/history`, {
          peliculaId: item.pelicula!.id,
          tipoAccion: 'comprada'
        }, {
          headers: {
            'Authorization': `Bearer ${this.authService.getToken()}`,
            'Content-Type': 'application/json'
          }
        }).subscribe({
          next: (response: any) => {
            if (response.success) {
              console.log(`✅ Historial guardado: ${item.pelicula!.titulo} - comprada`);
            } else {
              console.warn(`⚠️ No se pudo guardar historial para: ${item.pelicula!.titulo}`);
            }
          },
          error: (error) => {
            console.error(`❌ Error guardando historial para ${item.pelicula!.titulo}:`, error);
          }
        });
      });
  }

  const metodoPago = paypalData ? 'PayPal' : 'Tarjeta de Crédito';
  this.toastService.showSuccess(
    `¡Pago exitoso con ${metodoPago}! 🎉 Orden: ${paymentResponse.orderId}`,
    6000
  );

  if (paymentResponse.puntos && paymentResponse.puntos.ganados > 0) {
    setTimeout(() => {
      this.toastService.showInfo(
        `💰 ¡Has ganado ${paymentResponse.puntos.ganados} puntos!`,
        5000
      );
    }, 2000);
  }

  if (paypalData?.transactionId) {
    setTimeout(() => {
      this.toastService.showInfo(
        `💳 PayPal ID: ${paypalData.transactionId}`,
        4000
      );
    }, 4000);
  }

  this.enviarEmail(paymentResponse, paypalData);

  setTimeout(() => {
    this.router.navigate(['/home']);
  }, 7000);
}

  private enviarEmail(paymentResponse: any, paypalData?: any): void {
    this.toastService.showInfo('📧 Enviando confirmación por email...');

    const orderData = {
      orderId: paymentResponse.orderId,
      nombre: this.datosCheckout.nombre,
      email: this.datosCheckout.email,
      telefono: this.datosCheckout.telefono,
      metodoPago: paypalData ? 'PayPal' : 'Tarjeta de Crédito',
      subtotal: this.subtotal.toFixed(2),
      serviceFee: this.serviceFee.toFixed(2),
      taxes: this.taxes.toFixed(2),
      total: paymentResponse.total.toFixed(2),
      puntosGanados: paymentResponse.puntos?.ganados || 0,
      fecha: paymentResponse.fecha,
      ...(paypalData && {
        paypalTransactionId: paypalData.transactionId,
        paypalPayerId: paypalData.payerId,
        paypalStatus: paypalData.paymentStatus
      })
    };

    this.emailService.sendTicketEmail(orderData, this.cartItems)
      .then((success) => {
        if (success) {
          this.toastService.showSuccess(`✅ Confirmación enviada a ${this.datosCheckout.email}`);
        } else {
          this.toastService.showWarning(
            `⚠️ Error enviando email. Tu compra fue exitosa. Orden: ${paymentResponse.orderId}`
          );
        }
      })
      .catch((error) => {
        console.error('Error enviando email:', error);
        this.toastService.showWarning(
          `⚠️ Error enviando email. Tu compra fue exitosa. Orden: ${paymentResponse.orderId}`
        );
      });
  }

  // ==================== VALIDACIONES DE TARJETA ====================
  
  validarNumeroTarjeta(numero: string): { valid: boolean, tipo: string, message: string } {
    const cleanNumber = numero.replace(/[\s-]/g, '');
    
    if (!cleanNumber) {
      return { valid: false, tipo: '', message: 'Ingresa el número de tarjeta' };
    }
    if (!/^\d+$/.test(cleanNumber)) {
      return { valid: false, tipo: '', message: 'Solo se permiten números' };
    }

    let tipo = '';
    let expectedLength = 0;
    if (/^4/.test(cleanNumber)) {
      tipo = 'Visa';
      expectedLength = 16;
    } else if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) {
      tipo = 'MasterCard';
      expectedLength = 16;
    } else if (/^3[47]/.test(cleanNumber)) {
      tipo = 'American Express';
      expectedLength = 15;
    } else {
      return { valid: false, tipo: '', message: 'Tipo de tarjeta no soportado' };
    }

    if (cleanNumber.length !== expectedLength) {
      return { 
        valid: false, 
        tipo, 
        message: `${tipo} debe tener ${expectedLength} dígitos` 
      };
    }

    // Algoritmo de Luhn
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }

    const isValid = sum % 10 === 0;
    
    return {
      valid: isValid,
      tipo: tipo,
      message: isValid ? `Tarjeta ${tipo} válida` : 'Número de tarjeta inválido'
    };
  }

  validarFechaExpiracion(mes: string, anio: string): { valid: boolean, message: string } {
    if (!mes || !anio) {
      return { valid: false, message: 'Selecciona mes y año' };
    }

    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const anioActual = fechaActual.getFullYear();

    if (anioNum < anioActual) {
      return { valid: false, message: 'La tarjeta ha expirado' };
    }

    if (anioNum === anioActual && mesNum < mesActual) {
      return { valid: false, message: 'La tarjeta ha expirado' };
    }

    if (anioNum > anioActual + 10) {
      return { valid: false, message: 'Fecha muy lejana en el futuro' };
    }

    return { valid: true, message: 'Fecha de expiración válida' };
  }

  validarCVV(cvv: string, tipoTarjeta: string): { valid: boolean, message: string } {
    if (!cvv) {
      return { valid: false, message: 'Ingresa el código CVV' };
    }

    if (!/^\d+$/.test(cvv)) {
      return { valid: false, message: 'CVV solo debe contener números' };
    }

    const expectedLength = tipoTarjeta === 'American Express' ? 4 : 3;
    
    if (cvv.length !== expectedLength) {
      return { 
        valid: false, 
        message: `CVV debe tener ${expectedLength} dígitos` 
      };
    }

    return { valid: true, message: `CVV válido (${expectedLength} dígitos)` };
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private generateTempOrderId(): string {
    return 'TMP-' + Date.now().toString();
  }

  cancelarCompra(): void {
    this.toastService.showInfo('Compra cancelada');
    this.router.navigate(['/cart']);
  }

  getPeliculaItems(): CartItem[] {
    return this.cartItems.filter(item => item.tipo === 'pelicula');
  }

  getBarItems(): CartItem[] {
    return this.cartItems.filter(item => item.tipo === 'bar');
  }

  tienePeliculas(): boolean {
    return this.getPeliculaItems().length > 0;
  }

  tieneProductosBar(): boolean {
    return this.getBarItems().length > 0;
  }

  getCartSummary() {
    return this.cartService.getCartSummary();
  }

  // 🆕 MÉTODOS FALTANTES PARA EL TEMPLATE

  /**
   * Obtener nombre para mostrar del item
   */
  getItemDisplayName(cartItem: CartItem): string {
    if (cartItem.tipo === 'pelicula' && cartItem.pelicula) {
      return cartItem.pelicula.titulo;
    } else if (cartItem.tipo === 'bar') {
      return cartItem.nombre || cartItem.barProduct?.nombre || 'Producto del bar';
    }
    return 'Item desconocido';
  }

  /**
   * Obtener descripción del item
   */
  getItemDescription(cartItem: CartItem): string {
    if (cartItem.tipo === 'pelicula' && cartItem.funcion) {
      return `${cartItem.funcion.fecha} - ${cartItem.funcion.hora} - ${cartItem.funcion.sala}`;
    } else if (cartItem.tipo === 'bar' && cartItem.barOptions) {
      let description = '';
      if (cartItem.barOptions.tamano) {
        description += `Tamaño: ${cartItem.barOptions.tamano.nombre}`;
      }
      if (cartItem.barOptions.extras && cartItem.barOptions.extras.length > 0) {
        if (description) description += ' | ';
        description += `Extras: ${cartItem.barOptions.extras.map(e => e.nombre).join(', ')}`;
      }
      return description;
    }
    return '';
  }
}