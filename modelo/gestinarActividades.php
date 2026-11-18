<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

function leerDatos() {
    $datos = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        throw new Exception("Error al decodificar JSON: " . json_last_error_msg());
    }
    return $datos;
}
 
function validarActividad($datos) {
    $nombre = $datos['nombreActividad'] ?? null;
    $fecha = $datos['fechaEvento'] ?? null;
    $municipio = $datos['municipio'] ?? null;
    if (!is_string($nombre) || trim($nombre) === '' || !is_string($municipio) || trim($municipio) === '' || strlen (municipio) > 50) {
        http_response_code(400);
        throw new Exception("ingresa un nombre de actividad y un municipio válido");
    }
   return [
        'nombreActividad' => trim($nombre),
        'fechaEvento' => $fecha,
        'municipio' => trim($municipio)
    ];
}

function validarId($id) {
    $idactividad = filter_var($id, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    if ($idactividad === false) {
        http_response_code(400);
        throw new Exception("ID de actividad inválido");
    }
    return $idactividad;
}

try {
    if (!isset($_SESSION['documento'], $_SESSION['rol'])) {
        http_response_code(401);
        throw new Exception("iniciar sesion para acceder a actividades");
    }
    $metodo = $_SERVER['REQUEST_METHOD'];
    if(!in_array($metodo, ['GET', 'POST', 'PUT', 'DELETE'],true)) {
        http_response_code(405);
        throw new Exception("Método HTTP no permitido");
    }
    if ($metodo !== "get" && $_SESSION['rol'] !== "admin") {
        http_response_code(403);
        throw new Exception("No tienes permisos para realizar esta acción");

    }
    require_once __DIR__ . '/../modelo/actividades.php';
    $actividades = new Actividades();
    switch ($metodo) {
        case 'GET':
            $resultado = [
                "sucess" => true,
                "rol" => $_SESSION['rol'],
                "actividades" => $actividades->obtenerActividades()

            ];
            http_response_code(200);
            break;
        case 'POST':
            $datos = validarActividad(leerDatos());
            $actividades->guardar($datos);
            $resultado = [
                "sucess" => true,
                "mensaje" => "Actividad guardada correctamente"
            ];
            http_response_code(201);
            break;
        case 'PUT':
            $datos = leerDatos();
            $datos['idActividad'] = validarId($datos['idActividad'] ?? null);
            $datos = array_merge($datos, validarActividad($datos));

          if (!$actividades->editar($datos)) {
                http_response_code(404);
                throw new Exception("No se encontró la actividad");
            }
            $resultado = [
                "sucess" => true,
                "mensaje" => "Actividad actualizada correctamente"
            ];
            http_response_code(200);
            break;
            
        case 'DELETE':
            $datos = leerDatos();
            $idActividad = validarId($datos['idActividad'] ?? null);

            if (!$actividades->eliminar($idActividad)) {
                http_response_code(404);
                throw new Exception("No se encontró la actividad");
            }
            $resultado = [
                "sucess" => true,
                "mensaje" => "Actividad eliminada correctamente"
            ];
            http_response_code(200);
            break;
    }
  echo json_encode($resultado);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Error en la base de datos: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(http_response_code() ?: 400);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
    
}

