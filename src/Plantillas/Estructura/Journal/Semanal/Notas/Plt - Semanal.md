<%*
const dv = this.DataviewAPI;
if(!tp.file.title.startsWith("202")){ // En caso de que no venga de crearlo en el calendario
let paso1 = await tp.system.suggester(["Ingresando fecha completa", "Ingresando el año y la semana"],["fecha", "semana"], true, "¿Como deseas elegir la semana que vas a crear?")

if(paso1="fecha"){ // provee la fecha completa

}else{ // Provee el año y la semana

}
// revisar si ya existe el archivo
// Mover el archivo

} // Fin if no calendario
else{ // Else viene del calendario

} // Fin else Calendario  
let año = tp.file.title.slice(0,4) 
let week = tp.file.title.slice(6)
let fechaI = new Date(año, 0, (week - 1) * 7);
let fecha = new Date(año, 0, (week - 1) * 7 + 6); // Calculo con el ultimo dia de la semana
let fechaPI = moment(fechaI).format("YYYY-MM-DD dddd")
let fechaPF = moment(fecha).format("YYYY-MM-DD dddd")
let trim = moment(fecha).format("Q")
let sem = moment(fecha).format("W")-((moment(fecha).format("Q")-1)*13)
if (sem==0){sem = 13}
let numSemana = moment(fecha).format("WW")
let trimestre = moment(fecha).format("YYYY-[Q]Q") 
let mes = moment(fecha).format("YYYY-MM MMMM")
debugger
let folderSemanal = "Estructura/Journal/Semanal/Notas";

let idAux = dv.pages()
  .where(page => page.file.path.startsWith(folderSemanal))
  .file
  .frontmatter
  .sort(b => b.id, 'desc')
  .id;

// Comprobación adicional para asegurar que idAux es un número
if (isNaN(idAux[0]) || idAux[0] === undefined || idAux.length === 0) {
	debugger;
    idAux = [0]; // Aseguramos que idAux sea un arreglo con el valor 0
}
let id = idAux[0] + 1;

-%>
---
typeName: Semanal
type: W
titulo:
semana: <%numSemana%>
inicioW: <%fechaPI%>
fecha: <%fechaPF%>
estado: 🟡 
id:  <%id%>
aliases: 
- <%año%>-Q<%trim%>-W<%sem%>
trimestre:  <%año%>-Q<%trim%>
tags:
asunto: 
- "[[<%trimestre%>]]"
- "[[<%mes%>]]"
---
# Semana <%sem%> - <%trim%>Q  / W{{date: ww}}
 _Resumen de la semana:_ `VIEW[{titulo}]`
## Links
[[<% moment(tp.file.title, "YYYY-ww").subtract(1,"weeks").format("YYYY-[W]ww") %>]] / [[<% moment(tp.file.title, "YYYY-ww").add(1,"weeks").format("YYYY-[W]ww") %>]] 
```dataviewjs
const {piePagina} = customJS
piePagina.crearPrevNext(dv.current(), dv.pages('"Estructura/Journal/Semanal/Notas"').sort(b=> b.fecha, "asc"), dv.page("Estructura/Journal/Semanal/Indice Semanal"),dv)
```
<%*
// Define la función para agregar días a una fecha
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Recupera la fecha de inicio del YAML
let fechaInicio = new Date(fechaI);
let diaSemana = ["D ", " ﹒L ", " ﹒M ", " ﹒Mc ", " ﹒J ", " ﹒V ", " ﹒S "]
// Genera los enlaces para la semana
for (let i = 0; i < 7; i++) {
    let fechaActual = addDays(fechaInicio, i);
    let yyyy = fechaActual.getFullYear();
    let mm = String(fechaActual.getMonth() + 1).padStart(2, '0');
    let dd = String(fechaActual.getDate()).padStart(2, '0');
    let dayName = fechaActual.toLocaleDateString('es-ES', { weekday: 'long' });
    
    // Formatea el enlace
    let link = `[[${yyyy}-${mm}-${dd} ${dayName}|${dd}]]`;
    
    // Añade el enlace a tR
    tR += diaSemana[i] + link; // Añade un salto de línea después de cada enlace
}
%>
Enlaces: `VIEW[{asunto}][link]`


```dataviewjs
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
console.error('El plugin TPM no está habilitado.');
}

// Forma de acceder al objeto gp desde DVJS
const gp = app.plugins.plugins['obsidian-personal-management']
await gp.menuSemanalAPI.mostrarMenu(dv)
```
## Iniciando semana
### ¿Cuál es mi plan para esta semana? 

#### Propósitos principales.

#### ¿Cuál es mi inspiración de esta semana?

#### Semanario
<%*
for (let i = 0; i < 7; i++) {
    let fechaActual = addDays(fechaInicio, i);
    let yyyy = fechaActual.getFullYear();
    let mm = String(fechaActual.getMonth() + 1).padStart(2, '0');
    let dd = String(fechaActual.getDate()).padStart(2, '0');
    let dayName = fechaActual.toLocaleDateString('es-ES', { weekday: 'long' });
    
    // Formato 
    let formato = `##### [[${yyyy}-${mm}-${dd} ${dayName}#Plan y registro actividades|Bloques definidos para el ${yyyy}-${mm}-${dd} ${dayName}]]`;
    
    // Añade el enlace a tR
    tR += formato + "\n" + "\n"; // Añade un salto de línea después de cada enlace
}
%>

---
## Finalizando semana
Estado de revisión:  `INPUT[estadoNota][:estado]`
### Resumen Semanal

### Cuales son mis conclusiones de esta semana?

### Recursos creados y tareas cerradas de esta semana

```dataviewjs
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
console.error('El plugin TPM no está habilitado.');
}

// Forma de acceder al objeto gp desde DVJS
const gp = app.plugins.plugins['obsidian-personal-management']
await gp.menuSemanalAPI.mostrarMenu(dv)
```
## Anotaciones diarias de esta semana
<%*
for (let i = 0; i < 7; i++) {
    let fechaActual = addDays(fechaInicio, i);
    let yyyy = fechaActual.getFullYear();
    let mm = String(fechaActual.getMonth() + 1).padStart(2, '0');
    let dd = String(fechaActual.getDate()).padStart(2, '0');
    let dayName = fechaActual.toLocaleDateString('es-ES', { weekday: 'long' });
    // Convierte la primera letra a mayúscula y el resto a minúsculas (por si acaso) 
    let dayNameU = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    // Formato 
    let formato = `### ${dayNameU} \n ![[${yyyy}-${mm}-${dd} ${dayName}#Mi día]]`;
    
    // Añade el enlace a tR
    tR += formato + "\n"; // Añade un salto de línea después de cada enlace
}
%>
---
## Proceso GTD
### Revisión Semanal GTD
- Inbox
- Agenda
- Scheduled
- A. Seguimiento
- L. En Espera
- PGTD
- PQ
- Contextos
- Esta Semana No
- Algún día
### Tareas preferenciales de la semana por proyecto y prioridad 
- Proyectos Q
- Proyectos GTD
- Prioridad Alta
- Prioridad Media
### Tareas agendadas de Domingo a Sábado
- Botonera de D -> S
### Tareas planteadas para esta semana con el campo W
```dataviewjs
let weekTasks = dv.pages().file.tasks.filter(b => b.w && dv.func.contains(b.w.path, "<%año%> W<%numSemana%>"))
if (weekTasks.length>0){
const {tareasSemanaW} = customJS
let opciones = ["Totales", "Contextos" , "Sin contexto","Programada", "Sin Programar", "Proyectos de Q", "Proyectos GTD", "Anotaciones", "Otros" ,"Todas","Cerradas","🧹"]
let clase = []
clase.push("Nivel0")
tareasSemanaW.createButton(opciones, clase, this.container, dv,"<%año%> W<%numSemana%>","", weekTasks)
}else{
dv.paragraph("No hay tareas con el campo w creado apuntando a esta semana")
}
```
### Registros para la semana
- Bandeja Entrada
- Plan de Comida 
- Plan de Meditación
- Plan de consumo de contenido
---

---
# Fin
- [/] Crear la planeación de la semana <%numSemana%>  #cx/GestiónPersonal/PlanSemanal
- [ ] Escribir las conclusiones y hacer el cierre de la semana <%numSemana%>  #cx/GestiónPersonal/PlanSemanal

```dataviewjs
const {piePagina} = customJS
const views = ['Totales','Carrusel - Padre','Notas - Hijo','Tareas - Hijo','Notas Relacionadas','Vista Temas',,'Transacciones','Gráfico','Asunto','🧹']
let clase = []
clase.push("Nivel0")
piePagina.createButton(views, clase, this.container, dv)
```
