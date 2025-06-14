const Order = require('../../models/Order');
const Points = require('../../models/Points');

class CheckoutController {
  constructor() {
    this.orderModel = new Order();
    this.pointsModel = new Points();
  }

  // ==================== VALIDAR DISPONIBILIDAD ====================

  async validateAvailability(req, res) {
    try {
      console.log('🔍 Validando disponibilidad...');
      
      const { cartItems } = req.body;
      
      if (!cartItems || !Array.isArray(cartItems)) {
        return res.status(400).json({
          success: false,
          message: 'Items del carrito requeridos'
        });
      }

      const validation = await this.checkItemsAvailability(cartItems);
      
      res.json({
        success: validation.allAvailable,
        data: {
          available: validation.allAvailable,
          items: validation.itemsStatus,
          errors: validation.errors
        }
      });

    } catch (error) {
      console.error('❌ Error validando disponibilidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error al validar disponibilidad',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  // ==================== APLICAR PUNTOS ====================

  async applyPoints(req, res) {
    try {
      console.log('💰 Aplicando puntos al checkout...');
      
      const userId = req.user?.id;
      const { puntosAUsar, total } = req.body;
      
      if (!puntosAUsar || puntosAUsar <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Cantidad de puntos inválida'
        });
      }

      // Verificar si el usuario tiene suficientes puntos
      const canUse = await this.pointsModel.canUsePoints(userId, puntosAUsar);
      if (!canUse) {
        return res.status(400).json({
          success: false,
          message: 'Puntos insuficientes'
        });
      }

      // Calcular descuento
      const descuento = this.pointsModel.getPointsValue(puntosAUsar);
      const nuevoTotal = Math.max(0, total - descuento);
      
      res.json({
        success: true,
        data: {
          puntosAplicados: puntosAUsar,
          descuento: descuento,
          totalOriginal: total,
          nuevoTotal: nuevoTotal,
          ahorro: descuento
        }
      });

    } catch (error) {
      console.error('❌ Error aplicando puntos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al aplicar puntos',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  // ==================== SIMULAR PAGO PAYPAL ====================

  async simulatePayPal(req, res) {
    try {
      console.log('🏦 Simulando proceso de PayPal...');
      
      const { orderData, returnUrl, cancelUrl } = req.body;
      
      // Simular respuesta de PayPal
      const paypalResponse = {
        success: Math.random() > 0.1, // 90% éxito
        transactionId: this.generatePayPalTransactionId(),
        payerId: this.generatePayerId(),
        paymentStatus: 'COMPLETED',
        amount: orderData.total,
        currency: 'USD',
        timestamp: new Date().toISOString(),
        returnUrl,
        cancelUrl
      };
      
      if (!paypalResponse.success) {
        return res.status(400).json({
          success: false,
          message: 'Error en la simulación de PayPal',
          error: 'Pago rechazado por PayPal'
        });
      }
      
      res.json({
        success: true,
        message: 'Pago con PayPal simulado exitosamente',
        data: paypalResponse
      });

    } catch (error) {
      console.error('❌ Error simulando PayPal:', error);
      res.status(500).json({
        success: false,
        message: 'Error en la simulación de PayPal',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  // ==================== MÉTODOS AUXILIARES PRIVADOS ====================

  validateAndProcessCart(cartItems) {
    const errors = [];
    const processedItems = [];
    
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      
      // Validaciones básicas
      if (!item.tipo || !['pelicula', 'bar'].includes(item.tipo)) {
        errors.push(`Item ${i + 1}: Tipo inválido`);
        continue;
      }
      
      if (!item.cantidad || item.cantidad <= 0 || item.cantidad > 20) {
        errors.push(`Item ${i + 1}: Cantidad debe estar entre 1 y 20`);
        continue;
      }
      
      if (!item.precio || item.precio <= 0) {
        errors.push(`Item ${i + 1}: Precio inválido`);
        continue;
      }

      // Procesar según tipo
      if (item.tipo === 'pelicula') {
        const processedItem = this.processMovieItem(item);
        if (processedItem.error) {
          errors.push(`Item ${i + 1}: ${processedItem.error}`);
        } else {
          processedItems.push(processedItem);
        }
      } else if (item.tipo === 'bar') {
        const processedItem = this.processBarItem(item);
        if (processedItem.error) {
          errors.push(`Item ${i + 1}: ${processedItem.error}`);
        } else {
          processedItems.push(processedItem);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      processedItems
    };
  }

  processMovieItem(item) {
    if (!item.pelicula || !item.funcion) {
      return { error: 'Datos de película o función faltantes' };
    }
    
    return {
      tipo: 'pelicula',
      pelicula_id: item.pelicula.id,
      funcion_id: item.funcion.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      subtotal: item.precio * item.cantidad,
      asientos_seleccionados: item.asientos_seleccionados || [],
      tipo_asiento: item.precio > item.funcion.precio ? 'vip' : 'estandar',
      detalles: {
        titulo: item.pelicula.titulo,
        sala: item.funcion.sala,
        fecha: item.funcion.fecha,
        hora: item.funcion.hora,
        formato: item.funcion.formato
      }
    };
  }

  processBarItem(item) {
    if (!item.barProduct) {
      return { error: 'Datos de producto del bar faltantes' };
    }
    
    return {
      tipo: 'bar',
      producto_id: item.barProduct.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      subtotal: item.precio * item.cantidad,
      tamano_seleccionado: item.barOptions?.tamano || null,
      extras_seleccionados: item.barOptions?.extras || [],
      notas: item.barOptions?.notas || null,
      detalles: {
        nombre: item.barProduct.nombre,
        categoria: item.barProduct.categoria,
        es_combo: item.barProduct.es_combo
      }
    };
  }

  calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
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

  validatePaymentData(paymentData) {
    const errors = [];
    
    // Validar datos básicos
    if (!paymentData.nombre_cliente?.trim()) {
      errors.push('Nombre del cliente requerido');
    }
    
    if (!paymentData.email_cliente?.trim()) {
      errors.push('Email del cliente requerido');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.email_cliente)) {
      errors.push('Email inválido');
    }
    
    if (!paymentData.metodo_pago || !['tarjeta', 'paypal'].includes(paymentData.metodo_pago)) {
      errors.push('Método de pago inválido');
    }
    
    if (!paymentData.cartItems || !Array.isArray(paymentData.cartItems) || paymentData.cartItems.length === 0) {
      errors.push('Carrito vacío');
    }
    
    // Validar datos específicos del método de pago
    if (paymentData.metodo_pago === 'tarjeta') {
      if (!paymentData.tarjeta?.numero?.replace(/\s/g, '')) {
        errors.push('Número de tarjeta requerido');
      }
      if (!paymentData.tarjeta?.cvv) {
        errors.push('CVV requerido');
      }
      if (!paymentData.tarjeta?.mes_expiracion || !paymentData.tarjeta?.anio_expiracion) {
        errors.push('Fecha de expiración requerida');
      }
    }
    
    if (paymentData.metodo_pago === 'paypal') {
      if (!paymentData.paypal?.transaction_id) {
        errors.push('ID de transacción de PayPal requerido');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async prepareOrderData(userId, paymentData) {
    const totals = this.calculateTotals(paymentData.cartItems);
    
    // Separar items por tipo
    const movieItems = paymentData.cartItems
      .filter(item => item.tipo === 'pelicula')
      .map(item => ({
        funcion_id: item.funcion_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        asientos_seleccionados: item.asientos_seleccionados || [],
        tipo_asiento: item.tipo_asiento || 'estandar'
      }));
    
    const barItems = paymentData.cartItems
      .filter(item => item.tipo === 'bar')
      .map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        tamano_seleccionado: item.tamano_seleccionado,
        extras_seleccionados: item.extras_seleccionados,
        notas: item.notas
      }));
    
    return {
      usuario_id: userId,
      total: totals.total,
      subtotal: totals.subtotal,
      impuestos: totals.taxes,
      cargo_servicio: totals.serviceFee,
      metodo_pago: paymentData.metodo_pago === 'tarjeta' ? 'Tarjeta de Crédito' : 'PayPal',
      estado: 'completada',
      email_cliente: paymentData.email_cliente,
      nombre_cliente: paymentData.nombre_cliente,
      telefono_cliente: paymentData.telefono_cliente || null,
      paypal_transaction_id: paymentData.paypal?.transaction_id || null,
      paypal_payer_id: paymentData.paypal?.payer_id || null,
      paypal_status: paymentData.paypal?.status || null,
      items_peliculas: movieItems,
      items_bar: barItems
    };
  }

  async checkItemsAvailability(cartItems) {
    const itemsStatus = [];
    const errors = [];
    let allAvailable = true;
    
    // Aquí deberías verificar la disponibilidad real de cada item
    // Por ahora simulo la verificación
    
    for (const item of cartItems) {
      if (item.tipo === 'pelicula') {
        // Verificar asientos disponibles en la función
        const available = Math.random() > 0.1; // 90% disponible
        itemsStatus.push({
          id: item.id,
          tipo: 'pelicula',
          disponible: available,
          mensaje: available ? 'Disponible' : 'Asientos agotados'
        });
        
        if (!available) {
          allAvailable = false;
          errors.push(`${item.pelicula?.titulo}: Asientos no disponibles`);
        }
      } else if (item.tipo === 'bar') {
        // Verificar stock del producto
        const available = Math.random() > 0.05; // 95% disponible
        itemsStatus.push({
          id: item.id,
          tipo: 'bar',
          disponible: available,
          mensaje: available ? 'Disponible' : 'Producto agotado'
        });
        
        if (!available) {
          allAvailable = false;
          errors.push(`${item.barProduct?.nombre}: Producto no disponible`);
        }
      }
    }
    
    return {
      allAvailable,
      itemsStatus,
      errors
    };
  }

  generatePayPalTransactionId() {
    const prefix = 'PAY';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  generatePayerId() {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  }
   async initializeCheckout(req, res) {
    try {
      console.log('🛒 Inicializando proceso de checkout...');
      
      const userId = req.user?.id;
      const { cartItems } = req.body;
      
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El carrito está vacío'
        });
      }

      // Validar items del carrito
      const validation = this.validateAndProcessCart(cartItems);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Items del carrito inválidos',
          errors: validation.errors
        });
      }

      // Calcular totales
      const totals = this.calculateTotals(validation.processedItems);
      
      // Obtener puntos del usuario
      let userPoints = null;
      let pointsToEarn = 0;
      try {
        const pointsData = await this.pointsModel.getUserPoints(userId);
        const config = await this.pointsModel.getSystemConfig();
        userPoints = pointsData.puntos_actuales || 0;
        pointsToEarn = Math.floor(totals.total * config.puntos_por_dolar);
      } catch (error) {
        console.error('⚠️ Error obteniendo puntos del usuario:', error);
      }

      // Preparar respuesta
      const checkoutData = {
        user: {
          id: userId,
          points: userPoints
        },
        cart: {
          items: validation.processedItems,
          summary: {
            totalItems: validation.processedItems.reduce((sum, item) => sum + item.cantidad, 0),
            totalPeliculas: validation.processedItems
              .filter(item => item.tipo === 'pelicula')
              .reduce((sum, item) => sum + item.cantidad, 0),
            totalProductosBar: validation.processedItems
              .filter(item => item.tipo === 'bar')
              .reduce((sum, item) => sum + item.cantidad, 0)
          }
        },
        totals,
        points: {
          available: userPoints,
          toEarn: pointsToEarn,
          value: userPoints ? this.pointsModel.getPointsValue(userPoints) : 0
        },
        paymentMethods: ['tarjeta', 'paypal'],
        policies: {
          serviceFeePercent: 5,
          taxPercent: 8,
          cancellationPolicy: 'Las órdenes pueden cancelarse hasta 2 horas antes de la función'
        }
      };

      res.json({
        success: true,
        data: checkoutData
      });

    } catch (error) {
      console.error('❌ Error inicializando checkout:', error);
      res.status(500).json({
        success: false,
        message: 'Error al inicializar el checkout',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  // ==================== PROCESAR PAGO ====================

  async processPayment(req, res) {
    try {
      console.log('💳 Procesando pago...');
      
      const userId = req.user?.id;
      const paymentData = req.body;
      
      // Validar datos de pago
      const validation = this.validatePaymentData(paymentData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Datos de pago inválidos',
          errors: validation.errors
        });
      }

      // Preparar datos de la orden
      const orderData = await this.prepareOrderData(userId, paymentData);
      
      // Crear la orden
      const orderResult = await this.orderModel.createOrder(orderData);
      
      if (!orderResult.success) {
        throw new Error('Error al crear la orden');
      }

      // Procesar puntos (no bloquear si falla)
      let pointsResult = null;
      try {
        pointsResult = await this.pointsModel.processPointsForPurchase(
          userId,
          orderData.total,
          {
            order_id: orderResult.orderId,
            payment_method: paymentData.metodo_pago,
            items: paymentData.cartItems
          }
        );
      } catch (error) {
        console.error('⚠️ Error procesando puntos:', error);
      }

      // Responder con éxito
      res.status(201).json({
        success: true,
        message: 'Pago procesado exitosamente',
        data: {
          orderId: orderResult.orderId,
          fechaCreacion: orderResult.fechaCreacion,
          total: orderData.total,
          metodoPago: paymentData.metodo_pago,
          estado: 'completada',
          puntos: pointsResult ? {
            ganados: pointsResult.puntos_agregados || 0,
            total: pointsResult.puntos_nuevos || 0
          } : null,
          // Datos para confirmación
          confirmacion: {
            numeroOrden: orderResult.orderId,
            email: paymentData.email_cliente,
            nombre: paymentData.nombre_cliente,
            items: paymentData.cartItems.length,
            fecha: orderResult.fechaCreacion
          }
        }
      });

    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar el pago',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
      });
    }
  }
}

module.exports = new CheckoutController();
