require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Importar middlewares
const { errorHandler, notFound } = require('./middlewares/errorHandler.middleware');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const sesionRoutes = require('./routes/sesion.routes');
const cajaRoutes = require('./routes/caja.routes');
const paqueteRoutes = require('./routes/paquete.routes');
const usuarioRoutes = require('./routes/usuario.routes');

// Inicializar app
const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// MIDDLEWARES GLOBALES
// =============================================

// Seguridad HTTP headers
app.use(helmet());

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origin (como mobile apps o curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'CORS policy no permite acceso desde este origen';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// =============================================
// RUTAS
// =============================================

// Health check MEJORADO
app.get('/health', (req, res) => {
  const healthCheck = {
    success: true,
    message: '✅ API funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)} segundos`,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memoryUsage: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`,
    },
    nodeVersion: process.version,
    platform: process.platform,
  };

  res.status(200).json(healthCheck);
});

// Health check adicional para servicios externos
app.get('/health/advanced', async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        api: { status: 'ok', message: 'API principal operativa' },
        database: { status: 'checking', message: 'Verificando conexión a BD...' },
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Health check simple para monitoreo externo (ping)
app.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/sesiones', sesionRoutes);
app.use('/api/cajas', cajaRoutes);
app.use('/api/paquetes', paqueteRoutes);
app.use('/api/usuarios', usuarioRoutes);

// =============================================
// MANEJO DE ERRORES
// =============================================

// Ruta no encontrada
app.use(notFound);

// Middleware de errores
app.use(errorHandler);

// =============================================
// INICIAR SERVIDOR
// =============================================

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════════╗
  ║                                                        ║
  ║    🌟 ESTRELLA POLAR ESTUDIO API 🌟                   ║
  ║                                                        ║
  ║    Servidor corriendo en puerto ${PORT}                   ║
  ║    Entorno: ${process.env.NODE_ENV || 'development'}                        ║
  ║    URL: http://localhost:${PORT}                          ║
  ║    Rate Limiting: DESACTIVADO                         ║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Apagando servidor...');
  console.error(err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Apagando servidor...');
  console.error(err);
  process.exit(1);
});

module.exports = app;