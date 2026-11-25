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

    // Historial de abonos del asociado: se une con prestamos para filtrar por idAsociado
    public function obtenerPagosAsociado($idAsociado)
    {
        $sql = "SELECT pc.idPago, pc.valorCuota, pc.fechaPago, pc.metodoPago, pc.idPrestamo
                FROM pagos_cuotas pc
                INNER JOIN prestamos p ON p.idPrestamo = pc.idPrestamo
                WHERE p.idAsociado = :idAsociado
                ORDER BY pc.fechaPago DESC, pc.idPago DESC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':idAsociado' => $idAsociado]);
        return $consulta->fetchAll();
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
