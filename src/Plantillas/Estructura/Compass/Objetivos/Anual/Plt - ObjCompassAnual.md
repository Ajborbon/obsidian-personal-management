<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v = {}; 
let campos;
let  infoSubsistema = {}
infoSubsistema.defined = true; 
infoSubsistema.typeName = "ObjCompassAnual"; // No discrimino si es Planeación o desempeño.
infoSubsistema.type = "OCA"; // ObjetivoCompassAnual
infoSubsistema.folder = "folder_ObjCompassAnual"; // Las notas de Planeación y Desempeño quedan en el mismo folder anual.
infoSubsistema.indice = "indice_ObjCompassAnual";
infoSubsistema.fileName = tp.file.path(true);
debugger;
if (tp.file.title.startsWith("Trimestre")){
// Usamos una expresión regular para encontrar el patrón YYYY-Qq
let regex = /\b\d{4}-Q[1-4]\b/;
// Extraemos la parte del texto que coincide con la expresión regular
let resultado = tp.file.title.match(regex);
infoSubsistema.trimestre = resultado[0];
// Dividimos la cadena por el guion
let partes = resultado[0].split("-");
// La primera parte del array contiene el año
let año = partes[0];
infoSubsistema.año = año;
campos = ["id","fecha","areaVida","titulo","descripcion","estado","aliases","rename"];
} else {
campos = ["id","fecha","areaVida","año","titulo","descripcion","trimestre","estado","aliases","rename"];
}
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
-%>
---
version: 1.0
typeName: <% v.typeName %>
type: <% v.type %>
id: <% v.id %> 
titulo: <% v.titulo %>
descripcion: <% v.descripcion %>
aliases: <%* for (let a=0; a<v.aliases.length;a++){%>
 - <%v.aliases[a]%> <%* }%>
estado: <% v.estado %> 
año: <% v.año %>
areaVida: "[[<% v.areaVida %>]]"
fecha: <% v.fecha %>
trimestre: "[[<% v.trimestre %>]]"
proyecto: 
revisiones:
---
# <% v.titulo %>
`$= dv.span("Objetivo del Area de vida " + dv.current().areaVida + ", en estado " + dv.current().estado + " proyectado para el periodo " + dv.current().trimestre)` 

## Descripción
`INPUT[textArea(class(className: ajbbMB) ):descripcion]`
## Recursos y proyectos

