const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/points/pointsController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { body, param, query } = require('express-validator');
const validation = require('../middleware/validation');

// ==================== MIDDLEWARE GLOBAL ====================
// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ==================== RUTAS PRINCIPALES DE PUNTOS ====================

/**
 * @route GET /api/points
 * @desc Obtener puntos del usuario actual
 * @access Private
 */
router.get('/',
  pointsController.getUserPoints
);

/**
 * @route GET /api/points/stats
 * @desc Obtener estadísticas completas de puntos del usuario
 * @access Private
 */
router.get('/stats',
  pointsController.getUserPointsStats
);

/**
 * @route GET /api/points/history
 * @desc Obtener historial de transacciones de puntos
 * @access Private
 */
router.get('/history',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página debe ser un número mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Límite debe estar entre 1 y 100')
  ],
  validation,
  pointsController.getPointsHistory
);

/**
 * @route GET /api/points/config
 * @desc Obtener configuración del sistema de puntos
 * @access Private
 */
router.get('/config',
  pointsController.getSystemConfig
);

// ==================== RUTAS DE SISTEMA DE REFERIDOS ====================

/**
 * @route GET /api/points/referral/code
 * @desc Obtener código de referido del usuario
 * @access Private
 */
router.get('/referral/code',
  pointsController.getReferralCode
);

/**
 * @route POST /api/points/referral/create
 * @desc Crear código de referido para el usuario
 * @access Private
 */
router.post('/referral/create',
  pointsController.createReferralCode
);

/**
 * @route POST /api/points/referral/apply
 * @desc Aplicar código de referido
 * @access Private
 */
router.post('/referral/apply',
  [
    body('codigo')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Código de referido inválido (3-50 caracteres)')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Código debe contener solo letras mayúsculas y números')
  ],
  validation,
  pointsController.applyReferralCode
);

/**
 * @route GET /api/points/referral/list
 * @desc Obtener lista de usuarios referidos
 * @access Private
 */
router.get('/referral/list',
  pointsController.getUserReferrals
);

// ==================== RUTAS DE GESTIÓN DE PUNTOS ====================

/**
 * @route POST /api/points/welcome
 * @desc Otorgar puntos de bienvenida al usuario
 * @access Private
 */
router.post('/welcome',
  pointsController.giveWelcomePoints
);

/**
 * @route POST /api/points/use
 * @desc Usar/canjear puntos del usuario
 * @access Private
 */
router.post('/use',
  [
    body('puntos')
      .isInt({ min: 1 })
      .withMessage('Cantidad de puntos debe ser mayor a 0'),
    body('concepto')
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Concepto requerido (3-255 caracteres)'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata debe ser un objeto')
  ],
  validation,
  pointsController.usePoints
);

/**
 * @route GET /api/points/check/:puntos
 * @desc Verificar si el usuario puede usar cierta cantidad de puntos
 * @access Private
 */
router.get('/check/:puntos',
  [
    param('puntos')
      .isInt({ min: 1 })
      .withMessage('Cantidad de puntos debe ser un número mayor a 0')
  ],
  validation,
  (req, res) => {
    // Redirigir a la ruta con query parameter
    res.redirect(`/api/points/check?puntos=${req.params.puntos}`);
  }
);

/**
 * @route GET /api/points/check
 * @desc Verificar disponibilidad de puntos
 * @access Private
 */
router.get('/check',
  [
    query('puntos')
      .isInt({ min: 1 })
      .withMessage('Cantidad de puntos requerida')
  ],
  validation,
  pointsController.checkPointsAvailability
);

// ==================== RUTAS DE ADMINISTRACIÓN ====================

/**
 * @route POST /api/points/admin/add
 * @desc Agregar puntos manualmente a un usuario (solo admin)
 * @access Admin
 */
router.post('/admin/add',
  requireAdmin,
  [
    body('userId')
      .isInt({ min: 1 })
      .withMessage('ID de usuario requerido'),
    body('puntos')
      .isInt({ min: 1 })
      .withMessage('Cantidad de puntos debe ser mayor a 0'),
    body('concepto')
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Concepto requerido (3-255 caracteres)'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata debe ser un objeto')
  ],
  validation,
  pointsController.addPointsManually
);

/**
 * @route GET /api/points/admin/analytics
 * @desc Obtener analytics de puntos (solo admin)
 * @access Admin
 */
router.get('/admin/analytics',
  requireAdmin,
  [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Fecha de inicio inválida (formato ISO8601)'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('Fecha de fin inválida (formato ISO8601)')
  ],
  validation,
  pointsController.getPointsAnalytics
);

/**
 * @route GET /api/points/admin/top-users
 * @desc Obtener usuarios con más puntos (solo admin)
 * @access Admin
 */
router.get('/admin/top-users',
  requireAdmin,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Límite debe estar entre 1 y 100')
  ],
  validation,
  pointsController.getTopUsers
);

/**
 * @route GET /api/points/admin/user/:userId
 * @desc Obtener puntos de un usuario específico (solo admin)
 * @access Admin
 */
router.get('/admin/user/:userId',
  requireAdmin,
  [
    param('userId')
      .isInt({ min: 1 })
      .withMessage('ID de usuario inválido')
  ],
  validation,
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Temporalmente redirigir a la función existente
      // En una implementación completa, crearías un método específico
      req.user = { id: parseInt(userId) }; // Simular usuario para la consulta
      
      await pointsController.getUserPointsStats(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener puntos del usuario',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }
);

/**
 * @route GET /api/points/admin/user/:userId/history
 * @desc Obtener historial de puntos de un usuario específico (solo admin)
 * @access Admin
 */
router.get('/admin/user/:userId/history',
  requireAdmin,
  [
    param('userId')
      .isInt({ min: 1 })
      .withMessage('ID de usuario inválido'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página debe ser un número mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Límite debe estar entre 1 y 100')
  ],
  validation,
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Temporalmente redirigir a la función existente
      req.user = { id: parseInt(userId) };
      
      await pointsController.getPointsHistory(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener historial del usuario',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }
);

// ==================== RUTAS DE UTILIDADES ====================

/**
 * @route GET /api/points/value/:puntos
 * @desc Obtener valor en dólares de una cantidad de puntos
 * @access Private
 */
router.get('/value/:puntos',
  [
    param('puntos')
      .isInt({ min: 0 })
      .withMessage('Cantidad de puntos debe ser un número mayor o igual a 0')
  ],
  validation,
  (req, res) => {
    try {
      const { puntos } = req.params;
      const Points = require('../models/Points');
      const pointsModel = new Points();
      
      const valor = pointsModel.getPointsValue(parseInt(puntos));
      
      res.json({
        success: true,
        data: {
          puntos: parseInt(puntos),
          valor_dolares: valor,
          equivalencia: `${puntos} puntos = $${valor.toFixed(2)}`
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al calcular valor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }
);

// ==================== MANEJO DE ERRORES ====================

// Middleware para capturar errores no manejados en las rutas
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de puntos:', error);
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error en el sistema de puntos'
  });
});

module.exports = router;