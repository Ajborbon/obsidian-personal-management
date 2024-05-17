<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let  infoSubsistema = {}
infoSubsistema.defined = true; 
infoSubsistema.typeName = "CompassTrimestral"; // No discrimino si es de Inicio o Cierre.
infoSubsistema.type = "CTI"; // CompassTrimestralInicio
infoSubsistema.folder = "folder_CompassTrimestral"; // Las notas de Inicio y cierre quedan en el mismo folder.
infoSubsistema.indice = "indice_CompassTrimestral";
infoSubsistema.fileName = tp.file.path(true);
campos = ["id","fecha","año","trimestre","estado","aliases","rename"]
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
// Chequear si se debe cancelar la creación de la nota
if (v.borrarNota) {
    // Usar la API de Obsidian para borrar la nota actual
    const file = app.vault.getAbstractFileByPath(tp.file.path());
    if (file instanceof File) {
        await app.vault.delete(file);
    }
    return;
}
-%>
---
version: 1.0
typeName: <% v.typeName %>
type: <% v.type %>
id: <% v.id %> 
aliases: <%* for (let a=0; a<v.aliases.length;a++){%>
 - <%v.aliases[a]%> <%* }%>
estado: <% v.estado %> 
año: <% v.año %>
trimestre: <% v.trimestre %>
fecha: <% v.fecha %>
revisiones:
---
# INICIO DE PERIODO <%v.trimestre%>

## 1. Propósito general y expectativas de este trimestre.

## 2 Propósitos Mensuales 
### 2.1 Propósito mes 1

### 2.2 Proposito Mes 2

### 2.3 Proposito Mes 3.

## 3. Objetivos y proyectos para este trimestre.

### 3.1 Crea y verifica los objetivos que deseas alcanzar este trimestre.

```dataviewjs
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
console.error('El plugin TPM no está habilitado.');
}

// Forma de acceder al objeto gp desde DVJS
const gp = app.plugins.plugins['obsidian-personal-management']
await gp.subsistemasAPI.mostrarBotonCompassTrimestral(dv)
```
```dataviewjs
// Verificar si el plugin está habilitado
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
  console.error('El plugin TPM no está habilitado.');
} else {
  const gp = app.plugins.plugins['obsidian-personal-management'];
  // Acceder al directorio de interés desde las configuraciones del plugin
  let folder = `${gp.settings["folder_ObjCompassAnual"]}`;
let notas = dv.pages().where(page => page.file.path.startsWith(folder) && page.trimestre && page.trimestre.path && typeof(page.trimestre.path) === 'string' && page.trimestre.path.includes(dv.current().trimestre)).sort((b) => b.id, "asc");
// Nuevo
if (notas.length === 0) {
      dv.paragraph(`No se han definido objetivos para el trimestre ${dv.current().trimestre}.`);
  } else {
      dv.header(3, `Objetivos Compass para el año ${dv.current().año}`);
      dv.table(["Objetivo", "Area de Vida", "Descripción","Trimestre", "Estado Objetivo"],
  notas.map(objetivo => {
  return [dv.func.link(objetivo.file.link, objetivo.titulo), objetivo.areaVida, objetivo.descripcion, objetivo.trimestre, objetivo.estado];
                  })
              );
  } // Else notas > 0 
} // else plugin
```

### 3.2 Verifica los estados Trimestrales de las Areas de vida de acuerdo con tus objetivos.

```dataviewjs
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
console.error('El plugin TPM no está habilitado.');
}

// Forma de acceder al objeto gp desde DVJS
const gp = app.plugins.plugins['obsidian-personal-management']
await gp.subsistemasAPI.mostrarBotonCrearAVTrimestral(dv)
```

```dataviewjs
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
  dv.span('El plugin TPM no está habilitado.');
  }else{
  
  // Forma de acceder al objeto gp desde DVJS
  const gp = app.plugins.plugins['obsidian-personal-management']
  let folder = gp.settings.folder_AreasVida;
  let trimAV = `${dv.current().año}-Q`;
  let notas = dv.pages().where(page => page.file.path.startsWith(folder) && page.type=== "AV" && page.estado !== "🔴" && page.trimestre && page.trimestre.path && typeof(page.trimestre.path) === 'string' && page.trimestre.path.includes(dv.current().trimestre));
// Crear las filas de la tabla
let filas = notas.map(nota => {
  let grupo = nota.grupo;
  let link = nota.file.link;
  let trimestre = nota.trimestre;
  let objetivos = nota.descripcion;
  let estado = nota.estado; // Asumiendo que 'fecha' es una propiedad de las páginas
  return [grupo + " / " + dv.func.link(link, nota.areaVida), trimestre, objetivos, estado]; // Asumiendo que las notas tienen al menos un alias
});

// Agregar la tabla a la visualización
dv.table(["Area de Vida", "Trimestre", "Objetivos", "Estado"], filas.sort(b=> b[0]));

}
```


###  3.3. Los objetivos personales que transformaré en proyectos.

```dataviewjs
// Asegúrate de que el plugin obsidian-personal-management esté habilitado
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
    console.error('El plugin TPM no está habilitado.');
} else {
    const gp = app.plugins.plugins['obsidian-personal-management'];

    // Acceder a los directorios de interés desde las configuraciones del plugin
    let folder = gp.settings["folder_ObjCompassAnual"];
    let folderQ = gp.settings["folder_ProyectosQ"];
    let folderGTD = gp.settings["folder_ProyectosGTD"];

    // Obtener las notas de objetivos para el año actual
    let notas = dv.pages()
                   .where(page => page.file.path.startsWith(folder) && page.trimestre && page.trimestre.path && typeof(page.trimestre.path) === 'string' && page.trimestre.path.includes(dv.current().trimestre))
                   .sort((b) => b.id, "asc");

    // Función para buscar archivos en un directorio que coincidan con el asunto
    async function buscarProyectoConAsunto(folder, asunto) {
        // Imprime el asunto que se busca para asegurarte de que tiene el formato correcto
        console.log("Buscando asunto:", asunto);
        
        let resultados = dv.pages(`"${folder}"`)
            .where(p => {
                // Imprime los asuntos de la página actual para debug
                console.log("Asuntos en la página:", p.asunto);
                
                let coincide = Array.isArray(p.asunto) && p.asunto.some(asuntoEnLista => {
                    let comparacion = asuntoEnLista.path === asunto;
                    debugger;
                    console.log(`Comparando ${asuntoEnLista} con [[${asunto}]]:`, comparacion);
                    return comparacion;
                });
                return coincide;
            })
            .first(); // Retorna el primer archivo que coincida con el criterio
        
        return resultados; // Retorna el proyecto encontrado o undefined
    }
    
    

    // Función asincrónica principal para preparar los datos y generar la tabla
    async function prepararDatosYGenerarTabla() {
        // Revisa si hay notas de objetivos para procesar
        if (notas.length === 0) {
            dv.paragraph(`No se han definido objetivos para el trimestre ${dv.current().trimestre}.`);
            return;
        }
        
        dv.header(3, `Objetivos Compass para el año ${dv.current().año}`);

        // Prepara los datos de manera asincrónica
        let filasTabla = await Promise.all(notas.map(async objetivo => {
            debugger;
            let encontradoEnQ = await buscarProyectoConAsunto(folderQ, objetivo.file.path);
            let encontradoEnGTD = !encontradoEnQ ? await buscarProyectoConAsunto(folderGTD, objetivo.file.path) : undefined;
            
            // Usa el proyecto encontrado o genera un botón si no hay proyecto
            let proyectoCell = encontradoEnQ || encontradoEnGTD ? (encontradoEnQ || encontradoEnGTD).file.link : gp.subsistemasAPI.createButtonTable(dv, objetivo);
            
            return [dv.func.link(objetivo.file.link, objetivo.titulo), objetivo.areaVida, objetivo.trimestre, objetivo.estado, proyectoCell];
        }));
        
        // Genera la tabla con los datos preparados
        dv.table(["Objetivo", "Area de Vida", "Trimestre", "Estado Objetivo", "Proyecto"], filasTabla);
    }

    // Ejecutar la función principal asincrónica
    prepararDatosYGenerarTabla().catch(console.error);
}

```
## 4. ¿En que areas de vida y proyectos tengo mis prioridades este trimestre?

## 5. Objetivos semanales en los 3 proyectos principales.
