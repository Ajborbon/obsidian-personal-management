<%*
debugger
const dv = this.DataviewAPI;
const {update} = this.app.plugins.plugins["metaedit"].api
const fileCampos =dv.page("Estructura/Campos Sistema Gestion/Campos Sistema Central")
let clasificacionAX = fileCampos.tituloClasificacionAX
let tagsClasificacionAX = fileCampos.tagsClasificacionAX
let activo = app.workspace.getActiveFile();
let idAux = dv.pages('"Anotaciones/Notas"').file.frontmatter.sort(b=> b.id , 'desc').id;

// Comprueba si idAux tiene al menos un elemento y asigna a 'id' el siguiente valor en la secuencia o 1 si no hay elementos.
let id = idAux.length > 0 ? (idAux[0] + 1) : 1;

let newName, titulo, existe, asunto, nombre
	titulo = await tp.system.prompt("¿Sobre que es esta anotación?", "A-"+ id, true)
	// Verificar si el usuario presionó Esc.
    if (titulo === null) {
    new Notice("Creación de nota cancelada por el usuario.");
    return; // Termina la ejecución de la función aquí.
	}
	if (activo != null){ 
		nombre = activo.basename;
		const nota = app.metadataCache.getFileCache(activo); 
		asunto = await tp.system.suggester(["Si","No"],[true, false], true, nombre + " es origen de " + titulo + "?")
		}
	newName = "Anotaciones/Notas/A - " + id  
await tp.file.move(newName);
let clasificacion, descripcion, estado
let tagClasificacion = await tp.system.suggester(clasificacionAX, tagsClasificacionAX, false, "¿Clasificarías esta nota bajo alguna de las siguientes categorías?")
	// Verificar si el usuario presionó Esc.
    if (tagClasificacion === null) {
    new Notice("Creación de nota cancelada por el usuario.");
    return; // Termina la ejecución de la función aquí.
	}
let nuevaClasificacion = false
if(tagClasificacion=="Nuevo"){
	clasificacion = await tp.system.prompt("¿Cual es el nombre de la nueva clasificación que vas a ingresar?", "MiClasificación", true)
	// Verificar si el usuario presionó Esc.
    if (clasificacion === null) {
    new Notice("Creación de nota cancelada por el usuario.");
    return; // Termina la ejecución de la función aquí.
	}
	tagClasificacion = await tp.system.prompt("¿Cual es el tag que utilizaras para " + clasificacion + "?. No utilices espacios en la definición del tag.", "nuevoTag", true)
	// Verificar si el usuario presionó Esc.
    if (tagClasificacion === null) {
    new Notice("Creación de nota cancelada por el usuario.");
    return; // Termina la ejecución de la función aquí.
	}
	nuevaClasificacion = true
// --> Validar que el nombre del grupo no sea igual al nombre de ninguna area de Vida.
}else if(tagClasificacion=="Ninguna"){
	tagClasificacion = ""
	clasificacion = ""	
}else {
	let indice = tagsClasificacionAX.indexOf(tagClasificacion)
	clasificacion = clasificacionAX[indice]
}
if (nuevaClasificacion) {
    let nuevoC = clasificacionAX.pop(); // Última clasificación
    let ningunoC = clasificacionAX.pop(); // Penúltima clasificación

    clasificacionAX.push(clasificacion);
    clasificacionAX.push(ningunoC);
    clasificacionAX.push(nuevoC);

    await update("tituloClasificacionAX", clasificacionAX, fileCampos.file.path);
	await new Promise(resolve => setTimeout(resolve, 1000));

    let nuevoTagC = tagsClasificacionAX.pop(); // Último tag
    let ningunoTagC = tagsClasificacionAX.pop(); // Penúltimo tag

    tagsClasificacionAX.push(tagClasificacion);
    tagsClasificacionAX.push(ningunoTagC);
    tagsClasificacionAX.push(nuevoTagC);

    await update("tagsClasificacionAX", tagsClasificacionAX, fileCampos.file.path);
}


if (tagClasificacion != ""){
tagClasificacion = "cl/" + tagClasificacion 
}
if (clasificacion == "Feedback Semanal"){
	descripcion = []
	let aux = 0
	let otra
	do{
		descripcion[aux] = await tp.system.prompt("Escribe tu feedback de "+ titulo, "P" + aux, false, true)
		aux += 1
		otra = await tp.system.suggester(["Si","No"],[true,false], true, "¿Agregar otro parrafo?" )
	}while(otra)
}else{
	descripcion = await tp.system.prompt("¿Quieres agregar una descripción?", " " + titulo, false, true )
	// Verificar si el usuario presionó Esc.
    if (descripcion === null) {
    new Notice("Creación de nota cancelada por el usuario.");
    return; // Termina la ejecución de la función aquí.
	}
}
estado = await tp.system.suggester(["🔵 -> Completado - Información", "🟢 -> Finalizado","🟡 -> En ejecución", "🔴 -> Detenido"],["🔵", "🟢","🟡", "🔴"], false, "Cual es el estado de esta anotación?")
// Verificar si el usuario presionó Esc.
    if (estado === null) {
    new Notice("Creación de nota cancelada por el usuario.");
    return; // Termina la ejecución de la función aquí.
	}
-%>
---
tipo: Anotación
idq: 6
id: <% id %> 
idManual:
aliases: 
- <%titulo%>
descripcion: <%*if (clasificacion != "Feedback Semanal"){%> <%descripcion%><%* }else{%>>-  <%* for (let a=0; a<descripcion.length;a++){%>
   <%descripcion[a]%> 
<%*}}%>
tema: <%clasificacion%> 
estado: <% estado %> 
fecha: <% tp.date.now("YYYY-MM-DD dddd HH:mm") %>
hora: <% tp.date.now("HHmm", 0,)%>
valor:  
tags: <%tagClasificacion%> 
asunto: <%* if(asunto){ %> 
- "[[<%nombre%>]]" <%*}%>
related:
---
# `VIEW[{aliases}]` 
>[!info]- Descripcion
>`VIEW[{descripcion}]`
> 

Plantilla oculta
<%* if(clasificacion=="Meditaciones de alteración de futuro"){ -%>
## Objetivo 

## Evento imaginario que seguiría al cumplimiento del deseo

### Que es lo que siento?

### Detalles para la visualización.
## Premisas que alimenten el deseo cumplido
_Frases que apoyan mi objetivo_
## Tareas de seguimiento de la meditación
- [ ] Total de meditaciones de <% titulo %> 
	- [ ] Meditación de <% titulo %> #cx/Meditacion 🔁 every day when done 📅 <% tp.date.now("YYYY-MM-DD") %>
<%*}else if(clasificacion =="Feedback Semanal"){-%>
## Feedback
```dataviewjs
dv.paragraph(dv.current().descripcion)
```
<%*}else if(clasificacion =="Video Youtube"){-%>
## Video

> [!tip]- Como crear el link del video?
>Estamos utilizando el plugin TimeStamp Notes. Para crear el link aquí, solamente debes pegar el link de youtube, seleccionarlo y utilizar el comando Open Video Player, o el shortcut  ⌥ ^ O
### Timestamps
> [!important]- Crear los timestamps del video
> Para crear los timestamps del video, en el momento en el que llegues al video, solo debes pulsar el shortcut ⌥ ^ 0, o buscar el comando Insert Timestamp. 
 

## Comentarios Personales

## Hitos del video.

## Resumen IA

<%*}else if(clasificacion =="Grupo de Hojas de Trabajo"){-%>

## [[Comentarios a las plantillas#Temas relacionados a este grupo de hojas de trabajo|Temas relacionados a este grupo de hojas de trabajo:]]
```dataviewjs
const {crearAx} = customJS
let hijos = dv.pages().filter(b=> dv.func.contains(b.asunto, dv.current().file.link))
let totalHijos = 
dv.table(["Tema","Tipo","Fecha Modificación", "Pendientes","Hijos"], hijos.map(b=> [b.file.link, b.tema, b.fecha, b.file.tasks.filter(b=> b.status == ' ' || b.status == '/').length, crearAx.paginasHijos(dv,b).length-1]))
```


<%*}%>


# Fin
- [/] Finalizado el desarrollo de Anotación <%id%> #cx/Computador/OrganizarNotas  
Estado de la nota:  `INPUT[estadoNota][:estado]`
```dataviewjs
const {callDV} = customJS
callDV.CambiarTituloDescripcion(dv)
```
---
```dataviewjs
const {callDV} = customJS
callDV.CarruselAnotaciones(dv)
```
```dataviewjs
const {callDV} = customJS
callDV.BotonesStandar(dv)
```
