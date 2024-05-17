<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let  infoSubsistema = {}
infoSubsistema.defined = true; 
infoSubsistema.typeName = "RecursosRecurrentes";
infoSubsistema.type = "RR";
infoSubsistema.folder = "folder_RecursosRecurrentes"
infoSubsistema.indice = "indice_RecursosRecurrentes"
infoSubsistema.fileName = tp.file.path(true)
if (tp.file.title.includes("Untitled")){
// Creado directamente con la plantilla.
campos = ["id","fecha","titulo","asunto","proyectoGTD","ProyectoQ","areaInteres","areaVida","descripcion","estado","aliases","rename"]
}
else{ 
// Creado en algún proceso batch  
campos = [] // Definir.
}
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
debugger;
-%>
---
version: 1.0
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
proyectoGTD: <%* if (typeof v.proyectoGTD === 'undefined' || v.proyectoGTD.length === 0) { } else if (typeof v.proyectoGTD === 'string') {
%>
- "[[<%v.proyectoGTD%>]]"
<%* } else if (Array.isArray(v.proyectoGTD)) { for (let a = 0; a < v.proyectoGTD.length; a++) { %>
- "[[<%v.proyectoGTD[a].aliases[0]%>]]"
<%* }} %>
proyectoQ: <%* if (typeof v.proyectoQ === 'undefined' || v.proyectoQ.length === 0) { } else if (typeof v.proyectoQ === 'string') {
%>
- "[[<%v.proyectoQ%>]]" <%* } %>
proyectoPadre: <%* if (v.proyectoPadre){ %> <% v.proyectoPadre%> <%* } %>
asunto: <%* if(v.asunto.siAsunto){ %> 
- "[[<%v.asunto.nombre%>]]" <%* }%>
---
# <% v.titulo %>
```dataviewjs
dv.span("Recurso recurrente relacionada a " + (dv.current().asunto ? "asunto: " + dv.func.link(dv.page(dv.current().asunto[0].path).file.link, dv.page(dv.current().asunto[0].path).file.aliases[0]) + ", " : "") + (dv.current().proyectoGTD ? "PGTD: " + dv.current().proyectoGTD.map(entry => dv.func.link(dv.page(entry.path).file.link, dv.page(entry.path).file.aliases[0])).join(", ") + ", " : "") + (dv.current().proyectoQ ? "PQ: " + dv.func.link(dv.page(dv.current().proyectoQ[0].path).file.link, dv.page(dv.current().proyectoQ[0].path).titulo) + ", " : "") + (dv.current().areaInteres ? "AI: " + dv.current().areaInteres.map(entry => dv.func.link(dv.page(entry.path).file.link, dv.page(entry.path).titulo)).join(", ") + ", " : "") + (dv.current().areaVida ? "AV: " + dv.current().areaVida + ", " : "") + " en estado " + dv.current().estado)
```
## Descripción
`INPUT[textArea(class(className: ajbbMB) ):descripcion]`
## Recursos relacionados
```dataviewjs
let hijos = dv.pages().filter(b => {
    // Checa si b.asunto es un arreglo y si alguno de sus elementos contiene el enlace actual
    if (Array.isArray(b.asunto)) {
        return b.asunto.some(asunto => dv.func.contains(asunto, dv.current().file.link));
    }
    // Si no es un arreglo, realiza la verificación normal
    return dv.func.contains(b.asunto, dv.current().file.link);
});
hijos= hijos.sort(b=> b.fecha, "desc")
let totalHijos = 
dv.table(["Titulo", "Tipo","Estado", "Fecha Modificación", "Pendientes"], 
    hijos.map(b => [
        dv.func.link(b.file.path, b.titulo ? b.titulo : b.aliases[0]),
        b.typeName,
        b.estado,
        b.fecha,
        b.file.tasks.filter(b => b.status == ' ' || b.status == '/').length
    ])
);
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