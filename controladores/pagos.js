// Nuevo: controlador de pagos.html, con la misma estructura que actividades.js
const listaPrestamos = document.getElementById("listaPrestamos");
const formulario = document.getElementById("formularioPago");
const botonGuardar = document.getElementById("botonGuardar");
let prestamos = [];
let documentoAsociado = "";

async function solicitarApi(metodo, datos) {
    const opciones = {
        method: metodo,
        headers: {
            "Content-Type": "application/json"
        }
    };
    // GET no puede llevar cuerpo; solo se envia cuando hay datos
    if (datos) {
        opciones.body = JSON.stringify(datos);
    }
    const respuesta = await fetch("../modelo/gestionarPagos.php", opciones);

    if (respuesta.status === 401) {
        window.location.href = "../vista/login.html";
        throw new Error("Sesión expirada");
    }

    let resultado;
    try {
        resultado = await respuesta.json();
    } catch {
        throw new Error(`El servidor respondió con un error (${respuesta.status})`);
    }

    if (!respuesta.ok || !resultado.success) {
        throw new Error(resultado.message || "Error en la solicitud");
    }
    return resultado;
}

async function cargarPagos() {
    try {
        const resultado = await solicitarApi("GET");
        documentoAsociado = resultado.documento;
        prestamos = resultado.prestamos;

        limpiarFormulario();
        mostrarPrestamos();
    } catch (error) {
        mostrarMensajeTabla("No se pudieron cargar los préstamos: " + error.message);
    }
}

function mostrarMensajeTabla(mensaje) {
    listaPrestamos.replaceChildren();
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 6;
    celda.className = "text-center py-4 text-muted";
    celda.textContent = mensaje;
    fila.append(celda);
    listaPrestamos.append(fila);
}

function formatearDinero(valor) {
    if (valor === null) {
        return "pendiente";
    }
    return Number(valor).toLocaleString("es-CO", { style: "currency", currency: "COP" });
}

function mostrarPrestamos() {
    if (prestamos.length === 0) {
        mostrarMensajeTabla("No tienes préstamos registrados");
        return;
    }
    listaPrestamos.replaceChildren();
    prestamos.forEach((prestamo) => {
        const fila = document.createElement("tr");
        fila.dataset.idPrestamo = prestamo.idPrestamo;
        // text-nowrap: los valores no se parten en dos lineas.
        // Proximo pago y Estado se ven en "Mis Préstamos"; aqui solo lo necesario para abonar.
        fila.append(
            crearCelda(prestamo.idPrestamo),
            crearCelda(formatearDinero(prestamo.valorPrestamo), "text-nowrap"),
            crearCelda(`${prestamo.cuotasPagadas} / ${prestamo.numeroCuotas}`, "text-nowrap"),
            crearCelda(formatearDinero(prestamo.valorCuota), "text-nowrap"),
            crearCelda(formatearDinero(prestamo.saldo), "text-nowrap")
        );

        const acciones = document.createElement("td");
        const botonSeleccionar = document.createElement("button");
        botonSeleccionar.type = "button";
        botonSeleccionar.className = "btn btn-sm btn-outline-primary text-nowrap";
        botonSeleccionar.innerHTML = `<i class="bi bi-check2-circle"></i> Seleccionar`;
        // Un prestamo pagado ya no recibe abonos
        if (prestamo.estado === "Pagado") {
            botonSeleccionar.disabled = true;
            botonSeleccionar.title = "Préstamo pagado";
        }
        botonSeleccionar.addEventListener("click", () => seleccionarPrestamo(prestamo));
        acciones.append(botonSeleccionar);
        fila.append(acciones);

        listaPrestamos.append(fila);
    });
}

// La clase es opcional (por ejemplo "text-nowrap")
function crearCelda(texto, clase) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    if (clase) {
        celda.className = clase;
    }
    return celda;
}

// Pasa los datos del prestamo elegido al formulario de abono
function seleccionarPrestamo(prestamo) {
    document.getElementById("idPrestamo").value = prestamo.idPrestamo;
    document.getElementById("prestamoSeleccionado").value = `#${prestamo.idPrestamo} - ${formatearDinero(prestamo.valorPrestamo)}`;
    document.getElementById("saldoPendiente").value = formatearDinero(prestamo.saldo);
    document.getElementById("valorCuotaPrestamo").value = formatearDinero(prestamo.valorCuota);

    // Sugiere pagar una cuota; si queda menos que una cuota, sugiere el saldo
    const valorAbono = document.getElementById("valorAbono");
    valorAbono.value = Math.min(prestamo.valorCuota, prestamo.saldo);
    valorAbono.max = prestamo.saldo;

    // Resalta la fila elegida en la tabla
    listaPrestamos.querySelectorAll("tr").forEach((fila) => {
        fila.classList.toggle("table-warning", fila.dataset.idPrestamo === String(prestamo.idPrestamo));
    });

    botonGuardar.disabled = false;
    valorAbono.focus();
}

function limpiarFormulario() {
    formulario.reset();
    document.getElementById("idPrestamo").value = "";
    document.getElementById("documento").value = documentoAsociado;
    listaPrestamos.querySelectorAll("tr").forEach((fila) => fila.classList.remove("table-warning"));
    botonGuardar.disabled = true;
}
document.getElementById("botonLimpiar").addEventListener("click", limpiarFormulario);

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const idPrestamo = document.getElementById("idPrestamo").value;
    if (!idPrestamo) {
        alert("Selecciona un préstamo de la tabla");
        return;
    }
    const datos = {
        idPrestamo: Number(idPrestamo),
        documento: document.getElementById("documento").value,
        valorCuota: Number(document.getElementById("valorAbono").value),
        // La fecha no se envia: el servidor guarda la fecha de hoy
        metodoPago: document.getElementById("metodoPago").value
    };
    botonGuardar.disabled = true; // Evita guardar dos veces el mismo abono
    try {
        await solicitarApi("POST", datos);
        alert("Abono registrado correctamente");
        cargarPagos(); // Recarga la tabla para ver el nuevo saldo
    } catch (error) {
        alert(error.message);
        botonGuardar.disabled = false;
    }
});

cargarPagos();
