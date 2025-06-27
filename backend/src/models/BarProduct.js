const { query } = require('../config/database');

class BarProduct {
  // ✅ Obtener todos los productos (solo los no eliminados)
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

  // ✅ Obtener producto por ID (solo si no está eliminado)
  static async getById(id) {
  try {

    const productQuery = `
      SELECT * FROM productos_bar 
      WHERE id = $1 AND eliminado = false
    `;
    const productResult = await query(productQuery, [id]);
    
    if (productResult.rows.length === 0) {
      return null;
    }
    
    const producto = productResult.rows[0];
    
    // 2. Obtener tamaños (sin duplicados)
    const tamanosQuery = `
      SELECT DISTINCT id, nombre, precio 
      FROM producto_tamanos 
      WHERE producto_id = $1 
      ORDER BY precio ASC
    `;
    const tamanosResult = await query(tamanosQuery, [id]);
    
    // 3. Obtener extras (sin duplicados)
    const extrasQuery = `
      SELECT DISTINCT id, nombre, precio 
      FROM producto_extras 
      WHERE producto_id = $1 
      ORDER BY precio ASC
    `;
    const extrasResult = await query(extrasQuery, [id]);
    
    // 4. Obtener combo items (sin duplicados)
    const comboItemsQuery = `
      SELECT DISTINCT id, item_nombre 
      FROM combo_items 
      WHERE producto_id = $1 
      ORDER BY id ASC
    `;
    const comboItemsResult = await query(comboItemsQuery, [id]);
    
    // 5. Construir objeto final
    return {
      ...producto,
      tamanos: tamanosResult.rows,
      extras: extrasResult.rows,
      combo_items: comboItemsResult.rows
    };
    
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
    console.log('🔧 [DEBUG] Iniciando actualización del producto:', id);
    console.log('🔧 [DEBUG] Datos recibidos COMPLETOS:', JSON.stringify(productData, null, 2));
    
    // ============ VERIFICAR CONEXIÓN A BD ============
    console.log('🔧 [DEBUG] Verificando conexión a base de datos...');
    const testQuery = await query('SELECT NOW() as current_time');
    console.log('✅ [DEBUG] Conexión BD OK:', testQuery.rows[0]);
    
    // ============ ACTUALIZAR PRODUCTO PRINCIPAL ============
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
    
    console.log('✅ [DEBUG] Producto principal actualizado');
    
    // ============ VERIFICAR SI DEBE PROCESAR EXTRAS ============
    console.log('🔧 [DEBUG] ===== PROCESANDO EXTRAS =====');
    console.log('🔧 [DEBUG] productData.extras existe?', productData.hasOwnProperty('extras'));
    console.log('🔧 [DEBUG] productData.extras valor:', productData.extras);
    console.log('🔧 [DEBUG] productData.extras es array?', Array.isArray(productData.extras));
    console.log('🔧 [DEBUG] productData.extras length:', productData.extras ? productData.extras.length : 'N/A');
    
    if (productData.extras !== undefined) {
      console.log('🔧 [DEBUG] Entrando a procesamiento de extras...');
      
      // ============ ELIMINAR EXTRAS EXISTENTES ============
      console.log('🔧 [DEBUG] Eliminando extras existentes...');
      
      // Primero verificar si existen extras para este producto
      const existingExtrasCheck = await query(
        'SELECT COUNT(*) as count FROM producto_extras WHERE producto_id = $1', 
        [id]
      );
      console.log('🔧 [DEBUG] Extras existentes ANTES de eliminar:', existingExtrasCheck.rows[0].count);
      
      const deleteResult = await query('DELETE FROM producto_extras WHERE producto_id = $1 RETURNING *', [id]);
      console.log('✅ [DEBUG] Extras eliminados - cantidad:', deleteResult.rows.length);
      console.log('✅ [DEBUG] Extras eliminados - detalles:', deleteResult.rows);
      
      // ============ INSERTAR NUEVOS EXTRAS ============
      if (Array.isArray(productData.extras) && productData.extras.length > 0) {
        console.log('🔧 [DEBUG] Iniciando inserción de nuevos extras...');
        console.log('🔧 [DEBUG] Extras a insertar:', JSON.stringify(productData.extras, null, 2));
        
        for (let i = 0; i < productData.extras.length; i++) {
          const extra = productData.extras[i];
          console.log(`🔧 [DEBUG] Procesando extra ${i + 1}/${productData.extras.length}:`, extra);
          
          if (extra && extra.nombre && extra.precio !== undefined) {
            console.log(`🔧 [DEBUG] Extra ${i + 1} VÁLIDO - insertando...`);
            console.log(`🔧 [DEBUG] - producto_id: ${id}`);
            console.log(`🔧 [DEBUG] - nombre: "${extra.nombre}"`);
            console.log(`🔧 [DEBUG] - precio: ${extra.precio}`);
            
            try {
              const insertQuery = 'INSERT INTO producto_extras (producto_id, nombre, precio) VALUES ($1, $2, $3) RETURNING *';
              const insertValues = [id, extra.nombre, extra.precio];
              
              console.log(`🔧 [DEBUG] Ejecutando query:`, insertQuery);
              console.log(`🔧 [DEBUG] Con valores:`, insertValues);
              
              const insertResult = await query(insertQuery, insertValues);
              
              console.log(`✅ [DEBUG] Extra ${i + 1} insertado exitosamente:`, insertResult.rows[0]);
              
            } catch (insertError) {
              console.error(`❌ [DEBUG] Error al insertar extra ${i + 1}:`, insertError);
              console.error(`❌ [DEBUG] Error stack:`, insertError.stack);
              console.error(`❌ [DEBUG] Error code:`, insertError.code);
              console.error(`❌ [DEBUG] Error detail:`, insertError.detail);
              throw insertError;
            }
            
          } else {
            console.warn(`⚠️ [DEBUG] Extra ${i + 1} INVÁLIDO - ignorado:`, extra);
            console.warn(`⚠️ [DEBUG] - tiene nombre?`, !!extra?.nombre);
            console.warn(`⚠️ [DEBUG] - tiene precio?`, extra?.precio !== undefined);
            console.warn(`⚠️ [DEBUG] - precio >= 0?`, extra?.precio >= 0);
          }
        }
        
        // ============ VERIFICAR INSERCIÓN ============
        const finalExtrasCheck = await query(
          'SELECT * FROM producto_extras WHERE producto_id = $1', 
          [id]
        );
        console.log('🔧 [DEBUG] Extras DESPUÉS de insertar:', finalExtrasCheck.rows);
        console.log('🔧 [DEBUG] Total extras insertados:', finalExtrasCheck.rows.length);
        
      } else {
        console.log('ℹ️ [DEBUG] No hay extras para insertar o array vacío/inválido');
        console.log('ℹ️ [DEBUG] - es array?', Array.isArray(productData.extras));
        console.log('ℹ️ [DEBUG] - length:', productData.extras ? productData.extras.length : 'N/A');
      }
    } else {
      console.log('ℹ️ [DEBUG] productData.extras es undefined - no se procesarán extras');
    }
    
    // ============ PROCESAR TAMAÑOS (para comparar) ============
    console.log('🔧 [DEBUG] ===== PROCESANDO TAMAÑOS =====');
    if (productData.tamanos !== undefined) {
      console.log('🔧 [DEBUG] Procesando tamaños:', productData.tamanos);
      
      await query('DELETE FROM producto_tamanos WHERE producto_id = $1', [id]);
      console.log('✅ [DEBUG] Tamaños existentes eliminados');
      
      if (Array.isArray(productData.tamanos) && productData.tamanos.length > 0) {
        for (const tamano of productData.tamanos) {
          if (tamano && tamano.nombre && tamano.precio !== undefined) {
            await query(
              'INSERT INTO producto_tamanos (producto_id, nombre, precio) VALUES ($1, $2, $3)',
              [id, tamano.nombre, tamano.precio]
            );
            console.log(`✅ [DEBUG] Tamaño insertado: ${tamano.nombre} - $${tamano.precio}`);
          }
        }
      }
    }
    
    // ============ OBTENER PRODUCTO FINAL ============
    console.log('🔧 [DEBUG] Obteniendo producto actualizado...');
    const updatedProduct = await this.getById(id);
    console.log('✅ [DEBUG] Producto completamente actualizado:', updatedProduct);
    
    return updatedProduct;
    
  } catch (error) {
    console.error('❌ [DEBUG] Error completo en update:', error);
    console.error('❌ [DEBUG] Stack trace:', error.stack);
    throw new Error(`Error al actualizar producto: ${error.message}`);
  }
}

  // Cambiar disponibilidad (para activar/desactivar producto)
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

  // ✅ SIMPLIFICADO: Soft delete directo (igual que películas)
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

  // ✅ Obtener por categoría (solo los no eliminados)
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

  // ✅ Obtener combos (solo los no eliminados)
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

  // ✅ Obtener categorías (solo de productos no eliminados)
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