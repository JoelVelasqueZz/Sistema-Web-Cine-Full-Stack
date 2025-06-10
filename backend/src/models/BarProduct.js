const { query } = require('../config/database');

class BarProduct {
  static async getAll() {
    try {
      const queryText = `
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
          ) as extras,
          COALESCE(
            json_agg(
              json_build_object(
                'id', ci.id,
                'item_nombre', ci.item_nombre
              )
            ) FILTER (WHERE ci.id IS NOT NULL), 
            '[]'
          ) as combo_items
        FROM productos_bar pb
        LEFT JOIN producto_tamanos pt ON pb.id = pt.producto_id
        LEFT JOIN producto_extras pe ON pb.id = pe.producto_id
        LEFT JOIN combo_items ci ON pb.id = ci.producto_id
        WHERE pb.eliminado = false
        GROUP BY pb.id
        ORDER BY pb.categoria, pb.nombre
      `;
      
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const queryText = `
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
          ) as extras,
          COALESCE(
            json_agg(
              json_build_object(
                'id', ci.id,
                'item_nombre', ci.item_nombre
              )
            ) FILTER (WHERE ci.id IS NOT NULL), 
            '[]'
          ) as combo_items
        FROM productos_bar pb
        LEFT JOIN producto_tamanos pt ON pb.id = pt.producto_id
        LEFT JOIN producto_extras pe ON pb.id = pe.producto_id
        LEFT JOIN combo_items ci ON pb.id = ci.producto_id
        WHERE pb.id = $1 AND pb.eliminado = false
        GROUP BY pb.id
      `;
      
      const result = await query(queryText, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al obtener producto: ${error.message}`);
    }
  }

  static async create(productData) {
    try {
      // Insertar producto principal
      const productQuery = `
        INSERT INTO productos_bar (
          nombre, descripcion, precio, categoria, imagen, 
          disponible, es_combo, descuento, eliminado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const productValues = [
        productData.nombre,
        productData.descripcion || null,
        productData.precio,
        productData.categoria,
        productData.imagen || null,
        productData.disponible !== false, // Default true
        productData.es_combo || false,
        productData.descuento || 0,
        false // eliminado = false por defecto
      ];
      
      const productResult = await query(productQuery, productValues);
      const newProduct = productResult.rows[0];
      
      // Insertar tamaños si existen
      if (productData.tamanos && productData.tamanos.length > 0) {
        for (const tamano of productData.tamanos) {
          await query(
            'INSERT INTO producto_tamanos (producto_id, nombre, precio) VALUES ($1, $2, $3)',
            [newProduct.id, tamano.nombre, tamano.precio]
          );
        }
      }
      
      // Insertar extras si existen
      if (productData.extras && productData.extras.length > 0) {
        for (const extra of productData.extras) {
          await query(
            'INSERT INTO producto_extras (producto_id, nombre, precio) VALUES ($1, $2, $3)',
            [newProduct.id, extra.nombre, extra.precio]
          );
        }
      }
      
      // Insertar items del combo si es un combo
      if (productData.es_combo && productData.combo_items && productData.combo_items.length > 0) {
        for (const item of productData.combo_items) {
          await query(
            'INSERT INTO combo_items (producto_id, item_nombre) VALUES ($1, $2)',
            [newProduct.id, item.item_nombre]
          );
        }
      }
      
      // Obtener el producto completo con todas las relaciones
      return await this.getById(newProduct.id);
      
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
  }

  static async update(id, productData) {
    try {
      // Actualizar producto principal
      const productQuery = `
        UPDATE productos_bar SET
          nombre = COALESCE($1, nombre),
          descripcion = COALESCE($2, descripcion),
          precio = COALESCE($3, precio),
          categoria = COALESCE($4, categoria),
          imagen = COALESCE($5, imagen),
          disponible = COALESCE($6, disponible),
          es_combo = COALESCE($7, es_combo),
          descuento = COALESCE($8, descuento),
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $9 AND eliminado = false
        RETURNING *
      `;
      
      const productValues = [
        productData.nombre || null,
        productData.descripcion || null,
        productData.precio || null,
        productData.categoria || null,
        productData.imagen || null,
        productData.disponible !== undefined ? productData.disponible : null,
        productData.es_combo !== undefined ? productData.es_combo : null,
        productData.descuento !== undefined ? productData.descuento : null,
        id
      ];
      
      const productResult = await query(productQuery, productValues);
      if (productResult.rows.length === 0) {
        throw new Error('Producto no encontrado o ya eliminado');
      }
      
      // Actualizar tamaños si se proporcionan
      if (productData.tamanos !== undefined) {
        // Eliminar tamaños existentes
        await query('DELETE FROM producto_tamanos WHERE producto_id = $1', [id]);
        
        // Insertar nuevos tamaños
        if (productData.tamanos.length > 0) {
          for (const tamano of productData.tamanos) {
            await query(
              'INSERT INTO producto_tamanos (producto_id, nombre, precio) VALUES ($1, $2, $3)',
              [id, tamano.nombre, tamano.precio]
            );
          }
        }
      }
      
      // Actualizar extras si se proporcionan
      if (productData.extras !== undefined) {
        // Eliminar extras existentes
        await query('DELETE FROM producto_extras WHERE producto_id = $1', [id]);
        
        // Insertar nuevos extras
        if (productData.extras.length > 0) {
          for (const extra of productData.extras) {
            await query(
              'INSERT INTO producto_extras (producto_id, nombre, precio) VALUES ($1, $2, $3)',
              [id, extra.nombre, extra.precio]
            );
          }
        }
      }
      
      // Actualizar items del combo si se proporcionan
      if (productData.combo_items !== undefined) {
        // Eliminar items existentes
        await query('DELETE FROM combo_items WHERE producto_id = $1', [id]);
        
        // Insertar nuevos items
        if (productData.es_combo && productData.combo_items.length > 0) {
          for (const item of productData.combo_items) {
            await query(
              'INSERT INTO combo_items (producto_id, item_nombre) VALUES ($1, $2)',
              [id, item.item_nombre]
            );
          }
        }
      }
      
      // Obtener el producto actualizado con todas las relaciones
      return await this.getById(id);
      
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }

  // 🆕 NUEVO MÉTODO: Cambiar disponibilidad (para activar/desactivar producto)
  static async toggleDisponibilidad(id) {
    try {
      const queryText = `
        UPDATE productos_bar 
        SET disponible = NOT disponible, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $1 AND eliminado = false
        RETURNING *
      `;
      
      const result = await query(queryText, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Producto no encontrado o ya eliminado');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al cambiar disponibilidad: ${error.message}`);
    }
  }

  // 🆕 MODIFICADO: Soft delete (cambiar eliminado a true)
  static async delete(id) {
    try {
      const queryText = `
        UPDATE productos_bar 
        SET eliminado = true, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $1 AND eliminado = false
        RETURNING *
      `;
      
      const result = await query(queryText, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Producto no encontrado o ya eliminado');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }

  // 🆕 NUEVO MÉTODO: Restaurar producto eliminado
  static async restore(id) {
    try {
      const queryText = `
        UPDATE productos_bar 
        SET eliminado = false, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $1 AND eliminado = true
        RETURNING *
      `;
      
      const result = await query(queryText, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Producto no encontrado en la papelera');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al restaurar producto: ${error.message}`);
    }
  }

  // 🆕 NUEVO MÉTODO: Obtener productos eliminados (papelera)
  static async getDeleted() {
    try {
      const queryText = `
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
          ) as extras,
          COALESCE(
            json_agg(
              json_build_object(
                'id', ci.id,
                'item_nombre', ci.item_nombre
              )
            ) FILTER (WHERE ci.id IS NOT NULL), 
            '[]'
          ) as combo_items
        FROM productos_bar pb
        LEFT JOIN producto_tamanos pt ON pb.id = pt.producto_id
        LEFT JOIN producto_extras pe ON pb.id = pe.producto_id
        LEFT JOIN combo_items ci ON pb.id = ci.producto_id
        WHERE pb.eliminado = true
        GROUP BY pb.id
        ORDER BY pb.fecha_actualizacion DESC
      `;
      
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener productos eliminados: ${error.message}`);
    }
  }

  static async hardDelete(id) {
    try {
      // Eliminación física (solo para admin)
      const queryText = 'DELETE FROM productos_bar WHERE id = $1 RETURNING *';
      const result = await query(queryText, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Producto no encontrado');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al eliminar producto permanentemente: ${error.message}`);
    }
  }

  static async getByCategory(categoria) {
    try {
      const queryText = `
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
        WHERE pb.categoria = $1 AND pb.eliminado = false
        GROUP BY pb.id
        ORDER BY pb.nombre
      `;
      
      const result = await query(queryText, [categoria]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener productos por categoría: ${error.message}`);
    }
  }

  static async getCombos() {
    try {
      const queryText = `
        SELECT 
          pb.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', ci.id,
                'item_nombre', ci.item_nombre
              )
            ) FILTER (WHERE ci.id IS NOT NULL), 
            '[]'
          ) as combo_items
        FROM productos_bar pb
        LEFT JOIN combo_items ci ON pb.id = ci.producto_id
        WHERE pb.es_combo = true AND pb.eliminado = false
        GROUP BY pb.id
        ORDER BY pb.nombre
      `;
      
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener combos: ${error.message}`);
    }
  }

  static async getCategories() {
    try {
      const queryText = `
        SELECT DISTINCT categoria, COUNT(*) as total_productos
        FROM productos_bar 
        WHERE eliminado = false
        GROUP BY categoria
        ORDER BY categoria
      `;
      
      const result = await query(queryText);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }
  }
}

module.exports = BarProduct;