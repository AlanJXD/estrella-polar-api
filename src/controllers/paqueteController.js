const prisma = require('../config/prisma');
const { successResponse } = require('../utils/response');
const { validarPorcentajes } = require('../utils/validators');

class PaqueteController {
  /**
   * GET /api/paquetes
   * Obtiene todos los paquetes activos
   */
  async getAll(req, res, next) {
    try {
      const paquetes = await prisma.paquete.findMany({
        where: { activo: 1 },
        orderBy: { nombre: 'asc' },
      });

      return successResponse(res, 200, 'Paquetes obtenidos', paquetes);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/paquetes/:id
   * Obtiene un paquete por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const paquete = await prisma.paquete.findUnique({
        where: { id: parseInt(id) },
      });

      if (!paquete || paquete.activo !== 1) {
        return errorResponse(res, 404, 'Paquete no encontrado');
      }

      return successResponse(res, 200, 'Paquete obtenido', paquete);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/paquetes
   * Crea un nuevo paquete
   */
  async create(req, res, next) {
    try {
      const {
        nombre,
        descripcion,
        precio,
        porcentajeItzel,
        porcentajeCristian,
        porcentajeCesar,
      } = req.body;

      // Validar porcentajes
      if (!validarPorcentajes(porcentajeItzel, porcentajeCristian, porcentajeCesar)) {
        throw new Error('Los porcentajes deben sumar 100%');
      }

      const paquete = await prisma.paquete.create({
        data: {
          nombre,
          descripcion,
          precio,
          porcentajeItzel,
          porcentajeCristian,
          porcentajeCesar,
          activo: 1,
        },
      });

      return successResponse(res, 201, 'Paquete creado exitosamente', paquete);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/paquetes/:id
   * Actualiza un paquete
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const {
        nombre,
        descripcion,
        precio,
        porcentajeItzel,
        porcentajeCristian,
        porcentajeCesar,
      } = req.body;

      // Si se envían porcentajes, validar
      if (porcentajeItzel && porcentajeCristian && porcentajeCesar) {
        if (!validarPorcentajes(porcentajeItzel, porcentajeCristian, porcentajeCesar)) {
          throw new Error('Los porcentajes deben sumar 100%');
        }
      }

      const paquete = await prisma.paquete.update({
        where: { id: parseInt(id) },
        data: {
          nombre,
          descripcion,
          precio,
          porcentajeItzel,
          porcentajeCristian,
          porcentajeCesar,
        },
      });

      return successResponse(res, 200, 'Paquete actualizado', paquete);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/paquetes/:id
   * Elimina un paquete (soft delete)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.paquete.update({
        where: { id: parseInt(id) },
        data: { activo: 0 },
      });

      return successResponse(res, 200, 'Paquete eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaqueteController();
