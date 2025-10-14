const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * Middleware para validar los resultados de express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    return errorResponse(res, 400, 'Errores de validación', formattedErrors);
  }

  next();
};

module.exports = { validate };
