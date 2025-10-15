require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixEncoding() {
  console.log('🔧 Corrigiendo encoding de caracteres...\n');

  try {
    // Listar y actualizar todas las sesiones
    console.log('📝 Buscando sesiones...');
    const sesiones = await prisma.sesion.findMany();

    console.log(`Encontradas ${sesiones.length} sesiones\n`);

    // Map de correcciones conocidas
    const fixes = {
      'Carlos Mart�nez': 'Carlos Martínez',
      'Sesi�n exterior parque': 'Sesión exterior parque',
      'Juan P�rez': 'Juan Pérez',
      'Sesi�n en estudio': 'Sesión en estudio',
      'Mar�a Garc�a': 'María García',
      'Sesi�n en exteriores': 'Sesión en exteriores',
    };

    for (const sesion of sesiones) {
      const updates = {};

      if (fixes[sesion.nombreCliente]) {
        updates.nombreCliente = fixes[sesion.nombreCliente];
      }

      if (sesion.especificaciones && fixes[sesion.especificaciones]) {
        updates.especificaciones = fixes[sesion.especificaciones];
      }

      if (Object.keys(updates).length > 0) {
        console.log(`Actualizando sesión ${sesion.id}:`, updates);
        await prisma.sesion.update({
          where: { id: sesion.id },
          data: updates
        });
      }
    }

    console.log('✅ Sesiones actualizadas\n');

    // Actualizar paquetes
    console.log('📦 Actualizando paquetes...');
    const paquetes = await prisma.paquete.findMany();

    const paqueteFixes = {
      'Paquete B�sico': 'Paquete Básico',
      'Sesi�n de 1 hora con 10 fotos': 'Sesión de 1 hora con 10 fotos',
      'Paquete Pr�mium': 'Paquete Premium',
      'Sesi�n de 2 horas con 25 fotos y �lbum': 'Sesión de 2 horas con 25 fotos y álbum',
    };

    for (const paquete of paquetes) {
      const updates = {};

      if (paqueteFixes[paquete.nombre]) {
        updates.nombre = paqueteFixes[paquete.nombre];
      }

      if (paquete.descripcion && paqueteFixes[paquete.descripcion]) {
        updates.descripcion = paqueteFixes[paquete.descripcion];
      }

      if (Object.keys(updates).length > 0) {
        console.log(`Actualizando paquete ${paquete.id}:`, updates);
        await prisma.paquete.update({
          where: { id: paquete.id },
          data: updates
        });
      }
    }

    console.log('✅ Paquetes actualizados\n');

    console.log('🎉 ¡Encoding corregido exitosamente!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEncoding();
