// Nuevo: controlador de pagos.html, con la misma estructura que actividades.js
const listaPrestamos = document.getElementById("listaPrestamos");
const listaPagos = document.getElementById("listaPagos");
const formulario = document.getElementById("formularioPago");
const botonGuardar = document.getElementById("botonGuardar");
let prestamos = [];
let pagos = [];
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
        pagos = resultado.pagos;

        limpiarFormulario();
        mostrarPrestamos();
        mostrarPagos();
    } catch (error) {
        mostrarMensajeTabla(listaPrestamos, 8, "No se pudieron cargar los préstamos: " + error.message);
        mostrarMensajeTabla(listaPagos, 4, "No se pudieron cargar los pagos: " + error.message);
    }
}

// Igual que en actividades.js, pero recibe la tabla y sus columnas porque esta pagina tiene dos tablas
function mostrarMensajeTabla(tabla, columnas, mensaje) {
    tabla.replaceChildren();
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = columnas;
    celda.className = "text-center py-4 text-muted";
    celda.textContent = mensaje;
    fila.append(celda);
    tabla.append(fila);
}

function formatearDinero(valor) {
    if (valor === null) {
        return "pendiente";
    }
    return Number(valor).toLocaleString("es-CO", { style: "currency", currency: "COP" });
}

// Fecha de hoy en formato YYYY-MM-DD con la hora local (toISOString sola usa la hora UTC)
function fechaHoy() {
    const hoy = new Date();
    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    return hoy.toISOString().slice(0, 10);
}

function mostrarPrestamos() {
    if (prestamos.length === 0) {
        mostrarMensajeTabla(listaPrestamos, 8, "No tienes préstamos registrados");
        return;
    }
    listaPrestamos.replaceChildren();
    prestamos.forEach((prestamo) => {
        const fila = document.createElement("tr");
        fila.dataset.idPrestamo = prestamo.idPrestamo;
        // text-nowrap: las fechas y los valores no se parten en dos lineas
        fila.append(
            crearCelda(prestamo.idPrestamo),
            crearCelda(formatearDinero(prestamo.valorPrestamo), "text-nowrap"),
            crearCelda(`${prestamo.cuotasPagadas} / ${prestamo.numeroCuotas}`, "text-nowrap"),
            crearCelda(formatearDinero(prestamo.valorCuota), "text-nowrap"),
            crearCelda(prestamo.proximoPago ?? "—", "text-nowrap"),
            crearCelda(formatearDinero(prestamo.saldo), "text-nowrap"),
            crearCeldaEstado(prestamo.estado)
        );

        const acciones = document.createElement("td");
        const botonSeleccionar = document.createElement("button");
        botonSeleccionar.type = "button";
        botonSeleccionar.className = "btn btn-sm btn-outline-primary text-nowrap";
        botonSeleccionar.innerHTML = `<i class="bi bi-check2-circle"></i> Seleccionar`;
        // Un prestamo pagado ya no recibe abonos
        botonSeleccionar.disabled = prestamo.estado === "Pagado";
        botonSeleccionar.addEventListener("click", () => seleccionarPrestamo(prestamo));
        acciones.append(botonSeleccionar);
        fila.append(acciones);

        listaPrestamos.append(fila);
    });
}

function mostrarPagos() {
    if (pagos.length === 0) {
        mostrarMensajeTabla(listaPagos, 4, "Todavía no has registrado pagos");
        return;
    }
    listaPagos.replaceChildren();
    pagos.forEach((pago) => {
        const fila = document.createElement("tr");
        fila.append(
            crearCelda(pago.fechaPago, "text-nowrap"),
            crearCelda(`#${pago.idPrestamo}`),
            crearCelda(formatearDinero(pago.valorCuota), "text-nowrap"),
            crearCelda(pago.metodoPago)
        );
        listaPagos.append(fila);
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

// Estado con color: verde = al dia, rojo = en mora, gris = pagado (igual que prestamos.js)
function crearCeldaEstado(estado) {
    const colores = {
        "Al día": "text-bg-success",
        "En mora": "text-bg-danger",
        "Pagado": "text-bg-secondary"
    };
    const celda = document.createElement("td");
    const etiqueta = document.createElement("span");
    etiqueta.className = `badge ${colores[estado] ?? "text-bg-light"}`;
    etiqueta.textContent = estado;
    celda.append(etiqueta);
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

    // La fecha de pago va entre la fecha del prestamo y hoy (lo mismo valida gestionarPagos.php)
    document.getElementById("fechaPago").min = prestamo.fechaPrestamo;

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
    const fechaPago = document.getElementById("fechaPago");
    fechaPago.value = fechaHoy();
    fechaPago.max = fechaHoy();
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
        fechaPago: document.getElementById("fechaPago").value,
        metodoPago: document.getElementById("metodoPago").value
    };
    botonGuardar.disabled = true; // Evita guardar dos veces el mismo abono
    try {
        await solicitarApi("POST", datos);
        alert("Abono registrado correctamente");
        cargarPagos(); // Recarga las tablas para ver el nuevo saldo y el historial
    } catch (error) {
        alert(error.message);
        botonGuardar.disabled = false;
    }
});

cargarPagos();
