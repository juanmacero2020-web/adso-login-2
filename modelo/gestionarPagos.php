<?php
// Nuevo: API de pagos del asociado, con la misma estructura que gestionarActividades.php
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

function validarId($id) {
    $idPrestamo = filter_var($id, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    if ($idPrestamo === false) {
        http_response_code(400);
        throw new Exception("Selecciona un préstamo de la tabla");
    }
    return $idPrestamo;
}

function validarPago($datos) {
    // El documento del formulario debe ser el mismo del asociado que inicio sesion
    $documento = $datos['documento'] ?? '';
    if (!is_scalar($documento) || (string) $documento !== (string) $_SESSION['documento']) {
        http_response_code(400);
        throw new Exception("El documento no corresponde al asociado que inició sesión");
    }

    $valor = $datos['valorCuota'] ?? null;
    if (!is_numeric($valor) || $valor <= 0) {
        http_response_code(400);
        throw new Exception("El valor a abonar debe ser un número mayor a 0");
    }

    $fecha = $datos['fechaPago'] ?? null;
    $fechaValida = is_string($fecha) ? DateTime::createFromFormat('Y-m-d', $fecha) : false;
    if (!$fechaValida || $fechaValida->format('Y-m-d') !== $fecha) {
        http_response_code(400);
        throw new Exception("Ingresa una fecha de pago válida");
    }
    // Comparar como texto Y-m-d funciona porque el formato ordena año, mes y dia
    if ($fecha > date('Y-m-d')) {
        http_response_code(400);
        throw new Exception("La fecha de pago no puede ser futura");
    }

    $metodoPago = $datos['metodoPago'] ?? null;
    if (!in_array($metodoPago, Pagos::METODOS_PAGO, true)) {
        http_response_code(400);
        throw new Exception("Selecciona un método de pago válido");
    }

    return [
        'idPrestamo' => validarId($datos['idPrestamo'] ?? null),
        'valorCuota' => round((float) $valor, 2),
        'fechaPago' => $fecha,
        'metodoPago' => $metodoPago
    ];
}

try {
    // idAsociado se guarda al iniciar sesion; si falta, la sesion es vieja y hay que entrar de nuevo
    if (!isset($_SESSION['documento'], $_SESSION['rol'], $_SESSION['idAsociado'])) {
        http_response_code(401);
        throw new Exception("Inicia sesión para acceder a tus pagos");
    }

    $metodo = $_SERVER['REQUEST_METHOD'];
    if (!in_array($metodo, ['GET', 'POST'], true)) {
        http_response_code(405);
        throw new Exception("Método HTTP no permitido");
    }

    require_once __DIR__ . '/prestamos.php';
    require_once __DIR__ . '/pagos.php';
    $prestamos = new Prestamos();
    $pagos = new Pagos();

    switch ($metodo) {
        case 'GET':
            // Datos para llenar la pagina: documento del formulario, prestamos para elegir e historial
            $resultado = [
                "success" => true,
                "documento" => $_SESSION['documento'],
                "prestamos" => $prestamos->obtenerPrestamosAsociado($_SESSION['idAsociado']),
                "pagos" => $pagos->obtenerPagosAsociado($_SESSION['idAsociado'])
            ];
            http_response_code(200);
            break;

        case 'POST':
            $datos = validarPago(leerDatos());

            // Solo se puede abonar a un prestamo propio
            $prestamo = $prestamos->obtenerPrestamoAsociado($datos['idPrestamo'], $_SESSION['idAsociado']);
            if (!$prestamo) {
                http_response_code(404);
                throw new Exception("No se encontró el préstamo");
            }
            if ($prestamo['saldo'] <= 0) {
                http_response_code(400);
                throw new Exception("Este préstamo ya está pagado");
            }
            if ($datos['valorCuota'] > $prestamo['saldo']) {
                http_response_code(400);
                throw new Exception("El abono no puede ser mayor al saldo pendiente ($" . number_format($prestamo['saldo'], 2, ',', '.') . ")");
            }
            if ($datos['fechaPago'] < $prestamo['fechaPrestamo']) {
                http_response_code(400);
                throw new Exception("La fecha de pago no puede ser anterior a la fecha del préstamo");
            }

            $pagos->guardar($datos);
            $resultado = [
                "success" => true,
                "message" => "Abono registrado correctamente"
            ];
            http_response_code(201);
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
