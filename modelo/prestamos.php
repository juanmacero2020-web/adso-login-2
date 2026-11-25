<?php
require_once __DIR__ . '/../config/conexion.php';

// Nuevo: modelo de prestamos, con la misma forma que la clase Actividades (actividades.php)
class Prestamos
{
    // La tasa de interes del club es fija: 1% mensual
    const TASA_INTERES = 1;

    private $conexion;

    public function __construct()
    {
        $this->conexion = (new Conexion())->conectar();
    }

    // Consulta comun: datos del prestamo, nombre del asociado y lo que ya se ha pagado
    private function consultaPrestamos()
    {
        return "SELECT p.idPrestamo, p.valorPrestamo, p.tasaInteres, p.numeroCuotas, p.fechaPrestamo,
                       p.idAsociado, a.documento, CONCAT(a.nombres, ' ', a.apellidos) AS asociado,
                       (SELECT COALESCE(SUM(pc.valorCuota), 0)
                        FROM pagos_cuotas pc
                        WHERE pc.idPrestamo = p.idPrestamo) AS totalPagado
                FROM prestamos p
                INNER JOIN asociados a ON a.idAsociado = p.idAsociado";
    }

    // Todos los prestamos del club (lo usa el administrador)
    public function obtenerPrestamos()
    {
        $sql = $this->consultaPrestamos() . " ORDER BY p.fechaPrestamo DESC, p.idPrestamo DESC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute();
        return array_map([$this, 'calcularResumen'], $consulta->fetchAll());
    }

    // Solo los prestamos del asociado que inicio sesion
    public function obtenerPrestamosAsociado($idAsociado)
    {
        $sql = $this->consultaPrestamos() . " WHERE p.idAsociado = :idAsociado
                ORDER BY p.fechaPrestamo DESC, p.idPrestamo DESC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':idAsociado' => $idAsociado]);
        return array_map([$this, 'calcularResumen'], $consulta->fetchAll());
    }

    // Un prestamo, solo si pertenece al asociado (lo usa gestionarPagos.php antes de guardar un abono)
    public function obtenerPrestamoAsociado($idPrestamo, $idAsociado)
    {
        $sql = $this->consultaPrestamos() . " WHERE p.idPrestamo = :idPrestamo AND p.idAsociado = :idAsociado";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([
            ':idPrestamo' => $idPrestamo,
            ':idAsociado' => $idAsociado
        ]);
        $prestamo = $consulta->fetch();
        return $prestamo ? $this->calcularResumen($prestamo) : false;
    }

    // Un prestamo por su id, de cualquier asociado (lo usa el admin antes de editar o eliminar)
    public function obtenerPrestamo($idPrestamo)
    {
        $sql = $this->consultaPrestamos() . " WHERE p.idPrestamo = :idPrestamo";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':idPrestamo' => $idPrestamo]);
        $prestamo = $consulta->fetch();
        return $prestamo ? $this->calcularResumen($prestamo) : false;
    }

    // Calcula cuota, saldo, proxima fecha y estado con interes simple:
    // total a pagar = valor + (valor x tasa x numero de cuotas)
    public function calcularResumen($prestamo)
    {
        $valor = (float) $prestamo['valorPrestamo'];
        $tasa = (float) $prestamo['tasaInteres'];
        $cuotas = (int) $prestamo['numeroCuotas'];
        $totalPagado = (float) $prestamo['totalPagado'];

        $totalPagar = round($valor * (1 + ($tasa / 100) * $cuotas), 2);
        $valorCuota = round($totalPagar / $cuotas, 2);
        $saldo = max(0, round($totalPagar - $totalPagado, 2));

        // Cuotas completas que cubre lo pagado (+0.01 para no perder una cuota por el redondeo)
        $cuotasPagadas = $saldo <= 0 ? $cuotas : min($cuotas, (int) floor(($totalPagado + 0.01) / $valorCuota));

        // Meses que han pasado desde el prestamo: cada mes vence una cuota
        $fechaPrestamo = new DateTime($prestamo['fechaPrestamo']);
        $hoy = new DateTime('today');
        $mesesTranscurridos = 0;
        if ($hoy > $fechaPrestamo) {
            $diferencia = $fechaPrestamo->diff($hoy);
            $mesesTranscurridos = $diferencia->y * 12 + $diferencia->m;
        }
        $cuotasVencidas = min($cuotas, $mesesTranscurridos);
        $debePagado = min($totalPagar, $cuotasVencidas * $valorCuota);

        if ($saldo <= 0) {
            $estado = 'Pagado';
        } elseif ($totalPagado + 0.01 < $debePagado) {
            $estado = 'En mora'; // Pago menos de lo que ya se vencio
        } else {
            $estado = 'Al día';
        }

        // La siguiente cuota vence un mes despues de la ultima cuota pagada
        $proximoPago = null;
        if ($estado !== 'Pagado') {
            $proximoPago = (clone $fechaPrestamo)->modify('+' . ($cuotasPagadas + 1) . ' months')->format('Y-m-d');
        }

        return array_merge($prestamo, [
            'valorCuota' => $valorCuota,
            'totalPagado' => $totalPagado,
            'saldo' => $saldo,
            'cuotasPagadas' => $cuotasPagadas,
            'proximoPago' => $proximoPago,
            'estado' => $estado
        ]);
    }

    // Busca el id del asociado a partir de su documento (el admin escribe el documento en el formulario)
    public function buscarIdAsociado($documento)
    {
        $consulta = $this->conexion->prepare("SELECT idAsociado FROM asociados WHERE documento = :documento");
        $consulta->execute([':documento' => $documento]);
        return $consulta->fetchColumn();
    }

    public function guardar($datos)
    {
        $sql = "INSERT INTO prestamos (valorPrestamo, tasaInteres, numeroCuotas, fechaPrestamo, idAsociado)
                VALUES (:valorPrestamo, :tasaInteres, :numeroCuotas, :fechaPrestamo, :idAsociado)";
        $consulta = $this->conexion->prepare($sql);
        return $consulta->execute([
            ':valorPrestamo' => $datos['valorPrestamo'],
            ':tasaInteres' => self::TASA_INTERES, // Siempre 1%, no se recibe del formulario
            ':numeroCuotas' => $datos['numeroCuotas'],
            ':fechaPrestamo' => $datos['fechaPrestamo'],
            ':idAsociado' => $datos['idAsociado']
        ]);
    }

    // Igual que editar() de actividades.php. La tasa sigue fija en 1%.
    public function editar($datos)
    {
        $sql = "UPDATE prestamos
                SET valorPrestamo = :valorPrestamo, numeroCuotas = :numeroCuotas,
                    fechaPrestamo = :fechaPrestamo, idAsociado = :idAsociado
                WHERE idPrestamo = :idPrestamo";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([
            ':valorPrestamo' => $datos['valorPrestamo'],
            ':numeroCuotas' => $datos['numeroCuotas'],
            ':fechaPrestamo' => $datos['fechaPrestamo'],
            ':idAsociado' => $datos['idAsociado'],
            ':idPrestamo' => $datos['idPrestamo']
        ]);

        if ($consulta->rowCount() > 0) {
            return true; // Se actualizo al menos una fila
        }

        // rowCount() es 0 si los datos no cambiaron: comprobamos que el prestamo exista
        $verificar = $this->conexion->prepare("SELECT 1 FROM prestamos WHERE idPrestamo = :idPrestamo");
        $verificar->execute([':idPrestamo' => $datos['idPrestamo']]);
        return (bool) $verificar->fetchColumn();
    }

    // Igual que eliminar() de actividades.php
    public function eliminar($idPrestamo)
    {
        $consulta = $this->conexion->prepare("DELETE FROM prestamos WHERE idPrestamo = :idPrestamo");
        $consulta->execute([':idPrestamo' => $idPrestamo]);
        return $consulta->rowCount() > 0;
    }
}
