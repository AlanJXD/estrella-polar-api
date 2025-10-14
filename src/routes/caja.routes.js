const express = require('express');
const { body } = require('express-validator');
const cajaController = require('../controllers/cajaController');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validator.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/cajas
 * Obtiene todas las cajas con sus saldos
 */
router.get('/', cajaController.getAll);

/**
 * GET /api/cajas/:id/movimientos
 * Obtiene el historial de movimientos de una caja
 */
router.get('/:id/movimientos', cajaController.getMovimientos);

/**
 * POST /api/cajas/movimiento
 * Crea un movimiento manual (ingreso o retiro)
 */
router.post(
  '/movimiento',
  [
    body('cajaNombre')
      .isIn(['Caja', 'BBVA', 'Efectivo'])
      .withMessage('El nombre de caja debe ser: Caja, BBVA o Efectivo'),
    body('tipoMovimiento')
      .isIn(['Ingreso', 'Retiro'])
      .withMessage('El tipo de movimiento debe ser: Ingreso o Retiro'),
    body('concepto').notEmpty().withMessage('El concepto es requerido'),
    body('monto').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
    validate,
  ],
  cajaController.crearMovimiento
);

module.exports = router;
