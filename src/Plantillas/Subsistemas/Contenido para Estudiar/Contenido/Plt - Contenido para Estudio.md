<%*
debugger;
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let  infoSubsistema = {}
infoSubsistema.defined = true; 
infoSubsistema.typeName = "ContenidoParaEstudio";
infoSubsistema.type = "CPE";
infoSubsistema.folder = "folder_ContenidoParaEstudio"
infoSubsistema.indice = "indice_ContenidoParaEstudio"
infoSubsistema.fileName = tp.file.path(true)
campos = ["id","fecha","titulo","descripcion","estado","asunto","proyectoGTD","proyectoQ","areaInteres","areaVida","aliases","rename"]
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
-%>
---
version: 1.0
typeName: <% v.typeName %>
type: <% v.type %>
id: <% v.id %> 
aliases: <%* for (let a=0; a<v.aliases.length;a++){%>
 - <%v.aliases[a]%> <%* }%>. <%* debugger; %>
descripcion: <%* if (typeof v.descripcion === 'undefined' || v.descripcion.length === 0) { } else if (typeof v.descripcion === 'string') { %> 
<% v.descripcion%> <%* } else if (Array.isArray(v.descripcion)) { for (let a = 0; a < v.descripcion.length; a++) { %>
  <% v.descripcion[a]%> <%* }} %>
tags: 
estado: <% v.estado %> 
fecha: <% v.fecha %>
areaVida: <%* if (typeof v.areaVida === 'undefined' || v.areaVida.length === 0 || v.areaVida === "No es de ningún Area de Vida") { } else if (typeof v.areaVida === 'string') { %>
- "[[<%v.areaVida%>]]" <%* } else if (Array.isArray(v.areaVida)) { for (let a = 0; a < v.areaVida.length; a++) { %>
- "[[<%v.areaVida[a]%>]]" <%* }} %>
areaInteres: <%* if (typeof v.areaInteres === 'undefined' || v.areaInteres.length === 0) { } else if (typeof v.areaInteres === 'string') { %>
- "[[<%v.areaInteres%>]]" <%* } else if (Array.isArray(v.areaInteres)) { for (let a = 0; a < v.areaInteres.length; a++) { %>
- "[[<%v.areaInteres[a]%>]]" <%* }} %>
proyectoGTD: <%* if (typeof v.proyectoGTD === 'undefined' || v.proyectoGTD.length === 0) { } else if (typeof v.proyectoGTD === 'string') {
%>
- "[[<%v.proyectoGTD%>]]"
<%* } else if (Array.isArray(v.proyectoGTD)) { for (let a = 0; a < v.proyectoGTD.length; a++) { %>
- "[[<%v.proyectoGTD[a]%>]]" <%* }} %>
proyectoQ:<%* if (typeof v.proyectoQ === 'undefined' || v.proyectoQ.length === 0) { } else if (typeof v.proyectoQ === 'string') {
%>
- "[[<%v.proyectoQ%>]]"
<%* } else if (Array.isArray(v.proyectoQ)) { for (let a = 0; a < v.proyectoQ.length; a++) { %>
- "[[<%v.proyectoQ[a]%>]]"<%* }} %>
asunto: <%* if(v.asunto.siAsunto){ %> 
- "[[<%v.asunto.nombre%>]]" <%* }%>
---
# `VIEW[{aliases[0]}]`
> [!tip]- Uso del plugin TimeStamp Notes
>En esta versión está sugerido el uso del plugin TimeStamp Notes. Hay dos acciones importantes a tener en cuenta: 
>**1. Crear el link del video**: Solamente debes pegar el link de youtube, seleccionarlo y utilizar el comando Open Video Player, del plugin o el shortcut  ⌥ ^ O.
>**2. Crear los timestamps del video**: Para crear los timestamps del video, en el momento en el que llegues al video, solo debes pulsar el shortcut ⌥ ^ 0, o buscar el comando Insert Timestamp. 
```dataviewjs
dv.span("Contenido para Estudio relacionado a " + (dv.current().asunto ? "asunto: " + dv.func.link(dv.page(dv.current().asunto[0].path).file.link, dv.page(dv.current().asunto[0].path).file.aliases[0]) + ", " : "") + (dv.current().proyectoGTD ? "PGTD: " + dv.current().proyectoGTD.map(entry => dv.func.link(dv.page(entry.path).file.link, dv.page(entry.path).file.aliases[0])).join(", ") + ", " : "") + (dv.current().proyectoQ ? "PQ: " + dv.func.link(dv.page(dv.current().proyectoQ[0].path).file.link, dv.page(dv.current().proyectoQ[0].path).titulo) + ", " : "") + (dv.current().areaInteres ? "AI: " + dv.current().areaInteres.map(entry => dv.func.link(dv.page(entry.path).file.link, dv.page(entry.path).titulo)).join(", ") + ", " : "") + (dv.current().areaVida ? "AV: " + dv.current().areaVida + ", " : "") + " en estado " + dv.current().estado)
```

## Video

## Diagrama mermaid  

## Comentarios Personales

## Hitos del video.

## Resumen IA



# Fin
Estado de la nota:  `INPUT[estadoNota][:estado]`
## Modifica la descripción del video.
`INPUT[textArea(class(className: ajbbMB) ):descripcion]`

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