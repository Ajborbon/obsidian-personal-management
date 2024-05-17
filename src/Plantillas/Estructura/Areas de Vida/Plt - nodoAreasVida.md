<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let  infoSubsistema = {}
infoSubsistema.defined = true; 
infoSubsistema.folder = "folder_AreasVida"
infoSubsistema.indice = "indice_AreasVida"
infoSubsistema.typeName = "AreasVida";
infoSubsistema.type = "nAV";
infoSubsistema.fileName = tp.file.title;
campos = ["id","fecha","filename","aliases"]
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
await tp.file.rename(v.filename);
-%>
---
type: <% v.type %>
typeName: <% v.typeName %>
fecha: <% v.fecha %>
grupo: <% v.grupo %>
titulo: <% v.areaVida %>
areaVida: <% v.areaVida %>
id: <% v.id %>
aliases: <%* for (let a=0; a<v.aliases.length;a++){%>
 - <%v.aliases[a]%> <%*}%>
---
# <% v.grupo %> / <% v.areaVida %>
```dataviewjs
// Determinar el trimestre actual con el formato YYYY-[Q]Q
const fechaActual = new Date();
const añoActual = fechaActual.getFullYear();
const mesActual = fechaActual.getMonth(); // Enero = 0, Diciembre = 11
let trimestreActual;
if (mesActual < 3) {
  trimestreActual = `${añoActual}-Q1`;
} else if (mesActual < 6) {
  trimestreActual = `${añoActual}-Q2`;
} else if (mesActual < 9) {
  trimestreActual = `${añoActual}-Q3`;
} else {
  trimestreActual = `${añoActual}-Q4`;
}

// Obtener el folder de la nota actual
const folderActual = dv.current().file.path.split('/').slice(0, -1).join('/');

// Buscar notas en el mismo folder con el mismo trimestre
const notasMismoTrimestre = dv.pages()
  .where(p => p.file.path.startsWith(folderActual) && p.file.name.startsWith(trimestreActual));

// Determinar el estado según la búsqueda
if (notasMismoTrimestre.length > 0) {
  const estado = notasMismoTrimestre[0].estado; // Asumiendo que el campo estado existe en las notas
  dv.paragraph(`El estado actual de esta área de vida es ${estado}.`);
} else {
  dv.paragraph("El estado actual de esta área de vida es 🔴.");
}

```
## Descripción


## Periodos trimestrales creados.
```dataviewjs
// Verificar si el plugin de gestión personal está habilitado
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
  console.error('El plugin TPM no está habilitado.');
}

// Acceder al objeto del plugin de gestión personal
const gp = app.plugins.plugins['obsidian-personal-management'];
// Obtener el tipo de índice de la nota actual
let typeName = dv.current().typeName;
// Construir la clave dinámica para acceder a la configuración de la carpeta
let folderKey = `folder_${typeName}`;
// Usar la clave para obtener el valor de la configuración de la carpeta
let folder = gp.settings[folderKey];


// Obtener las notas que están en la misma carpeta que la nota actual y cuyo campo "asunto" apunta a la nota actual
let notas = dv.pages().where(page => page.file.path.startsWith(folder) && dv.func.contains(page.asunto, dv.current().file.link))
// Crear las filas de la tabla, incluyendo en el campo "Asunto" el enlace a la nota actual
let filas = notas.map(nota => {
  let link = nota.file.link;
  let estado = nota.estado; // Asumiendo que 'estado' es una propiedad de las páginas
  let trimestre = nota.trimestre;
  // Asumiendo que las notas tienen al menos un alias para el link
  return [dv.func.link(link, nota.aliases[0]), estado, trimestre];
});

// Agregar la tabla a la visualización
dv.table(["Nota", "Estado", "Trimestre"], filas);

```

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
 let notas = dv.pages().where(page => page.file.path.startsWith(folder) && page.type=== dv.current().type).sort((b) => b.id, "asc");
gp.addOnsAPI.crearPrevNext(notas,indice,dv)
```
