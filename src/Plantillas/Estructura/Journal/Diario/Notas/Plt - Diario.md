<%*
let semana = moment(tp.file.title.split(" ")[0]).add('days',1).format("YYYY-[W]WW")
let mes = moment(tp.file.title.split(" ")[0]).format("YYYY-MM MMMM")
-%>
---
asunto: 
- "[[<%semana%>]]"
- "[[<%mes%>]]"
titulo: []
estado: 🟡
---
_Resumen del día:_ `VIEW[{titulo}]`

---
[[<% moment(tp.file.title, "YYYY-MM-DD").subtract(1,"days").format("YYYY-MM-DD dddd ") %>]] / **<% moment(tp.file.title, "YYYY-MM-DD").format("dddd DD [de] MMMM")%>** / [[<% moment(tp.file.title, "YYYY-MM-DD").add(1,"days").format("YYYY-MM-DD dddd") %>]] 
Enlaces: `VIEW[{asunto}][link]`

```dataviewjs
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
console.error('El plugin TPM no está habilitado.');
}

// Forma de acceder al objeto gp desde DVJS
const gp = app.plugins.plugins['obsidian-personal-management']
await gp.menuHoyAPI.mostrarMenu(dv)
```

Estado de revisión:  `INPUT[estadoNota][:estado]`
# Mi día.
## Como me imagino este día

## Resumen del día

## Pensamientos del día.

# Plan y registro actividades
## Plan inicial del día.
![[<%semana%>#<%moment(tp.file.title.split(" ") [0]).format("YYYY-MM-DD dddd")%> Plan y registro actividades Bloques definidos para el <%moment(tp.file.title.split(" ") [0]).format("YYYY-MM-DD dddd")%>]]
## Planeación del día por bloques
