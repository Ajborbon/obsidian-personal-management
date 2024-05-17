<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let  infoSubsistema = {}
infoSubsistema.defined = true; 
infoSubsistema.typeName = "Anual";
infoSubsistema.type = "AY";
infoSubsistema.folder = "folder_Anual";
infoSubsistema.indice = "indice_Anual";
infoSubsistema.fileName = tp.file.path(true);
// Creado directamente con la plantilla.
debugger;
if (tp.file.title.includes("Untitled")){
campos = ["id","fecha","año","estado","rename"];
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
v.año = tp.file.title;
v.estado = "🟢";
}
-%>
---
version: 1.0
typeName: <% v.typeName %>
type: <% v.type %>
id: <% v.id %> 
año: <% v.año %> 
estado: <% v.estado %> 
fecha: <% v.fecha %>
---

# <% v.año %>

