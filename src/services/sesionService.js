const prisma = require('../config/prisma');
const cajaService = require('./cajaService');
const distribucionService = require('./distribucionService');
const { validarHoras, validarMonto } = require('../utils/validators');

class SesionService {
  /**
   * Crea una sesión completa con anticipo, distribución y movimientos de caja
   * TODO SE EJECUTA EN UNA TRANSACCIÓN ATÓMICA
   * @param {Object} datos - Datos de la sesión
   * @param {Number} usuarioId - ID del usuario que crea la sesión
   */
  async crearSesionCompleta(datos, usuarioId) {
    const {
      fecha,
      horaInicial,
      horaFinal,
      nombreCliente,
      celularCliente,
      paqueteId,
      especificaciones,
      anticipo = 0,
      restante = 0,
      comentario,
      montoCaja = 0,
    } = datos;

    // Validaciones previas
    if (!validarHoras(horaInicial, horaFinal)) {
      throw new Error('La hora final debe ser mayor a la hora inicial');
    }

    if (!validarMonto(anticipo) || !validarMonto(montoCaja)) {
      throw new Error('Los montos deben ser válidos (>= 0, máximo 2 decimales)');
    }

    // Ejecutar todo en una transacción optimizada
    return await prisma.$transaction(async (tx) => {
      // 1. Verificar que el paquete existe y está activo
      const paquete = await tx.paquete.findUnique({
        where: { id: paqueteId },
        select: {
          id: true,
          activo: true,
          porcentajeItzel: true,
          porcentajeCristian: true,
          porcentajeCesar: true,
        },
      });

      if (!paquete || paquete.activo !== 1) {
        throw new Error('Paquete no encontrado o inactivo');
      }

      // 2. Obtener IDs de cajas si se necesitan (en paralelo)
      let cajaBBVAId = null;
      let cajaAhorroId = null;

      if (Number(anticipo) > 0 || Number(montoCaja) > 0) {
        const cajas = await tx.caja.findMany({
          where: {
            activo: 1,
            tipoCaja: {
              nombre: { in: ['BBVA', 'Caja'] },
              activo: 1,
            },
          },
          select: {
            id: true,
            tipoCaja: {
              select: { nombre: true },
            },
          },
        });

        cajaBBVAId = cajas.find((c) => c.tipoCaja.nombre === 'BBVA')?.id;
        cajaAhorroId = cajas.find((c) => c.tipoCaja.nombre === 'Caja')?.id;
      }

      // 3. Crear la sesión
      const sesion = await tx.sesion.create({
        data: {
          fecha: new Date(fecha),
          horaInicial: new Date(`1970-01-01T${horaInicial}:00Z`),
          horaFinal: new Date(`1970-01-01T${horaFinal}:00Z`),
          nombreCliente,
          celularCliente,
          paqueteId,
          especificaciones,
          anticipo,
          restante,
          comentario,
          montoCaja,
          usuarioId,
          activo: 1,
        },
      });

      // 4. Si hay anticipo, crear movimiento en caja BBVA (AUTOMÁTICO)
      if (Number(anticipo) > 0) {
        if (!cajaBBVAId) {
          throw new Error('Caja BBVA no encontrada');
        }

        await cajaService.crearMovimiento(tx, {
          cajaId: cajaBBVAId,
          tipoMovimientoId: 1, // 1 = Ingreso
          concepto: `Anticipo de sesión - ${nombreCliente}`,
          monto: anticipo,
          usuarioId,
          sesionId: sesion.id,
        });
      }

      // 5. Si hay monto para caja (ahorro), crear movimiento
      if (Number(montoCaja) > 0) {
        if (!cajaAhorroId) {
          throw new Error('Caja de ahorro no encontrada');
        }

        await cajaService.crearMovimiento(tx, {
          cajaId: cajaAhorroId,
          tipoMovimientoId: 1, // 1 = Ingreso
          concepto: `Ahorro de sesión - ${nombreCliente}`,
          monto: montoCaja,
          usuarioId,
          sesionId: sesion.id,
        });
      }

      // 6. Crear distribución inicial con porcentajes del paquete
      await distribucionService.crearOActualizarDistribucion(tx, sesion.id, {
        itzel: Number(paquete.porcentajeItzel),
        cristian: Number(paquete.porcentajeCristian),
        cesar: Number(paquete.porcentajeCesar),
      });

      // 7. Obtener sesión completa creada
      return await tx.sesion.findUnique({
        where: { id: sesion.id },
        include: {
          paquete: true,
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellidoPaterno: true,
            },
          },
          distribucion: true,
        },
      });
    });
  }

  /**
   * Agrega una liquidación a una sesión
   * @param {Number} sesionId - ID de la sesión
   * @param {Object} datos - { monto, cajaDestinoNombre }
   * @param {Number} usuarioId - ID del usuario que registra la liquidación
   */
  async agregarLiquidacion(sesionId, datos, usuarioId) {
    const { monto, cajaDestinoNombre } = datos;

    // Validaciones
    if (!validarMonto(monto) || Number(monto) <= 0) {
      throw new Error('El monto debe ser mayor a 0 y válido');
    }

    if (!['BBVA', 'Efectivo'].includes(cajaDestinoNombre)) {
      throw new Error('La caja destino debe ser BBVA o Efectivo');
    }

    return await prisma.$transaction(async (tx) => {
      // Obtener sesión y caja destino en paralelo
      const [sesion, cajaDestino] = await Promise.all([
        tx.sesion.findUnique({
          where: { id: sesionId },
          select: {
            id: true,
            nombreCliente: true,
            activo: true,
          },
        }),
        tx.caja.findFirst({
          where: {
            activo: 1,
            tipoCaja: {
              nombre: cajaDestinoNombre,
              activo: 1,
            },
          },
          select: { id: true },
        }),
      ]);

      if (!sesion || sesion.activo !== 1) {
        throw new Error('Sesión no encontrada o inactiva');
      }

      if (!cajaDestino) {
        throw new Error(`Caja ${cajaDestinoNombre} no encontrada`);
      }

      // Crear liquidación
      const liquidacion = await tx.liquidacion.create({
        data: {
          sesionId,
          monto,
          cajaDestinoId: cajaDestino.id,
          activo: 1,
        },
      });

      // Crear movimiento en la caja destino
      await cajaService.crearMovimiento(tx, {
        cajaId: cajaDestino.id,
        tipoMovimientoId: 1, // 1 = Ingreso
        concepto: `Liquidación de sesión - ${sesion.nombreCliente}`,
        monto,
        usuarioId,
        sesionId,
      });

      // Recalcular distribución
      const distribucion = await tx.distribucionSesion.findUnique({
        where: { sesionId },
        select: {
          porcentajeItzel: true,
          porcentajeCristian: true,
          porcentajeCesar: true,
        },
      });

      if (distribucion) {
        await distribucionService.crearOActualizarDistribucion(tx, sesionId, {
          itzel: Number(distribucion.porcentajeItzel),
          cristian: Number(distribucion.porcentajeCristian),
          cesar: Number(distribucion.porcentajeCesar),
        });
      }

      return liquidacion;
    });
  }

  /**
   * Agrega un ingreso extra a una sesión
   */
  async agregarIngresoExtra(sesionId, datos, usuarioId) {
    const { concepto, monto } = datos;

    if (!validarMonto(monto) || Number(monto) <= 0) {
      throw new Error('El monto debe ser mayor a 0 y válido');
    }

    return await prisma.$transaction(async (tx) => {
      // Crear ingreso extra
      const ingreso = await tx.ingresoExtra.create({
        data: {
          sesionId,
          concepto,
          monto,
          activo: 1,
        },
      });

      // Recalcular distribución
      const distribucion = await tx.distribucionSesion.findUnique({
        where: { sesionId },
      });

      if (distribucion) {
        await distribucionService.crearOActualizarDistribucion(tx, sesionId, {
          itzel: Number(distribucion.porcentajeItzel),
          cristian: Number(distribucion.porcentajeCristian),
          cesar: Number(distribucion.porcentajeCesar),
        });
      }

      return ingreso;
    });
  }

  /**
   * Agrega un gasto a una sesión
   */
  async agregarGasto(sesionId, datos, usuarioId) {
    const { concepto, monto } = datos;

    if (!validarMonto(monto) || Number(monto) <= 0) {
      throw new Error('El monto debe ser mayor a 0 y válido');
    }

    return await prisma.$transaction(async (tx) => {
      // Crear gasto
      const gasto = await tx.gasto.create({
        data: {
          sesionId,
          concepto,
          monto,
          activo: 1,
        },
      });

      // Recalcular distribución
      const distribucion = await tx.distribucionSesion.findUnique({
        where: { sesionId },
      });

      if (distribucion) {
        await distribucionService.crearOActualizarDistribucion(tx, sesionId, {
          itzel: Number(distribucion.porcentajeItzel),
          cristian: Number(distribucion.porcentajeCristian),
          cesar: Number(distribucion.porcentajeCesar),
        });
      }

      return gasto;
    });
  }

  /**
   * Obtiene el detalle completo de una sesión
   */
  async obtenerDetalleCompleto(sesionId) {
    const sesion = await prisma.sesion.findUnique({
      where: { id: sesionId },
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
        distribucion: true,
      },
    });

    if (!sesion || sesion.activo !== 1) {
      throw new Error('Sesión no encontrada o inactiva');
    }

    return sesion;
  }
}

module.exports = new SesionService();
