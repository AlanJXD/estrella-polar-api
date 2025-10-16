const express = require('express');
const { body } = require('express-validator');
const sesionController = require('../controllers/sesionController');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validator.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/sesiones
 * Obtiene todas las sesiones
 */
router.get('/', sesionController.getAll);

/**
 * GET /api/sesiones/proximas
 * Obtiene las sesiones próximas
 */
router.get('/proximas', sesionController.getProximas);

/**
 * GET /api/sesiones/:id
 * Obtiene una sesión por ID
 */
router.get('/:id', sesionController.getById);

/**
 * POST /api/sesiones
 * Crea una nueva sesión
 */
router.post(
  '/',
  [
    body('fecha').notEmpty().withMessage('La fecha es requerida'),
    body('horaInicial').notEmpty().withMessage('La hora inicial es requerida'),
    body('horaFinal').notEmpty().withMessage('La hora final es requerida'),
    body('nombreCliente').notEmpty().withMessage('El nombre del cliente es requerido'),
    body('paqueteId').isInt().withMessage('El ID del paquete debe ser un número'),
    body('anticipo')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El anticipo debe ser mayor o igual a 0'),
    body('montoCaja')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El monto de caja debe ser mayor o igual a 0'),
    validate,
  ],
  sesionController.create
);

/**
 * PUT /api/sesiones/:id
 * Actualiza una sesión
 */
router.put('/:id', sesionController.update);

/**
 * DELETE /api/sesiones/:id
 * Elimina una sesión (soft delete)
 */
router.delete('/:id', sesionController.delete);

/**
 * POST /api/sesiones/:id/liquidaciones
 * Agrega una liquidación a una sesión
 */
router.post(
  '/:id/liquidaciones',
  [
    body('monto').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
    body('cajaDestinoNombre')
      .isIn(['BBVA', 'Efectivo'])
      .withMessage('La caja destino debe ser BBVA o Efectivo'),
    validate,
  ],
  sesionController.agregarLiquidacion
);

/**
 * POST /api/sesiones/:id/ingresos-extra
 * Agrega un ingreso extra a una sesión
 */
router.post(
  '/:id/ingresos-extra',
  [
    body('concepto').notEmpty().withMessage('El concepto es requerido'),
    body('monto').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
    validate,
  ],
  sesionController.agregarIngresoExtra
);

/**
 * POST /api/sesiones/:id/gastos
 * Agrega un gasto a una sesión
 */
router.post(
  '/:id/gastos',
  [
    body('concepto').notEmpty().withMessage('El concepto es requerido'),
    body('monto').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
    validate,
  ],
  sesionController.agregarGasto
);

/**
 * PUT /api/sesiones/:id/distribucion
 * Actualiza los porcentajes de distribución de una sesión
 */
router.put(
  '/:id/distribucion',
  [
    body('porcentajeItzel')
      .isFloat({ min: 0, max: 100 })
      .withMessage('El porcentaje de Itzel debe estar entre 0 y 100'),
    body('porcentajeCristian')
      .isFloat({ min: 0, max: 100 })
      .withMessage('El porcentaje de Cristian debe estar entre 0 y 100'),
    body('porcentajeCesar')
      .isFloat({ min: 0, max: 100 })
      .withMessage('El porcentaje de César debe estar entre 0 y 100'),
    validate,
  ],
  sesionController.actualizarDistribucion
);


/**
 * GET /api/sesiones/reporte/distribucion
 * Obtiene el reporte de distribución de ingresos
 */
router.get('/reporte/distribucion', sesionController.getReporteDistribucion);

module.exports = router;


