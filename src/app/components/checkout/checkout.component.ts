import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';
import { EmailService } from '../../services/email.service';
import { PaypalSimulationService, PayPalResult } from '../../services/paypal-simulation.service';
import { AuthService } from '../../services/auth.service'; 
import { UserService } from '../../services/user.service';
import { PointsService } from '../../services/points.service'; // 🆕 NUEVO

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  procesandoPago: boolean = false;
  
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

  // Cálculos
  subtotal: number = 0;
  serviceFee: number = 0;
  taxes: number = 0;
  total: number = 0;

  // 🆕 NUEVAS PROPIEDADES PARA SISTEMA DE PUNTOS
  userPoints: number = 0;
  pointsToEarn: number = 0;
  userId: number = 0;

  constructor(
    private cartService: CartService,
    private router: Router,
    private toastService: ToastService,
    private emailService: EmailService,
    private paypalService: PaypalSimulationService,
    public authService: AuthService,
    private userService: UserService,
    private pointsService: PointsService // 🆕 NUEVO
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
    this.loadUserPoints(); // 🆕 NUEVO
  }

  cargarDatos(): void {
    this.cartItems = this.cartService.getCartItems();
    
    if (this.cartItems.length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.subtotal = this.cartService.getTotal();
    this.serviceFee = this.subtotal * 0.05;
    this.taxes = (this.subtotal + this.serviceFee) * 0.08;
    this.total = this.subtotal + this.serviceFee + this.taxes;

    // 🆕 CALCULAR PUNTOS A GANAR
    this.pointsToEarn = Math.floor(this.total * this.pointsService.getPointsConfig().puntosPorDolar);
  }

  // 🆕 NUEVO MÉTODO: Cargar puntos del usuario
  loadUserPoints(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userId = currentUser.id;
      this.userPoints = this.pointsService.getUserPoints(this.userId);
    }
  }

  // ==================== MÉTODOS DE VALIDACIÓN ====================

  // Validación en tiempo real del número de tarjeta
  onNumeroTarjetaChange(): void {
    // Formatear número (agregar espacios cada 4 dígitos)
    const numero = this.datosCheckout.numeroTarjeta.replace(/\s/g, '');
    const formatted = numero.replace(/(.{4})/g, '$1 ').trim();
    this.datosCheckout.numeroTarjeta = formatted;

    // Validar
    this.validacionTarjeta = this.validarNumeroTarjeta(numero);
    
    // Limpiar CVV si cambia tipo de tarjeta
    if (this.datosCheckout.cvv) {
      this.onCVVChange();
    }
  }

  // Validación en tiempo real de fecha
  onFechaExpiracionChange(): void {
    this.validacionFecha = this.validarFechaExpiracion(
      this.datosCheckout.mesExpiracion, 
      this.datosCheckout.anioExpiracion
    );
  }

  // Validación en tiempo real de CVV
  onCVVChange(): void {
    this.validacionCVV = this.validarCVV(this.datosCheckout.cvv, this.validacionTarjeta.tipo);
  }

  // Solo permitir números
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // Generar array de años
  getYearsArray(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  }

  // Placeholder dinámico para CVV
  getCVVPlaceholder(): string {
    return this.validacionTarjeta.tipo === 'American Express' ? '1234' : '123';
  }

  // Longitud máxima de CVV
  getCVVMaxLength(): number {
    return this.validacionTarjeta.tipo === 'American Express' ? 4 : 3;
  }

  // Validación completa del formulario
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

  // Validar número de tarjeta con Algoritmo de Luhn
  validarNumeroTarjeta(numero: string): { valid: boolean, tipo: string, message: string } {
    const cleanNumber = numero.replace(/[\s-]/g, '');
    
    if (!cleanNumber) {
      return { valid: false, tipo: '', message: 'Ingresa el número de tarjeta' };
    }
    if (!/^\d+$/.test(cleanNumber)) {
      return { valid: false, tipo: '', message: 'Solo se permiten números' };
    }

    // Detectar tipo de tarjeta
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

    // Verificar longitud
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

  // Validar fecha de expiración
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

  // Validar CVV
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

  // ==================== MÉTODOS DE PAGO ====================

  procesarPago(): void {
    if (!this.isFormValid()) {
      this.toastService.showWarning('Por favor completa todos los campos requeridos');
      return;
    }

    this.procesandoPago = true;

    setTimeout(() => {
      if (this.datosCheckout.metodoPago === 'paypal') {
        this.procesarPayPal();
      } else {
        this.procesarTarjeta();
      }
    }, 2000);
  }

  procesarTarjeta(): void {
    console.log('Procesando pago con tarjeta...', this.datosCheckout);
    this.toastService.showInfo('Procesando pago con tarjeta...');
    this.pagoExitoso();
  }

  procesarPayPal(): void {
    console.log('Iniciando proceso PayPal...');
    this.toastService.showInfo('🔄 Redirigiendo a PayPal...');
    
    // Preparar datos para PayPal
    const paypalOrderData = {
      orderId: this.generateTempOrderId(),
      total: this.total.toFixed(2),
      email: this.datosCheckout.email,
      items: this.cartItems
    };
    
    // Simular redirección a PayPal
    this.paypalService.simulatePayPalRedirect(paypalOrderData)
      .then((result: PayPalResult) => {
        console.log('✅ Respuesta de PayPal:', result);
        
        if (result.success) {
          // PayPal exitoso
          this.toastService.showSuccess('✅ Pago con PayPal exitoso!');
          
          // Continuar con el proceso normal
          this.pagoExitoso(result);
          
        } else {
          // PayPal falló
          this.procesandoPago = false;
          this.toastService.showError('❌ ' + (result.error || 'Error en PayPal'));
        }
      })
      .catch((error: any) => {
        console.error('❌ Error en PayPal:', error);
        this.procesandoPago = false;
        this.toastService.showError('❌ Error de conexión con PayPal');
      });
  }

  pagoExitoso(paypalResult?: PayPalResult): void {
    this.cartService.processPurchase().then(result => {
      console.log('Compra procesada:', result);
      
      // 🆕 AGREGAR AL HISTORIAL CUANDO SE COMPLETE LA COMPRA
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        // Agregar solo las películas compradas al historial
        this.cartItems
          .filter(item => item.tipo === 'pelicula' && item.pelicula)
          .forEach((item, index) => {
            this.userService.addToHistory(currentUser.id, {
              peliculaId: index,
              titulo: item.pelicula!.titulo,
              poster: item.pelicula!.poster,
              genero: item.pelicula!.genero,
              anio: item.pelicula!.anio,
              fechaVista: new Date().toISOString(),
              tipoAccion: 'comprada'
            });
          });

        // 🆕 PROCESAR PUNTOS POR LA COMPRA
        const puntosGanados = this.pointsService.processPointsForPurchase(
          currentUser.id,
          this.total,
          this.cartItems
        );

        if (puntosGanados > 0) {
          this.toastService.showSuccess(`¡Ganaste ${puntosGanados} puntos por tu compra! 🎉`);
        }

        // 🍿 Log de productos del bar comprados (opcional)
        const productosBarComprados = this.cartItems
          .filter(item => item.tipo === 'bar' && item.barProduct)
          .map(item => ({
            nombre: item.nombre || item.barProduct!.nombre,
            cantidad: item.cantidad,
            precio: item.subtotal
          }));

        if (productosBarComprados.length > 0) {
          console.log('🍿 Productos del bar comprados:', productosBarComprados);
        }
      }
      
      this.procesandoPago = false;
      
      // Preparar datos completos incluyendo PayPal
      const orderData = {
        ...result,
        nombre: this.datosCheckout.nombre,
        email: this.datosCheckout.email,
        telefono: this.datosCheckout.telefono,
        metodoPago: this.datosCheckout.metodoPago === 'tarjeta' ? 'Tarjeta de Crédito' : 'PayPal',
        subtotal: this.subtotal.toFixed(2),
        serviceFee: this.serviceFee.toFixed(2),
        taxes: this.taxes.toFixed(2),
        total: this.total.toFixed(2),
        
        // 🆕 AGREGAR INFORMACIÓN DE PUNTOS
        puntosGanados: this.pointsToEarn,
        
        // Datos adicionales de PayPal
        ...(paypalResult && {
          paypalTransactionId: paypalResult.transactionId,
          paypalPayerId: paypalResult.payerId,
          paypalStatus: paypalResult.paymentStatus
        })
      };
      
      // Envío de email
      this.toastService.showInfo('📧 Enviando entradas por email...');
      
      this.emailService.sendTicketEmail(orderData, this.cartItems)
        .then((success) => {
          if (success) {
            const mensaje = paypalResult ? 
              `¡Pago con PayPal exitoso! 🎉 Entradas enviadas a ${this.datosCheckout.email}` :
              `¡Pago exitoso! 🎉 Entradas enviadas a ${this.datosCheckout.email}`;
              
            this.toastService.showSuccess(mensaje, 6000);
            
            // 🆕 MOSTRAR MENSAJE DE PUNTOS GANADOS
            if (this.pointsToEarn > 0) {
              setTimeout(() => {
                this.toastService.showInfo(
                  `💰 ¡Has ganado ${this.pointsToEarn} puntos! Úsalos en el centro de recompensas.`,
                  5000
                );
              }, 2000);
            }
            
            // Mostrar información de transacción PayPal
            if (paypalResult?.transactionId) {
              setTimeout(() => {
                this.toastService.showInfo(
                  `💳 PayPal ID: ${paypalResult.transactionId}`,
                  4000
                );
              }, 4000);
            }
            
          } else {
            this.toastService.showError(
              'Error enviando email. Contacta soporte con tu número de orden: ' + result.orderId
            );
          }
          
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 7000);
          
        })
        .catch((error: any) => {
          console.error('Error en proceso de email:', error);
          this.toastService.showError(
            'Error enviando email. Tu compra fue exitosa. Orden: ' + result.orderId
          );
          
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 3000);
        });
        
    }).catch((error: any) => {
      console.error('Error procesando compra:', error);
      this.procesandoPago = false;
      this.toastService.showError('Error procesando el pago. Intenta nuevamente.');
    });
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private generateTempOrderId(): string {
    return 'PP-' + Date.now().toString();
  }

  cancelarCompra(): void {
    this.toastService.showInfo('Compra cancelada');
    this.router.navigate(['/cart']);
  }

  // ==================== MÉTODOS PARA EL TEMPLATE ====================

  /**
   * Obtener items de películas
   */
  getPeliculaItems(): CartItem[] {
    return this.cartItems.filter(item => item.tipo === 'pelicula');
  }

  /**
   * Obtener items del bar
   */
  getBarItems(): CartItem[] {
    return this.cartItems.filter(item => item.tipo === 'bar');
  }

  /**
   * Verificar si hay películas en el carrito
   */
  tienePeliculas(): boolean {
    return this.getPeliculaItems().length > 0;
  }

  /**
   * Verificar si hay productos del bar en el carrito
   */
  tieneProductosBar(): boolean {
    return this.getBarItems().length > 0;
  }

  /**
   * Obtener resumen del carrito
   */
  getCartSummary() {
    return this.cartService.getCartSummary();
  }

  /**
   * Obtener nombre del item (útil para productos del bar con opciones)
   */
  getItemDisplayName(item: CartItem): string {
    if (item.tipo === 'pelicula' && item.pelicula) {
      return item.pelicula.titulo;
    } else if (item.tipo === 'bar') {
      return item.nombre || item.barProduct?.nombre || 'Producto del bar';
    }
    return 'Item desconocido';
  }

  /**
   * Obtener descripción del item
   */
  getItemDescription(item: CartItem): string {
    if (item.tipo === 'pelicula' && item.funcion) {
      return `${item.funcion.fecha} - ${item.funcion.hora} - ${item.funcion.sala}`;
    } else if (item.tipo === 'bar' && item.barOptions) {
      let description = '';
      if (item.barOptions.tamano) {
        description += `Tamaño: ${item.barOptions.tamano.nombre}`;
      }
      if (item.barOptions.extras && item.barOptions.extras.length > 0) {
        if (description) description += ' | ';
        description += `Extras: ${item.barOptions.extras.map(e => e.nombre).join(', ')}`;
      }
      return description;
    }
    return '';
  }

  // 🆕 NUEVOS MÉTODOS PARA EL SISTEMA DE PUNTOS

  /**
   * Obtener configuración de puntos
   */
  getPointsConfig() {
    return this.pointsService.getPointsConfig();
  }

  /**
   * Calcular valor en dólares de los puntos del usuario
   */
  getUserPointsValue(): number {
    return this.pointsService.getPointsValue(this.userPoints);
  }
}