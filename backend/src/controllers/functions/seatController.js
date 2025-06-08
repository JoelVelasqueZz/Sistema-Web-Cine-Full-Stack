// backend/src/controllers/functions/seatController.js
const { query } = require('../../config/database');

// Generar asientos para una función
const generateSeatsForFunction = async (req, res) => {
  try {
    const { funcionId } = req.params;
    
    console.log(`📡 Generando asientos para función: ${funcionId}`);
    
    // Verificar que la función existe
    const funcionResult = await query(
      'SELECT * FROM funciones_cine WHERE id = $1 AND activo = true',
      [funcionId]
    );
    
    if (funcionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Función no encontrada'
      });
    }
    
    const funcion = funcionResult.rows[0];
    
    // Verificar si ya tiene asientos generados
    const existingSeats = await query(
      'SELECT COUNT(*) as count FROM asientos WHERE funcion_id = $1',
      [funcionId]
    );
    
    if (parseInt(existingSeats.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        error: 'Esta función ya tiene asientos generados'
      });
    }
    
    // 🆕 MEJORAR: Generar matriz completa y marcar extras como no disponibles
    const salaConfig = getSalaConfiguration(funcion.sala, funcion.asientos_disponibles);
    
    const asientosGenerados = [];
    const totalMatriz = salaConfig.filas * salaConfig.asientosPorFila;
    let asientoCount = 0;
    
    console.log(`🪑 Configuración: ${salaConfig.filas} filas x ${salaConfig.asientosPorFila} asientos = ${totalMatriz} total`);
    console.log(`🪑 Asientos disponibles: ${funcion.asientos_disponibles}`);
    console.log(`🪑 Asientos que se marcarán como no disponibles: ${totalMatriz - funcion.asientos_disponibles}`);
    
    // Generar TODA la matriz
    for (let row = 0; row < salaConfig.filas; row++) {
      const fila = String.fromCharCode(65 + row); // A, B, C, etc.
      
      for (let seatNum = 1; seatNum <= salaConfig.asientosPorFila; seatNum++) {
        const esVip = salaConfig.filasVip.includes(fila);
        const precio = esVip ? funcion.precio * 1.5 : funcion.precio;
        
        // 🆕 LÓGICA MEJORADA: Marcar como no disponible si excede el límite
        const estaDisponible = asientoCount < funcion.asientos_disponibles;
        const estaOcupado = false; // Los asientos nuevos no están ocupados
        const estaDeshabilitado = !estaDisponible; // Si no está disponible, está deshabilitado
        
        const insertSql = `
          INSERT INTO asientos (funcion_id, fila, numero, es_vip, precio, esta_ocupado, esta_deshabilitado)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, fila, numero, es_vip, precio, esta_ocupado, esta_deshabilitado
        `;
        
        const result = await query(insertSql, [
          funcionId, 
          fila, 
          seatNum, 
          esVip, 
          precio, 
          estaOcupado,
          estaDeshabilitado  // 🆕 NUEVO CAMPO
        ]);
        
        asientosGenerados.push(result.rows[0]);
        
        if (estaDisponible) {
          asientoCount++;
        }
      }
    }
    
    const asientosDisponibles = asientosGenerados.filter(a => !a.esta_deshabilitado).length;
    const asientosDeshabilitados = asientosGenerados.filter(a => a.esta_deshabilitado).length;
    const asientosVip = asientosGenerados.filter(a => a.es_vip && !a.esta_deshabilitado).length;
    
    console.log(`✅ Matriz generada:`, {
      totalAsientos: asientosGenerados.length,
      disponibles: asientosDisponibles,
      deshabilitados: asientosDeshabilitados,
      vip: asientosVip,
      filas: salaConfig.filas,
      asientosPorFila: salaConfig.asientosPorFila
    });
    
    res.status(201).json({
      success: true,
      message: `${asientosGenerados.length} asientos generados exitosamente`,
      data: {
        funcionId: funcionId,
        totalAsientos: asientosGenerados.length,
        asientosDisponibles: asientosDisponibles,
        asientosDeshabilitados: asientosDeshabilitados,
        asientosVip: asientosVip,
        asientosNormales: asientosDisponibles - asientosVip,
        configuracion: {
          filas: salaConfig.filas,
          asientosPorFila: salaConfig.asientosPorFila,
          filasVip: salaConfig.filasVip
        }
      }
    });

  } catch (error) {
    console.error('❌ Error al generar asientos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener asientos de una función
const getSeatsForFunction = async (req, res) => {
  try {
    const { funcionId } = req.params;
    
    console.log(`📡 Obteniendo asientos de función: ${funcionId}`);
    
    const sql = `
      SELECT 
        a.id,
        a.fila,
        a.numero,
        a.es_vip,
        a.esta_ocupado,
        a.esta_deshabilitado,
        a.precio,
        CONCAT(a.fila, a.numero) as seat_id
      FROM asientos a
      WHERE a.funcion_id = $1
      ORDER BY a.fila ASC, a.numero ASC
    `;
    
    const result = await query(sql, [funcionId]);
    
    console.log(`✅ ${result.rows.length} asientos encontrados`);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error al obtener asientos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Reservar asientos
const reserveSeats = async (req, res) => {
  try {
    const { funcionId } = req.params;
    const { seatIds } = req.body; // Array de IDs de asientos
    
    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de IDs de asientos'
      });
    }
    
    console.log(`📡 Reservando ${seatIds.length} asientos en función ${funcionId}`);
    
    // Verificar que todos los asientos existen y están disponibles
    const checkSql = `
      SELECT id, fila, numero, esta_ocupado, esta_deshabilitado
      FROM asientos 
      WHERE id = ANY($1) AND funcion_id = $2
    `;
    
    const existingSeats = await query(checkSql, [seatIds, funcionId]);
    
    if (existingSeats.rows.length !== seatIds.length) {
      return res.status(404).json({
        success: false,
        error: 'Algunos asientos no existen'
      });
    }
    
    // Verificar que ningún asiento esté ocupado o deshabilitado
    const noDisponibles = existingSeats.rows.filter(seat => seat.esta_ocupado || seat.esta_deshabilitado);
    if (noDisponibles.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Los siguientes asientos no están disponibles: ${noDisponibles.map(s => s.fila + s.numero).join(', ')}`
      });
    }
    
    // Marcar asientos como ocupados
    const updateSql = `
      UPDATE asientos 
      SET esta_ocupado = true 
      WHERE id = ANY($1) AND funcion_id = $2
      RETURNING id, fila, numero, precio
    `;
    
    const result = await query(updateSql, [seatIds, funcionId]);
    
    // Calcular total
    const totalPrecio = result.rows.reduce((sum, seat) => sum + parseFloat(seat.precio), 0);
    
    console.log(`✅ ${result.rows.length} asientos reservados`);
    
    res.json({
      success: true,
      message: `${result.rows.length} asientos reservados exitosamente`,
      data: {
        asientosReservados: result.rows,
        totalPrecio: totalPrecio,
        cantidad: result.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Error al reservar asientos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Liberar asientos (por si se cancela una compra)
const releaseSeats = async (req, res) => {
  try {
    const { funcionId } = req.params;
    const { seatIds } = req.body;
    
    console.log(`📡 Liberando ${seatIds.length} asientos en función ${funcionId}`);
    
    const updateSql = `
      UPDATE asientos 
      SET esta_ocupado = false 
      WHERE id = ANY($1) AND funcion_id = $2
      RETURNING id, fila, numero
    `;
    
    const result = await query(updateSql, [seatIds, funcionId]);
    
    console.log(`✅ ${result.rows.length} asientos liberados`);
    
    res.json({
      success: true,
      message: `${result.rows.length} asientos liberados`,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Error al liberar asientos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// 🆕 FUNCIÓN MEJORADA: Configuración más inteligente de salas
function getSalaConfiguration(nombreSala, totalAsientos) {
  // Configuraciones predefinidas por sala
  const configuracionesSala = {
    'Sala VIP': { 
      baseFilas: 6, 
      baseAsientosPorFila: 8, 
      filasVip: ['A', 'B', 'C', 'D', 'E', 'F'] 
    },
    'Sala IMAX': { 
      baseFilas: 8, 
      baseAsientosPorFila: 12, 
      filasVip: ['F', 'G', 'H'] 
    },
    'Sala Premium': { 
      baseFilas: 7, 
      baseAsientosPorFila: 10, 
      filasVip: ['E', 'F', 'G'] 
    },
    'Sala 1': { 
      baseFilas: 6, 
      baseAsientosPorFila: 10, 
      filasVip: ['E', 'F'] 
    },
    'Sala 2': { 
      baseFilas: 8, 
      baseAsientosPorFila: 12, 
      filasVip: ['F', 'G', 'H'] 
    },
    'Sala 3': { 
      baseFilas: 6, 
      baseAsientosPorFila: 8, 
      filasVip: ['E', 'F'] 
    }
  };
  
  // Obtener configuración base o usar default
  const configBase = configuracionesSala[nombreSala] || {
    baseFilas: 6,
    baseAsientosPorFila: 10,
    filasVip: ['E', 'F']
  };
  
  // 🆕 ALGORITMO MEJORADO: Encontrar la mejor matriz que acomode los asientos
  let mejorConfig = null;
  let menorDiferencia = Infinity;
  
  // Probar diferentes configuraciones cercanas a la base
  for (let filas = Math.max(4, configBase.baseFilas - 2); filas <= configBase.baseFilas + 3; filas++) {
    for (let asientosPorFila = Math.max(4, configBase.baseAsientosPorFila - 3); asientosPorFila <= configBase.baseAsientosPorFila + 4; asientosPorFila++) {
      const totalMatriz = filas * asientosPorFila;
      
      // Preferir matrices que sean >= a los asientos necesarios
      if (totalMatriz >= totalAsientos) {
        const diferencia = totalMatriz - totalAsientos;
        const factor = Math.abs(filas - configBase.baseFilas) + Math.abs(asientosPorFila - configBase.baseAsientosPorFila);
        const puntuacion = diferencia + (factor * 2); // Penalizar desviaciones de la configuración base
        
        if (puntuacion < menorDiferencia) {
          menorDiferencia = puntuacion;
          mejorConfig = { filas, asientosPorFila, totalMatriz };
        }
      }
    }
  }
  
  // Si no encontramos buena configuración, usar cálculo automático
  if (!mejorConfig) {
    const filas = Math.max(4, Math.ceil(Math.sqrt(totalAsientos)));
    const asientosPorFila = Math.ceil(totalAsientos / filas);
    mejorConfig = { filas, asientosPorFila, totalMatriz: filas * asientosPorFila };
  }
  
  // Ajustar filas VIP según el número total de filas
  const letrasFilas = Array.from({ length: mejorConfig.filas }, (_, i) => String.fromCharCode(65 + i));
  const filasVip = letrasFilas.slice(-Math.min(3, Math.ceil(mejorConfig.filas / 3))); // Últimas filas como VIP
  
  console.log(`🎭 Configuración calculada para ${nombreSala}:`, {
    filas: mejorConfig.filas,
    asientosPorFila: mejorConfig.asientosPorFila,
    totalMatriz: mejorConfig.totalMatriz,
    asientosDisponibles: totalAsientos,
    asientosDeshabilitados: mejorConfig.totalMatriz - totalAsientos,
    filasVip
  });
  
  return {
    filas: mejorConfig.filas,
    asientosPorFila: mejorConfig.asientosPorFila,
    filasVip: filasVip,
    totalAsientos: totalAsientos
  };
}

module.exports = {
  generateSeatsForFunction,
  getSeatsForFunction,
  reserveSeats,
  releaseSeats
};