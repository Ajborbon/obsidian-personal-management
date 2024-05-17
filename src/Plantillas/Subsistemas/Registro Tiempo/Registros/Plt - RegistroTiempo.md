<%*
debugger
const gp = app.plugins.plugins['obsidian-personal-management'];
let v;
let nombre = tp.file.title; // Título del archivo actual

// Decide si retomar un registro existente o iniciar uno nuevo
if (nombre.includes("Retomar")) {
    v = await gp.registroTiempoAPI.retomarRegistro(nombre.split(" ")[1]);
} else {
    v = await gp.registroTiempoAPI.iniciarRegistro();
}

// Si v.detener es verdadero, termina la ejecución y elimina el archivo
if (v.detener) {
debugger
    const fileToDelete = this.app.vault.getAbstractFileByPath(tp.file.path(true));
    if (fileToDelete) {
        await this.app.vault.delete(fileToDelete);
        new Notice("Creación de registro cancelada y nota eliminada.");
    } else {
        new Notice("Error: No se pudo encontrar el archivo para eliminar.");
    }
    return false; // Termina la ejecución de la plantilla
}

// Procede con mover el archivo y otras operaciones
try {
    await tp.file.move(v.nameFile);
    new Notice(`Se inició el registro de la Actividad ${v.titulo}`);
} catch(err) {
    new Notice(`Error al mover el archivo: ${err.message}`);
}
-%>
---
version: 1.1
typeName: RegistroTiempo
type: RT
fecha: <% v.fecha %>
horaInicio: <% v.fecha %>
horaFinal: <%  v.fecha %>
tiempoTrabajado: 0
id: <%v.id%>
idSec: <%v.idSec%>
estado: 🟢
descripcion:  
titulo: <% v.titulo%> 
aliases: <%* for (const alias of v.aliases){%>
- <%alias%> <%* }%>
areaVida: <%* if (v.areaVida != "No es de ningún Area de Vida"){ %> "[[<% v.areaVida%>]]" <%* } %>
areaInteres: <%* if (typeof v.areaInteres === 'undefined' || v.areaInteres.length === 0) { } else if (typeof v.areaInteres === 'string') { %>
- "[[<%v.areaInteres%>]]" <%* } else if (Array.isArray(v.areaInteres)) { for (let a = 0; a < v.areaInteres.length; a++) { %>
- "[[<%v.areaInteres[a]%>]]" <%* }} %>
proyectoGTD: <%* if (typeof v.proyectoGTD === 'undefined' || v.proyectoGTD.length === 0) { } else if (typeof v.proyectoGTD === 'string') { %>
- "[[<%v.proyectoGTD%>]]" <%* } else if (Array.isArray(v.proyectoGTD)) { for (let a = 0; a < v.proyectoGTD.length; a++) { %>
- "[[<%v.proyectoGTD[a]%>]]" <%* }} %>
proyectoQ:<%* if (typeof v.proyectoQ === 'undefined' || v.proyectoQ.length === 0) { } else if (typeof v.proyectoQ === 'string') { %>
- "[[<%v.proyectoQ%>]]" <%* } else if (Array.isArray(v.proyectoQ)) { for (let a = 0; a < v.proyectoQ.length; a++) { %>
- "[[<%v.proyectoQ[a]%>]]" <%* }} %>
asunto:<%* if (v.siAsunto) { %>
- "[[<% v.nombre %>]]"
<%* } else if (v.asuntoRetomado && (typeof v.asuntoRetomado === 'string' || Array.isArray(v.asuntoRetomado))) {
    if (typeof v.asuntoRetomado === 'string') { 
        %>
- "<% v.asuntoRetomado %>"
<%* } else { // Si es un array 
        %>
<% v.asuntoRetomado.map(item => `- "${item}"`).join('\n') %>
<%* } } %>

---

# `VIEW[{aliases[0]}]`
```dataviewjs
//V1.0 carrusel API
// Forma de acceder al objeto gp desde DVJS
const gp = app.plugins.plugins['obsidian-personal-management']
const {callDV} = customJS
let typeName = dv.current().typeName;
// Luego, construimos las claves dinámicas para acceder a las propiedades en gp.settings
let indiceKey = `indice_${typeName}`;
let folderKey = `folder_${typeName}`;
// Finalmente, usamos las claves para obtener los valores de gp.settings
let indice = dv.page(gp.settings[indiceKey]);
let folder = `${gp.settings[folderKey]}`;
 let notas = dv.pages().where(page => page.file.path.startsWith(folder)).sort((b) => b.id, "asc");
gp.addOnsAPI.crearPrevNext(notas,indice,dv)
```
```dataviewjs
dv.span("Registro de Tiempo relacionado a " + (dv.current().asunto ? "asunto: " + dv.func.link(dv.page(dv.current().asunto[0].path).file.link, dv.page(dv.current().asunto[0].path).file.aliases[0]) + ", " : "") + (dv.current().proyectoGTD ? "PGTD: " + dv.current().proyectoGTD.map(entry => dv.func.link(dv.page(entry.path).file.link, dv.page(entry.path).file.aliases[0])).join(", ") + ", " : "") + (dv.current().proyectoQ ? "PQ: " + dv.func.link(dv.page(dv.current().proyectoQ[0].path).file.link, dv.page(dv.current().proyectoQ[0].path).titulo) + ", " : "") + (dv.current().areaInteres ? "AI: " + dv.current().areaInteres.map(entry => dv.func.link(dv.page(entry.path).file.link, dv.page(entry.path).titulo)).join(", ") + ", " : "") + (dv.current().areaVida ? "AV: " + dv.current().areaVida + ", " : "") + " en estado " + dv.current().estado)
```
```dataviewjs
if (dv.current().estado==="🟢"){
	dv.container.innerHTML = ''; // Limpiar el contenedor
    const botonUpdate = document.createElement('button');
    botonUpdate.textContent = 'Cerrar Registro Tiempo';
    dv.container.appendChild(botonUpdate);

    botonUpdate.onclick = async () => {
        await updateFields(dv); // Actualizar la fecha al hacer click
    };

async function updateFields(dv){
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
console.error('El plugin TPM no está habilitado.');
}
// Forma de acceder al objeto gp desde DVJS
const gp = app.plugins.plugins['obsidian-personal-management']

let infoNota = dv.current();
let campos = ["fecha","horaFinal","tiempoTrabajado","estado"];
let resultado = await gp.YAMLUpdaterAPI.actualizarNota(infoNota, campos)
let textoResultado = Object.entries(resultado).map(([propiedad, valor]) => `${propiedad}: ${valor}`).join(', ');
dv.paragraph(`Se han actualizado los campos ${textoResultado}`);

}
}else{
dv.paragraph("La nota esta cerrada.")
}
```

## Tiempo
- Hora Inicio: `VIEW[{horaInicio}]`
- Hora Finalización `VIEW[{horaFinal}]`
- El tiempo trabajado es de `VIEW[round(number({tiempoTrabajado} ms, minutes), 2)]` minutos, ó `VIEW[round(number({tiempoTrabajado} ms, hour), 2)]` horas 

## Descripción de la actividad del registro.
`INPUT[textArea(class(className: ajbbMB) ):descripcion]`
Hora Inicio:
`INPUT[textArea(class(className : ajbbText)):horaInicio]` 
```dataviewjs
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
console.error('El plugin TPM no está habilitado.');
}

// Forma de acceder al objeto gp desde DVJS
const gp = app.plugins.plugins['obsidian-personal-management']
const boton = document.createElement('button');
boton.textContent = "Cambio Hora Final";
boton.style.cursor = 'pointer';
boton.style.padding = '5px 10px';
boton.style.margin = '10px';
boton.style.borderRadius = '5px';

// Añadir el botón al contenedor de Dataview
dv.container.appendChild(boton);
// Definir la acción al hacer clic en el botón
    boton.onclick = async () => {
        // Ejecutar el comando
        let infoNota = dv.current();
		let resultado = await gp.YAMLUpdaterAPI.modalCambioHF(infoNota);
    };
```

```dataviewjs 
dv.span("Se han trabajado " + dv.current().idSec + " sesiones ")
dv.current().asunto ? dv.span(" del asunto: " + dv.func.link(dv.page(dv.current().asunto[0].path).file.link, dv.page(dv.current().asunto[0].path).file.aliases[0]) + ". " ): ""
```

