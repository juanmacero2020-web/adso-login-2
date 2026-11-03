document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    const clave = event.target.dataset.clave;
    const registros = JSON.parse(localStorage.getItem(clave)) || [];

    registros.push(Object.fromEntries(new FormData(event.target)));
    localStorage.setItem(clave, JSON.stringify(registros));
    alert("Registro guardado");
    event.target.reset();
});
