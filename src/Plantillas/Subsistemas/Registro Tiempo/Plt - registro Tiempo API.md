<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v;
let nombre = tp.file.title; // Título del archivo actual

// Decide si retomar un registro existente o iniciar uno nuevo
if (nombre.includes("Retomar")) {
    v = await gp.registroTiempoAPI.retomarRegistro(nombre);
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
- <%alias%> <%*}%>
asunto: <%* if(v.siAsunto){ %>"[[<% v.nombre %>]]"<%* } %>
---

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
# `VIEW[{aliases}]`
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
```meta-bind
INPUT[list(title(Ingresa los detalles sobre la tarea que estuviste trabajando), limit(400)):descripcion]
```

Hora Inicio `INPUT[text:horaInicio]`  y hora de finalización `INPUT[text:horaFinal]`

Se han trabajado `VIEW[{idSec}]`sesiones de este mismo tema: `VIEW[{asunto}][link]`
