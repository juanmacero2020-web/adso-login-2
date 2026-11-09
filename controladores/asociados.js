const formulario = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensajeRegistro");

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();
    const botonGuardar = formulario.querySelector("button[type='submit']");
    // Lee los campos del formulario y los convierte en un objeto
    const asociado = Object.fromEntries(new FormData(formulario));

  if(asociado.password !== asociado.confirmPassword) {
    document.getElementById("mensajeRegistro").textContent = "Las contraseñas no coinciden.";
    return;
  }
   delete asociado.confirmPassword;   

    botonGuardar.disabled = true; // Deshabilitar el botón mientras se procesa la solicitud
    mensaje.textContent = "Guardando...";
    mensaje.dataset.tipo = "";

    try {
        const respuesta = await fetch(formulario.action, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(asociado)
        });
        // Pasar la respuesta JSON a un objeto de JavaScript
        const resultado = await respuesta.json();
        mensaje.textContent = resultado.message;

        if (respuesta.ok && resultado.success) {
            formulario.reset(); // Limpiar el formulario si el registro fue exitoso
        }
    } catch (error) {
        console.error("Error al enviar el formulario:", error);
        mensaje.textContent = "Error al registrar el asociado. Por favor, inténtelo de nuevo.";
        mensaje.dataset.tipo = "error";
    } finally {
        botonGuardar.disabled = false; // Habilitar el botón después de procesar la solicitud
    }
});
