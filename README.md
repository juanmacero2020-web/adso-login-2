# Club Acerías (adso-login)

Prototipo web para un club de asociados: registro de asociados, préstamos, actividades y pagos.
Front-end en HTML, CSS y JavaScript; los datos se guardan en MySQL con PHP (PDO).

## Cómo abrirlo

1. Copiar el proyecto en `C:\laragon\www\club_acerias` y encender Apache y MySQL en Laragon (base `club_acerias`).
2. Ejecutar **una sola vez** `sql/cambios_prestamos_pagos.sql` (en HeidiSQL o en la consola de MySQL). Agrega el método de pago a los abonos.
3. Abrir `http://localhost/club_acerias/vista/login.html`.

Si ya había una sesión abierta antes de esta versión, hay que cerrar sesión y volver a entrar: el login ahora guarda también el `idAsociado`.

## Cuentas de prueba (solo demostración)

| Email | Contraseña | Rol |
|---|---|---|
| admin@gmail.com | 1234 | admin |
| user1@gmail.com | 1234 | asociado |

## Pantallas

| Archivo | Rol | Descripción |
|---|---|---|
| `vista/login.html` | todos | Inicio de sesión |
| `vista/registro.html` | todos | Registro de asociados |
| `vista/dashboard.html` | todos | Panel principal (las tarjetas dependen del rol) |
| `vista/asociados.html` | admin | CRUD de asociados: crear, ver, editar y eliminar (no se elimina a quien tiene préstamos ni a uno mismo) |
| `vista/prestamos.html` | ambos | Admin: CRUD de préstamos (solo se editan o eliminan los que no tienen pagos). Asociado: estado de sus préstamos |
| `vista/actividades.html` | admin | Crear, editar y eliminar actividades |
| `vista/pagos.html` | asociado | Elegir un préstamo, abonarle y ver el historial de pagos |

## Préstamos

- Tasa de interés fija del **1% mensual**, con interés simple:
  - Total a pagar = valor + (valor × 1% × número de cuotas).
  - Cuota = total ÷ número de cuotas.
- Estados:
  - **Al día**: lo pagado alcanza para las cuotas vencidas.
  - **En mora**: lo pagado es menor que las cuotas vencidas (vence una cuota por cada mes desde la fecha del préstamo).
  - **Pagado**: saldo en 0.

## Estructura

```
vista/          pantallas
controladores/  JS de cada pantalla (cada uno llama a su modelo/gestionarX.php con fetch)
assets/css/     estilos.css (login y registro) y panel.css (páginas con Bootstrap)
config/         conexion.php
modelo/         clases con las consultas (actividades.php, prestamos.php, pagos.php, asociados.php)
                y APIs que validan sesión y rol (gestionarActividades.php, gestionarPrestamos.php,
                gestionarPagos.php, gestionarAsociados.php); asociado.php y guardarAsociado.php
                para el registro
sql/            cambios a la base de datos
```

## Pendiente

- Módulos Reportes y Mi Perfil.
- Vista de pagos para el administrador.
