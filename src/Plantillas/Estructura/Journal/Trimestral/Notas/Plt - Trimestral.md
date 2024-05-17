<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let  infoSubsistema = {}
infoSubsistema.defined = true; 
infoSubsistema.typeName = "Trimestral";
infoSubsistema.type = "TQ";
infoSubsistema.folder = "folder_Trimestral";
infoSubsistema.indice = "indice_Trimestral";
infoSubsistema.fileName = tp.file.path(true);
// Creado directamente con la plantilla.
debugger;
if (tp.file.title.includes("Untitled")){
campos = ["id","fecha","trimestre","estado","rename"];
/* En caso de querer hacerla manual, para que quede dentro de Journal, habria que desarrollar estos campos tambien.
journal: personal
journal-start-date: 2024-01-01
journal-end-date: 2024-12-31
journal-section: year
*/
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
}else{
campos = ["id","fecha"]
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
v.trimestre = tp.file.title;
v.estado = "🟢";
}
-%>
---
version: 1.0
typeName: <% v.typeName %>
type: <% v.type %>
id: <% v.id %> 
trimestre: <% v.trimestre %> 
estado: <% v.estado %> 
fecha: <% v.fecha %>
---

# <% v.trimestre %>


