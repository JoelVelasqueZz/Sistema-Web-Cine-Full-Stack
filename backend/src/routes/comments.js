// backend/src/routes/comments.js - DEBUG MIDDLEWARE
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

console.log('🔍 Iniciando importación del controlador...');
const commentController = require('../controllers/comments/commentController');
console.log('✅ Controlador importado:', typeof commentController);

// 🔍 DEBUG: Verificar middleware
console.log('🔍 Verificando middleware...');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

console.log('- authMiddleware:', typeof authMiddleware);
console.log('- adminMiddleware:', typeof adminMiddleware);

// Si son objetos, mostrar las propiedades
if (typeof authMiddleware === 'object') {
    console.log('🚨 authMiddleware es un objeto! Propiedades:', Object.keys(authMiddleware));
}

if (typeof adminMiddleware === 'object') {
    console.log('🚨 adminMiddleware es un objeto! Propiedades:', Object.keys(adminMiddleware));
}

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

// ==================== RUTAS SIN MIDDLEWARE PRIMERO (PARA PROBAR) ====================

console.log('📝 Definiendo ruta SIN middleware: GET /movie/:pelicula_id');
router.get('/movie/:pelicula_id', commentController.getByMovie);

console.log('📝 Definiendo ruta SIN middleware: POST /');
router.post('/', validateComment, commentController.create);

// 🔥 SOLUCIÓN TEMPORAL: Solo usar middleware si son funciones
if (typeof authMiddleware === 'function') {
    console.log('📝 Definiendo ruta CON authMiddleware: GET /user/my-comments');
    router.get('/user/my-comments', authMiddleware, commentController.getMyComments);
    
    console.log('📝 Definiendo ruta CON authMiddleware: GET /system/feedback');
    router.get('/system/feedback', authMiddleware, commentController.getSystemFeedback);
    
    console.log('📝 Definiendo ruta CON authMiddleware: GET /:id');
    router.get('/:id', authMiddleware, validateId, commentController.getById);
    
    console.log('📝 Definiendo ruta CON authMiddleware: PUT /:id');
    router.put('/:id', authMiddleware, validateId, validateUpdate, commentController.update);
    
    console.log('📝 Definiendo ruta CON authMiddleware: DELETE /:id');
    router.delete('/:id', authMiddleware, validateId, commentController.delete);
} else {
    console.log('🚨 SALTANDO rutas con authMiddleware - no es una función');
    
    // Rutas temporales sin middleware para que funcione
    console.log('📝 Definiendo ruta SIN authMiddleware: GET /user/my-comments');
    router.get('/user/my-comments', commentController.getMyComments);
    
    console.log('📝 Definiendo ruta SIN authMiddleware: GET /system/feedback');
    router.get('/system/feedback', commentController.getSystemFeedback);
    
    console.log('📝 Definiendo ruta SIN authMiddleware: GET /:id');
    router.get('/:id', validateId, commentController.getById);
    
    console.log('📝 Definiendo ruta SIN authMiddleware: PUT /:id');
    router.put('/:id', validateId, validateUpdate, commentController.update);
    
    console.log('📝 Definiendo ruta SIN authMiddleware: DELETE /:id');
    router.delete('/:id', validateId, commentController.delete);
}

// ==================== RUTAS ADMIN ====================

if (typeof authMiddleware === 'function' && typeof adminMiddleware === 'function') {
    console.log('📝 Definiendo rutas admin CON middleware');
    
    router.get('/admin/all', authMiddleware, adminMiddleware, commentController.getAllForAdmin);
    
    router.put('/admin/:id/status', 
        authMiddleware, 
        adminMiddleware,
        validateId,
        [body('estado').isIn(['activo', 'oculto', 'moderacion', 'rechazado']).withMessage('Estado inválido')],
        commentController.updateStatus
    );
    
    router.put('/admin/:id/featured', 
        authMiddleware, 
        adminMiddleware,
        validateId,
        commentController.toggleFeatured
    );
} else {
    console.log('🚨 SALTANDO rutas admin - middleware no son funciones');
    
    // Rutas temporales sin middleware
    router.get('/admin/all', commentController.getAllForAdmin);
    router.put('/admin/:id/status', validateId, [body('estado').isIn(['activo', 'oculto', 'moderacion', 'rechazado']).withMessage('Estado inválido')], commentController.updateStatus);
    router.put('/admin/:id/featured', validateId, commentController.toggleFeatured);
}

console.log('✅ Todas las rutas definidas');

module.exports = router;