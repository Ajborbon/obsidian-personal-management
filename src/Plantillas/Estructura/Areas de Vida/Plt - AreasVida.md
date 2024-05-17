<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let  infoSubsistema = {}
infoSubsistema.defined = true; 
infoSubsistema.typeName = "AreasVida";
infoSubsistema.type = "AV";
infoSubsistema.folder = "folder_AreasVida"
infoSubsistema.indice = "indice_AreasVida"
if (tp.file.title.includes("Untitled")){
campos = ["id","fecha","area","trimestre","descripcion","estado","aliases","filename"]
}else{
infoSubsistema.fileName = tp.file.title;
campos = ["id","fecha","filename","rename","descripcion","estado","aliases"]
}
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
//await tp.file.rename(v.filename);
-%>
---
version: 1.0
typeName: AreasVida
type: AV
estado: <% v.estado %>
trimestre: "[[<% v.trimestre %>]]"
descripcion: <% v.descripcion %>
grupo: <% v.grupo %>
fecha:  <% v.fecha %>
id: <% v.id %> 
areaVida: <% v.titulo %>
aliases:<%* for (let a=0; a<v.aliases.length;a++){%>
 - <%v.aliases[a]%> <%*}%>
comentarios:
tags:
asunto: "[[<% v.titulo %>]]"
---
# <% v.titulo %>
`$= dv.span("Area de vida " + dv.current().asunto + ", en estado " + dv.current().estado + " para el periodo " + dv.current().trimestre)` 

## Descripción
`INPUT[textArea(class(className: ajbbMB) ):descripcion]`
## Recursos y proyectos

```dataviewjs
let hijos = dv.pages().filter(b => {
    // Checa si b.asunto es un arreglo y si alguno de sus elementos contiene el enlace actual
    if (Array.isArray(b.areaVida)) {
        return b.areaVida.some(asunto => dv.func.contains(asunto, dv.current().file.link));
    }
    // Si no es un arreglo, realiza la verificación normal
    return dv.func.contains(b.areaVida, dv.current().file.link);
});
hijos= hijos.sort(b=> b.fecha, "desc")
let totalHijos = 
dv.table(["Titulo", "Tipo", "Estado", "Fecha Modificación", "Pendientes"], 
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