<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let  infoSubsistema = {}
infoSubsistema.defined = true; 
infoSubsistema.typeName = "CompassAnual"; // No discrimino si es de Inicio o Cierre.
infoSubsistema.type = "CAI"; // CompassAnualInicio
infoSubsistema.folder = "folder_CompassAnual"; // Las notas de Inicio y cierre quedan en el mismo folder.
infoSubsistema.indice = "indice_CompassAnual";
infoSubsistema.fileName = tp.file.path(true);
campos = ["id","fecha","año","estado","aliases","rename"]
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
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
fecha: <% v.fecha %>
revisiones:
---
# INICIO DE AÑO <%v.año%>

## [[Ax - 16#1. Mensaje de mi yo recordando los últimos y poniéndome en perspectiva y expectativa para este nuevo año.|1. Mensaje de mi yo recordando los últimos años y poniéndome en perspectiva y expectativa para este nuevo año.]]  
- 

## [[Ax - 16#2. Sueña en grande, vibra con la ilusión de lo que puede ser este nuevo año.|2. Sueña en grande, vibra con la ilusión de lo que puede ser este nuevo año.]]
- 

## [[Ax - 16#3. Eligiendo las áreas de vida en las que quiero trabajar este año.|3. Eligiendo las áreas de vida y objetivos en los que quiero trabajar este año.]]

### 3.1 Crea los objetivos que deseas alcanzar este año.

```dataviewjs
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
console.error('El plugin TPM no está habilitado.');
}

// Forma de acceder al objeto gp desde DVJS
const gp = app.plugins.plugins['obsidian-personal-management']
await gp.subsistemasAPI.mostrarBotonCompassAnual(dv)
```
```dataviewjs
// Verificar si el plugin está habilitado
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
  console.error('El plugin TPM no está habilitado.');
} else {
  const gp = app.plugins.plugins['obsidian-personal-management'];
  // Acceder al directorio de interés desde las configuraciones del plugin
  let folder = `${gp.settings["folder_ObjCompassAnual"]}`;
let notas = dv.pages().where(page => page.file.path.startsWith(folder) && page.año === dv.current().año).sort((b) => b.id, "asc");
// Nuevo
if (notas.length === 0) {
      dv.paragraph(`No se han definido objetivos para el año ${dv.current().año}.`);
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
await gp.subsistemasAPI.mostrarBotonCrearAV(dv)
```

```dataviewjs
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
  dv.span('El plugin TPM no está habilitado.');
  }else{
  
  // Forma de acceder al objeto gp desde DVJS
  const gp = app.plugins.plugins['obsidian-personal-management']
  let folder = gp.settings.folder_AreasVida;
  let trimAV = `${dv.current().año}-Q`;
  let notas = dv.pages().where(page => page.file.path.startsWith(folder) && page.type=== "AV" && page.estado !== "🔴" && page.trimestre && page.trimestre.path && typeof(page.trimestre.path) === 'string' && page.trimestre.path.includes(trimAV));
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

## [[Ax - 16#4. Creación de mis expectativas de este nuevo año.|4. Creación de mis expectativas de este nuevo año.]]
### [[Ax - 16#4.1 Estas cosas (mínimo 3) son las que mas me van a gustar de mi mismo este año.|4.1 Estas cosas (mínimo 3) son las que mas me van a gustar de mi mismo este año.]]
- 
- 
- 
### [[Ax - 16#4.2 Estoy listo para desprenderme de estas (mínimo 3) cosas este año.|4.2 Estoy listo para desprenderme de estas (mínimo 3) cosas este año.]]
- 
- 
- 
### [[Ax - 16#4.3 Estas son las (mínimo 3) cosas que mas deseo lograr este año.|4.3 Estas son las (mínimo 3) cosas que mas deseo lograr este año.]]
- 
- 
- 
### [[Ax - 16#4.4 Estas son las (mínimo 3) personas en las que siento que me puedo apoyar en los momentos difíciles de este año.|4.4 Estas son las (mínimo 3) personas en las que siento que me puedo apoyar en los momentos difíciles de este año.]]
- 
- 
- 

### [[Ax - 16#4.5 Estas son las (mínimo 3) cosas que estoy dispuesto a experimentar, probar y descubrir este año.|4.5 Estas son las (mínimo 3) cosas que estoy dispuesto a experimentar, probar y descubrir este año.]]
- 
- 
- 

### [[Ax - 16#4.6 Estas son las (mínimo 3) cosas a las que tendré fuerza y voluntad este año de decir que no.|4.6 Estas son las (mínimo 3) cosas a las que tendré fuerza y voluntad este año de decir que no.]]
- 
- 
- 

### [[Ax - 16#4.7 Estas son las (mínimo 3) cosas con las que voy a hacer que mi alrededor sea muy acogedor.|4.7 Estas son las (mínimo 3) cosas con las que voy a hacer que mi alrededor sea muy acogedor.]]
- 
- 
- 

### [[Ax - 16#4.8 Estos son los (mínimo 3) hábitos que diaria o semanalmente voy a desarrollar en mi mismo este año.|4.8 Estos son los (mínimo 3) hábitos que diaria o semanalmente voy a desarrollar en mi mismo este año.]]
- 
- 
- 

### [[Ax - 16#4.9 Estos son los (mínimo 3) lugares que voy a visitar este año.|4.9 Estos son los (mínimo 3) lugares que voy a visitar este año.]]
- 
- 
- 

### [[Ax - 16#4.10 Estas son las (mínimo 3) cosas con las que este año me acostumbraré a mimarme y consentirme.|4.10 Estas son las (mínimo 3) cosas con las que este año me acostumbraré a mimarme y consentirme.]]
- 
- 
- 

### [[Ax - 16#4.11 Estas son las (mínimo 3) maneras con las que voy a conectar y mejorar mi relación con las personas que quiero.|4.11 Estas son las (mínimo 3) maneras con las que voy a conectar y mejorar mi relación con las personas que quiero.]]
- 
- 
- 

### [[Ax - 16#4.12 Estos son los (mínimo 3) regalos con los que voy a premiar mis propios éxitos de este año.|4.12 Estos son los (mínimo 3) regalos con los que voy a premiar mis propios éxitos de este año.]]
- 
- 
- 

## [[Ax - 16#5. Mi perspectiva personal del nuevo año|5. Mi perspectiva personal del nuevo año]]
### [[Ax - 16#5.1 Mi consejo personal para este nuevo año es|5.1 Mi consejo personal para este nuevo año es:]]
- 

### [[Ax - 16#5.2 Este año será especial para mi gracias a|5.2 Este año será especial para mi gracias a:]]
- 

### [[Ax - 16#5.3 Este año conecto con las palabras|5.3 Este año conecto con las palabras:]]
- 

### [[Ax - 16#5.4 La inspiración que siento para esta año la encuentro en|5.4 La inspiración que siento para esta año la encuentro en:]]
- 

### [[Ax - 16#5.5 Este año voy a|5.5 Este año voy a:]]
#### [[Ax - 16#Decir que si a|Decir que si a:]]
- 

#### [[Ax - 16#Ser consciente de que|Ser consciente de que:]]
- 

#### [[Ax - 16#Dejar de procrastinar en|Dejar de procrastinar en:]]
- 

### [[Ax - 16#5.6 Mi definición de quien elijo ser este nuevo año es|5.6 Mi definición de quien elijo ser este nuevo año es: ]]
- 

## [[Ax - 16#6. Los objetivos personales que transformaré en proyectos.|6. Los objetivos personales que transformaré en proyectos.]]

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
                   .where(page => page.file.path.startsWith(folder) && page.año === dv.current().año)
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
            dv.paragraph(`No se han definido objetivos para el año ${dv.current().año}.`);
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
