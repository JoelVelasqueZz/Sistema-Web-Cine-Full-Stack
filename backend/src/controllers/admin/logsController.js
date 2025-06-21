// backend/src/controllers/admin/logsController.js
const pool = require('../../config/database');

const logsController = {
  // Obtener actividad reciente usando la vista
  async getRecentActivity(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      
      const query = `
        SELECT 
          tipo,
          descripcion,
          fecha,
          icono,
          color
        FROM vista_actividad_reciente 
        ORDER BY fecha DESC 
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      
      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
      
    } catch (error) {
      console.error('Error al obtener actividad reciente:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los logs del sistema',
        error: error.message
      });
    }
  },

  // Obtener logs de órdenes específicas
  async getOrderLogs(req, res) {
    try {
      const { limit = 20 } = req.query;
      
      const query = `
        SELECT 
          o.id,
          o.total,
          o.estado,
          o.nombre_cliente,
          o.email_cliente,
          o.metodo_pago,
          o.fecha_creacion,
          o.fecha_actualizacion,
          CASE 
            WHEN o.estado = 'completada' THEN 'success'
            WHEN o.estado = 'pendiente' THEN 'warning'
            WHEN o.estado = 'cancelada' THEN 'danger'
            ELSE 'secondary'
          END as color_estado
        FROM ordenes o
        ORDER BY o.fecha_creacion DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      
      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
      
    } catch (error) {
      console.error('Error al obtener logs de órdenes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener logs de órdenes',
        error: error.message
      });
    }
  },

  // Obtener logs de usuarios (registros recientes)
  async getUserLogs(req, res) {
    try {
      const { limit = 20 } = req.query;
      
      const query = `
        SELECT 
          u.id,
          u.nombre,
          u.email,
          u.role,
          u.is_active,
          u.fecha_registro,
          CASE 
            WHEN u.is_active = true THEN 'success'
            ELSE 'secondary'
          END as color_estado
        FROM usuarios u
        ORDER BY u.fecha_registro DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      
      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
      
    } catch (error) {
      console.error('Error al obtener logs de usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener logs de usuarios',
        error: error.message
      });
    }
  },

  // Obtener estadísticas generales del sistema
  async getSystemStats(req, res) {
    try {
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM usuarios WHERE is_active = true) as usuarios_activos,
          (SELECT COUNT(*) FROM ordenes WHERE estado = 'completada' AND DATE(fecha_creacion) = CURRENT_DATE) as ordenes_hoy,
          (SELECT COUNT(*) FROM ordenes WHERE estado = 'pendiente') as ordenes_pendientes,
          (SELECT COALESCE(SUM(total), 0) FROM ordenes WHERE estado = 'completada' AND DATE(fecha_creacion) = CURRENT_DATE) as ingresos_hoy,
          (SELECT COUNT(*) FROM peliculas WHERE activo = true) as peliculas_activas,
          (SELECT COUNT(*) FROM funciones_cine WHERE activo = true AND fecha >= CURRENT_DATE) as funciones_activas
      `;
      
      const result = await pool.query(statsQuery);
      const stats = result.rows[0];

      res.json({
        success: true,
        data: {
          usuarios_activos: parseInt(stats.usuarios_activos),
          ordenes_hoy: parseInt(stats.ordenes_hoy),
          ordenes_pendientes: parseInt(stats.ordenes_pendientes),
          ingresos_hoy: parseFloat(stats.ingresos_hoy),
          peliculas_activas: parseInt(stats.peliculas_activas),
          funciones_activas: parseInt(stats.funciones_activas)
        }
      });
      
    } catch (error) {
      console.error('Error al obtener estadísticas del sistema:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas del sistema',
        error: error.message
      });
    }
  },

  // Obtener logs de errores (simulado - en producción vendría de archivos de log)
  async getErrorLogs(req, res) {
    try {
      // Por ahora, vamos a simular algunos logs de errores
      // En producción, esto leería de archivos de log reales
      const errorLogs = [
        {
          id: 1,
          tipo: 'ERROR',
          mensaje: 'Error de conexión a base de datos',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
          nivel: 'error',
          modulo: 'database'
        },
        {
          id: 2,
          tipo: 'WARNING',
          mensaje: 'Consulta lenta detectada en tabla órdenes',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          nivel: 'warning',
          modulo: 'performance'
        },
        {
          id: 3,
          tipo: 'INFO',
          mensaje: 'Sistema iniciado correctamente',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          nivel: 'info',
          modulo: 'system'
        }
      ];

      res.json({
        success: true,
        data: errorLogs,
        total: errorLogs.length
      });
      
    } catch (error) {
      console.error('Error al obtener logs de errores:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener logs de errores',
        error: error.message
      });
    }
  }
};

module.exports = logsController;