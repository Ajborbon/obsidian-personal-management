<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let  infoSubsistema = {}
infoSubsistema.defined = true; 
infoSubsistema.typeName = "Anotaciones";
infoSubsistema.type = "Ax";
infoSubsistema.folder = "folder_Anotaciones"
infoSubsistema.indice = "indice_Anotaciones"
infoSubsistema.fileName = tp.file.path(true)
campos = ["id","fecha","titulo","descripcion","estado","asunto","proyectoGTD","proyectoQ","areaInteres","areaVida","aliases","clasificacion","rename"];
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
-%>
---
excalidraw-plugin: 
version: 1.1
excalidraw-open-md: true
excalidraw-autoexport: svg
typeName: <% v.typeName %>
type: <% v.type %>
id: <% v.id %> 
aliases: <%* for (let a=0; a<v.aliases.length;a++){%>
 - <%v.aliases[a]%> <%* }%>
descripcion: <%*if (v.clasificacion.clase != "Feedback Semanal"){%> <%v.descripcion%><%* }else{%>>-  <%* for (let a=0; a<v.descripcion.length;a++){%>
   <%v.descripcion[a]%> 
<%* }}%>
tema: <%v.clasificacion.clase%> 
tags: <%v.clasificacion.tag%> 
estado: <% v.estado %> 
fecha: <% v.fecha %>
valor:  
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
>[!info]- Descripcion
>`VIEW[{descripcion}]`
 
```dataviewjs
dv.span("Anotación relacionada a " + (dv.current().asunto ? "asunto: " + dv.func.link(dv.page(dv.current().asunto[0].path).file.link, dv.page(dv.current().asunto[0].path).file.aliases[0]) + ", " : "") + (dv.current().proyectoGTD ? "PGTD: " + dv.current().proyectoGTD.map(entry => dv.func.link(dv.page(entry.path).file.link, dv.page(entry.path).file.aliases[0])).join(", ") + ", " : "") + (dv.current().proyectoQ ? "PQ: " + dv.func.link(dv.page(dv.current().proyectoQ[0].path).file.link, dv.page(dv.current().proyectoQ[0].path).titulo) + ", " : "") + (dv.current().areaInteres ? "AI: " + dv.current().areaInteres.map(entry => dv.func.link(dv.page(entry.path).file.link, dv.page(entry.path).titulo)).join(", ") + ", " : "") + (dv.current().areaVida ? "AV: " + dv.current().areaVida + ", " : "") + " en estado " + dv.current().estado)
```

![[<%v.type%> - <%v.id%>.svg]]

<%* if(v.clasificacion.clase=="Meditaciones de alteración de futuro"){ -%>
## Objetivo 

## Evento imaginario que seguiría al cumplimiento del deseo

### Que es lo que siento?

### Detalles para la visualización.
## Premisas que alimenten el deseo cumplido
_Frases que apoyan mi objetivo_
## Tareas de seguimiento de la meditación
- [ ] Total de meditaciones de <% titulo %> 
	- [ ] Meditación de <% v.titulo %> #cx/Meditacion 🔁 every day when done 📅 <% tp.date.now("YYYY-MM-DD") %>
<%*}else if(v.clasificacion.clase =="Feedback Semanal"){-%>
## Feedback
```dataviewjs
dv.paragraph(dv.current().descripcion)
```

<%*}else if(v.clasificacion.clase =="Grupo de Hojas de Trabajo"){-%>

## [[Comentarios a las plantillas#Temas relacionados a este grupo de hojas de trabajo|Temas relacionados a este grupo de hojas de trabajo:]]
```dataviewjs
const {crearAx} = customJS
let hijos = dv.pages().filter(b=> dv.func.contains(b.asunto, dv.current().file.link))
let totalHijos = 
dv.table(["Tema","Tipo","Fecha Modificación", "Pendientes","Hijos"], hijos.map(b=> [b.file.link, b.tema, b.fecha, b.file.tasks.filter(b=> b.status == ' ' || b.status == '/').length, crearAx.paginasHijos(dv,b).length-1]))
```


<%*}%>


# Fin
- [/] Finalizado el desarrollo de Anotación <%v.id%> #cx/Computador/OrganizarNotas  
Estado de la nota:  `INPUT[estadoNota][:estado]`
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

```dataviewjs
const {callDV} = customJS
callDV.BotonesStandar(dv)
```



==⚠  Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu of this document. ⚠==


%%
# Text Elements

# Drawing
```json
{"type":"excalidraw","version":2,"source":"https://github.com/zsviczian/obsidian-excalidraw-plugin/releases/tag/2.1.4","elements":[],"appState":{"gridSize":null,"viewBackgroundColor":"#ffffff"}}
```
%%