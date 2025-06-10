const BarProduct = require('../../models/BarProduct');
const { validationResult } = require('express-validator');
const { asyncHandler } = require('../../middleware/errorHandler');

class BarController {
  // Obtener todos los productos
  static getAllProducts = asyncHandler(async (req, res) => {
    const products = await BarProduct.getAll();
    
    res.status(200).json({
      success: true,
      message: 'Productos obtenidos exitosamente',
      data: products,
      total: products.length
    });
  });

  // Obtener producto por ID
  static getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const product = await BarProduct.getById(parseInt(id));
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Producto obtenido exitosamente',
      data: product
    });
  });

  // Crear nuevo producto
  static createProduct = asyncHandler(async (req, res) => {
    // Validar errores de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const productData = req.body;
    
    // Validaciones adicionales
    if (!productData.nombre || !productData.precio || !productData.categoria) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: nombre, precio y categoría son requeridos'
      });
    }

    if (productData.precio <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    const newProduct = await BarProduct.create(productData);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: newProduct
    });
  });

  // Actualizar producto
  static updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    // Validar errores de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const productData = req.body;
    
    // Validaciones adicionales
    if (productData.precio && productData.precio <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    const updatedProduct = await BarProduct.update(parseInt(id), productData);

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  });

  // 🆕 NUEVO: Cambiar disponibilidad del producto
  static toggleDisponibilidad = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const updatedProduct = await BarProduct.toggleDisponibilidad(parseInt(id));

    const estado = updatedProduct.disponible ? 'disponible' : 'no disponible';
    
    res.status(200).json({
      success: true,
      message: `Producto marcado como ${estado}`,
      data: updatedProduct
    });
  });

  // 🆕 MODIFICADO: Eliminar producto (soft delete)
  static deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const deletedProduct = await BarProduct.delete(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente',
      data: deletedProduct
    });
  });

  // 🆕 NUEVO: Restaurar producto eliminado
  static restoreProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const restoredProduct = await BarProduct.restore(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Producto restaurado exitosamente',
      data: restoredProduct
    });
  });

  // 🆕 NUEVO: Obtener productos eliminados (papelera)
  static getDeletedProducts = asyncHandler(async (req, res) => {
    const deletedProducts = await BarProduct.getDeleted();

    res.status(200).json({
      success: true,
      message: 'Productos eliminados obtenidos exitosamente',
      data: deletedProducts,
      total: deletedProducts.length
    });
  });

  // Eliminar producto permanentemente (solo admin)
  static hardDeleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const deletedProduct = await BarProduct.hardDelete(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Producto eliminado permanentemente',
      data: deletedProduct
    });
  });

  // Obtener productos por categoría
  static getProductsByCategory = asyncHandler(async (req, res) => {
    const { categoria } = req.params;
    
    if (!categoria) {
      return res.status(400).json({
        success: false,
        message: 'Categoría es requerida'
      });
    }

    const products = await BarProduct.getByCategory(categoria);

    res.status(200).json({
      success: true,
      message: `Productos de la categoría ${categoria} obtenidos exitosamente`,
      data: products,
      total: products.length
    });
  });

  // Obtener todos los combos
  static getCombos = asyncHandler(async (req, res) => {
    const combos = await BarProduct.getCombos();

    res.status(200).json({
      success: true,
      message: 'Combos obtenidos exitosamente',
      data: combos,
      total: combos.length
    });
  });

  // Obtener todas las categorías
  static getCategories = asyncHandler(async (req, res) => {
    const categories = await BarProduct.getCategories();

    res.status(200).json({
      success: true,
      message: 'Categorías obtenidas exitosamente',
      data: categories,
      total: categories.length
    });
  });

  // Buscar productos
  static searchProducts = asyncHandler(async (req, res) => {
    const { q, categoria, es_combo } = req.query;
    
    let query = `
      SELECT 
        pb.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pt.id,
              'nombre', pt.nombre,
              'precio', pt.precio
            )
          ) FILTER (WHERE pt.id IS NOT NULL), 
          '[]'
        ) as tamanos,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pe.id,
              'nombre', pe.nombre,
              'precio', pe.precio
            )
          ) FILTER (WHERE pe.id IS NOT NULL), 
          '[]'
        ) as extras
      FROM productos_bar pb
      LEFT JOIN producto_tamanos pt ON pb.id = pt.producto_id
      LEFT JOIN producto_extras pe ON pb.id = pe.producto_id
      WHERE pb.eliminado = false
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (q) {
      paramCount++;
      query += ` AND (pb.nombre ILIKE $${paramCount} OR pb.descripcion ILIKE $${paramCount})`;
      params.push(`%${q}%`);
    }
    
    if (categoria) {
      paramCount++;
      query += ` AND pb.categoria = $${paramCount}`;
      params.push(categoria);
    }
    
    if (es_combo !== undefined) {
      paramCount++;
      query += ` AND pb.es_combo = $${paramCount}`;
      params.push(es_combo === 'true');
    }
    
    query += ` GROUP BY pb.id ORDER BY pb.nombre`;
    
    const { query: dbQuery } = require('../../config/database');
    const result = await dbQuery(query, params);

    res.status(200).json({
      success: true,
      message: 'Búsqueda completada exitosamente',
      data: result.rows,
      total: result.rows.length,
      filters: { q, categoria, es_combo }
    });
  });
}

module.exports = BarController;