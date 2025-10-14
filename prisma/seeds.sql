-- =============================================
-- SEEDS PARA ESTRELLA POLAR ESTUDIO
-- =============================================
-- Ejecutar estos INSERTs después de aplicar el schema

-- Tipos de Caja
INSERT INTO c_tipos_caja (nombre, descripcion, activo) VALUES
('Caja', 'Ahorro general del estudio', 1),
('BBVA', 'Cuenta bancaria BBVA (transferencias)', 1),
('Efectivo', 'Dinero físico en caja chica', 1);

-- Tipos de Movimiento
INSERT INTO c_tipos_movimiento (nombre, activo) VALUES
('Ingreso', 1),
('Retiro', 1);

-- Inicializar las 3 cajas
INSERT INTO b_cajas (tipo_caja_id, saldo_actual, activo) VALUES
(1, 0.00, 1), -- Caja (Ahorro)
(2, 0.00, 1), -- BBVA
(3, 0.00, 1); -- Efectivo

-- Paquetes de ejemplo
INSERT INTO c_paquetes (nombre, descripcion, precio, porcentaje_itzel, porcentaje_cristian, porcentaje_cesar, activo) VALUES
('Básico', 'Sesión básica de 1 hora con 10 fotos editadas', 1000.00, 33.33, 33.33, 33.34, 1),
('Premium', 'Sesión premium de 2 horas con 25 fotos editadas', 2500.00, 33.33, 33.33, 33.34, 1),
('Deluxe', 'Sesión deluxe de 3 horas con 50 fotos editadas + álbum', 5000.00, 33.33, 33.33, 33.34, 1);

-- Usuario de prueba (password: password123)
-- Hash generado con bcrypt de "password123"
INSERT INTO b_usuarios (usuario, password_hash, nombre, apellido_paterno, apellido_materno, celular, correo, activo) VALUES
('admin', '$2a$10$xK8YqYqYqYqYqYqYqYqYqOXvFrPzGqH1g7L9vZzZzZzZzZzZzZzZu', 'Administrador', 'Sistema', NULL, '5512345678', 'admin@estrellapolar.com', 1);

-- NOTA: El hash de arriba es solo ejemplo.
-- En producción, usa la ruta POST /api/auth/register para crear usuarios con contraseñas hasheadas correctamente
