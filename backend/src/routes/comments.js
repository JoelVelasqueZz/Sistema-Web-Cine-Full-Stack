// backend/src/routes/comments.js - CORREGIDO
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const commentController = require('../controllers/comments/commentController');

// 🔥 IMPORTACIÓN CORRECTA DEL MIDDLEWARE
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// ==================== VALIDACIONES ====================

const validateComment = [
    body('tipo')
        .isIn(['pelicula', 'sistema', 'sugerencia'])
        .withMessage('Tipo de comentario inválido'),
    body('titulo')
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage('El título debe tener entre 3 y 255 caracteres'),
    body('contenido')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('El contenido debe tener entre 10 y 2000 caracteres'),
    body('pelicula_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de película inválido'),
    body('puntuacion')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('La puntuación debe ser entre 1 y 5')
];

const validateUpdate = [
    body('titulo')
        .optional()
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage('El título debe tener entre 3 y 255 caracteres'),
    body('contenido')
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('El contenido debe tener entre 10 y 2000 caracteres'),
    body('puntuacion')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('La puntuación debe ser entre 1 y 5')
];

const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID inválido')
];

// ==================== RUTAS ESPECÍFICAS PRIMERO ====================

/**
 * @route   GET /api/comments/user/my-comments
 * @desc    Obtener comentarios del usuario actual
 * @access  Private
 */
router.get('/user/my-comments', authenticateToken, commentController.getMyComments);

/**
 * @route   GET /api/comments/system/feedback
 * @desc    Obtener sugerencias del sistema
 * @access  Private
 */
router.get('/suggestions', authenticateToken, commentController.getSystemFeedback);

/**
 * @route   GET /api/comments/movie/:pelicula_id
 * @desc    Obtener comentarios de una película
 * @access  Public (no requiere auth)
 */
router.get('/movie/:pelicula_id', commentController.getByMovie);

// ==================== RUTAS ADMIN ESPECÍFICAS ====================

/**
 * @route   GET /api/comments/admin/all
 * @desc    Obtener todos los comentarios (admin)
 * @access  Admin
 */
router.get('/admin/all', authenticateToken, requireAdmin, commentController.getAllForAdmin);

/**
 * @route   PUT /api/comments/admin/:id/status
 * @desc    Cambiar estado del comentario
 * @access  Admin
 */
router.put('/admin/:id/status', 
    authenticateToken, 
    requireAdmin,
    validateId,
    [body('estado').isIn(['activo', 'oculto', 'moderacion', 'rechazado']).withMessage('Estado inválido')],
    commentController.updateStatus
);

/**
 * @route   PUT /api/comments/admin/:id/featured
 * @desc    Destacar/quitar destaque de comentario
 * @access  Admin
 */
router.put('/admin/:id/featured', 
    authenticateToken, 
    requireAdmin,
    validateId,
    commentController.toggleFeatured
);

// ==================== RUTAS GENERALES (CON PARÁMETROS AL FINAL) ====================

/**
 * 🔥 RUTA CORREGIDA: POST con autenticación
 * @route   POST /api/comments
 * @desc    Crear nuevo comentario
 * @access  Private
 */
router.post('/', authenticateToken, validateComment, commentController.create);

/**
 * @route   GET /api/comments/:id
 * @desc    Obtener comentario por ID
 * @access  Private
 */
router.get('/:id', authenticateToken, validateId, commentController.getById);

/**
 * @route   PUT /api/comments/:id
 * @desc    Actualizar comentario
 * @access  Private (solo el autor)
 */
router.put('/:id', authenticateToken, validateId, validateUpdate, commentController.update);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Eliminar comentario
 * @access  Private (solo el autor)
 */
router.delete('/:id', authenticateToken, validateId, commentController.delete);

module.exports = router;