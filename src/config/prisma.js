const { PrismaClient } = require('@prisma/client');

// Singleton instance
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    transactionOptions: {
      maxWait: 15000, // Máximo tiempo de espera para adquirir una transacción: 15s
      timeout: 30000, // Tiempo máximo de ejecución de la transacción: 30s
    },
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      transactionOptions: {
        maxWait: 15000, // Máximo tiempo de espera para adquirir una transacción: 15s
        timeout: 30000, // Tiempo máximo de ejecución de la transacción: 30s
      },
    });
  }
  prisma = global.prisma;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;
