-- Script para corregir el campo 'restante' en sesiones existentes
-- Este script actualiza el restante como: precio_paquete - anticipo

-- Actualizar todas las sesiones activas con el restante correcto
UPDATE b_sesiones s
INNER JOIN c_paquetes p ON s.paqueteId = p.id
SET s.restante = p.precio - s.anticipo
WHERE s.activo = 1;

-- Verificar los cambios (opcional)
SELECT
    s.id,
    s.nombreCliente,
    p.nombre as paquete,
    p.precio as precio_paquete,
    s.anticipo,
    s.restante as restante_calculado,
    (SELECT SUM(l.monto) FROM r_liquidaciones l WHERE l.sesionId = s.id AND l.activo = 1) as total_liquidaciones,
    (s.restante - COALESCE((SELECT SUM(l.monto) FROM r_liquidaciones l WHERE l.sesionId = s.id AND l.activo = 1), 0)) as restante_pendiente
FROM b_sesiones s
INNER JOIN c_paquetes p ON s.paqueteId = p.id
WHERE s.activo = 1
ORDER BY s.fecha DESC
LIMIT 20;
