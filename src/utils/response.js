/**
 * Formato estándar de respuesta exitosa
 * @param {Object} res - Response object de Express
 * @param {Number} statusCode - Código HTTP
 * @param {String} message - Mensaje descriptivo
 * @param {*} data - Datos a retornar
 */
const successResponse = (res, statusCode = 200, message = 'Operación exitosa', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Formato estándar de respuesta de error
 * @param {Object} res - Response object de Express
 * @param {Number} statusCode - Código HTTP
 * @param {String} message - Mensaje de error
 * @param {*} errors - Detalles del error (opcional)
 */
const errorResponse = (res, statusCode = 500, message = 'Error en el servidor', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
