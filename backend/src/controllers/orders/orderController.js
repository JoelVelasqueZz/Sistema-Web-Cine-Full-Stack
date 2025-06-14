const Order = require('../../models/Order');
const Points = require('../../models/Points');

class OrderController {
  constructor() {
    this.orderModel = new Order();
    this.pointsModel = new Points();
  }

  // ==================== CREAR NUEVA ORDEN ====================

  async createOrder(req, res) {
    try {
      console.log('📦 Creando nueva orden...');
      console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
      
      const userId = req.user?.id; // Del middleware de autenticación
      const orderData = {
        ...req.body,
        usuario_id: userId
      };

      // Validar datos de la orden
      const validation = await this.orderModel.validateOrderData(orderData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Datos de orden inválidos',
          errors: validation.errors
        });
      }

      // Crear la orden
      const result = await this.orderModel.createOrder(orderData);
      
      if (result.success) {
        console.log(`✅ Orden creada exitosamente: ${result.orderId}`);
        
        // Procesar puntos por la compra (async, no bloquear respuesta)
        this.processPointsForOrder(userId, orderData.total, result.orderId)
          .catch(error => console.error('Error procesando puntos:', error));
        
        res.status(201).json({
          success: true,
          message: 'Orden creada exitosamente',
          orderId: result.orderId,
          fechaCreacion: result.fechaCreacion,
          data: {
            id: result.orderId,
            usuario_id: userId,
            total: orderData.total,
            subtotal: orderData.subtotal,
            estado: orderData.estado || 'pendiente',
            metodo_pago: orderData.metodo_pago,
            fecha_creacion: result.fechaCreacion
          }
        });
      } else {
        throw new Error('Error al crear la orden');
      }

    } catch (error) {
      console.error('❌ Error al crear orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error al procesar la orden'
      });
    }
  }

  // ==================== OBTENER ÓRDENES ====================

  async getOrderById(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;
      
      console.log(`🔍 Buscando orden: ${orderId} para usuario: ${userId}`);
      
      const order = await this.orderModel.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }
      
      // Verificar que la orden pertenece al usuario (si no es admin)
      if (req.user.role !== 'admin' && order.usuario_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver esta orden'
        });
      }
      
      res.json({
        success: true,
        data: order
      });

    } catch (error) {
      console.error('❌ Error al obtener orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la orden',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  async getUserOrders(req, res) {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      console.log(`📋 Obteniendo órdenes del usuario ${userId}, página ${page}`);
      
      const orders = await this.orderModel.getOrdersByUser(userId, limit, offset);
      
      res.json({
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total: orders.length,
          hasMore: orders.length === limit
        }
      });

    } catch (error) {
      console.error('❌ Error al obtener órdenes del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las órdenes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  // ==================== ACTUALIZAR ORDEN ====================

  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { estado, paypal_data } = req.body;
      
      console.log(`🔄 Actualizando estado de orden ${orderId} a: ${estado}`);
      
      const validStates = ['pendiente', 'completada', 'cancelada', 'reembolsada'];
      if (!validStates.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado de orden inválido',
          validStates
        });
      }
      
      const updatedOrder = await this.orderModel.updateOrderStatus(orderId, estado, paypal_data);
      
      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }
      
      res.json({
        success: true,
        message: `Estado actualizado a: ${estado}`,
        data: updatedOrder
      });

    } catch (error) {
      console.error('❌ Error al actualizar estado de orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la orden',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  // ==================== CANCELAR ORDEN ====================

  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';
      
      console.log(`❌ Cancelando orden ${orderId} por usuario ${userId}`);
      
      const result = await this.orderModel.cancelOrder(orderId, isAdmin ? null : userId);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Orden cancelada exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Error al cancelar la orden'
        });
      }

    } catch (error) {
      console.error('❌ Error al cancelar orden:', error);
      
      if (error.message === 'Orden no encontrada') {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }
      
      if (error.message === 'Solo se pueden cancelar órdenes pendientes') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden cancelar órdenes pendientes'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al cancelar la orden',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  // ==================== ESTADÍSTICAS ====================

  async getOrderStats(req, res) {
    try {
      const userId = req.user?.role === 'admin' ? null : req.user?.id;
      
      console.log(`📊 Obteniendo estadísticas de órdenes ${userId ? `para usuario ${userId}` : '(global)'}`);
      
      const stats = await this.orderModel.getOrderStats(userId);
      
      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  // ==================== PROCESAR COMPRA COMPLETA ====================

  async processPurchase(req, res) {
    try {
      console.log('🛒 Procesando compra completa...');
      
      const userId = req.user?.id;
      const purchaseData = req.body;
      
      // 1. Crear la orden
      const orderData = {
        usuario_id: userId,
        total: purchaseData.total,
        subtotal: purchaseData.subtotal,
        impuestos: purchaseData.impuestos || 0,
        cargo_servicio: purchaseData.cargo_servicio || 0,
        metodo_pago: purchaseData.metodo_pago,
        estado: 'completada', // Directamente completada si el pago es exitoso
        email_cliente: purchaseData.email_cliente,
        nombre_cliente: purchaseData.nombre_cliente,
        telefono_cliente: purchaseData.telefono_cliente,
        paypal_transaction_id: purchaseData.paypal_transaction_id,
        paypal_payer_id: purchaseData.paypal_payer_id,
        paypal_status: purchaseData.paypal_status,
        items_peliculas: purchaseData.items_peliculas || [],
        items_bar: purchaseData.items_bar || []
      };
      
      // 2. Validar y crear orden
      const validation = await this.orderModel.validateOrderData(orderData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Datos de compra inválidos',
          errors: validation.errors
        });
      }
      
      const orderResult = await this.orderModel.createOrder(orderData);
      
      if (!orderResult.success) {
        throw new Error('Error al crear la orden');
      }
      
      // 3. Procesar puntos por la compra
      let pointsResult = null;
      try {
        pointsResult = await this.pointsModel.processPointsForPurchase(
          userId, 
          purchaseData.total,
          {
            order_id: orderResult.orderId,
            items_count: (purchaseData.items_peliculas?.length || 0) + (purchaseData.items_bar?.length || 0),
            payment_method: purchaseData.metodo_pago
          }
        );
      } catch (pointsError) {
        console.error('⚠️ Error procesando puntos (no crítico):', pointsError);
      }
      
      // 4. Responder con éxito
      res.status(201).json({
        success: true,
        message: 'Compra procesada exitosamente',
        data: {
          order: {
            id: orderResult.orderId,
            fecha_creacion: orderResult.fechaCreacion,
            total: purchaseData.total,
            estado: 'completada'
          },
          points: pointsResult ? {
            puntos_ganados: pointsResult.puntos_agregados,
            puntos_totales: pointsResult.puntos_nuevos
          } : null
        }
      });
      
    } catch (error) {
      console.error('❌ Error al procesar compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar la compra',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
      });
    }
  }

  // ==================== MÉTODOS AUXILIARES PRIVADOS ====================

  async processPointsForOrder(userId, total, orderId) {
    try {
      console.log(`💰 Procesando puntos para orden ${orderId}, total: $${total}`);
      
      const result = await this.pointsModel.processPointsForPurchase(
        userId, 
        total,
        { order_id: orderId }
      );
      
      if (result.success && result.puntos_agregados > 0) {
        console.log(`✅ ${result.puntos_agregados} puntos agregados al usuario ${userId}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error procesando puntos para orden:', error);
      throw error;
    }
  }

  // ==================== VALIDACIONES AUXILIARES ====================

  validateCartItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return { valid: false, message: 'El carrito debe contener al menos un item' };
    }
    
    for (const item of items) {
      if (!item.tipo || !['pelicula', 'bar'].includes(item.tipo)) {
        return { valid: false, message: 'Tipo de item inválido' };
      }
      
      if (!item.cantidad || item.cantidad <= 0) {
        return { valid: false, message: 'Cantidad debe ser mayor a 0' };
      }
      
      if (!item.precio || item.precio <= 0) {
        return { valid: false, message: 'Precio debe ser mayor a 0' };
      }
    }
    
    return { valid: true };
  }

  calculateTotals(items) {
    let subtotal = 0;
    
    for (const item of items) {
      subtotal += item.precio * item.cantidad;
    }
    
    const serviceFee = subtotal * 0.05; // 5% cargo por servicio
    const taxes = (subtotal + serviceFee) * 0.08; // 8% impuestos
    const total = subtotal + serviceFee + taxes;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      serviceFee: Math.round(serviceFee * 100) / 100,
      taxes: Math.round(taxes * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }
}

module.exports = new OrderController();