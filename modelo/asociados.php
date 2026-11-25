<?php
require_once __DIR__ . '/../config/conexion.php';

// Nuevo: lista, edicion y eliminacion de asociados para el administrador (CRUD como Actividades).
// Para crear se reutiliza asociado.php (en singular), el mismo que usa registro.html.
class Asociados
{
    private $conexion;

    public function __construct()
    {
        $this->conexion = (new Conexion())->conectar();
    }

    public function obtenerAsociados()
    {
        // No se consulta passwordHash: la contraseña nunca sale de la base de datos.
        // Se cuentan los prestamos de cada asociado para mostrarlos en la tabla.
        $sql = "SELECT a.idAsociado, a.documento, a.nombres, a.apellidos, a.fechaNacimiento, a.genero,
                       a.direccionResidencia, a.ciudad, a.telefono, a.email, a.rol,
                       (SELECT COUNT(*) FROM prestamos p WHERE p.idAsociado = a.idAsociado) AS prestamos
                FROM asociados a
                ORDER BY a.apellidos ASC, a.nombres ASC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute();
        return $consulta->fetchAll();
    }

    // Nuevo: cuantos prestamos tiene; si tiene, no se deja eliminar (la BD borraria sus prestamos y pagos)
    public function contarPrestamos($idAsociado)
    {
        $consulta = $this->conexion->prepare("SELECT COUNT(*) FROM prestamos WHERE idAsociado = :idAsociado");
        $consulta->execute([':idAsociado' => $idAsociado]);
        return (int) $consulta->fetchColumn();
    }

    // Nuevo: igual que editar() de actividades.php. El documento no se cambia.
    public function editar($datos)
    {
        $sql = "UPDATE asociados
                SET nombres = :nombres, apellidos = :apellidos, fechaNacimiento = :fechaNacimiento,
                    genero = :genero, direccionResidencia = :direccionResidencia, ciudad = :ciudad,
                    telefono = :telefono, email = :email, rol = :rol
                WHERE idAsociado = :idAsociado";
        $parametros = [
            ':nombres' => $datos['nombres'],
            ':apellidos' => $datos['apellidos'],
            ':fechaNacimiento' => $datos['fechaNacimiento'],
            ':genero' => $datos['genero'],
            ':direccionResidencia' => $datos['direccionResidencia'],
            ':ciudad' => $datos['ciudad'],
            ':telefono' => $datos['telefono'],
            ':email' => $datos['email'],
            ':rol' => $datos['rol'],
            ':idAsociado' => $datos['idAsociado']
        ];
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute($parametros);
        $filasCambiadas = $consulta->rowCount();

        // La contraseña solo se cambia si el admin escribio una nueva
        if ($datos['password'] !== '') {
            $consultaPassword = $this->conexion->prepare(
                "UPDATE asociados SET passwordHash = :passwordHash WHERE idAsociado = :idAsociado"
            );
            $consultaPassword->execute([
                ':passwordHash' => password_hash($datos['password'], PASSWORD_DEFAULT),
                ':idAsociado' => $datos['idAsociado']
            ]);
            $filasCambiadas += $consultaPassword->rowCount();
        }

        if ($filasCambiadas > 0) {
            return true; // Se actualizo al menos una fila
        }

        // rowCount() es 0 si los datos no cambiaron: comprobamos que el asociado exista
        $verificar = $this->conexion->prepare("SELECT 1 FROM asociados WHERE idAsociado = :idAsociado");
        $verificar->execute([':idAsociado' => $datos['idAsociado']]);
        return (bool) $verificar->fetchColumn();
    }

    // Nuevo: igual que eliminar() de actividades.php
    public function eliminar($idAsociado)
    {
        $consulta = $this->conexion->prepare("DELETE FROM asociados WHERE idAsociado = :idAsociado");
        $consulta->execute([':idAsociado' => $idAsociado]);
        return $consulta->rowCount() > 0;
    }
}
