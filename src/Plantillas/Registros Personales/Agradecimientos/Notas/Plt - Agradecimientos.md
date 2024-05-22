<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let infoSubsistema = {};
infoSubsistema.defined = true;
infoSubsistema.typeName = "Agradecimiento";
infoSubsistema.type = "Agr";
infoSubsistema.folder = "Registros Personales/Agradecimientos/Notas";
infoSubsistema.indice = "indice_Agradecimientos";
infoSubsistema.fileName = tp.file.path(true);
campos = ["id", "fecha", "aliases", "rename", "estado", "agradecimientos"];
v = await gp.starterAPI.fillNote(infoSubsistema, campos);
-%>
---
version: 1.0
typeName: <% v.typeName %>
type: <% v.type %>
id: <% v.id %> 
aliases: <%* for (let a=0; a<v.aliases.length;a++){%>
 - <%v.aliases[a]%> <%* }%>
agradecimientos: <%* for (let a=0; a<v.agradecimientos.length;a++){%>
 - <%v.agradecimientos[a]%> <%* }%>
estado: <% v.estado %> 
fecha: <% v.fecha %>
---

# Agradecimientos del `VIEW[{fecha}]`
```meta-bind
INPUT[list:agradecimientos]
```

```dataviewjs
dv.paragraph("Hoy he creado " + dv.array(dv.current().titulo).length + " agradecimientos.")
```


# Fin