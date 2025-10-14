const prisma = require('../config/prisma');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');
const { successResponse, errorResponse } = require('../utils/response');

class AuthController {
  /**
   * POST /api/auth/register
   * Registra un nuevo usuario
   */
  async register(req, res, next) {
    try {
      const {
        usuario,
        password,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        celular,
        correo,
      } = req.body;

      // Hashear contraseña
      const passwordHash = await hashPassword(password);

      // Crear usuario
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          usuario,
          passwordHash,
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          celular,
          correo,
          activo: 1,
        },
        select: {
          id: true,
          usuario: true,
          nombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          correo: true,
          celular: true,
        },
      });

      // Generar tokens
      const accessToken = generateAccessToken({ id: nuevoUsuario.id, usuario: nuevoUsuario.usuario });
      const refreshToken = generateRefreshToken({ id: nuevoUsuario.id });

      return successResponse(res, 201, 'Usuario registrado exitosamente', {
        usuario: nuevoUsuario,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Inicia sesión
   */
  async login(req, res, next) {
    try {
      const { usuario, password } = req.body;

      // Buscar usuario
      const usuarioEncontrado = await prisma.usuario.findUnique({
        where: { usuario },
      });

      if (!usuarioEncontrado || usuarioEncontrado.activo !== 1) {
        return errorResponse(res, 401, 'Credenciales inválidas');
      }

      // Verificar contraseña
      const passwordValida = await comparePassword(password, usuarioEncontrado.passwordHash);

      if (!passwordValida) {
        return errorResponse(res, 401, 'Credenciales inválidas');
      }

      // Generar tokens
      const accessToken = generateAccessToken({
        id: usuarioEncontrado.id,
        usuario: usuarioEncontrado.usuario,
      });
      const refreshToken = generateRefreshToken({ id: usuarioEncontrado.id });

      // Datos del usuario (sin password)
      const { passwordHash, ...usuarioSinPassword } = usuarioEncontrado;

      return successResponse(res, 200, 'Inicio de sesión exitoso', {
        usuario: usuarioSinPassword,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Obtiene el usuario actual autenticado
   */
  async me(req, res, next) {
    try {
      return successResponse(res, 200, 'Usuario autenticado', req.user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
