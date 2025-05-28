import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service'; // ← AGREGAR IMPORT

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

  // Cálculos
  subtotal: number = 0;
  serviceFee: number = 0;
  taxes: number = 0;
  total: number = 0;

  constructor(
    private cartService: CartService,
    private router: Router,
    private toastService: ToastService // ← AGREGAR AQUÍ
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cartItems = this.cartService.getCartItems();
    
    // Si no hay items, redirigir al carrito
    if (this.cartItems.length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    // Calcular totales
    this.subtotal = this.cartService.getTotal();
    this.serviceFee = this.subtotal * 0.05; // 5% cargo por servicio
    this.taxes = (this.subtotal + this.serviceFee) * 0.08; // 8% impuestos
    this.total = this.subtotal + this.serviceFee + this.taxes;
  }

  procesarPago(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.procesandoPago = true;

    // Simular procesamiento de pago
    setTimeout(() => {
      if (this.datosCheckout.metodoPago === 'paypal') {
        this.procesarPayPal();
      } else {
        this.procesarTarjeta();
      }
    }, 2000);
  }

  procesarTarjeta(): void {
    // Simular pago con tarjeta
    console.log('Procesando pago con tarjeta...', this.datosCheckout);
    
    // ✅ NUEVO: Toast de procesamiento
    this.toastService.showInfo('Procesando pago con tarjeta...');
    
    // Simular respuesta exitosa
    this.pagoExitoso();
  }

  procesarPayPal(): void {
    // Simular integración con PayPal
    console.log('Redirigiendo a PayPal...');
    
    // ✅ CAMBIO: Alert por Toast
    this.toastService.showInfo('Redirigiendo a PayPal...');
    
    // Simular pago exitoso después de PayPal
    setTimeout(() => {
      this.pagoExitoso();
    }, 1000);
  }

  pagoExitoso(): void {
    // Procesar la compra
    this.cartService.processPurchase().then(result => {
      console.log('Compra procesada:', result);
      
      this.procesandoPago = false;
      
      // ✅ CAMBIO: Alert por Toast de éxito (más largo)
      this.toastService.showSuccess(
        `¡Pago exitoso! 🎉 Tu número de orden es: ${result.orderId}. Revisa tu email para las entradas.`,
        6000 // 6 segundos para que pueda leer el número de orden
      );
      
      // Redirigir después de mostrar el toast
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 2000);
      
    }).catch(error => {
      console.error('Error procesando compra:', error);
      this.procesandoPago = false;
      
      // ✅ CAMBIO: Alert por Toast de error
      this.toastService.showError('Error procesando el pago. Intenta nuevamente.');
    });
  }

  // VALIDAR NÚMERO DE TARJETA (ALGORITMO DE LUHN)
  validarNumeroTarjeta(numero: string): { valid: boolean, tipo: string, message: string } {
    const cleanNumber = numero.replace(/[\s-]/g, '');
    
    if (!cleanNumber) {
      return { valid: false, tipo: '', message: 'El número de tarjeta es requerido' };
    }

    if (!/^\d+$/.test(cleanNumber)) {
      return { valid: false, tipo: '', message: 'El número de tarjeta solo debe contener números' };
    }

    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return { valid: false, tipo: '', message: 'El número de tarjeta debe tener entre 13 y 19 dígitos' };
    }

    // Detectar tipo de tarjeta
    let tipo = 'Desconocida';
    if (/^4/.test(cleanNumber)) tipo = 'Visa';
    else if (/^5[1-5]/.test(cleanNumber)) tipo = 'MasterCard';
    else if (/^3[47]/.test(cleanNumber)) tipo = 'American Express';

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

  // VALIDAR FECHA DE EXPIRACIÓN
  validarFechaExpiracion(mes: string, anio: string): { valid: boolean, message: string } {
    if (!mes || !anio) {
      return { valid: false, message: 'Selecciona la fecha de expiración completa' };
    }

    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const anioActual = fechaActual.getFullYear();

    if (anioNum < anioActual) {
      return { valid: false, message: 'La tarjeta ha expirado (año anterior)' };
    }

    if (anioNum === anioActual && mesNum < mesActual) {
      return { valid: false, message: 'La tarjeta ha expirado (mes anterior)' };
    }

    return { valid: true, message: 'Fecha de expiración válida' };
  }

  validarFormulario(): boolean {
    if (!this.datosCheckout.nombre.trim()) {
      // ✅ CAMBIO: Alert por Toast
      this.toastService.showWarning('Por favor ingresa tu nombre');
      return false;
    }

    if (!this.datosCheckout.email.trim()) {
      // ✅ CAMBIO: Alert por Toast
      this.toastService.showWarning('Por favor ingresa tu email');
      return false;
    }

    if (!this.datosCheckout.aceptaTerminos) {
      // ✅ CAMBIO: Alert por Toast
      this.toastService.showWarning('Debes aceptar los términos y condiciones');
      return false;
    }

    if (this.datosCheckout.metodoPago === 'tarjeta') {
      if (!this.datosCheckout.numeroTarjeta.trim()) {
        // ✅ CAMBIO: Alert por Toast
        this.toastService.showWarning('Por favor ingresa el número de tarjeta');
        return false;
      }

      if (!this.datosCheckout.mesExpiracion || !this.datosCheckout.anioExpiracion) {
        // ✅ CAMBIO: Alert por Toast
        this.toastService.showWarning('Por favor selecciona la fecha de expiración');
        return false;
      }

      if (!this.datosCheckout.cvv.trim()) {
        // ✅ CAMBIO: Alert por Toast
        this.toastService.showWarning('Por favor ingresa el CVV');
        return false;
      }
    }

    return true;
  }

  cancelarCompra(): void {
    // ✅ CAMBIO: Confirm por Toast + navegación directa
    this.toastService.showInfo('Compra cancelada');
    this.router.navigate(['/cart']);
  }
}