<?php

// Nuevo: hora de Colombia para las fechas (PHP en Laragon viene en UTC y despues de las 7 p. m.
// "hoy" ya seria mañana). Lo usan las validaciones de fechas de pagos y prestamos.
date_default_timezone_set('America/Bogota');

class conexion
{
    private $host = "localhost";
    private $db_name = "club_acerias";
    private $username = "root";
    private $password = "";

    public function conectar()
    {
        $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4";
        return new PDO($dsn, $this->username, $this->password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
}
