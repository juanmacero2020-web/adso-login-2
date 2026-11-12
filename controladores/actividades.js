document.addEventListener("DOMContentLoaded", () => {
    // Igual que en dashboard.js: si no hay sesion, se manda al login
    const logueado = localStorage.getItem("logueado");

    if (!logueado) {
        window.location.href = "../vista/login.html";
        return;
    }

    const rol = localStorage.getItem("rol");
    const botonNueva = document.getElementById("nuevaActividad");

    // Solo el admin ve el boton "Nueva actividad" y la columna "Acciones"
    if (rol === "admin") {
        botonNueva.classList.remove("d-none");
        document.getElementById("encabezadoAcciones").classList.remove("d-none");
    }

    // El boton lleva al formulario que antes estaba en actividades.html
    botonNueva.addEventListener("click", () => {
        window.location.href = "registroActividad.html";
    });

    // Todavia no hay un PHP que liste las actividades desde MySQL,
    // asi que se quita "Cargando actividades..." y se muestra el mensaje #sinActividades.
    // Cuando el PHP funcione, aqui va el fetch que llena la tabla.
    document.getElementById("listaActividades").innerHTML = "";
    document.getElementById("sinActividades").classList.remove("d-none");
});

const listaActividades = document.getElementById("listaActividades");
async function solicitarApi(metodo,datos,) {
    const opciones = {
        method: metodo,
        headers: { "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    };
    if (datos) {
        opciones.body = JSON.stringify(datos);
    }
    const respuesta = await fetch("../modelo/gestionarActividades.php", opciones);
    const resultado = await respuesta.json();

    if (resultado.status === "401") {
        window.location.href = "../vista/login.html";
    }
     if (!resultado.ok|| resultado.success) {
        throw new Error(resultado.message || "Error en la solicitud");
  }
  return resultado;
}