document.addEventListener("DOMContentLoaded", () => {
    const logueado = localStorage.getItem("logueado");

    if (!logueado) {
        window.location.href = "../vista/login.html";
        return;
    }
    const nombre = localStorage.getItem("nombre");
    const rol = localStorage.getItem("rol");

    document.getElementById("nombreUsuario").textContent = nombre;
    if (rol === "admin") {
        document.getElementById("tarjetasAdministrador").classList.remove("d-none");
        document.getElementById("tarjetasAsociados").classList.add("d-none");
    } else {
        document.getElementById("tarjetasAsociados").classList.remove("d-none");
        document.getElementById("tarjetasAdministrador").classList.add("d-none");
    }

   
   async function cerrarSesion() {
        try {
         // Nombre en minuscula, igual al archivo real (cerrarsesion.php): en Linux (Hostinger) las mayusculas importan
         const respuesta = await fetch( "../modelo/cerrarsesion.php",{
            method: "POST",
         });

            if (!respuesta.ok) {
                throw new Error("Error al cerrar sesión");
            }
            localStorage.clear();
            window.location.href = "../vista/login.html";
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }

    }

    // Conecta el boton "Cerrar" con la funcion: sin esta linea el boton no hacia nada
    document.getElementById("btnCerrarSesion").addEventListener("click", cerrarSesion);

});