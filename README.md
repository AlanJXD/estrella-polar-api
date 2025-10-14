# Estrella Polar Estudio - API REST

API REST para el sistema de gestión de sesiones fotográficas del estudio "Estrella Polar".

## Tecnologías

- **Node.js** + **Express.js** - Framework del servidor
- **Prisma ORM** - ORM para MySQL
- **MySQL** - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Encriptación de contraseñas

## Características de Seguridad

- ✅ Transacciones atómicas para operaciones financieras
- ✅ Validaciones estrictas de montos y saldos
- ✅ Soft delete en todos los modelos
- ✅ Autenticación JWT
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Helmet para headers HTTP seguros
- ✅ Auditoría completa (usuario_id + timestamps)

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

### 3. Ejecutar migraciones de Prisma

```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Aplicar el schema a la base de datos
npm run prisma:push
```

### 4. Insertar datos iniciales

Ejecuta el script SQL de seeds para crear los tipos de caja, tipos de movimiento y cajas iniciales:

```sql
-- Estos INSERT ya están en el schema, pero puedes verificarlos ejecutando:

INSERT INTO c_tipos_caja (nombre, descripcion, activo) VALUES
('Caja', 'Ahorro general del estudio', 1),
('BBVA', 'Cuenta bancaria BBVA (transferencias)', 1),
('Efectivo', 'Dinero físico en caja chica', 1);

INSERT INTO c_tipos_movimiento (nombre, activo) VALUES
('Ingreso', 1),
('Retiro', 1);

INSERT INTO b_cajas (tipo_caja_id, saldo_actual, activo) VALUES
(1, 0.00, 1), -- Caja
(2, 0.00, 1), -- BBVA
(3, 0.00, 1); -- Efectivo
```

### 5. Iniciar el servidor

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

El servidor estará corriendo en `http://localhost:3000`

## Estructura del Proyecto

```
estrella-polar-api/
├── prisma/
│   └── schema.prisma          # Schema de Prisma con todos los modelos
├── src/
│   ├── config/
│   │   ├── prisma.js          # Cliente Prisma singleton
│   │   └── jwt.js             # Funciones JWT
│   ├── controllers/           # Controladores de rutas
│   ├── routes/                # Definición de rutas
│   ├── middlewares/           # Middlewares personalizados
│   ├── services/              # Lógica de negocio crítica
│   ├── utils/                 # Utilidades (validators, bcrypt, response)
│   └── server.js              # Punto de entrada
├── .env                       # Variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## Endpoints Principales

### Autenticación

```
POST   /api/auth/register      - Registrar usuario
POST   /api/auth/login         - Iniciar sesión
GET    /api/auth/me            - Usuario actual (requiere auth)
```

### Sesiones

```
GET    /api/sesiones                      - Listar sesiones
GET    /api/sesiones/proximas             - Sesiones próximas
GET    /api/sesiones/:id                  - Detalle de sesión
POST   /api/sesiones                      - Crear sesión
PUT    /api/sesiones/:id                  - Actualizar sesión
DELETE /api/sesiones/:id                  - Eliminar sesión (soft)
POST   /api/sesiones/:id/liquidaciones    - Agregar liquidación
POST   /api/sesiones/:id/ingresos-extra   - Agregar ingreso extra
POST   /api/sesiones/:id/gastos           - Agregar gasto
```

### Cajas

```
GET    /api/cajas                    - Listar cajas con saldos
GET    /api/cajas/:id/movimientos    - Historial de movimientos
POST   /api/cajas/movimiento         - Crear movimiento manual
```

### Paquetes

```
GET    /api/paquetes       - Listar paquetes
GET    /api/paquetes/:id   - Detalle de paquete
POST   /api/paquetes       - Crear paquete
PUT    /api/paquetes/:id   - Actualizar paquete
DELETE /api/paquetes/:id   - Eliminar paquete (soft)
```

### Usuarios

```
GET    /api/usuarios       - Listar usuarios
GET    /api/usuarios/:id   - Detalle de usuario
PUT    /api/usuarios/:id   - Actualizar usuario
DELETE /api/usuarios/:id   - Eliminar usuario (soft)
```

## Formato de Respuestas

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

### Respuesta de Error

```json
{
  "success": false,
  "message": "Mensaje de error",
  "errors": [ ... ]
}
```

## Ejemplo de Uso

### 1. Registrar un usuario

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "usuario": "itzel",
  "password": "password123",
  "nombre": "Itzel",
  "apellidoPaterno": "García",
  "correo": "itzel@estrellapolar.com"
}
```

### 2. Iniciar sesión

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "usuario": "itzel",
  "password": "password123"
}
```

Respuesta:

```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "usuario": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3. Crear una sesión

```bash
POST http://localhost:3000/api/sesiones
Authorization: Bearer <token>
Content-Type: application/json

{
  "fecha": "2024-02-15",
  "horaInicial": "10:00",
  "horaFinal": "12:00",
  "nombreCliente": "María López",
  "celularCliente": "5512345678",
  "paqueteId": 1,
  "especificaciones": "Sesión familiar exterior",
  "anticipo": 500,
  "restante": 500,
  "montoCaja": 100
}
```

## Lógica de Negocio

### Flujo de Creación de Sesión

1. **Validaciones**: Hora final > hora inicial, montos válidos
2. **Crear sesión** en `b_sesiones`
3. **Si hay anticipo**: Crear movimiento en caja BBVA (automático)
4. **Si hay montoCaja**: Crear movimiento en caja de ahorro
5. **Crear distribución**: Con porcentajes del paquete seleccionado
6. **Todo en transacción atómica**: Si algo falla, nada se guarda

### Flujo de Liquidación

1. Usuario elige caja destino (BBVA o Efectivo)
2. Crear registro en `r_liquidaciones`
3. Crear movimiento en la caja destino
4. Actualizar saldo de la caja
5. Recalcular distribución de la sesión
6. Todo en transacción atómica

### Distribución de Ganancias

```
Ingresos Totales = Anticipo + Liquidaciones + Ingresos Extra
Gastos Totales = Suma de todos los gastos
Monto para Caja = Campo montoCaja de la sesión
Neto = Ingresos Totales - Gastos Totales - Monto Caja

Distribución:
- Monto Itzel = Neto × (% Itzel / 100)
- Monto Cristian = Neto × (% Cristian / 100)
- Monto Cesar = Neto × (% Cesar / 100)
```

## Scripts Útiles

```bash
# Desarrollo
npm run dev

# Producción
npm start

# Prisma Studio (GUI para ver la BD)
npm run prisma:studio

# Generar cliente de Prisma
npm run prisma:generate

# Aplicar schema a BD
npm run prisma:push
```

## Comandos de Prisma

```bash
# Ver la base de datos en interfaz gráfica
npx prisma studio

# Generar migrations
npx prisma migrate dev --name nombre_de_la_migracion

# Aplicar schema sin migrations
npx prisma db push

# Resetear base de datos (¡CUIDADO!)
npx prisma migrate reset
```

## Consideraciones de Seguridad

1. **Contraseñas**: Hasheadas con bcrypt (10 rounds)
2. **Tokens JWT**: Expiran en 24h (access) y 7d (refresh)
3. **Rate Limiting**: 100 req/15min general, 10 req/15min en auth
4. **Validación de entrada**: Todas las rutas validadas con express-validator
5. **Soft Delete**: Los registros nunca se eliminan físicamente
6. **Transacciones**: Operaciones financieras siempre en transacciones

## Solución de Problemas

### Error de conexión a MySQL

Verifica que:
- La IP del servidor MySQL sea accesible
- Las credenciales en `.env` sean correctas
- El puerto 3306 esté abierto

### Error de Prisma

```bash
# Regenerar el cliente
npm run prisma:generate

# Aplicar el schema nuevamente
npm run prisma:push
```

### Token expirado

Los access tokens expiran en 24h. Usa el refresh token para obtener uno nuevo.

## Autores

Estrella Polar Estudio - Sistema desarrollado para gestión de sesiones fotográficas

## Licencia

MIT
"# estrella-polar-api" 
