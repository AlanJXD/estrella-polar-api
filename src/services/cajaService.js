const prisma = require('../config/prisma');
const {
  validarMonto,
  validarSaldoSuficiente,
  redondearDosDecimales,
} = require('../utils/validators');

class CajaService {
  /**
   * Obtiene todas las cajas activas con sus saldos
   */
  async obtenerCajas() {
    return await prisma.caja.findMany({
      where: { activo: 1 },
      include: {
        tipoCaja: true,
      },
    });
  }

  /**
   * Obtiene una caja por su tipo (Caja, BBVA, Efectivo)
   * @param {String} nombreTipo - Nombre del tipo de caja
   */
  async obtenerCajaPorTipo(nombreTipo) {
    return await prisma.caja.findFirst({
      where: {
        activo: 1,
        tipoCaja: {
          nombre: nombreTipo,
          activo: 1,
        },
      },
      include: {
        tipoCaja: true,
      },
    });
  }

  /**
   * Crea un movimiento de caja (ingreso o retiro) de forma segura
   * IMPORTANTE: Este método debe ejecutarse dentro de una transacción
   * @param {Object} tx - Instancia de transacción de Prisma
   * @param {Object} datos - { cajaId, tipoMovimientoId, concepto, monto, usuarioId, sesionId? }
   * @returns {Promise<Object>} Movimiento creado
   */
  async crearMovimiento(tx, datos) {
    const { cajaId, tipoMovimientoId, concepto, monto, usuarioId, sesionId = null } = datos;

    // Validaciones estrictas
    if (!validarMonto(monto)) {
      throw new Error('El monto debe ser mayor o igual a 0 y tener máximo 2 decimales');
    }

    if (monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    // Obtener caja actual - query simple y rápida
    const caja = await tx.caja.findUnique({
      where: { id: cajaId },
      select: {
        id: true,
        saldoActual: true,
        activo: true,
      },
    });

    if (!caja || caja.activo !== 1) {
      throw new Error('Caja no encontrada o inactiva');
    }

    const saldoAnterior = Number(caja.saldoActual);
    const montoOperacion = redondearDosDecimales(Number(monto));
    let saldoNuevo;

    // Calcular nuevo saldo según tipo de movimiento
    // tipoMovimientoId: 1 = Ingreso, 2 = Retiro
    if (tipoMovimientoId === 1) {
      saldoNuevo = redondearDosDecimales(saldoAnterior + montoOperacion);
    } else if (tipoMovimientoId === 2) {
      // Validar saldo suficiente para retiros
      if (!validarSaldoSuficiente(saldoAnterior, montoOperacion)) {
        throw new Error(
          `Saldo insuficiente. Saldo actual: $${saldoAnterior}, Monto a retirar: $${montoOperacion}`
        );
      }
      saldoNuevo = redondearDosDecimales(saldoAnterior - montoOperacion);
    } else {
      throw new Error('Tipo de movimiento inválido');
    }

    // Crear movimiento - sin includes para máxima velocidad
    const movimiento = await tx.movimientoCaja.create({
      data: {
        cajaId,
        tipoMovimientoId,
        concepto,
        monto: montoOperacion,
        saldoAnterior,
        saldoNuevo,
        usuarioId,
        sesionId,
        activo: 1,
      },
    });

    // Actualizar saldo de la caja
    await tx.caja.update({
      where: { id: cajaId },
      data: { saldoActual: saldoNuevo },
    });

    return movimiento;
  }

  /**
   * Obtiene el historial de movimientos de una caja
   * @param {Number} cajaId - ID de la caja
   * @param {Object} filtros - { limit, offset }
   */
  async obtenerHistorial(cajaId, filtros = {}) {
    const { limit = 50, offset = 0 } = filtros;

    const [movimientos, total] = await Promise.all([
      prisma.movimientoCaja.findMany({
        where: {
          cajaId,
          activo: 1,
        },
        include: {
          tipoMovimiento: true,
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true,
            },
          },
          sesion: {
            select: {
              id: true,
              nombreCliente: true,
              fecha: true,
            },
          },
        },
        orderBy: {
          fechaRegistro: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.movimientoCaja.count({
        where: {
          cajaId,
          activo: 1,
        },
      }),
    ]);

    return {
      movimientos,
      total,
      limit,
      offset,
    };
  }
}

module.exports = new CajaService();
