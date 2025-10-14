const { errorResponse } = require('../utils/response');

/**
 * Middleware global de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de Prisma - Registro no encontrado
  if (err.code === 'P2025') {
    return errorResponse(res, 404, 'Registro no encontrado');
  }

  // Error de Prisma - Violación de restricción única
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'campo';
    return errorResponse(res, 409, `El ${field} ya está en uso`);
  }

  // Error de Prisma - Violación de llave foránea
  if (err.code === 'P2003') {
    return errorResponse(res, 400, 'Referencia inválida a registro relacionado');
  }

  // Error de validación personalizado
  if (err.name === 'ValidationError') {
    return errorResponse(res, 400, err.message);
  }

  // Error de autenticación
  if (err.name === 'UnauthorizedError') {
    return errorResponse(res, 401, 'No autorizado');
  }

  // Error genérico
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  return errorResponse(res, statusCode, message);
};

/**
 * Middleware para rutas no encontradas
 */
const notFound = (req, res) => {
  return errorResponse(res, 404, 'Ruta no encontrada');
};

module.exports = {
  errorHandler,
  notFound,
};
