<%*
const dv = this.DataviewAPI;
const {update} = this.app.plugins.plugins["metaedit"].api
let activo = app.workspace.getActiveFile();
let idAux = dv.pages('"Subsistemas/Modulos Sistema Gestion/Modulos"').file.frontmatter.sort(b=> b.id , 'desc').id;

// Comprueba si idAux tiene al menos un elemento y asigna a 'id' el siguiente valor en la secuencia o 1 si no hay elementos.
let id = idAux.length > 0 ? (idAux[0] + 1) : 1;

let newName, titulo, existe, asunto, nombre
	titulo = await tp.system.prompt("¿Cual es el nombre de este módulo del sistema de gestión?", "MSG-"+ id, true)
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
	newName = "Subsistemas/Modulos Sistema Gestion/Modulos/MSG - " + id  
	await tp.file.move(newName);

let descripcion, estado
	descripcion = await tp.system.prompt("¿Quieres agregar una descripción del módulo?", " " + titulo, false, true )
	// Verificar si el usuario presionó Esc.
    if (descripcion === null) {
    new Notice("Creación de nota cancelada por el usuario.");
    return; // Termina la ejecución de la función aquí.
	}

estado = await tp.system.suggester(["🔵 -> Completado - Información", "🟢 -> Finalizado","🟡 -> En ejecución", "🔴 -> Detenido"],["🔵", "🟢","🟡", "🔴"], false, "Cual es el estado de esta anotación?")
// Verificar si el usuario presionó Esc.
    if (estado === null) {
    new Notice("Creación de nota cancelada por el usuario.");
    return; // Termina la ejecución de la función aquí.
	}
-%>
---
typeName: ModulosSistema
type: MSG
idq: 12
id: <% id %> 
aliases:
- <%titulo%>
descripcion: <%descripcion%>
estado: <% estado %> 
fecha: <% tp.date.now("YYYY-MM-DD dddd HH:mm") %>
tags:
tema: 
asunto: <%* if(asunto){ %> 
- "[[<%nombre%>]]" <%*}%>
related:
---
# `VIEW[{aliases[0]}]`
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
>[!info]- Descripcion
>`VIEW[{descripcion}]`
```dataviewjs
// Función para mostrar el botón
const textoBoton = 'Gráfico'
const comando = 'graph:open-local'
function mostrarBoton(dv) {
    
    // Limpiar el contenedor para asegurarse de que está vacío antes de añadir nuevos elementos
    dv.container.innerHTML = '';

    // Crear un botón y configurar sus propiedades
    const boton = document.createElement('button');
    boton.textContent = textoBoton;
    boton.style.cursor = 'pointer';
    boton.style.padding = '5px 10px';
    boton.style.margin = '10px';
    boton.style.borderRadius = '5px';

    // Añadir el botón al contenedor de Dataview
    dv.container.appendChild(boton);

    // Definir la acción al hacer clic en el botón
    boton.onclick = async () => {
        // Ejecutar el comando
        if (app.commands.executeCommandById(comando)) {
            console.log(`Comando ${comando} ejecutado correctamente.`);
        } else {
            console.error(`No se pudo ejecutar el comando ${comando}.`);
        }
    };
}

// Llamar a la función para mostrar el botón "Ahora"
mostrarBoton(dv);

```
## Requerimiento

## Plan de desarrollo del módulo

## Estructura del Módulo

## Código


# Fin
- [/] Finalizado el ingreso de Módulo Sistema de Gestión-<%id%> #cx/Computador/OrganizarNotas  
Estado de la nota:  `INPUT[estadoNota][:estado]`
```dataviewjs
const {callDV} = customJS
callDV.CambiarTituloDescripcion(dv)
```
---
```dataviewjs
const {callDV} = customJS
callDV.BotonesStandar(dv)
```


