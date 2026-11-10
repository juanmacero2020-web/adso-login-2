const formulario = document.getElementById("formLogin");
formulario.addEventListener("submit", async function (event) {
    event.preventDefault();
    const boton = formulario.querySelector("button[type='submit']");
    const  mensaje = document.getElementById("mensajeError");
    boton.disabled = true;
    
  
  try {
   const respuesta = await fetch(formulario.action, {
     method: "POST",
     headers: {"content-type": "application/json"},
     body: JSON.stringify(Object.fromEntries(new FormData(formulario).entries())),
   });
    const resultado = await respuesta.json();
 if (!resultado.success) {
    mensaje.textContent = "no fue posible iniciar sesion";
    boton.disabled = false;
    return;

   }
        localStorage.setItem('logueado', 'true');
        localStorage.setItem('rol', resultado.rol);
        localStorage.setItem('nombre', resultado.nombre);
        
        window.location.href = "dashboard.html";
  }catch (error) {
    console.error("Error al iniciar sesión:", error);
    mensaje.textContent = "Error al iniciar sesión, inténtalo de nuevo más tarde.";
  } finally {
    boton.disabled = false;
  }


  
});