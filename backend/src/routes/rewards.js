// src/routes/rewards.js
const express = require('express');
const router = express.Router();
const rewardsController = require('../controllers/rewards/rewardsController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { body, param, query } = require('express-validator');
const validation = require('../middleware/validation');

// ==================== RUTAS PÚBLICAS ====================

/**
 * @route GET /api/rewards
 * @desc Obtener todas las recompensas disponibles
 * @access Public
 */
router.get('/', 
  [
    query('categoria')
      .optional()
      .isIn(['peliculas', 'bar', 'especial', 'descuentos'])
      .withMessage('Categoría inválida'),
    query('limite')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Límite debe estar entre 1 y 100')
  ],
  validation,
  (req, res) => {
    rewardsController.getAllRewards(req, res);
  }
);

/**
 * @route GET /api/rewards/categories
 * @desc Obtener categorías de recompensas disponibles
 * @access Public
 */
router.get('/categories', (req, res) => {
  rewardsController.getCategories(req, res);
});

/**
 * @route GET /api/rewards/:id
 * @desc Obtener recompensa por ID
 * @access Public (pero con info adicional si está autenticado)
 */
router.get('/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID de recompensa inválido')
  ],
  validation,
  (req, res, next) => {
    // Middleware opcional de autenticación
    if (req.headers.authorization) {
      return authenticateToken(req, res, next);
    }
    next();
  },
  (req, res) => {
    rewardsController.getRewardById(req, res);
  }
);

// ==================== RUTAS AUTENTICADAS ====================

// Middleware para todas las rutas que requieren autenticación
router.use('/redeem*', authenticateToken);
router.use('/my*', authenticateToken);
router.use('/validate*', authenticateToken);
router.use('/check*', authenticateToken);

/**
 * @route POST /api/rewards/redeem/:id
 * @desc Canjear una recompensa por puntos
 * @access Private
 */
router.post('/redeem/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID de recompensa inválido')
  ],
  validation,
  (req, res) => {
    rewardsController.redeemReward(req, res);
  }
);

/**
 * @route GET /api/rewards/my/redemptions
 * @desc Obtener canjes del usuario autenticado
 * @access Private
 */
router.get('/my/redemptions',
  [
    query('incluir_usados')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('incluir_usados debe ser true o false')
  ],
  validation,
  (req, res) => {
    rewardsController.getUserRedemptions(req, res);
  }
);

/**
 * @route GET /api/rewards/validate/:codigo
 * @desc Validar código de canje
 * @access Private
 */
router.get('/validate/:codigo',
  [
    param('codigo')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Código de canje inválido')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Código debe contener solo letras mayúsculas y números')
  ],
  validation,
  (req, res) => {
    rewardsController.validateRedemptionCode(req, res);
  }
);

/**
 * @route GET /api/rewards/check/availability
 * @desc Verificar disponibilidad de puntos para canje
 * @access Private
 */
router.get('/check/availability',
  [
    query('puntos')
      .isInt({ min: 1 })
      .withMessage('Cantidad de puntos requerida')
  ],
  validation,
  (req, res) => {
    rewardsController.checkRedeemAvailability(req, res);
  }
);

// ==================== RUTAS DE ADMINISTRACIÓN ====================

// Middleware para todas las rutas de admin
router.use('/admin*', requireAdmin);

/**
 * @route POST /api/rewards/admin/create
 * @desc Crear nueva recompensa
 * @access Admin
 */
router.post('/admin/create',
  [
    body('nombre')
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Nombre requerido (3-255 caracteres)'),
    body('descripcion')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Descripción requerida (10-1000 caracteres)'),
    body('categoria')
      .isIn(['peliculas', 'bar', 'especial', 'descuentos'])
      .withMessage('Categoría inválida'),
    body('puntos_requeridos')
      .isInt({ min: 1 })
      .withMessage('Puntos requeridos debe ser mayor a 0'),
    body('tipo')
      .isIn(['descuento', 'producto', 'paquete', 'experiencia', 'codigo', 'bonus'])
      .withMessage('Tipo de recompensa inválido'),
    body('imagen')
      .optional()
      .isURL()
      .withMessage('URL de imagen inválida'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock debe ser mayor o igual a 0'),
    body('valor')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Valor debe ser mayor o igual a 0'),
    body('limite_por_usuario')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Límite por usuario debe ser mayor a 0'),
    body('validez_dias')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Validez en días debe ser mayor a 0'),
    body('terminos')
      .optional()
      .isArray()
      .withMessage('Términos debe ser un array'),
    body('disponible')
      .optional()
      .isBoolean()
      .withMessage('Disponible debe ser verdadero o falso')
  ],
  validation,
  (req, res) => {
    rewardsController.createReward(req, res);
  }
);

/**
 * @route PUT /api/rewards/admin/:id
 * @desc Actualizar recompensa existente
 * @access Admin
 */
router.put('/admin/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID de recompensa inválido'),
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Nombre debe tener entre 3-255 caracteres'),
    body('descripcion')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Descripción debe tener entre 10-1000 caracteres'),
    body('categoria')
      .optional()
      .isIn(['peliculas', 'bar', 'especial', 'descuentos'])
      .withMessage('Categoría inválida'),
    body('puntos_requeridos')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Puntos requeridos debe ser mayor a 0'),
    body('tipo')
      .optional()
      .isIn(['descuento', 'producto', 'paquete', 'experiencia', 'codigo', 'bonus'])
      .withMessage('Tipo de recompensa inválido'),
    body('imagen')
      .optional()
      .isURL()
      .withMessage('URL de imagen inválida'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock debe ser mayor o igual a 0'),
    body('valor')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Valor debe ser mayor o igual a 0'),
    body('limite_por_usuario')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Límite por usuario debe ser mayor a 0'),
    body('validez_dias')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Validez en días debe ser mayor a 0'),
    body('terminos')
      .optional()
      .isArray()
      .withMessage('Términos debe ser un array'),
    body('disponible')
      .optional()
      .isBoolean()
      .withMessage('Disponible debe ser verdadero o falso')
  ],
  validation,
  (req, res) => {
    rewardsController.updateReward(req, res);
  }
);

/**
 * @route DELETE /api/rewards/admin/:id
 * @desc Eliminar recompensa
 * @access Admin
 */
router.delete('/admin/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID de recompensa inválido')
  ],
  validation,
  (req, res) => {
    rewardsController.deleteReward(req, res);
  }
);

/**
 * @route GET /api/rewards/admin/stats
 * @desc Obtener estadísticas de recompensas y canjes
 * @access Admin
 */
router.get('/admin/stats', (req, res) => {
  rewardsController.getRewardsStats(req, res);
});

/**
 * @route GET /api/rewards/admin/redemptions
 * @desc Obtener todos los canjes para administración
 * @access Admin
 */
router.get('/admin/redemptions',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página debe ser mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Límite debe estar entre 1 y 100'),
    query('recompensa_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('ID de recompensa inválido')
  ],
  validation,
  (req, res) => {
    rewardsController.getAllRedemptions(req, res);
  }
);

/**
 * @route POST /api/rewards/admin/mark-used/:codigo
 * @desc Marcar código de canje como usado
 * @access Admin
 */
router.post('/admin/mark-used/:codigo',
  [
    param('codigo')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Código de canje inválido')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Código debe contener solo letras mayúsculas y números')
  ],
  validation,
  (req, res) => {
    rewardsController.markCodeAsUsed(req, res);
  }
);

// ==================== MANEJO DE ERRORES ====================

// Middleware para capturar errores no manejados en las rutas
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de recompensas:', error);
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error en el sistema de recompensas'
  });
});

module.exports = router;