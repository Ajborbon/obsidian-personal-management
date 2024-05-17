<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let  infoSubsistema = {}
debugger;
infoSubsistema.defined = true; 
infoSubsistema.typeName = "ProyectosGTD";
infoSubsistema.type = "PGTD";
infoSubsistema.folder = "folder_ProyectosGTD"
infoSubsistema.indice = "indice_ProyectosGTD"
infoSubsistema.fileName = tp.file.path(true)
// Creado directamente con la plantilla.
if (tp.file.title.includes("Untitled")){
campos = ["id","fecha","titulo","asunto","proyectoGTD","ProyectoQ","areaInteres","areaVida","descripcion","estado","aliases","rename"]
}
// Creado desde el botón de Objetivos anuales.  
else{
debugger;
campos = ["id","fecha","filename","titulo","descripcion","estado","aliases","rename"]
}
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
-%>
---
version: 1.1
typeName: <% v.typeName %>
type: <% v.type %>
estado: <% v.estado %> 
titulo: <% v.titulo %>
descripcion: <% v.descripcion %>
fecha:  <% v.fecha %>
id: <% v.id %> 
aliases:<%* for (let a=0; a<v.aliases.length;a++){%>
 - <%v.aliases[a]%> <%* }%>
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
asunto: <%* if(v.asunto.siAsunto){ %> 
- "[[<%v.asunto.nombre%>]]" <%* }%>
nivelP: <% v.nivelP %> 
related:
periodo:
fechaInicio:
fechaCierre:
avances:

---
# <% v.titulo %>

```dataviewjs
dv.span("Proyecto GTD relacionado a " + (dv.current().asunto ? "asunto: " + dv.func.link(dv.page(dv.current().asunto[0].path).file.link, dv.page(dv.current().asunto[0].path).file.aliases[0]) + ", " : "") + (dv.current().proyectoGTD ? "PGTD: " + dv.current().proyectoGTD.map(entry => dv.func.link(dv.page(entry.path).file.link, dv.page(entry.path).file.aliases[0])).join(", ") + ", " : "") + (dv.current().proyectoQ ? "PQ: " + dv.func.link(dv.page(dv.current().proyectoQ[0].path).file.link, dv.page(dv.current().proyectoQ[0].path).titulo) + ", " : "") + (dv.current().areaInteres ? "AI: " + dv.current().areaInteres.map(entry => dv.func.link(dv.page(entry.path).file.link, dv.page(entry.path).titulo)).join(", ") + ", " : "") + (dv.current().areaVida ? "AV: " + dv.current().areaVida + ", " : "") + " en estado " + dv.current().estado)
```




## Recursos y proyectos

### Proyectos Hijos

```dataviewjs
const gp = app.plugins.plugins['obsidian-personal-management'];
let typeGTD = "ProyectosGTD";
let typePQ = "ProyectosQ";

// Construimos las claves dinámicas para acceder a las propiedades en gp.settings
let pathFolderGTD = `folder_${typeGTD}`;
let pathFolderPQ = `folder_${typePQ}`;

// Usamos las claves para obtener los valores de gp.settings
let folderGTD = `${gp.settings[pathFolderGTD]}`;
let folderPQ = `${gp.settings[pathFolderPQ]}`;

let hijos = dv.pages().filter(b => {
    // Checa si b.proyectoGTD es un arreglo y si alguno de sus elementos contiene el enlace actual
    if (Array.isArray(b.proyectoGTD)) {
        return b.proyectoGTD.some(asunto => dv.func.contains(asunto, dv.current().file.link));
    }
    // Si no es un arreglo, realiza la verificación normal
    return dv.func.contains(b.proyectoGTD, dv.current().file.link);
})
.filter(b => (b.file.path.startsWith(folderGTD + "/") || b.file.path.startsWith(folderPQ + "/"))) // Filtro adicional por carpetas y nivelP
.sort(a => a.fecha, "desc"); // Ordenar por fecha de forma descendente

let totalHijos = dv.table(["Titulo", "Tipo", "Estado", "Fecha Modificación", "Pendientes"], 
    hijos.map(b => [
        dv.func.link(b.file.path, b.titulo ? b.titulo : b.aliases[0]),
        b.typeName,
        b.estado,
        b.fecha,
        b.file.tasks.filter(b => b.status == ' ' || b.status == '/').length
    ])
);

```


### Recursos de subsistemas
```dataviewjs
const gp = app.plugins.plugins['obsidian-personal-management'];
let typeGTD = "ProyectosGTD";
let typePQ = "ProyectosQ";
let typeRT = "RegistroTiempo";

// Construimos las claves dinámicas para acceder a las propiedades en gp.settings
let pathFolderGTD = `folder_${typeGTD}`;
let pathFolderPQ = `folder_${typePQ}`;
let pathFolderRT = `folder_${typeRT}`;

// Usamos las claves para obtener los valores de gp.settings
let folderGTD = `${gp.settings[pathFolderGTD]}`;
let folderPQ = `${gp.settings[pathFolderPQ]}`;
let folderRT = `${gp.settings[pathFolderRT]}`;

let hijos = dv.pages().filter(b => {
    // Checa si b.proyectoGTD es un arreglo y si alguno de sus elementos contiene el enlace actual
    if (Array.isArray(b.proyectoGTD)) {
        return b.proyectoGTD.some(asunto => dv.func.contains(asunto, dv.current().file.link));
    }
    // Si no es un arreglo, realiza la verificación normal
    return dv.func.contains(b.proyectoGTD, dv.current().file.link);
})
.filter(b => !(b.file.path.startsWith(folderGTD + "/") || b.file.path.startsWith(folderPQ + "/") || b.file.path.startsWith(folderRT + "/"))) // Filtro adicional por carpetas
.sort(a => a.typeName, "desc").sort(a => a.fecha, "desc"); // Ordenar por fecha de forma descendente

let totalHijos = dv.table(["Titulo", "Tipo", "Estado", "Fecha Modificación", "Pendientes"], 
    hijos.map(b => [
        dv.func.link(b.file.path, b.titulo ? b.titulo : b.aliases[0]),
        b.typeName,
        b.estado,
        b.fecha,
        b.file.tasks.filter(b => b.status == ' ' || b.status == '/').length
    ])
);

```


### Registros de Tiempo

```dataviewjs
function formatDuration(ms){
    if (ms === null || ms === undefined || isNaN(ms)) {
        return "No definido";
    } else {
        // Convertir milisegundos a minutos, horas y días
        let minutos = Math.floor(ms / (1000 * 60));
        let horas = Math.floor(minutos / 60);
        minutos = minutos % 60; // Resto de la división para obtener los minutos sobrantes
        let dias = Math.floor(horas / 24);
        horas = horas % 24; // Resto de la división para obtener las horas sobrantes

        // Formatear el string de salida
        if (dias > 0) {
            return `${dias} d ${horas} h ${minutos} min`;
        } else if (horas > 0) {
            return `${horas} h ${minutos} min`;
        } else {
            return `${minutos} min`;
        }
    }
}

const gp = app.plugins.plugins['obsidian-personal-management'];
let typeRT = "RegistroTiempo";

// Construimos las claves dinámicas para acceder a las propiedades en gp.settings
let pathFolderRT = `folder_${typeRT}`;

// Usamos las claves para obtener los valores de gp.settings
let folderRT = `${gp.settings[pathFolderRT]}`;

let hijos = dv.pages().filter(b => {
    // Checa si b.areaInteres es un arreglo y si alguno de sus elementos contiene el enlace actual
    if (Array.isArray(b.proyectoGTD)) {
        return b.proyectoGTD.some(asunto => dv.func.contains(asunto, dv.current().file.link));
    }
    // Si no es un arreglo, realiza la verificación normal
    return dv.func.contains(b.proyectoGTD, dv.current().file.link);
})
.filter(b => (b.file.path.startsWith(folderRT + "/"))) // Filtro adicional por carpetas
.sort(a => a.fecha, "desc"); // Ordenar por fecha de forma descendente

// Sumar el tiempo trabajado y mostrar el total formateado
let totalTiempoTrabajado = 0;
for (let hijo of hijos) {
    totalTiempoTrabajado += hijo.tiempoTrabajado || 0;
}
dv.paragraph(`**Total tiempo trabajado: ${formatDuration(totalTiempoTrabajado)}**`);


let totalHijos = dv.table(["Titulo", "Detalle", "Tiempo Trabajado", "Estado", "Fecha Modificación"], 
    hijos.map(b => [
        dv.func.link(b.file.path, b.asunto[0] ? dv.page(b.asunto[0]).aliases[0] : b.aliases[0]),
        b.descripcion,
        formatDuration(b.tiempoTrabajado),
        b.estado,
        b.fecha,
    ])
);



```


# Fin
Estado del Proyecto:  `INPUT[estadoProyecto][:estado]` 
```dataviewjs
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
 let notas = dv.pages().where(page => page.file.path.startsWith(folder) && page.estado=== dv.current().estado).sort((b) => b.id, "asc");
gp.addOnsAPI.crearPrevNext(notas,indice,dv)
```
