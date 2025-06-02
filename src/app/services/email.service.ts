// email.service.ts - Versión CDN
import { Injectable } from '@angular/core';
import { CartItem } from './cart.service';

// ✅ Declarar emailjs como variable global
declare var emailjs: any;

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  // ✅ CONFIGURACIÓN CON TUS DATOS REALES
  private readonly SERVICE_ID = 'service_qv9d88e';
  private readonly TEMPLATE_ID = 'template_w6435yp';

  constructor() {
    console.log('📧 EmailJS cargado desde CDN para Parky Films');
  }

  // ✅ ENVIAR EMAIL CON ENTRADAS REALES
  async sendTicketEmail(orderData: any, cartItems: CartItem[]): Promise<boolean> {
    try {
      console.log('📧 Enviando email real con EmailJS CDN...');
      
      // Verificar que emailjs esté disponible
      if (typeof emailjs === 'undefined') {
        throw new Error('EmailJS no está cargado desde el CDN');
      }
      
      // Preparar datos para el template
      const templateParams = {
        to_email: orderData.email,
        to_name: orderData.nombre,
        order_id: orderData.orderId,
        total_amount: orderData.total,
        purchase_date: new Date().toLocaleDateString('es-ES'),
        payment_method: orderData.metodoPago,
        
        // Información detallada de las películas
        movies_details: this.formatMoviesForEmail(cartItems),
        
        // Desglose de precios
        subtotal: orderData.subtotal,
        service_fee: orderData.serviceFee,
        taxes: orderData.taxes,
        
        // Info adicional
        phone: orderData.telefono || 'No proporcionado'
      };

      console.log('📋 Datos a enviar:', templateParams);

      const result = await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        templateParams
      );

      console.log('✅ Email enviado exitosamente:', result);
      return true;

    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return false;
    }
  }

  // ✅ FORMATEAR INFORMACIÓN DE PELÍCULAS PARA EMAIL
  private formatMoviesForEmail(cartItems: CartItem[]): string {
    return cartItems.map((item, index) => `
🎬 ENTRADA ${index + 1}:
   • Película: ${item.pelicula.titulo}
   • Género: ${item.pelicula.genero}
   • Sala: ${item.funcion.sala}
   • Fecha: ${item.funcion.fecha}
   • Hora: ${item.funcion.hora}
   • Formato: ${item.funcion.formato}
   • Asientos: ${item.cantidad}
   • Precio: $${item.subtotal.toFixed(2)}
   ${item.precio > item.funcion.precio ? '👑 ASIENTOS VIP' : '🪑 ASIENTOS ESTÁNDAR'}
`).join('\n');
  }

  // ✅ VALIDAR CONFIGURACIÓN
  isConfigured(): boolean {
    return typeof emailjs !== 'undefined';
  }

  // ✅ TEST EMAIL (para probar la configuración)
  async sendTestEmail(testEmail: string): Promise<boolean> {
    try {
      if (typeof emailjs === 'undefined') {
        throw new Error('EmailJS no está disponible');
      }

      const testParams = {
        to_email: testEmail,
        to_name: 'Usuario de Prueba',
        order_id: 'TEST-001',
        total_amount: '25.50',
        purchase_date: new Date().toLocaleDateString('es-ES'),
        payment_method: 'Tarjeta de Crédito',
        movies_details: `
🎬 ENTRADA 1:
   • Película: Avatar: El Camino del Agua
   • Género: Aventura
   • Sala: Sala 1 - IMAX
   • Fecha: 2024-12-20
   • Hora: 14:30
   • Formato: IMAX 3D
   • Asientos: 2
   • Precio: $25.00
   🪑 ASIENTOS ESTÁNDAR`,
        subtotal: '19.00',
        service_fee: '0.95',
        taxes: '1.60',
        phone: '+1 234 567 8900'
      };

      const result = await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        testParams
      );

      console.log('✅ Email de prueba enviado:', result);
      return true;
    } catch (error) {
      console.error('❌ Error en email de prueba:', error);
      return false;
    }
  }
}