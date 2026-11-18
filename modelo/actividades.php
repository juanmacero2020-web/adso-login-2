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
    public function eliminar($idActividad)
    {
        $sql = "DELETE FROM actividades WHERE idActividad = :idActividad";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':idActividad' => $id]);
        return $consulta->rowCount() > 0;
    }
    public function editar($id, $datos)
    {
        $sql = "UPDATE actividades SET nombreActividad = :nombreActividad, fechaEvento = :fechaEvento, municipio = :municipio, totalRecaudado = :totalRecaudado WHERE idActividad = :idActividad";
        $consulta = $this->conexion->prepare($sql);
        return $consulta->execute([
            ':nombreActividad' => $datos['nombreActividad'],
            ':fechaEvento' => $datos['fechaEvento'],
            ':municipio' => $datos['municipio'],
            ':totalRecaudado' => $datos['totalRecaudado'],
            ':idActividad' => $datos['idActividad']
        ]);
        if ($consulta->rowCount() > 0) {
            return true; // Actualización exitosa
        } 
        
        $verificar =this->conexion->prepare("SELECT 1 FROM actividades WHERE idActividad = :idActividad");
        $verificar->execute([':idActividad' => $datos['idActividad']]);
       
        return(bool)$verificar->fetchColumn(); // Devuelve true si el registro existe, false si no existe
    }
}