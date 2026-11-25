<?php
// Nuevo: API de prestamos, con la misma estructura que gestionarActividades.php
session_start();
header('Content-Type: application/json; charset=UTF-8');

function leerDatos() {
    $datos = json_decode(file_get_contents('php://input'), true);
    if (!is_array($datos) || json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        throw new Exception("Datos inválidos: " . json_last_error_msg());
    }
    return $datos;
}

function validarPrestamo($datos) {
    $documento = filter_var($datos['documento'] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    if ($documento === false) {
        http_response_code(400);
        throw new Exception("Ingresa un documento de asociado válido");
    }

    $valor = $datos['valorPrestamo'] ?? null;
    // La columna valorPrestamo es decimal(12,2): maximo 9.999.999.999,99
    if (!is_numeric($valor) || $valor <= 0 || $valor > 9999999999.99) {
        http_response_code(400);
        throw new Exception("El valor del préstamo debe ser un número mayor a 0");
    }

    $cuotas = filter_var($datos['numeroCuotas'] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1, "max_range" => 60]]);
    if ($cuotas === false) {
        http_response_code(400);
        throw new Exception("El número de cuotas debe ser un entero entre 1 y 60");
    }

    $fecha = $datos['fechaPrestamo'] ?? null;
    $fechaValida = is_string($fecha) ? DateTime::createFromFormat('Y-m-d', $fecha) : false;
    if (!$fechaValida || $fechaValida->format('Y-m-d') !== $fecha) {
        http_response_code(400);
        throw new Exception("Ingresa una fecha de préstamo válida");
    }

    return [
        'documento' => $documento,
        'valorPrestamo' => round((float) $valor, 2),
        'numeroCuotas' => $cuotas,
        'fechaPrestamo' => $fecha
    ];
}

// Igual que validarId() de gestionarActividades.php
function validarId($id) {
    $idPrestamo = filter_var($id, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    if ($idPrestamo === false) {
        http_response_code(400);
        throw new Exception("ID de préstamo inválido");
    }
    return $idPrestamo;
}

// Antes de editar o eliminar, el prestamo debe existir y no tener pagos (si no, se dañan los saldos)
function revisarPrestamoSinPagos($prestamos, $idPrestamo, $accion) {
    $prestamo = $prestamos->obtenerPrestamo($idPrestamo);
    if (!$prestamo) {
        http_response_code(404);
        throw new Exception("No se encontró el préstamo");
    }
    if ($prestamo['totalPagado'] > 0) {
        http_response_code(409);
        throw new Exception("No se puede $accion: el préstamo ya tiene pagos registrados");
    }
}

try {
    // idAsociado se guarda al iniciar sesion; si falta, la sesion es vieja y hay que entrar de nuevo
    if (!isset($_SESSION['documento'], $_SESSION['rol'], $_SESSION['idAsociado'])) {
        http_response_code(401);
        throw new Exception("Inicia sesión para acceder a préstamos");
    }

    $metodo = $_SERVER['REQUEST_METHOD'];
    // PUT (editar) y DELETE (eliminar), como en gestionarActividades.php
    if (!in_array($metodo, ['GET', 'POST', 'PUT', 'DELETE'], true)) {
        http_response_code(405);
        throw new Exception("Método HTTP no permitido");
    }

    // Cualquier asociado puede consultar sus prestamos; solo el admin puede crear, editar o eliminar
    if ($metodo !== 'GET' && $_SESSION['rol'] !== 'admin') {
        http_response_code(403);
        throw new Exception("No tienes permisos para realizar esta acción");
    }

    require_once __DIR__ . '/prestamos.php';
    $prestamos = new Prestamos();

    switch ($metodo) {
        case 'GET':
            // El admin ve todos los prestamos; el asociado solo los suyos
            if ($_SESSION['rol'] === 'admin') {
                $lista = $prestamos->obtenerPrestamos();
            } else {
                $lista = $prestamos->obtenerPrestamosAsociado($_SESSION['idAsociado']);
            }
            $resultado = [
                "success" => true,
                "rol" => $_SESSION['rol'],
                "prestamos" => $lista
            ];
            http_response_code(200);
            break;

        case 'POST':
            $datos = validarPrestamo(leerDatos());

            $idAsociado = $prestamos->buscarIdAsociado($datos['documento']);
            if (!$idAsociado) {
                http_response_code(404);
                throw new Exception("No existe un asociado con ese documento");
            }
            $datos['idAsociado'] = $idAsociado;

            $prestamos->guardar($datos);
            $resultado = [
                "success" => true,
                "message" => "Préstamo guardado correctamente"
            ];
            http_response_code(201);
            break;

        case 'PUT':
            $entrada = leerDatos();
            $datos = validarPrestamo($entrada);
            $datos['idPrestamo'] = validarId($entrada['idPrestamo'] ?? null);
            revisarPrestamoSinPagos($prestamos, $datos['idPrestamo'], "editar");

            $idAsociado = $prestamos->buscarIdAsociado($datos['documento']);
            if (!$idAsociado) {
                http_response_code(404);
                throw new Exception("No existe un asociado con ese documento");
            }
            $datos['idAsociado'] = $idAsociado;

            $prestamos->editar($datos);
            $resultado = [
                "success" => true,
                "message" => "Préstamo actualizado correctamente"
            ];
            http_response_code(200);
            break;

        case 'DELETE':
            $datos = leerDatos();
            $idPrestamo = validarId($datos['idPrestamo'] ?? null);
            revisarPrestamoSinPagos($prestamos, $idPrestamo, "eliminar");

            $prestamos->eliminar($idPrestamo);
            $resultado = [
                "success" => true,
                "message" => "Préstamo eliminado correctamente"
            ];
            http_response_code(200);
            break;
    }

    echo json_encode($resultado);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error en la base de datos: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    $codigo = http_response_code();
    if (!$codigo || $codigo === 200) {
        http_response_code(400);
    }
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
