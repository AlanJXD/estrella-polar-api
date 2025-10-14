const prisma = require('../config/prisma');
const sesionService = require('../services/sesionService');
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
      const { editado, entregado, comentario, especificaciones } = req.body;

      const sesion = await prisma.sesion.update({
        where: { id: parseInt(id) },
        data: {
          editado: editado !== undefined ? editado : undefined,
          entregado: entregado !== undefined ? entregado : undefined,
          comentario,
          especificaciones,
        },
      });

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
        },
        orderBy: [{ fecha: 'asc' }, { horaInicial: 'asc' }],
        take: 20,
      });

      return successResponse(res, 200, 'Sesiones próximas obtenidas', sesiones);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SesionController();
