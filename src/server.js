require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

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

// Rate limiting (protección contra ataques de fuerza bruta)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting más estricto para rutas de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // límite de 10 intentos de login
  message: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos',
  skipSuccessfulRequests: true,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// =============================================
// RUTAS
// =============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
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
