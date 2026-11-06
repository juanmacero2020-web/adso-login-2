# Club Acerías (adso-login)

Prototipo web para un club de asociados: registro de asociados, préstamos, actividades y pagos.
Front-end en HTML, CSS y JavaScript. El registro de asociados se guarda en MySQL con PHP (PDO); el login y los demás formularios son solo de demostración.

## Cómo abrirlo

1. Copiar el proyecto en `C:\laragon\www\club_acerias` y encender Apache y MySQL en Laragon (base `club_acerias`, tabla `asociados`).
2. Abrir `http://localhost/club_acerias/vista/login.html`.

## Cuentas de prueba (solo demostración)

| Email | Contraseña | Rol |
|---|---|---|
| admin@gmail.com | 1234 | admin |
| user1@gmail.com | 1234 | asociado |

## Pantallas

| Archivo | Descripción |
|---|---|
| `vista/login.html` | Inicio de sesión |
| `vista/registro.html` | Registro de asociados |
| `vista/dashboard.html` | Panel principal (las tarjetas dependen del rol) |
| `vista/pagos.html` | Registro de pago |
| `vista/prestamos.html` | Registro de préstamo |
| `vista/actividades.html` | Registro de actividades |

## Estructura

```
vista/          pantallas
controladores/  lógica de cada pantalla (login, dashboard y registro de asociados)
assets/css/     estilos de login, registro y formularios (el panel usa Bootstrap)
modelo/ config/ guardado de asociados en MySQL (conexion.php, asociado.php, guardarAsociado.php)
```

Los formularios de pagos, préstamos y actividades todavía no guardan datos.

## Pendiente

- Listados, edición y eliminación de registros.
- Módulos Reportes y Mi Perfil.
- Guardar pagos, préstamos y actividades en la base de datos.
- Validación real de sesión y roles (hoy es solo de demostración).
