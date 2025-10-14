const prisma = require('../config/prisma');
const { hashPassword } = require('../utils/bcrypt');
const { successResponse, errorResponse } = require('../utils/response');

class UsuarioController {
  /**
   * GET /api/usuarios
   * Obtiene todos los usuarios activos
   */
  async getAll(req, res, next) {
    try {
      const usuarios = await prisma.usuario.findMany({
        where: { activo: 1 },
        select: {
          id: true,
          usuario: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          celular: true,
          correo: true,
          activo: true,
          fechaRegistro: true,
        },
        orderBy: { nombre: 'asc' },
      });

      return successResponse(res, 200, 'Usuarios obtenidos', usuarios);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/usuarios/:id
   * Obtiene un usuario por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          usuario: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          celular: true,
          correo: true,
          activo: true,
          fechaRegistro: true,
        },
      });

      if (!usuario || usuario.activo !== 1) {
        return errorResponse(res, 404, 'Usuario no encontrado');
      }

      return successResponse(res, 200, 'Usuario obtenido', usuario);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/usuarios/:id
   * Actualiza un usuario
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, apellidoPaterno, apellidoMaterno, celular, correo, password } = req.body;

      const data = {
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        celular,
        correo,
      };

      // Si se envía una nueva contraseña, hashearla
      if (password) {
        data.passwordHash = await hashPassword(password);
      }

      const usuario = await prisma.usuario.update({
        where: { id: parseInt(id) },
        data,
        select: {
          id: true,
          usuario: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          celular: true,
          correo: true,
        },
      });

      return successResponse(res, 200, 'Usuario actualizado', usuario);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/usuarios/:id
   * Elimina un usuario (soft delete)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // No permitir que un usuario se elimine a sí mismo
      if (parseInt(id) === req.user.id) {
        return errorResponse(res, 400, 'No puedes eliminar tu propio usuario');
      }

      await prisma.usuario.update({
        where: { id: parseInt(id) },
        data: { activo: 0 },
      });

      return successResponse(res, 200, 'Usuario eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsuarioController();
