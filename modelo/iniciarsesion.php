<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

try {

 if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    throw new Exception("Método HTTP no permitido", 405);
 }
    $datos = json_decode(file_get_contents('php://input'), true);

    if(!is_array($datos) || json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Datos inválidos", 400);
    }
    $email = $datos['email'] ?? '';
    $password = $datos['password'] ?? '';

    if (!is_string($email) || !is_string($password) || $email === ""  ||  $password === "") {
        throw new Exception("Email o contraseña inválidos", 400);
    }

  require_once __DIR__ . '/../config/conexion.php';
   $conexion = (new Conexion())-> conectar();

   $consulta = $conexion->prepare("SELECT * FROM asociados WHERE email = :email");
    $consulta->execute([':email' => $email]);
    $asociados = $consulta->fetch();

    // passwordHash puede ser NULL (asociados antiguos sin contraseña): no pueden entrar
    if(!$asociados || empty($asociados['passwordHash']) || !password_verify($password, $asociados['passwordHash'])) {
        throw new Exception("Email o contraseña incorrectos", 401);
    }

 $_SESSION['rol'] = strtolower($asociados['rol']) ;
 $_SESSION['documento'] = $asociados['documento'] ;
   
 echo json_encode([
 "success" => true, 
 "rol" => $_SESSION['rol'],
 "nombre" => $asociados['nombres']." ".$asociados['apellidos'],
 ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de base de datos: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

?>