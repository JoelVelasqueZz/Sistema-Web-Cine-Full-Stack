// models/Order.js
const { pool } = require('../config/database'); // 🔧 CORRECCIÓN: Destructuring del pool

class Order {
  constructor() {
    this.pool = pool;
  }

  // ==================== CREAR NUEVA ORDEN ====================
  
  async createOrder(orderData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Crear la orden principal
      const orderQuery = `
        INSERT INTO ordenes (
          usuario_id, total, subtotal, impuestos, cargo_servicio,
          metodo_pago, estado, email_cliente, nombre_cliente, telefono_cliente,
          paypal_transaction_id, paypal_payer_id, paypal_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, fecha_creacion
      `;
      
      const orderValues = [
        orderData.usuario_id,
        orderData.total,
        orderData.subtotal,
        orderData.impuestos || 0,
        orderData.cargo_servicio || 0,
        orderData.metodo_pago,
        orderData.estado || 'pendiente',
        orderData.email_cliente,
        orderData.nombre_cliente,
        orderData.telefono_cliente,
        orderData.paypal_transaction_id || null,
        orderData.paypal_payer_id || null,
        orderData.paypal_status || null
      ];
      
      const orderResult = await client.query(orderQuery, orderValues);
      const orderId = orderResult.rows[0].id;
      const fechaCreacion = orderResult.rows[0].fecha_creacion;
      
      // 2. Agregar items de películas si existen
      if (orderData.items_peliculas && orderData.items_peliculas.length > 0) {
        for (const item of orderData.items_peliculas) {
          const movieItemQuery = `
            INSERT INTO orden_items_peliculas (
              orden_id, funcion_id, cantidad, precio_unitario, subtotal,
              asientos_seleccionados, tipo_asiento
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `;
          
          const movieItemValues = [
            orderId,
            item.funcion_id,
            item.cantidad,
            item.precio_unitario,
            item.subtotal,
            item.asientos_seleccionados || [],
            item.tipo_asiento || 'estandar'
          ];
          
          await client.query(movieItemQuery, movieItemValues);
          
          // 3. Actualizar asientos disponibles en la función
          const updateFunctionQuery = `
            UPDATE funciones_cine 
            SET asientos_disponibles = asientos_disponibles - $1
            WHERE id = $2
          `;
          await client.query(updateFunctionQuery, [item.cantidad, item.funcion_id]);
          
          // 4. Marcar asientos como ocupados si se especificaron
          if (item.asientos_seleccionados && item.asientos_seleccionados.length > 0) {
            for (const asientoId of item.asientos_seleccionados) {
              const updateSeatQuery = `
                UPDATE asientos 
                SET esta_ocupado = true
                WHERE id = $1 AND funcion_id = $2
              `;
              await client.query(updateSeatQuery, [asientoId, item.funcion_id]);
            }
          }
        }
      }
      
      // 5. Agregar items del bar si existen
      if (orderData.items_bar && orderData.items_bar.length > 0) {
        for (const item of orderData.items_bar) {
          const barItemQuery = `
            INSERT INTO orden_items_bar (
              orden_id, producto_id, cantidad, precio_unitario, subtotal,
              tamano_seleccionado, extras_seleccionados, notas
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          `;
          
          const barItemValues = [
            orderId,
            item.producto_id,
            item.cantidad,
            item.precio_unitario,
            item.subtotal,
            item.tamano_seleccionado ? JSON.stringify(item.tamano_seleccionado) : null,
            item.extras_seleccionados ? JSON.stringify(item.extras_seleccionados) : null,
            item.notas || null
          ];
          
          await client.query(barItemQuery, barItemValues);
        }
      }
      
      await client.query('COMMIT');
      
      return {
        success: true,
        orderId: orderId,
        fechaCreacion: fechaCreacion,
        message: 'Orden creada exitosamente'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al crear orden:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ==================== OBTENER ÓRDENES ====================
  
  async getOrderById(orderId) {
    try {
      const orderQuery = `
        SELECT 
          o.*,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', oip.id,
                'tipo', 'pelicula',
                'funcion_id', oip.funcion_id,
                'cantidad', oip.cantidad,
                'precio_unitario', oip.precio_unitario,
                'subtotal', oip.subtotal,
                'asientos_seleccionados', oip.asientos_seleccionados,
                'tipo_asiento', oip.tipo_asiento,
                'pelicula_titulo', p.titulo,
                'pelicula_poster', p.poster,
                'funcion_fecha', fc.fecha,
                'funcion_hora', fc.hora,
                'funcion_sala', fc.sala
              )
            ) FILTER (WHERE oip.id IS NOT NULL), 
            '[]'::json
          ) as items_peliculas,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', oib.id,
                'tipo', 'bar',
                'producto_id', oib.producto_id,
                'cantidad', oib.cantidad,
                'precio_unitario', oib.precio_unitario,
                'subtotal', oib.subtotal,
                'tamano_seleccionado', oib.tamano_seleccionado,
                'extras_seleccionados', oib.extras_seleccionados,
                'notas', oib.notas,
                'producto_nombre', pb.nombre,
                'producto_categoria', pb.categoria,
                'producto_imagen', pb.imagen
              )
            ) FILTER (WHERE oib.id IS NOT NULL), 
            '[]'::json
          ) as items_bar
        FROM ordenes o
        LEFT JOIN orden_items_peliculas oip ON o.id = oip.orden_id
        LEFT JOIN funciones_cine fc ON oip.funcion_id = fc.id
        LEFT JOIN peliculas p ON fc.pelicula_id = p.id
        LEFT JOIN orden_items_bar oib ON o.id = oib.orden_id
        LEFT JOIN productos_bar pb ON oib.producto_id = pb.id
        WHERE o.id = $1
        GROUP BY o.id
      `;
      
      const result = await this.pool.query(orderQuery, [orderId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error al obtener orden:', error);
      throw error;
    }
  }

  async getOrdersByUser(userId, limit = 20, offset = 0) {
    try {
      const query = `
        SELECT 
          o.id,
          o.total,
          o.subtotal,
          o.estado,
          o.metodo_pago,
          o.fecha_creacion,
          COUNT(DISTINCT oip.id) as total_entradas,
          COUNT(DISTINCT oib.id) as total_productos_bar
        FROM ordenes o
        LEFT JOIN orden_items_peliculas oip ON o.id = oip.orden_id
        LEFT JOIN orden_items_bar oib ON o.id = oib.orden_id
        WHERE o.usuario_id = $1
        GROUP BY o.id, o.total, o.subtotal, o.estado, o.metodo_pago, o.fecha_creacion
        ORDER BY o.fecha_creacion DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener órdenes del usuario:', error);
      throw error;
    }
  }

  // ==================== ACTUALIZAR ORDEN ====================
  
  async updateOrderStatus(orderId, estado, paypal_data = null) {
    try {
      let query = `
        UPDATE ordenes 
        SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP
      `;
      
      let values = [estado];
      let paramCount = 2;
      
      if (paypal_data) {
        query += `, paypal_transaction_id = $${paramCount++}, paypal_payer_id = $${paramCount++}, paypal_status = $${paramCount++}`;
        values.push(paypal_data.transaction_id, paypal_data.payer_id, paypal_data.status);
      }
      
      query += ` WHERE id = $${paramCount} RETURNING *`;
      values.push(orderId);
      
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error al actualizar estado de orden:', error);
      throw error;
    }
  }

  // ==================== CANCELAR ORDEN ====================
  
  async cancelOrder(orderId, userId = null) {
    try {
      let query = `
        UPDATE ordenes 
        SET estado = 'cancelada', fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $1 AND estado = 'pendiente'
      `;
      
      let values = [orderId];
      
      if (userId !== null) {
        query += ` AND usuario_id = $2`;
        values.push(userId);
      }
      
      query += ` RETURNING *`;
      
      const result = await this.pool.query(query, values);
      
      if (result.rows.length === 0) {
        if (userId !== null) {
          // Verificar si la orden existe pero no pertenece al usuario
          const orderCheck = await this.pool.query('SELECT estado, usuario_id FROM ordenes WHERE id = $1', [orderId]);
          if (orderCheck.rows.length === 0) {
            throw new Error('Orden no encontrada');
          } else if (orderCheck.rows[0].estado !== 'pendiente') {
            throw new Error('Solo se pueden cancelar órdenes pendientes');
          } else {
            throw new Error('No tienes permisos para cancelar esta orden');
          }
        } else {
          throw new Error('Orden no encontrada o no se puede cancelar');
        }
      }
      
      return { success: true, order: result.rows[0] };
    } catch (error) {
      console.error('Error al cancelar orden:', error);
      throw error;
    }
  }

  // ==================== ESTADÍSTICAS ====================
  
  async getOrderStats(userId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_ordenes,
          COUNT(CASE WHEN estado = 'completada' THEN 1 END) as ordenes_completadas,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as ordenes_pendientes,
          COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as ordenes_canceladas,
          COALESCE(SUM(CASE WHEN estado = 'completada' THEN total ELSE 0 END), 0) as total_ingresos,
          COALESCE(AVG(CASE WHEN estado = 'completada' THEN total ELSE NULL END), 0) as ticket_promedio
        FROM ordenes
      `;
      
      const values = [];
      
      if (userId) {
        query += ` WHERE usuario_id = $1`;
        values.push(userId);
      }
      
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error al obtener estadísticas de órdenes:', error);
      throw error;
    }
  }

  // ==================== VALIDACIONES ====================
  
  async validateOrderData(orderData) {
    const errors = [];
    
    // Validar datos básicos
    if (!orderData.usuario_id) errors.push('ID de usuario requerido');
    if (!orderData.email_cliente) errors.push('Email del cliente requerido');
    if (!orderData.nombre_cliente) errors.push('Nombre del cliente requerido');
    if (!orderData.total || orderData.total <= 0) errors.push('Total debe ser mayor a 0');
    if (!orderData.metodo_pago) errors.push('Método de pago requerido');
    
    // Validar que tenga al menos un item
    const hasMovieItems = orderData.items_peliculas && orderData.items_peliculas.length > 0;
    const hasBarItems = orderData.items_bar && orderData.items_bar.length > 0;
    
    if (!hasMovieItems && !hasBarItems) {
      errors.push('La orden debe contener al menos un item');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = Order;