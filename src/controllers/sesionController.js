const prisma = require('../config/prisma');
const sesionService = require('../services/sesionService');
const distribucionService = require('../services/distribucionService');
const { successResponse, errorResponse } = require('../utils/response');

class SesionController {
  /**
   * GET /api/sesiones
   * Obtiene todas las sesiones activas
   */
  async getAll(req, res, next) {
    try {
      const { limit = 50, offset = 0, fecha, nombreCliente } = req.query;

      const where = { activo: 1 };

      if (fecha) {
        where.fecha = new Date(fecha);
      }

      if (nombreCliente) {
        where.nombreCliente = {
          contains: nombreCliente,
        };
      }

      const [sesiones, total] = await Promise.all([
        prisma.sesion.findMany({
          where,
          include: {
            paquete: true,
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
              },
            },
            liquidaciones: {
              where: { activo: 1 },
              select: {
                id: true,
                monto: true,
              },
            },
          },
          orderBy: [{ fecha: 'desc' }, { horaInicial: 'desc' }],
          take: parseInt(limit),
          skip: parseInt(offset),
        }),
        prisma.sesion.count({ where }),
      ]);

      return successResponse(res, 200, 'Sesiones obtenidas', {
        sesiones,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sesiones/:id
   * Obtiene una sesión por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const sesion = await sesionService.obtenerDetalleCompleto(parseInt(id));

      return successResponse(res, 200, 'Sesión obtenida', sesion);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sesiones
   * Crea una nueva sesión
   */
  async create(req, res, next) {
    try {
      const usuarioId = req.user.id;
      const sesion = await sesionService.crearSesionCompleta(req.body, usuarioId);

      return successResponse(res, 201, 'Sesión creada exitosamente', sesion);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/sesiones/:id
   * Actualiza una sesión
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const {
        editado,
        entregado,
        comentario,
        especificaciones,
        montoCaja,
        nombreCliente,
        celularCliente,
        fecha,
        horaInicial,
        horaFinal,
        anticipo,
        restante
      } = req.body;

      const data = {
        editado: editado !== undefined ? editado : undefined,
        entregado: entregado !== undefined ? entregado : undefined,
        comentario,
        especificaciones,
      };

      // Campos generales de la sesión
      if (nombreCliente !== undefined) data.nombreCliente = nombreCliente;
      if (celularCliente !== undefined) data.celularCliente = celularCliente;
      if (fecha !== undefined) data.fecha = new Date(fecha);

      // Convertir horas a formato DateTime
      if (horaInicial !== undefined) {
        const [hours, minutes] = horaInicial.split(':');
        const horaDate = new Date(1970, 0, 1, parseInt(hours), parseInt(minutes), 0);
        data.horaInicial = horaDate;
      }
      if (horaFinal !== undefined) {
        const [hours, minutes] = horaFinal.split(':');
        const horaDate = new Date(1970, 0, 1, parseInt(hours), parseInt(minutes), 0);
        data.horaFinal = horaDate;
      }

      // Si se actualiza el anticipo, recalcular el restante automáticamente
      if (anticipo !== undefined) {
        data.anticipo = Number(anticipo);

        // Obtener el paquete para calcular el restante
        const sesionActual = await prisma.sesion.findUnique({
          where: { id: parseInt(id) },
          include: { paquete: true },
        });

        if (sesionActual) {
          data.restante = Number(sesionActual.paquete.precio) - Number(anticipo);
        }
      }

      // Permitir actualizar restante manualmente solo si no se actualiza el anticipo
      if (restante !== undefined && anticipo === undefined) {
        data.restante = Number(restante);
      }

      // Solo actualizar montoCaja si se proporciona
      if (montoCaja !== undefined) {
        data.montoCaja = Number(montoCaja);
      }

      const sesion = await prisma.sesion.update({
        where: { id: parseInt(id) },
        data,
      });

      // Si se actualizó montoCaja, recalcular distribución
      if (montoCaja !== undefined) {
        // Obtener el paquete para los porcentajes por defecto
        const sesionConPaquete = await prisma.sesion.findUnique({
          where: { id: parseInt(id) },
          include: { paquete: true, distribucion: true },
        });

        if (sesionConPaquete) {
          const porcentajes = sesionConPaquete.distribucion
            ? {
                itzel: Number(sesionConPaquete.distribucion.porcentajeItzel),
                cristian: Number(sesionConPaquete.distribucion.porcentajeCristian),
                cesar: Number(sesionConPaquete.distribucion.porcentajeCesar),
              }
            : {
                itzel: Number(sesionConPaquete.paquete.porcentajeItzel),
                cristian: Number(sesionConPaquete.paquete.porcentajeCristian),
                cesar: Number(sesionConPaquete.paquete.porcentajeCesar),
              };

          await prisma.$transaction(async (tx) => {
            await distribucionService.crearOActualizarDistribucion(tx, parseInt(id), porcentajes);
          });
        }
      }

      return successResponse(res, 200, 'Sesión actualizada', sesion);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/sesiones/:id
   * Elimina una sesión (soft delete)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.sesion.update({
        where: { id: parseInt(id) },
        data: { activo: 0 },
      });

      return successResponse(res, 200, 'Sesión eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sesiones/:id/liquidaciones
   * Agrega una liquidación a una sesión
   */
  async agregarLiquidacion(req, res, next) {
    try {
      const { id } = req.params;
      const usuarioId = req.user.id;

      const liquidacion = await sesionService.agregarLiquidacion(
        parseInt(id),
        req.body,
        usuarioId
      );

      return successResponse(res, 201, 'Liquidación agregada', liquidacion);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sesiones/:id/ingresos-extra
   * Agrega un ingreso extra a una sesión
   */
  async agregarIngresoExtra(req, res, next) {
    try {
      const { id } = req.params;
      const usuarioId = req.user.id;

      const ingreso = await sesionService.agregarIngresoExtra(parseInt(id), req.body, usuarioId);

      return successResponse(res, 201, 'Ingreso extra agregado', ingreso);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/sesiones/:id/gastos
   * Agrega un gasto a una sesión
   */
  async agregarGasto(req, res, next) {
    try {
      const { id } = req.params;
      const usuarioId = req.user.id;

      const gasto = await sesionService.agregarGasto(parseInt(id), req.body, usuarioId);

      return successResponse(res, 201, 'Gasto agregado', gasto);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sesiones/proximas
   * Obtiene las sesiones próximas
   */
  async getProximas(req, res, next) {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const sesiones = await prisma.sesion.findMany({
        where: {
          activo: 1,
          fecha: {
            gte: hoy,
          },
        },
        include: {
          paquete: true,
          liquidaciones: {
            where: { activo: 1 },
            select: {
              id: true,
              monto: true,
            },
          },
        },
        orderBy: [{ fecha: 'asc' }, { horaInicial: 'asc' }],
        take: 20,
      });

      return successResponse(res, 200, 'Sesiones próximas obtenidas', sesiones);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/sesiones/:id/distribucion
   * Actualiza los porcentajes de distribución de una sesión
   */
  async actualizarDistribucion(req, res, next) {
    try {
      const { id } = req.params;
      const { porcentajeItzel, porcentajeCristian, porcentajeCesar } = req.body;

      // Validar que se proporcionen los porcentajes
      if (
        porcentajeItzel === undefined ||
        porcentajeCristian === undefined ||
        porcentajeCesar === undefined
      ) {
        return errorResponse(res, 400, 'Deben proporcionarse los tres porcentajes');
      }

      // Validar que los porcentajes sumen 100
      const suma = Number(porcentajeItzel) + Number(porcentajeCristian) + Number(porcentajeCesar);
      if (Math.abs(suma - 100) > 0.01) {
        return errorResponse(res, 400, 'Los porcentajes deben sumar 100%');
      }

      // Actualizar distribución usando el servicio
      const distribucion = await prisma.$transaction(async (tx) => {
        return await distribucionService.crearOActualizarDistribucion(tx, parseInt(id), {
          itzel: Number(porcentajeItzel),
          cristian: Number(porcentajeCristian),
          cesar: Number(porcentajeCesar),
        });
      });

      return successResponse(res, 200, 'Distribución actualizada exitosamente', distribucion);
    } catch (error) {
      next(error);
    }
  }

  async getReporteDistribucion(req, res, next) {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return errorResponse(res, 400, 'Se requieren fechas de inicio y fin');
      }

      const sesiones = await prisma.sesion.findMany({
        where: {
          activo: 1,
          fecha: {
            gte: new Date(fechaInicio),
            lte: new Date(fechaFin),
          },
        },
        include: {
          distribucion: true,
        },
      });

      const reporte = {
        totalNeto: 0,
        totalAnticipos: 0,
        totalLiquidaciones: 0,
        totalCajas: 0,
        totalGastos: 0,
        totalIngresos: 0,
        distribucion: {
          itzel: 0,
          cristian: 0,
          cesar: 0,
        },
        sesiones: sesiones,
      };

      for (const sesion of sesiones) {
        reporte.totalAnticipos += Number(sesion.anticipo);
        reporte.totalCajas += Number(sesion.montoCaja);

        if (sesion.distribucion) {
          reporte.totalNeto += Number(sesion.distribucion.neto);
          reporte.totalGastos += Number(sesion.distribucion.gastosTotales);
          reporte.totalIngresos += Number(sesion.distribucion.ingresosTotales);
          reporte.distribucion.itzel += Number(sesion.distribucion.montoItzel);
          reporte.distribucion.cristian += Number(sesion.distribucion.montoCristian);
          reporte.distribucion.cesar += Number(sesion.distribucion.montoCesar);
        }
      }

      return successResponse(res, 200, 'Reporte de distribución obtenido', reporte);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SesionController();
 
