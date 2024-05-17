<%*
const dv = this.DataviewAPI;
const {update} = this.app.plugins.plugins["metaedit"].api
const fileCampos =dv.page("Estructura/Campos Sistema Gestion/Campos sistema central")
let lenguaje = fileCampos.lenguaje
let activo = app.workspace.getActiveFile();
let idAux = dv.pages('"Subsistemas/Desarrollos/Codigos"').file.frontmatter.sort(b=> b.id , 'desc').id;

// Comprueba si idAux tiene al menos un elemento y asigna a 'id' el siguiente valor en la secuencia o 1 si no hay elementos.
let id = idAux.length > 0 ? (idAux[0] + 1) : 1;

let newName, titulo, existe, asunto, nombre
	titulo = await tp.system.prompt("¿De que es este código o ejemplo?", "D-"+ id, true)
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
	newName = "Subsistemas/Desarrollos/Codigos/Desarrollo - " + id  
	await tp.file.move(newName);
		// Espera un breve momento antes de abrir la hoja en un nuevo panel
	// Esto asegura que la operación de mover/renombrar se haya completado
	setTimeout(() => {
	    app.workspace.openLinkText(newName, '', true);
	}, 500); // Ajusta el tiempo de espera según sea necesario

let clasificacion, descripcion, estado
clasificacion = await tp.system.suggester(lenguaje, lenguaje, false, "¿De que categoría es este código o ejemplo?")
	// Verificar si el usuario presionó Esc.
    if (clasificacion === null) {
    new Notice("Creación de nota cancelada por el usuario.");
    return; // Termina la ejecución de la función aquí.
	}
let nuevaClasificacion = false
if(clasificacion=="Nuevo"){
	clasificacion = await tp.system.prompt("¿Cual es el nombre de la nueva categoría de lenguaje que vas a crear?", "lenguaje-Sistema", true)
	// Verificar si el usuario presionó Esc.
    if (clasificacion === null) {
    new Notice("Creación de nota cancelada por el usuario.");
    return; // Termina la ejecución de la función aquí.
	}
	nuevaClasificacion = true
// --> Validar que el nombre del grupo no sea igual al nombre de ninguna area de Vida.
}else if(clasificacion=="Ninguna"){
	clasificacion = ""	
}
if (nuevaClasificacion) {
    let nuevoC = lenguaje.pop(); // Última clasificación
    let ningunoC = lenguaje.pop(); // Penúltima clasificación

    lenguaje.push(clasificacion);
    lenguaje.push(ningunoC);
    lenguaje.push(nuevoC);

    await update("lenguaje", lenguaje, fileCampos.file.path);
	await new Promise(resolve => setTimeout(resolve, 1000));
}
	descripcion = await tp.system.prompt("¿Quieres agregar una descripción?", " " + titulo, false, true )
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
typeName: Desarrollos
type: Dx
idq: 11
id: <% id %> 
aliases:
- <%titulo%>
descripcion: <%descripcion%>
lenguaje: <%clasificacion%>
estado: <% estado %> 
fecha: <% tp.date.now("YYYY-MM-DD dddd HH:mm") %>
tags:
asunto: <%* if(asunto){ %> 
- "[[<%nombre%>]]" <%*}%>
related:
---
# `VIEW[{aliases}]` 
>[!info]- Descripcion
>`VIEW[{descripcion}]`
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
// Inicia el bloque DataviewJS
dv.paragraph("**Lenguaje:** " + dv.current().lenguaje);

// Verifica si el campo 'asunto' existe y contiene notas dentro del directorio especificado

if (dv.current().asunto && dv.current().asunto.length > 0) {
    // Filtra las notas dentro del directorio específico
    const notasModulos = dv.current().asunto.filter(nota =>
        nota.path.startsWith("Subsistemas/Modulos Sistema Gestion/Modulos/")
    );
    const notasDesarrollos = dv.current().asunto.filter(nota =>
        nota.path.startsWith("Subsistemas/Desarrollo/Codigos/")
    );

    // Si hay notas filtradas en módulos, muestra un enlace a cada nota encontrada
    if (notasModulos.length > 0) {
        dv.span("**Módulos del sistema de gestión: **");
        notasModulos.forEach(nota => {
            dv.span("[[" + nota.path + "|" + (dv.page(nota.path).aliases || nota.file.name) + "]]");
        });
    }

    // Si hay notas filtradas en desarrollos, muestra un enlace a cada nota encontrada
    if (notasDesarrollos.length > 0) {
        dv.span("**Códigos de Origen: **");
        notasDesarrollos.forEach(nota => {
            dv.span("[[" + nota.path + "|" + (dv.page(nota.path).aliases || nota.file.name) + "]]");
        });
    }
}

```

## Contexto 


## Código


# Fin
- [/] Finalizado el ingreso de  Desarrollo-<%id%> #cx/Computador/OrganizarNotas  
Estado de la nota:  `INPUT[estadoNota][:estado]`
```dataviewjs
const {callDV} = customJS
callDV.CambiarTituloDescripcion(dv)
```
---
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
```dataviewjs
const {callDV} = customJS
callDV.BotonesStandar(dv)
```
