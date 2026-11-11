<?php
    





    header("content-type: text/html; charset=utf-8");
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        //saltar a catch para que devuelva el mensaje de error en formato JSON
        throw new Exception("Método HTTP no permitido", 405);
    }
   session_start();
   $_SESSION = [];

   if (ini_get("session.use_cookies")) {
       $params = session_get_cookie_params();
       setcookie(session_name(), '', time() - 42000,
           $params["path"], $params["domain"],
           $params["secure"], $params["httponly"]
       );
   }

    session_destroy();

    echo json_encode([
        "success" => true,
       
    ]);













?>