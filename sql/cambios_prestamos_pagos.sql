-- Cambios en la base club_acerias para los modulos de prestamos y pagos.
-- Ejecutar UNA sola vez en HeidiSQL o en la consola de MySQL de Laragon.

USE club_acerias;

-- Nuevo: guarda el metodo con el que el asociado pago cada abono (antes la tabla solo tenia valor, fecha y prestamo)
ALTER TABLE pagos_cuotas
    ADD metodoPago ENUM('Efectivo', 'Transferencia', 'PSE') NOT NULL DEFAULT 'Efectivo';
