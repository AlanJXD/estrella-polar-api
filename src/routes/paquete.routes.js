const express = require('express');
const { body } = require('express-validator');
const paqueteController = require('../controllers/paqueteController');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validator.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/paquetes
 * Obtiene todos los paquetes
 */
router.get('/', paqueteController.getAll);

/**
 * GET /api/paquetes/:id
 * Obtiene un paquete por ID
 */
router.get('/:id', paqueteController.getById);

/**
 * POST /api/paquetes
 * Crea un nuevo paquete
 */
router.post(
  '/',
  [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0'),
    body('porcentajeItzel')
      .isFloat({ min: 0, max: 100 })
      .withMessage('El porcentaje debe estar entre 0 y 100'),
    body('porcentajeCristian')
      .isFloat({ min: 0, max: 100 })
      .withMessage('El porcentaje debe estar entre 0 y 100'),
    body('porcentajeCesar')
      .isFloat({ min: 0, max: 100 })
      .withMessage('El porcentaje debe estar entre 0 y 100'),
    validate,
  ],
  paqueteController.create
);

/**
 * PUT /api/paquetes/:id
 * Actualiza un paquete
 */
router.put('/:id', paqueteController.update);

/**
 * DELETE /api/paquetes/:id
 * Elimina un paquete (soft delete)
 */
router.delete('/:id', paqueteController.delete);

module.exports = router;
