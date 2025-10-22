/**
 * PRUEBAS UNITARIAS - PointsService
 * ID de Pruebas: PU-01 a PU-06
 * Tipo: Unitarias
 * Objetivo: Verificar la lógica de negocio del sistema de puntos
 */

const PointsService = require('../../services/pointsService');

// Mock del modelo de puntos
jest.mock('../../models/Points', () => {
  return jest.fn().mockImplementation(() => ({
    processPointsForPurchase: jest.fn(),
    getUserPoints: jest.fn(),
    getPointsValue: jest.fn(),
    getUserPointsStats: jest.fn(),
    getPointsHistory: jest.fn(),
    getUserReferrals: jest.fn(),
    addPoints: jest.fn(),
    getSystemConfig: jest.fn()
  }));
});

describe('PointsService - Pruebas Unitarias', () => {
  let pointsService;
  let mockPointsModel;

  beforeEach(() => {
    pointsService = new PointsService();
    mockPointsModel = pointsService.pointsModel;
    jest.clearAllMocks();

    // Mock por defecto para getPointsHistory (retorna array vacío)
    mockPointsModel.getPointsHistory.mockResolvedValue([]);
  });

  /**
   * ID: PU-01
   * Tipo: Unitaria
   * Objetivo: Verificar que calculateUserLevel retorna el nivel correcto según puntos
   * Requisito: Sistema de puntos debe categorizar usuarios en niveles
   */
  describe('PU-01: calculateUserLevel', () => {
    test('Debe retornar nivel Bronce para 0-499 puntos', () => {
      const nivel = pointsService.calculateUserLevel(250);

      expect(nivel.name).toBe('Bronce');
      expect(nivel.min).toBe(0);
      expect(nivel.max).toBe(499);
      expect(nivel.benefits).toContain('Descuentos básicos');
      expect(nivel.progress).toBe(250);
    });

    test('Debe retornar nivel Plata para 500-1499 puntos', () => {
      const nivel = pointsService.calculateUserLevel(750);

      expect(nivel.name).toBe('Plata');
      expect(nivel.min).toBe(500);
      expect(nivel.max).toBe(1499);
      expect(nivel.benefits).toContain('Descuentos mejorados');
    });

    test('Debe retornar nivel Oro para 1500-2999 puntos', () => {
      const nivel = pointsService.calculateUserLevel(2000);

      expect(nivel.name).toBe('Oro');
      expect(nivel.min).toBe(1500);
      expect(nivel.max).toBe(2999);
    });

    test('Debe retornar nivel Platino para 3000-4999 puntos', () => {
      const nivel = pointsService.calculateUserLevel(4000);

      expect(nivel.name).toBe('Platino');
      expect(nivel.min).toBe(3000);
      expect(nivel.max).toBe(4999);
    });

    test('Debe retornar nivel Diamante para 5000+ puntos', () => {
      const nivel = pointsService.calculateUserLevel(10000);

      expect(nivel.name).toBe('Diamante');
      expect(nivel.min).toBe(5000);
      expect(nivel.max).toBe(Infinity);
      expect(nivel.progressPercent).toBe(100);
    });

    test('Debe calcular correctamente el progreso porcentual', () => {
      const nivel = pointsService.calculateUserLevel(1000); // Nivel Plata

      expect(nivel.name).toBe('Plata');
      const expectedProgress = ((1000 - 500) / (1499 - 500)) * 100;
      expect(nivel.progressPercent).toBeCloseTo(expectedProgress, 2);
    });
  });

  /**
   * ID: PU-02
   * Tipo: Unitaria
   * Objetivo: Verificar el cálculo de descuento basado en puntos
   * Requisito: Los puntos deben poder convertirse a descuentos monetarios
   */
  describe('PU-02: calculatePointsDiscount', () => {
    beforeEach(() => {
      mockPointsModel.getPointsValue.mockImplementation((puntos) => puntos * 0.1);
    });

    test('Debe calcular descuento correcto para 100 puntos', () => {
      const resultado = pointsService.calculatePointsDiscount(100);

      expect(resultado.puntos).toBe(100);
      expect(resultado.descuento).toBe(10);
      expect(resultado.formatted).toBe('$10.00');
    });

    test('Debe calcular descuento correcto para 500 puntos', () => {
      const resultado = pointsService.calculatePointsDiscount(500);

      expect(resultado.puntos).toBe(500);
      expect(resultado.descuento).toBe(50);
      expect(resultado.formatted).toBe('$50.00');
    });

    test('Debe manejar correctamente 0 puntos', () => {
      mockPointsModel.getPointsValue.mockReturnValue(0);
      const resultado = pointsService.calculatePointsDiscount(0);

      expect(resultado.descuento).toBe(0);
      expect(resultado.formatted).toBe('$0.00');
    });
  });

  /**
   * ID: PU-03
   * Tipo: Unitaria
   * Objetivo: Verificar validación de uso de puntos
   * Requisito: Sistema debe validar que el usuario tenga puntos suficientes
   */
  describe('PU-03: validatePointsUsage', () => {
    test('Debe retornar válido cuando hay puntos suficientes', async () => {
      mockPointsModel.getUserPoints.mockResolvedValue({
        puntos_actuales: 1000
      });

      const resultado = await pointsService.validatePointsUsage(1, 500);

      expect(resultado.valid).toBe(true);
      expect(resultado.available).toBe(1000);
      expect(resultado.required).toBe(500);
      expect(resultado.difference).toBe(500);
    });

    test('Debe retornar inválido cuando no hay puntos suficientes', async () => {
      mockPointsModel.getUserPoints.mockResolvedValue({
        puntos_actuales: 300
      });

      const resultado = await pointsService.validatePointsUsage(1, 500);

      expect(resultado.valid).toBe(false);
      expect(resultado.available).toBe(300);
      expect(resultado.required).toBe(500);
      expect(resultado.difference).toBe(-200);
    });

    test('Debe manejar errores correctamente', async () => {
      // Silenciar console.error para esta prueba
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockPointsModel.getUserPoints.mockRejectedValue(new Error('Database error'));

      const resultado = await pointsService.validatePointsUsage(1, 500);

      expect(resultado.valid).toBe(false);
      expect(resultado.error).toBeDefined();

      // Restaurar console.error
      consoleErrorSpy.mockRestore();
    });
  });

  /**
   * ID: PU-04
   * Tipo: Unitaria
   * Objetivo: Verificar obtención del siguiente milestone
   * Requisito: Sistema debe indicar al usuario cuántos puntos necesita para el siguiente nivel
   */
  describe('PU-04: getNextMilestone', () => {
    test('Debe retornar milestone 500 para usuario con 100 puntos', () => {
      const milestone = pointsService.getNextMilestone(100);

      expect(milestone.points).toBe(500);
      expect(milestone.remaining).toBe(400);
      expect(milestone.reward).toBe('Nivel Plata + 50 puntos bonus');
    });

    test('Debe retornar milestone 1500 para usuario con 600 puntos', () => {
      const milestone = pointsService.getNextMilestone(600);

      expect(milestone.points).toBe(1500);
      expect(milestone.remaining).toBe(900);
      expect(milestone.reward).toBe('Nivel Oro + 100 puntos bonus');
    });

    test('Debe retornar null cuando se alcanzaron todos los milestones', () => {
      const milestone = pointsService.getNextMilestone(15000);

      expect(milestone).toBeNull();
    });
  });

  /**
   * ID: PU-05
   * Tipo: Unitaria
   * Objetivo: Verificar formateo de puntos para visualización
   * Requisito: Los puntos deben mostrarse en formato legible (K, M)
   */
  describe('PU-05: formatPoints', () => {
    test('Debe mostrar números menores a 1000 sin formato', () => {
      expect(pointsService.formatPoints(500)).toBe('500');
      expect(pointsService.formatPoints(999)).toBe('999');
    });

    test('Debe formatear miles con "K"', () => {
      expect(pointsService.formatPoints(1000)).toBe('1.0K');
      expect(pointsService.formatPoints(5500)).toBe('5.5K');
      expect(pointsService.formatPoints(99999)).toBe('100.0K');
    });

    test('Debe formatear millones con "M"', () => {
      expect(pointsService.formatPoints(1000000)).toBe('1.0M');
      expect(pointsService.formatPoints(2500000)).toBe('2.5M');
    });
  });

  /**
   * ID: PU-06
   * Tipo: Unitaria
   * Objetivo: Verificar categorización de actividades de puntos
   * Requisito: Sistema debe clasificar transacciones de puntos por tipo
   */
  describe('PU-06: categorizeActivities', () => {
    test('Debe categorizar correctamente transacciones de compra', () => {
      const history = [
        { concepto: 'Compra - Ticket #123', tipo: 'ganancia', puntos: 50 },
        { concepto: 'Compra de película', tipo: 'ganancia', puntos: 30 }
      ];

      const categorias = pointsService.categorizeActivities(history);

      expect(categorias.purchases.count).toBe(2);
      expect(categorias.purchases.points).toBe(80);
    });

    test('Debe categorizar correctamente referidos', () => {
      const history = [
        { concepto: 'Referido - Usuario nuevo', tipo: 'ganancia', puntos: 100 },
        { concepto: 'Bonus por referido', tipo: 'ganancia', puntos: 50 }
      ];

      const categorias = pointsService.categorizeActivities(history);

      expect(categorias.referrals.count).toBe(2);
      expect(categorias.referrals.points).toBe(150);
    });

    test('Debe categorizar correctamente milestones', () => {
      const history = [
        { concepto: 'Milestone alcanzado: 500 puntos', tipo: 'ganancia', puntos: 50 }
      ];

      const categorias = pointsService.categorizeActivities(history);

      expect(categorias.milestones.count).toBe(1);
      expect(categorias.milestones.points).toBe(50);
    });

    test('Debe manejar redenciones (uso de puntos)', () => {
      const history = [
        { concepto: 'Canje de puntos', tipo: 'uso', puntos: 200 }
      ];

      const categorias = pointsService.categorizeActivities(history);

      expect(categorias.redemptions.count).toBe(1);
      expect(categorias.redemptions.points).toBe(-200);
    });
  });

  /**
   * ID: PU-07
   * Tipo: Unitaria
   * Objetivo: Verificar validación de transacciones de puntos
   * Requisito: Sistema debe validar reglas de negocio antes de procesar puntos
   */
  describe('PU-07: validatePointsTransaction', () => {
    test('Debe rechazar cantidad de puntos <= 0', async () => {
      const resultado = await pointsService.validatePointsTransaction(1, 'add', 0, 'Test');

      expect(resultado.valid).toBe(false);
      expect(resultado.errors).toContain('La cantidad de puntos debe ser mayor a 0');
    });

    test('Debe rechazar cantidad > 10000', async () => {
      const resultado = await pointsService.validatePointsTransaction(1, 'add', 15000, 'Test');

      expect(resultado.valid).toBe(false);
      expect(resultado.errors).toContain('No se pueden procesar más de 10,000 puntos por transacción');
    });

    test('Debe rechazar razón inválida', async () => {
      const resultado = await pointsService.validatePointsTransaction(1, 'add', 100, 'AB');

      expect(resultado.valid).toBe(false);
      expect(resultado.errors).toContain('Se requiere una razón válida (mínimo 3 caracteres)');
    });

    test('Debe validar puntos disponibles para uso', async () => {
      mockPointsModel.getUserPoints.mockResolvedValue({
        puntos_actuales: 50
      });

      const resultado = await pointsService.validatePointsTransaction(1, 'use', 100, 'Canje');

      expect(resultado.valid).toBe(false);
      expect(resultado.errors).toContain('Puntos insuficientes');
    });

    test('Debe aceptar transacción válida', async () => {
      mockPointsModel.getUserPoints.mockResolvedValue({
        puntos_actuales: 500
      });
      mockPointsModel.getPointsHistory.mockResolvedValue([]);

      const resultado = await pointsService.validatePointsTransaction(1, 'use', 100, 'Canje válido');

      expect(resultado.valid).toBe(true);
      expect(resultado.errors).toHaveLength(0);
    });
  });
});
