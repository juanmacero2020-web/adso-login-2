// Nuevo: controlador de prestamos.html, con la misma estructura que actividades.js
const listaPrestamos = document.getElementById("listaPrestamos");
let esAdministrador = false;
let prestamos = [];
let accionesConfiguradas = false;
const formulario = document.getElementById("formularioPrestamo");
const modalFormulario = new bootstrap.Modal(document.getElementById("modalFormulario"));

// Tasa fija del club: 1% mensual (la misma constante TASA_INTERES de prestamos.php)
const TASA_INTERES = 1;

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
    const respuesta = await fetch("../modelo/gestionarPrestamos.php", opciones);

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

async function cargarPrestamos() {
    try {
        const resultado = await solicitarApi("GET");
        esAdministrador = resultado.rol === "admin";
        configurarAcciones();

        prestamos = resultado.prestamos;
        mostrarPrestamos();
    } catch (error) {
        mostrarMensajeTabla("No se pudieron cargar los préstamos: " + error.message);
    }
}

function mostrarMensajeTabla(mensaje) {
    listaPrestamos.replaceChildren();
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    // El admin tiene dos columnas mas (Asociado y Acciones)
    celda.colSpan = esAdministrador ? 12 : 10;
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
        mostrarMensajeTabla(esAdministrador ? "No hay préstamos registrados" : "No tienes préstamos registrados");
        return;
    }
    listaPrestamos.replaceChildren();
    prestamos.forEach((prestamo) => {
        const fila = document.createElement("tr");
        fila.append(crearCelda(prestamo.idPrestamo));
        if (esAdministrador) {
            fila.append(crearCelda(`${prestamo.asociado} (${prestamo.documento})`));
        }
        // text-nowrap: las fechas y los valores no se parten en dos lineas
        fila.append(
            crearCelda(formatearDinero(prestamo.valorPrestamo), "text-nowrap"),
            crearCelda(`${Number(prestamo.tasaInteres)}%`),
            crearCelda(`${prestamo.cuotasPagadas} / ${prestamo.numeroCuotas}`, "text-nowrap"),
            crearCelda(formatearDinero(prestamo.valorCuota), "text-nowrap"),
            crearCelda(prestamo.fechaPrestamo, "text-nowrap"),
            crearCelda(prestamo.proximoPago ?? "—", "text-nowrap"),
            crearCelda(formatearDinero(prestamo.totalPagado), "text-nowrap"),
            crearCelda(formatearDinero(prestamo.saldo), "text-nowrap"),
            crearCeldaEstado(prestamo.estado)
        );
        // Nuevo: botones de editar y eliminar, igual que en actividades.js
        if (esAdministrador) {
            const acciones = document.createElement("td");
            acciones.className = "text-nowrap";

            const botonEditar = document.createElement("button");
            botonEditar.type = "button";
            botonEditar.className = "btn btn-sm btn-outline-primary me-2";
            botonEditar.title = "Editar";
            botonEditar.innerHTML = `<i class="bi bi-pencil-square"></i>`;
            botonEditar.addEventListener("click", () => abrirEdicion(prestamo));

            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.className = "btn btn-sm btn-outline-danger";
            botonEliminar.title = "Eliminar";
            botonEliminar.innerHTML = `<i class="bi bi-trash"></i>`;
            botonEliminar.addEventListener("click", () => eliminarPrestamo(prestamo));

            // Un prestamo con pagos no se cambia: se dañarian el saldo y el historial
            // (gestionarPrestamos.php tambien lo revisa)
            if (Number(prestamo.totalPagado) > 0) {
                botonEditar.disabled = true;
                botonEliminar.disabled = true;
                botonEditar.title = "Tiene pagos: no se puede editar";
                botonEliminar.title = "Tiene pagos: no se puede eliminar";
            }

            acciones.append(botonEditar, botonEliminar);
            fila.append(acciones);
        }
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

// Estado con color: verde = al dia, rojo = en mora, gris = pagado
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

function configurarAcciones() {
    if (accionesConfiguradas) {
        return;
    }
    if (esAdministrador) {
        document.getElementById("botonNuevoPrestamo").classList.remove("d-none");
        document.getElementById("encabezadoAsociado").classList.remove("d-none");
        document.getElementById("encabezadoAcciones").classList.remove("d-none");
        document.getElementById("textoAyuda").textContent =
            "Préstamos otorgados a los asociados. La tasa de interés es fija del 1% mensual.";
        accionesConfiguradas = true;
    }
}

function abrirCreacion() {
    formulario.reset();
    document.getElementById("idPrestamo").value = "";
    document.getElementById("tasaInteres").value = `${TASA_INTERES}%`;
    document.getElementById("resumenCuota").textContent = "";
    document.getElementById("tituloFormulario").textContent = "Nuevo préstamo";
    document.getElementById("botonGuardar").textContent = "Guardar";
    modalFormulario.show();
}
document.getElementById("botonNuevoPrestamo").addEventListener("click", abrirCreacion);

// Nuevo: abre el mismo modal con los datos del prestamo (igual que abrirEdicion() de actividades.js)
function abrirEdicion(prestamo) {
    formulario.reset();
    document.getElementById("idPrestamo").value = prestamo.idPrestamo;
    document.getElementById("documento").value = prestamo.documento;
    document.getElementById("valorPrestamo").value = Number(prestamo.valorPrestamo);
    document.getElementById("numeroCuotas").value = prestamo.numeroCuotas;
    document.getElementById("fechaPrestamo").value = prestamo.fechaPrestamo;
    document.getElementById("tasaInteres").value = `${TASA_INTERES}%`;
    actualizarResumen();

    document.getElementById("tituloFormulario").textContent = "Editar préstamo";
    document.getElementById("botonGuardar").textContent = "Guardar cambios";
    modalFormulario.show();
}

// Nuevo: igual que eliminarActividad() de actividades.js
async function eliminarPrestamo(prestamo) {
    const confirmacion = window.confirm(`¿Está seguro de que desea eliminar el préstamo #${prestamo.idPrestamo} de ${prestamo.asociado}?`);
    if (!confirmacion) {
        return;
    }
    try {
        await solicitarApi("DELETE", { idPrestamo: prestamo.idPrestamo });
        await cargarPrestamos();
        alert("Préstamo eliminado correctamente");
    } catch (error) {
        alert(error.message);
    }
}

// Muestra en el modal cuanto se pagara: interes simple, igual que calcularResumen() en prestamos.php
function actualizarResumen() {
    const valor = Number(document.getElementById("valorPrestamo").value);
    const cuotas = Number(document.getElementById("numeroCuotas").value);
    const resumen = document.getElementById("resumenCuota");
    if (valor <= 0 || !Number.isInteger(cuotas) || cuotas < 1) {
        resumen.textContent = "";
        return;
    }
    const totalPagar = valor * (1 + (TASA_INTERES / 100) * cuotas);
    resumen.textContent = `Total a pagar: ${formatearDinero(totalPagar)} · Cuota mensual: ${formatearDinero(totalPagar / cuotas)}`;
}
document.getElementById("valorPrestamo").addEventListener("input", actualizarResumen);
document.getElementById("numeroCuotas").addEventListener("input", actualizarResumen);

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const idPrestamo = document.getElementById("idPrestamo").value;
    const datos = {
        documento: document.getElementById("documento").value.trim(),
        valorPrestamo: Number(document.getElementById("valorPrestamo").value),
        numeroCuotas: Number(document.getElementById("numeroCuotas").value),
        fechaPrestamo: document.getElementById("fechaPrestamo").value
    };
    // Nuevo: si hay id es una edicion (PUT); si no, un prestamo nuevo (POST)
    if (idPrestamo) {
        datos.idPrestamo = Number(idPrestamo);
    }
    try {
        await solicitarApi(idPrestamo ? "PUT" : "POST", datos);
        modalFormulario.hide();
        alert(idPrestamo ? "Préstamo actualizado correctamente" : "Préstamo guardado correctamente");
        cargarPrestamos();
    } catch (error) {
        alert(error.message);
    }
});

cargarPrestamos();
