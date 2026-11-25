<?php
// Nuevo: API CRUD de asociados para el administrador, con la misma estructura que gestionarActividades.php.
// registro.html sigue usando guardarAsociado.php para el registro publico.
session_start();
header('Content-Type: application/json; charset=UTF-8');

const GENEROS = ['Masculino', 'Femenino', 'Otro'];
const ROLES = ['admin', 'asociado'];

function leerDatos() {
    $datos = json_decode(file_get_contents('php://input'), true);
    if (!is_array($datos) || json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        throw new Exception("Datos inválidos: " . json_last_error_msg());
    }
    return $datos;
}

// Revisa un texto obligatorio con largo maximo (los mismos largos de las columnas de la tabla asociados)
function validarTexto($datos, $campo, $nombre, $maximo) {
    $valor = $datos[$campo] ?? null;
    if (!is_string($valor) || trim($valor) === '' || mb_strlen(trim($valor)) > $maximo) {
        http_response_code(400);
        throw new Exception("Ingresa un $nombre válido (máximo $maximo caracteres)");
    }
    return trim($valor);
}

// $esNuevo = true al crear (pide documento y contraseña); false al editar
function validarAsociado($datos, $esNuevo) {
    $asociado = [
        'nombres' => validarTexto($datos, 'nombres', 'nombre', 50),
        'apellidos' => validarTexto($datos, 'apellidos', 'apellido', 50),
        'direccionResidencia' => validarTexto($datos, 'direccionResidencia', 'dirección', 100),
        'ciudad' => validarTexto($datos, 'ciudad', 'ciudad', 50),
        'telefono' => validarTexto($datos, 'telefono', 'teléfono', 20),
        'email' => validarTexto($datos, 'email', 'email', 100)
    ];

    if (!filter_var($asociado['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        throw new Exception("El correo electrónico no es válido");
    }

    $fecha = $datos['fechaNacimiento'] ?? null;
    $fechaValida = is_string($fecha) ? DateTime::createFromFormat('Y-m-d', $fecha) : false;
    if (!$fechaValida || $fechaValida->format('Y-m-d') !== $fecha || $fecha > date('Y-m-d')) {
        http_response_code(400);
        throw new Exception("Ingresa una fecha de nacimiento válida");
    }
    $asociado['fechaNacimiento'] = $fecha;

    $genero = $datos['genero'] ?? null;
    if (!in_array($genero, GENEROS, true)) {
        http_response_code(400);
        throw new Exception("Selecciona un género válido");
    }
    $asociado['genero'] = $genero;

    // Al crear la contraseña es obligatoria; al editar, vacia significa "no cambiarla"
    $password = $datos['password'] ?? '';
    if (!is_string($password) || ($esNuevo && $password === '') || ($password !== '' && mb_strlen($password) < 8)) {
        http_response_code(400);
        throw new Exception("La contraseña debe tener mínimo 8 caracteres");
    }
    $asociado['password'] = $password;

    if ($esNuevo) {
        $documento = filter_var($datos['documento'] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
        if ($documento === false) {
            http_response_code(400);
            throw new Exception("Ingresa un documento válido");
        }
        $asociado['documento'] = $documento;
    } else {
        $rol = $datos['rol'] ?? null;
        if (!in_array($rol, ROLES, true)) {
            http_response_code(400);
            throw new Exception("Selecciona un rol válido");
        }
        $asociado['rol'] = $rol;
    }

    return $asociado;
}

function validarId($id) {
    $idAsociado = filter_var($id, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    if ($idAsociado === false) {
        http_response_code(400);
        throw new Exception("ID de asociado inválido");
    }
    return $idAsociado;
}

try {
    // idAsociado se usa para que el admin no se elimine ni se quite el rol a si mismo
    if (!isset($_SESSION['documento'], $_SESSION['rol'], $_SESSION['idAsociado'])) {
        http_response_code(401);
        throw new Exception("Inicia sesión para acceder a asociados");
    }

    $metodo = $_SERVER['REQUEST_METHOD'];
    if (!in_array($metodo, ['GET', 'POST', 'PUT', 'DELETE'], true)) {
        http_response_code(405);
        throw new Exception("Método HTTP no permitido");
    }

    // La lista tiene datos personales: todo el modulo es solo para el administrador
    if ($_SESSION['rol'] !== 'admin') {
        http_response_code(403);
        throw new Exception("No tienes permisos para realizar esta acción");
    }

    require_once __DIR__ . '/asociados.php';
    $asociados = new Asociados();

    switch ($metodo) {
        case 'GET':
            $resultado = [
                "success" => true,
                "idAsociadoSesion" => $_SESSION['idAsociado'],
                "asociados" => $asociados->obtenerAsociados()
            ];
            http_response_code(200);
            break;

        case 'POST':
            // Se reutiliza la clase asociado (asociado.php), la misma del registro publico
            require_once __DIR__ . '/asociado.php';
            $nuevo = new asociado(validarAsociado(leerDatos(), true));
            $nuevo->guardar();
            $resultado = [
                "success" => true,
                "message" => "Asociado guardado correctamente"
            ];
            http_response_code(201);
            break;

        case 'PUT':
            $entrada = leerDatos();
            $datos = validarAsociado($entrada, false);
            $datos['idAsociado'] = validarId($entrada['idAsociado'] ?? null);

            if ($datos['idAsociado'] === (int) $_SESSION['idAsociado'] && $datos['rol'] !== 'admin') {
                http_response_code(400);
                throw new Exception("No puedes quitarte a ti mismo el rol de administrador");
            }

            if (!$asociados->editar($datos)) {
                http_response_code(404);
                throw new Exception("No se encontró el asociado");
            }
            $resultado = [
                "success" => true,
                "message" => "Asociado actualizado correctamente"
            ];
            http_response_code(200);
            break;

        case 'DELETE':
            $idAsociado = validarId(leerDatos()['idAsociado'] ?? null);

            if ($idAsociado === (int) $_SESSION['idAsociado']) {
                http_response_code(400);
                throw new Exception("No puedes eliminar tu propia cuenta");
            }
            // La BD borra en cascada los prestamos y pagos del asociado: se bloquea para no perderlos
            if ($asociados->contarPrestamos($idAsociado) > 0) {
                http_response_code(409);
                throw new Exception("No se puede eliminar: el asociado tiene préstamos registrados");
            }

            if (!$asociados->eliminar($idAsociado)) {
                http_response_code(404);
                throw new Exception("No se encontró el asociado");
            }
            $resultado = [
                "success" => true,
                "message" => "Asociado eliminado correctamente"
            ];
            http_response_code(200);
            break;
    }

    echo json_encode($resultado);

} catch (PDOException $e) {
    // 23000: el documento ya existe (llave unica), igual que en guardarAsociado.php
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Ya existe un asociado con ese documento"]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error en la base de datos: " . $e->getMessage()
        ]);
    }
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
