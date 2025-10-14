const prisma = require('../config/prisma');
const {
  validarPorcentajes,
  calcularDistribucion,
  redondearDosDecimales,
} = require('../utils/validators');

class DistribucionService {
  /**
   * Calcula los totales de una sesión (ingresos y gastos)
   * @param {Number} sesionId - ID de la sesión
   * @param {Object} tx - Instancia de transacción (opcional)
   */
  async calcularTotalesSesion(sesionId, tx = prisma) {
    // Obtener sesión
    const sesion = await tx.sesion.findUnique({
      where: { id: sesionId },
      include: {
        ingresosExtra: {
          where: { activo: 1 },
        },
        gastos: {
          where: { activo: 1 },
        },
        liquidaciones: {
          where: { activo: 1 },
        },
      },
    });

    if (!sesion) {
      throw new Error('Sesión no encontrada');
    }

    // Calcular ingresos totales
    const anticipo = Number(sesion.anticipo) || 0;
    const liquidaciones = sesion.liquidaciones.reduce(
      (sum, liq) => sum + Number(liq.monto),
      0
    );
    const ingresosExtra = sesion.ingresosExtra.reduce(
      (sum, ing) => sum + Number(ing.monto),
      0
    );
    const ingresosTotales = redondearDosDecimales(anticipo + liquidaciones + ingresosExtra);

    // Calcular gastos totales
    const gastosTotales = redondearDosDecimales(
      sesion.gastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0)
    );

    // Calcular monto destinado a caja (ahorro)
    const montoCaja = Number(sesion.montoCaja) || 0;

    // Calcular neto (ingresos - gastos - montoCaja)
    const neto = redondearDosDecimales(ingresosTotales - gastosTotales - montoCaja);

    return {
      ingresosTotales,
      gastosTotales,
      montoCaja,
      neto,
    };
  }

  /**
   * Crea o actualiza la distribución de una sesión
   * @param {Object} tx - Instancia de transacción de Prisma
   * @param {Number} sesionId - ID de la sesión
   * @param {Object} porcentajes - { itzel, cristian, cesar }
   */
  async crearOActualizarDistribucion(tx, sesionId, porcentajes) {
    const { itzel, cristian, cesar } = porcentajes;

    // Validar porcentajes
    if (!validarPorcentajes(itzel, cristian, cesar)) {
      throw new Error('Los porcentajes deben sumar 100%');
    }

    // Calcular totales
    const { ingresosTotales, gastosTotales, montoCaja, neto } = await this.calcularTotalesSesion(
      sesionId,
      tx
    );

    // Calcular distribución de montos
    const { monto1, monto2, monto3 } = calcularDistribucion(neto, itzel, cristian, cesar);

    // Verificar si ya existe distribución
    const distribucionExistente = await tx.distribucionSesion.findUnique({
      where: { sesionId },
    });

    if (distribucionExistente) {
      // Actualizar distribución existente
      return await tx.distribucionSesion.update({
        where: { sesionId },
        data: {
          porcentajeItzel: itzel,
          porcentajeCristian: cristian,
          porcentajeCesar: cesar,
          montoItzel: monto1,
          montoCristian: monto2,
          montoCesar: monto3,
          ingresosTotales,
          gastosTotales,
          neto,
        },
      });
    } else {
      // Crear nueva distribución
      return await tx.distribucionSesion.create({
        data: {
          sesionId,
          porcentajeItzel: itzel,
          porcentajeCristian: cristian,
          porcentajeCesar: cesar,
          montoItzel: monto1,
          montoCristian: monto2,
          montoCesar: monto3,
          ingresosTotales,
          gastosTotales,
          neto,
          activo: 1,
        },
      });
    }
  }

  /**
   * Obtiene la distribución completa de una sesión
   * @param {Number} sesionId - ID de la sesión
   */
  async obtenerDistribucionCompleta(sesionId) {
    const distribucion = await prisma.distribucionSesion.findUnique({
      where: { sesionId },
      include: {
        sesion: {
          include: {
            paquete: true,
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
              },
            },
            ingresosExtra: {
              where: { activo: 1 },
            },
            gastos: {
              where: { activo: 1 },
            },
            liquidaciones: {
              where: { activo: 1 },
              include: {
                cajaDestino: {
                  include: { tipoCaja: true },
                },
              },
            },
          },
        },
      },
    });

    if (!distribucion) {
      throw new Error('Distribución no encontrada para esta sesión');
    }

    return distribucion;
  }
}

module.exports = new DistribucionService();
