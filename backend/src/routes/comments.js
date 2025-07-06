// backend/src/routes/comments.js - DEBUG VERSION
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

// 🔍 DEBUG: Verificar importación del controlador
console.log('🔍 Iniciando importación del controlador...');
const commentController = require('../controllers/comments/commentController');
console.log('✅ Controlador importado:', typeof commentController);
console.log('📋 Métodos disponibles:', Object.keys(commentController));

// Verificar cada método específicamente
console.log('🔍 Verificando métodos:');
console.log('- create:', typeof commentController.create);
console.log('- getById:', typeof commentController.getById);
console.log('- getByMovie:', typeof commentController.getByMovie);
console.log('- getMyComments:', typeof commentController.getMyComments);
console.log('- getSystemFeedback:', typeof commentController.getSystemFeedback);
console.log('- update:', typeof commentController.update);
console.log('- delete:', typeof commentController.delete);
console.log('- getAllForAdmin:', typeof commentController.getAllForAdmin);
console.log('- updateStatus:', typeof commentController.updateStatus);
console.log('- toggleFeatured:', typeof commentController.toggleFeatured);

const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

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

console.log('📝 Definiendo ruta: GET /user/my-comments');
router.get('/user/my-comments', authMiddleware, commentController.getMyComments);

console.log('📝 Definiendo ruta: GET /system/feedback');
router.get('/system/feedback', authMiddleware, commentController.getSystemFeedback);

console.log('📝 Definiendo ruta: GET /movie/:pelicula_id');
router.get('/movie/:pelicula_id', commentController.getByMovie);

// ==================== RUTAS ADMIN ESPECÍFICAS ====================

console.log('📝 Definiendo ruta: GET /admin/all');
router.get('/admin/all', authMiddleware, adminMiddleware, commentController.getAllForAdmin);

console.log('📝 Definiendo ruta: PUT /admin/:id/status');
router.put('/admin/:id/status', 
    authMiddleware, 
    adminMiddleware,
    validateId,
    [body('estado').isIn(['activo', 'oculto', 'moderacion', 'rechazado']).withMessage('Estado inválido')],
    commentController.updateStatus
);

console.log('📝 Definiendo ruta: PUT /admin/:id/featured');
router.put('/admin/:id/featured', 
    authMiddleware, 
    adminMiddleware,
    validateId,
    commentController.toggleFeatured
);

// ==================== RUTAS GENERALES (CON PARÁMETROS AL FINAL) ====================

console.log('📝 Definiendo ruta: POST /');
router.post('/', authMiddleware, validateComment, commentController.create);

console.log('📝 Definiendo ruta: GET /:id - LÍNEA 63 APROX');
router.get('/:id', authMiddleware, validateId, commentController.getById);

console.log('📝 Definiendo ruta: PUT /:id');
router.put('/:id', authMiddleware, validateId, validateUpdate, commentController.update);

console.log('📝 Definiendo ruta: DELETE /:id');
router.delete('/:id', authMiddleware, validateId, commentController.delete);

console.log('✅ Todas las rutas definidas correctamente');

module.exports = router;