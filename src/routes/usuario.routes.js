const express = require('express');
const { body } = require('express-validator');
const usuarioController = require('../controllers/usuarioController');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validator.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/usuarios
 * Obtiene todos los usuarios
 */
router.get('/', usuarioController.getAll);

/**
 * GET /api/usuarios/:id
 * Obtiene un usuario por ID
 */
router.get('/:id', usuarioController.getById);

/**
 * PUT /api/usuarios/:id
 * Actualiza un usuario
 */
router.put(
  '/:id',
  [
    body('correo').optional().isEmail().withMessage('Correo electrónico inválido'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    validate,
  ],
  usuarioController.update
);

/**
 * DELETE /api/usuarios/:id
 * Elimina un usuario (soft delete)
 */
router.delete('/:id', usuarioController.delete);

module.exports = router;
