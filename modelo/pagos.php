<?php
require_once __DIR__ . '/../config/conexion.php';

// Nuevo: modelo de pagos (abonos a prestamos), con la misma forma que la clase Actividades
class Pagos
{
    // Metodos aceptados: son los mismos valores del ENUM metodoPago (sql/cambios_prestamos_pagos.sql)
    const METODOS_PAGO = ['Efectivo', 'Transferencia', 'PSE'];

    private $conexion;

    public function __construct()
    {
        $this->conexion = (new Conexion())->conectar();
    }

    public function guardar($datos)
    {
        $sql = "INSERT INTO pagos_cuotas (valorCuota, fechaPago, metodoPago, idPrestamo)
                VALUES (:valorCuota, :fechaPago, :metodoPago, :idPrestamo)";
        $consulta = $this->conexion->prepare($sql);
        return $consulta->execute([
            ':valorCuota' => $datos['valorCuota'],
            ':fechaPago' => $datos['fechaPago'],
            ':metodoPago' => $datos['metodoPago'],
            ':idPrestamo' => $datos['idPrestamo']
        ]);
    }
}
