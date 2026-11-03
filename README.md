# Club Acerías (adso-login)

Prototipo web para un club de asociados: registro de asociados, préstamos, actividades y pagos.
Es solo front-end (HTML, CSS y JavaScript). No tiene servidor ni base de datos: los datos se guardan en el `localStorage` del navegador.

## Cómo abrirlo

1. Copiar el proyecto en `C:\laragon\www\club_acerias` y encender Laragon.
2. Abrir `http://localhost/club_acerias/vista/login.html`.

## Cuentas de prueba (solo demostración)

| Email | Contraseña | Rol |
|---|---|---|
| admin@gmail.com | 1234 | admin |
| user1@gmail.com | 1234 | asociado |

Quien se registre en `registro.html` también puede iniciar sesión, con rol asociado.

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
controladores/  lógica de cada pantalla (sesion.js protege las páginas, formulario.js guarda los formularios)
assets/css/     estilos de login, registro y formularios (el panel usa Bootstrap)
modelo/ config/ reservadas para una base de datos futura
```

Cada formulario guarda una lista en `localStorage` con el nombre `asociados`, `pagos`, `prestamos` o `actividades`
(se puede ver con F12 > Application > Local Storage).

## Pendiente

- Listados, edición y eliminación de registros.
- Módulos Reportes y Mi Perfil.
- Base de datos y validación real de sesión y roles (hoy es solo de demostración).
