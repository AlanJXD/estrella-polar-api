const { verifyAccessToken } = require('../config/jwt');
const { errorResponse } = require('../utils/response');
const prisma = require('../config/prisma');

/**
 * Middleware de autenticación JWT
 * Verifica el token y agrega el usuario al request
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'No se proporcionó token de autenticación');
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = verifyAccessToken(token);

    // Verificar que el usuario exista y esté activo
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        usuario: true,
        nombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        activo: true,
      },
    });

    if (!usuario || usuario.activo !== 1) {
      return errorResponse(res, 401, 'Usuario no autorizado o inactivo');
    }

    // Agregar usuario al request
    req.user = usuario;
    next();
  } catch (error) {
    return errorResponse(res, 401, 'Token inválido o expirado');
  }
};

module.exports = { authenticate };
