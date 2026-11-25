// Nuevo: controlador de asociados.html (CRUD para el admin), con la misma estructura que actividades.js.
// No confundir con asociados.js, que es el del formulario de registro.html.
const listaAsociados = document.getElementById("listaAsociados");
let asociados = [];
let idAsociadoSesion = 0; // El admin que inicio sesion: no se puede eliminar a si mismo
const formulario = document.getElementById("formularioAsociado");
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
    const respuesta = await fetch("../modelo/gestionarAsociados.php", opciones);

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

async function cargarAsociados() {
    try {
        const resultado = await solicitarApi("GET");
        idAsociadoSesion = Number(resultado.idAsociadoSesion);
        asociados = resultado.asociados;
        mostrarAsociados();
    } catch (error) {
        mostrarMensajeTabla("No se pudieron cargar los asociados: " + error.message);
    }
}

function mostrarMensajeTabla(mensaje) {
    listaAsociados.replaceChildren();
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 8;
    celda.className = "text-center py-4 text-muted";
    celda.textContent = mensaje;
    fila.append(celda);
    listaAsociados.append(fila);
}

function mostrarAsociados() {
    if (asociados.length === 0) {
        mostrarMensajeTabla("No hay asociados registrados");
        return;
    }
    listaAsociados.replaceChildren();
    asociados.forEach((asociado) => {
        const fila = document.createElement("tr");
        fila.append(
            crearCelda(asociado.documento),
            crearCelda(`${asociado.nombres} ${asociado.apellidos}`),
            crearCelda(asociado.email),
            crearCelda(asociado.telefono),
            crearCelda(asociado.ciudad),
            crearCeldaRol(asociado.rol),
            crearCelda(asociado.prestamos)
        );

        // Botones de editar y eliminar, igual que en actividades.js
        const acciones = document.createElement("td");
        acciones.className = "text-nowrap";

        const botonEditar = document.createElement("button");
        botonEditar.type = "button";
        botonEditar.className = "btn btn-sm btn-outline-primary me-2";
        botonEditar.title = "Editar";
        botonEditar.innerHTML = `<i class="bi bi-pencil-square"></i>`;
        botonEditar.addEventListener("click", () => abrirEdicion(asociado));

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.className = "btn btn-sm btn-outline-danger";
        botonEliminar.title = "Eliminar";
        botonEliminar.innerHTML = `<i class="bi bi-trash"></i>`;
        botonEliminar.addEventListener("click", () => eliminarAsociado(asociado));

        // No se puede eliminar a uno mismo ni a quien tiene prestamos (gestionarAsociados.php tambien lo revisa)
        if (Number(asociado.idAsociado) === idAsociadoSesion) {
            botonEliminar.disabled = true;
            botonEliminar.title = "No puedes eliminar tu propia cuenta";
        } else if (Number(asociado.prestamos) > 0) {
            botonEliminar.disabled = true;
            botonEliminar.title = "Tiene préstamos: no se puede eliminar";
        }

        acciones.append(botonEditar, botonEliminar);
        fila.append(acciones);
        listaAsociados.append(fila);
    });
}

function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
}

// Rol con color: naranja para admin, azul para asociado
function crearCeldaRol(rol) {
    const celda = document.createElement("td");
    const etiqueta = document.createElement("span");
    etiqueta.className = rol === "admin" ? "badge text-bg-warning" : "badge text-bg-primary";
    etiqueta.textContent = rol;
    celda.append(etiqueta);
    return celda;
}

function abrirCreacion() {
    formulario.reset();
    document.getElementById("idAsociado").value = "";
    document.getElementById("documento").readOnly = false;
    document.getElementById("documento").classList.remove("bg-body-secondary");
    // Un asociado nuevo siempre entra con rol "asociado" y necesita contraseña
    document.getElementById("campoRol").classList.add("d-none");
    document.getElementById("etiquetaPassword").textContent = "Contraseña";
    document.getElementById("password").placeholder = "mínimo 8 caracteres";
    document.getElementById("tituloFormulario").textContent = "Nuevo asociado";
    document.getElementById("botonGuardar").textContent = "Guardar";
    modalFormulario.show();
}
document.getElementById("botonNuevoAsociado").addEventListener("click", abrirCreacion);

async function eliminarAsociado(asociado) {
    const confirmacion = window.confirm(`¿Está seguro de que desea eliminar al asociado "${asociado.nombres} ${asociado.apellidos}"?`);
    if (!confirmacion) {
        return;
    }
    try {
        await solicitarApi("DELETE", { idAsociado: asociado.idAsociado });
        await cargarAsociados();
        alert("Asociado eliminado correctamente");
    } catch (error) {
        alert(error.message);
    }
}

function abrirEdicion(asociado) {
    formulario.reset();
    document.getElementById("idAsociado").value = asociado.idAsociado;
    document.getElementById("documento").value = asociado.documento;
    document.getElementById("nombres").value = asociado.nombres;
    document.getElementById("apellidos").value = asociado.apellidos;
    document.getElementById("fechaNacimiento").value = asociado.fechaNacimiento;
    document.getElementById("genero").value = asociado.genero;
    document.getElementById("direccionResidencia").value = asociado.direccionResidencia;
    document.getElementById("ciudad").value = asociado.ciudad;
    document.getElementById("telefono").value = asociado.telefono;
    document.getElementById("email").value = asociado.email;
    document.getElementById("rol").value = asociado.rol;

    // El documento no se cambia al editar (queda gris, solo de lectura)
    document.getElementById("documento").readOnly = true;
    document.getElementById("documento").classList.add("bg-body-secondary");
    document.getElementById("campoRol").classList.remove("d-none");
    document.getElementById("etiquetaPassword").textContent = "Nueva contraseña (opcional)";
    document.getElementById("password").placeholder = "déjala vacía para no cambiarla";
    document.getElementById("tituloFormulario").textContent = "Editar asociado";
    document.getElementById("botonGuardar").textContent = "Guardar cambios";
    modalFormulario.show();
}

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const idAsociado = document.getElementById("idAsociado").value;
    const datos = {
        nombres: document.getElementById("nombres").value.trim(),
        apellidos: document.getElementById("apellidos").value.trim(),
        fechaNacimiento: document.getElementById("fechaNacimiento").value,
        genero: document.getElementById("genero").value,
        direccionResidencia: document.getElementById("direccionResidencia").value.trim(),
        ciudad: document.getElementById("ciudad").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
    };
    if (idAsociado) {
        datos.idAsociado = Number(idAsociado);
        datos.rol = document.getElementById("rol").value;
    } else {
        datos.documento = document.getElementById("documento").value.trim();
    }
    try {
        await solicitarApi(idAsociado ? "PUT" : "POST", datos);
        modalFormulario.hide();
        alert(idAsociado ? "Asociado actualizado correctamente" : "Asociado guardado correctamente");
        cargarAsociados();
    } catch (error) {
        alert(error.message);
    }
});

cargarAsociados();
