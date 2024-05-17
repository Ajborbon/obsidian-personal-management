<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let  infoSubsistema = {}
infoSubsistema.defined = true; 
infoSubsistema.typeName = "ProyectosQ";
infoSubsistema.type = "PQ";
infoSubsistema.folder = "folder_ProyectosQ"
infoSubsistema.indice = "indice_ProyectosQ"
infoSubsistema.fileName = tp.file.path(true)
debugger;
if (tp.file.title.includes("Untitled")){
// Creado directamente con templater + plantilla
campos = ["id","fecha","titulo","asunto","trimestre","areaInteres","areaVida","descripcion","estado","aliases","rename"]
}else{
// Creado en algún proceso batch o con un boton 
//infoSubsistema.fileName = tp.file.title;
campos = ["id","fecha","filename","titulo","descripcion","estado","aliases","rename"]
}
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
-%>
---
version: 1.1
type: <% v.type %>
typeName: <% v.typeName %>
estado: <% v.estado %>
titulo: <% v.titulo %>
trimestre: "[[<% v.trimestre %>]]"
descripcion: <% v.descripcion %>
fecha:  <% v.fecha %>
id: <% v.id %> 
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
aliases:<%* for (let a=0; a<v.aliases.length;a++){%>
 - <%v.aliases[a]%> <%* }%>
comentarios:
nivelP: <% v.nivelP %> 
asunto: <%* if(v.asunto.siAsunto){ %> 
- "[[<%v.asunto.nombre%>]]" <%* }%>
tags:
---
# <% v.titulo %>
```dataviewjs
dv.span("Proyecto de Q relacionado a " + (dv.current().asunto ? "asunto: " + dv.func.link(dv.page(dv.current().asunto[0].path).file.link, dv.page(dv.current().asunto[0].path).file.aliases[0]) + ", " : "") + (dv.current().proyectoGTD ? "PGTD: " + dv.current().proyectoGTD.map(entry => dv.func.link(dv.page(entry.path).file.link, dv.page(entry.path).file.aliases[0])).join(", ") + ", " : "") + (dv.current().proyectoQ ? "PQ: " + dv.func.link(dv.page(dv.current().proyectoQ[0].path).file.link, dv.page(dv.current().proyectoQ[0].path).titulo) + ", " : "") + (dv.current().areaInteres ? "AI: " + dv.current().areaInteres.map(entry => dv.func.link(dv.page(entry.path).file.link, dv.page(entry.path).titulo)).join(", ") + ", " : "") + (dv.current().areaVida ? "AV: " + dv.current().areaVida + ", " : "") + " en estado " + dv.current().estado)
```
## Descripción
`INPUT[textArea(class(className: ajbbMB) ):descripcion]`
## Recursos relacionados

```dataviewjs
let hijos = dv.pages().filter(b=> dv.func.contains(b.proyectoQ, dv.current().file.link))
let totalHijos = 
dv.table(["Titulo","Tipo","Fecha Modificación", "Pendientes"], hijos.map(b=> [dv.func.link(b.file.path,b.titulo), b.typeName, b.fecha, b.file.tasks.filter(b=> b.status == ' ' || b.status == '/').length]))
```


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
# Fin
```dataviewjs
const {piePagina} = customJS
const views = ['Totales','Notas - Hijo','Tareas - Hijo','Vista Temas','Gráfico','🧹']
let clase = []
clase.push("Nivel0")
piePagina.createButton(views, clase, this.container, dv,"")
```
---
