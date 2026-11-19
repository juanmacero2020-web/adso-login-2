const listaActividades = document.getElementById("listaActividades");
let esAdministrador = false;
let actividades = [];
let accionesConfiguradas = false;
const formulario = document.getElementById("formularioActividad");
const modalFormulario = new bootstrap.Modal(document.getElementById("modalFormulario"));

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
    const respuesta = await fetch("../modelo/gestionarActividades.php", opciones);

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

async function cargarActividades() {
    try {
        const resultado = await solicitarApi("GET");
        esAdministrador = resultado.rol === "admin";
        configurarAcciones();

        actividades = resultado.actividades;
        mostrarActividades();
    } catch (error) {
        mostrarMensajeTabla("No se pudieron cargar las actividades: " + error.message);
    }
}

function mostrarMensajeTabla(mensaje) {
    listaActividades.replaceChildren();
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = esAdministrador ? 5 : 4;
    celda.className = "text-center py-4 text-muted";
    celda.textContent = mensaje;
    fila.append(celda);
    listaActividades.append(fila);
}

function formatearDinero(valor) {
    if (valor === null) {
        return "pendiente";
    }
    return Number(valor).toLocaleString("es-CO", { style: "currency", currency: "COP" });
}

function mostrarActividades() {
    if (actividades.length === 0) {
        mostrarMensajeTabla("No hay actividades disponibles");
        return;
    }
    listaActividades.replaceChildren();
    actividades.forEach((actividad) => {
        const fila = document.createElement("tr");
        fila.append(
            crearCelda(actividad.nombreActividad),
            crearCelda(actividad.fechaEvento),
            crearCelda(actividad.municipio),
            crearCelda(formatearDinero(actividad.totalRecaudado))
        );
        if (esAdministrador) {
            const acciones = document.createElement("td");
            acciones.className = "text-nowrap";

            const botonEditar = document.createElement("button");
            botonEditar.type = "button";
            botonEditar.className = "btn btn-sm btn-outline-primary me-2";
            botonEditar.title = "Editar";
            botonEditar.innerHTML = `<i class="bi bi-pencil-square"></i>`;
            botonEditar.addEventListener("click", () => abrirEdicion(actividad));

            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.className = "btn btn-sm btn-outline-danger";
            botonEliminar.title = "Eliminar";
            botonEliminar.innerHTML = `<i class="bi bi-trash"></i>`;
            botonEliminar.addEventListener("click", () => eliminarActividad(actividad));

            acciones.append(botonEditar, botonEliminar);
            fila.append(acciones);
        }
        listaActividades.append(fila);
    });
}

function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
}

function abrirCreacion() {
    formulario.reset();
    formulario.classList.remove("was-validated");
    document.getElementById("idActividad").value = "";
    document.getElementById("campoTotalRecaudado").classList.add("d-none");
    document.getElementById("tituloFormulario").textContent = "Nueva actividad";
    document.getElementById("botonGuardar").textContent = "Guardar";
    modalFormulario.show();
}
document.getElementById("botonNuevaActividad").addEventListener("click", abrirCreacion);

async function eliminarActividad(actividad) {
    const confirmacion = window.confirm(`¿Está seguro de que desea eliminar la actividad "${actividad.nombreActividad}"?`);
    if (!confirmacion) {
        return;
    }
    try {
        await solicitarApi("DELETE", { idActividad: actividad.idActividad });
        await cargarActividades();
        alert("Actividad eliminada correctamente");
    } catch (error) {
        alert(error.message);
    }
}

function configurarAcciones() {
    if (accionesConfiguradas) {
        return;
    }
    const botonNueva = document.getElementById("botonNuevaActividad");
    const encabezadoAcciones = document.getElementById("encabezadoAcciones");
    if (esAdministrador) {
        botonNueva.classList.remove("d-none");
        encabezadoAcciones.classList.remove("d-none");
        accionesConfiguradas = true;
    }
}
function abrirEdicion(actividad) {
    formulario.reset();
    document.getElementById("idActividad").value = actividad.idActividad;
    document.getElementById("nombreActividad").value = actividad.nombreActividad;
    document.getElementById("fechaEvento").value = actividad.fechaEvento;
    document.getElementById("municipio").value = actividad.municipio;
    document.getElementById("totalRecaudado").value = actividad.totalRecaudado ?? 0;

    document.getElementById("campoTotalRecaudado").classList.remove("d-none");
    document.getElementById("tituloFormulario").textContent = "Editar actividad";
    document.getElementById("botonGuardar").textContent = "Guardar cambios";
    modalFormulario.show();
}
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const idActividad = document.getElementById("idActividad").value;
    const datos = {
        nombreActividad: document.getElementById("nombreActividad").value.trim(),
        fechaEvento: document.getElementById("fechaEvento").value,
        municipio: document.getElementById("municipio").value.trim(),
       
    };
    if (idActividad){
        datos.idActividad = Number(idActividad);
        const total = document.getElementById("totalRecaudado").value;
        datos.totalRecaudado = total === "" ? null : Number(total);
    }
    try {
        await solicitarApi(idActividad ? "PUT" : "POST", datos);
        modalFormulario.hide();
        alert ("actualizada correctamente");
        cargarActividades();
       
    } catch (error) {
     alert( error.message);
    }
});
    cargarActividades();
