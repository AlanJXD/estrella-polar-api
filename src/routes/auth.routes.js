const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validator.middleware');

const router = express.Router();

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 */
router.post(
  '/register',
  [
    body('usuario')
      .trim()
      .isLength({ min: 3 })
      .withMessage('El usuario debe tener al menos 3 caracteres'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('apellidoPaterno').notEmpty().withMessage('El apellido paterno es requerido'),
    body('correo').isEmail().withMessage('Correo electrónico inválido'),
    validate,
  ],
  authController.register
);

/**
 * POST /api/auth/login
 * Inicia sesión
 */
router.post(
  '/login',
  [
    body('usuario').notEmpty().withMessage('El usuario es requerido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
    validate,
  ],
  authController.login
);

/**
 * GET /api/auth/me
 * Obtiene el usuario actual autenticado
 */
router.get('/me', authenticate, authController.me);

module.exports = router;
