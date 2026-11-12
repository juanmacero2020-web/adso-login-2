<<?php
require_once __dir__ . '/..config/conexion.php';

class Actividades
{
    private $conexion;

    public function __construct()
    {
        $this->conexion = new Conexion();
    }

    public function obtenerActividades()
    {
        $conexiondb = new Conexion();
        $this->conexion = $conexiondb->getConexion();
    }
    public function obtenerActividades()
    {
        
        $sql = "SELECT * FROM actividades order by fechaevento asc";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute(); 
        return $consulta->fetchAll();
    }
    public function guardar()
    {
        $sql = "INSERT INTO actividades (nombreActividad, fechaEvento, municipio) 
        VALUES (:nombreActividad, :fechaEvento, :municipio)";
       $consulta = $this->conexion->prepare($sql);
       return $consulta->execute([
            ':nombreActividad' => $datos->["nombreActividad"],
            ':fechaEvento' => $datos->["fechaEvento"],
            ':municipio' => $datos->["municipio"]
        ]);
       
    }
    public function eliminar($id)
    {
        $sql = "DELETE FROM actividades WHERE idActividad = :idActividad";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':idActividad' => $id]);
        return $consulta->rowCount() > 0;
    }
}