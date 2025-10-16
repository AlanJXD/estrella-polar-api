const prisma = require('../config/prisma');
const cajaService = require('../services/cajaService');
const { successResponse } = require('../utils/response');

class CajaController {
  /**
   * GET /api/cajas
   * Obtiene todas las cajas con sus saldos
   */
  async getAll(req, res, next) {
    try {
      const cajas = await cajaService.obtenerCajas();
      return successResponse(res, 200, 'Cajas obtenidas', cajas);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/cajas/:id/movimientos
   * Obtiene el historial de movimientos de una caja
   */
  async getMovimientos(req, res, next) {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;

      const historial = await cajaService.obtenerHistorial(parseInt(id), {
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      });

      return successResponse(res, 200, 'Historial de movimientos obtenido', historial);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/cajas/movimiento
   * Crea un movimiento manual en una caja (ingreso o retiro)
   */
  async crearMovimiento(req, res, next) {
    try {
      const { cajaNombre, tipoMovimiento, concepto, monto } = req.body;
      const usuarioId = req.user.id;

      const movimiento = await prisma.$transaction(async (tx) => {
        // Obtener caja
        const caja = await cajaService.obtenerCajaPorTipo(cajaNombre);

        if (!caja) {
          throw new Error(`Caja ${cajaNombre} no encontrada`);
        }

        // Obtener tipo de movimiento por nombre
        const tipo = await tx.tipoMovimiento.findFirst({
          where: { nombre: tipoMovimiento },
        });

        if (!tipo) {
          throw new Error('Tipo de movimiento inválido');
        }

        // Crear movimiento
        return await cajaService.crearMovimiento(tx, {
          cajaId: caja.id,
          tipoMovimientoId: tipo.id,
          concepto,
          monto,
          usuarioId,
        });
      });

      return successResponse(res, 201, 'Movimiento registrado exitosamente', movimiento);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CajaController();
