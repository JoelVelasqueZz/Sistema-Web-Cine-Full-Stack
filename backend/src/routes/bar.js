const express = require('express');
const router = express.Router();
const BarController = require('../controllers/bar/barController');
const { body } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Validaciones para crear/actualizar productos
const productValidation = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
  
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  
  body('precio')
    .isFloat({ min: 0.01 })
    .withMessage('El precio debe ser un número positivo'),
  
  body('categoria')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La categoría debe tener entre 2 y 100 caracteres'),
  
  body('imagen')
    .optional()
    .trim()
    .isURL()
    .withMessage('La imagen debe ser una URL válida'),
  
  body('disponible')
    .optional()
    .isBoolean()
    .withMessage('Disponible debe ser verdadero o falso'),
  
  body('es_combo')
    .optional()
    .isBoolean()
    .withMessage('Es combo debe ser verdadero o falso'),
  
  body('descuento')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('El descuento debe estar entre 0 y 100'),
  
  body('tamanos')
    .optional()
    .isArray()
    .withMessage('Tamaños debe ser un array'),
  
  body('tamanos.*.nombre')
    .if(body('tamanos').exists())
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre del tamaño es requerido y no puede exceder 100 caracteres'),
  
  body('tamanos.*.precio')
    .if(body('tamanos').exists())
    .isFloat({ min: 0.01 })
    .withMessage('El precio del tamaño debe ser un número positivo'),
  
  body('extras')
    .optional()
    .isArray()
    .withMessage('Extras debe ser un array'),
  
  body('extras.*.nombre')
    .if(body('extras').exists())
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre del extra es requerido y no puede exceder 100 caracteres'),
  
  body('extras.*.precio')
    .if(body('extras').exists())
    .isFloat({ min: 0.01 })
    .withMessage('El precio del extra debe ser un número positivo'),
  
  body('combo_items')
    .optional()
    .isArray()
    .withMessage('Items del combo debe ser un array'),
  
  body('combo_items.*.item_nombre')
    .if(body('combo_items').exists())
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('El nombre del item del combo es requerido y no puede exceder 255 caracteres')
];

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

// GET /api/bar - Obtener todos los productos
router.get('/', BarController.getAllProducts);

// GET /api/bar/search - Buscar productos
router.get('/search', BarController.searchProducts);

// GET /api/bar/categories - Obtener categorías
router.get('/categories', BarController.getCategories);

// GET /api/bar/combos - Obtener combos
router.get('/combos', BarController.getCombos);

// GET /api/bar/category/:categoria - Obtener productos por categoría
router.get('/category/:categoria', BarController.getProductsByCategory);

// GET /api/bar/:id - Obtener producto por ID
router.get('/:id', BarController.getProductById);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación de admin)
// ============================================

// POST /api/bar - Crear nuevo producto
router.post('/', 
  authenticateToken, 
  requireAdmin, 
  productValidation, 
  BarController.createProduct
);

// PUT /api/bar/:id - Actualizar producto
router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  productValidation, 
  BarController.updateProduct
);

// DELETE /api/bar/:id - Eliminar producto (soft delete)
router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  BarController.deleteProduct
);

// DELETE /api/bar/:id/hard - Eliminar producto permanentemente
router.delete('/:id/hard', 
  authenticateToken, 
  requireAdmin, 
  BarController.hardDeleteProduct
);

module.exports = router;