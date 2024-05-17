<%*
const gp = app.plugins.plugins['obsidian-personal-management'];
let v, campos;
let  infoSubsistema = {}
infoSubsistema.defined = true; 
infoSubsistema.typeName = "CompassAnual"; // No discrimino si es de Inicio o Cierre.
infoSubsistema.type = "CAC"; // CompassAnualCierre
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
# FINALIZACIÓN DEL AÑO <% v.año %>

## [[Ax - 16#1. Los eventos mas representativos para mi de este año que estoy cerrando.|1. Los eventos mas representativos para mi de este año que estoy cerrando.]]

## [[Ax - 16#2. Estos fueron los avances que tuve en las áreas de vida en las que elegí trabajar el año que estoy cerrando.|2. Estos fueron los avances que tuve en las áreas de vida en las que elegí trabajar el año que estoy cerrando.]]
```dataviewjs
let areasVida = dv.pages('"Estructura/Areas de Vida"').sort(b=> b.id)
dv.table(["Area de Vida", "Estado Actual", "Avances obtenidos en el <% v.año %>"], areasVida.map(b=> [b.id + ". "+ b.tema+" -> " + dv.func.link(b.file.link, b.titulo), b.estado, b.avances]))
```

## [[Ax - 16#3. Mis apreciaciones mas importantes del año pasado|3. Mis apreciaciones mas importantes del año pasado]]
### [[Ax - 16#3.1 La lección más importante que aprendí fue|3.1 La lección más importante que aprendí fue:]]
- 

### [[Ax - 16#3.2 La ó las decisiones que considero fue(ron) mas acertada(s) y que me hacen sentir agradecido|3.2 La ó las decisiones que considero fue(ron) mas acertada(s) y que me hacen sentir agradecido:]]
- 

### [[Ax - 16#3.3 El mayor riesgo que tomé fué|3.3 El mayor riesgo que tomé fué:]]
- 

### [[Ax - 16#3.4 La mayor sorpresa del año ha sido|3.4 La mayor sorpresa del año ha sido:]]
- 

### [[Ax - 16#3.5 El logro ó logros más importantes del año fueron|3.5 El logro ó logros más importantes del año fueron:]]
- 
### [[Ax - 16#3.6 La acción que tomé y que mas represento para otros fué|3.6 La acción que tomé y que mas represento para otros fué:]]
- 

### [[Ax - 16#3.7 De la acción que me siento más orgulloso de este año que estoy cerrando es|3.7 De la acción que me siento más orgulloso de este año que estoy cerrando es:]]
- 

### [[Ax - 16#3.8 Que cosas no lograste finalizar?|3.8 Que cosas no lograste finalizar?]]
- 

### [[Ax - 16#3.9 Cual es el mayor aprendizaje que has tenido en este año que cierras sobre ti mismo?|3.9 Cual es el mayor aprendizaje que has tenido en este año que cierras sobre ti mismo?]]
- 

### [[Ax - 16#3.10 Cual es la situación sobre la que te sientes mas agradecido?|3.10 Cual es la situación sobre la que te sientes mas agradecido?]]
- 

### [[Ax - 16#3.11 Quienes fueron las (mínimo 3) personas que tuvieron influencia y efecto en tu vida? Cuál fué esa influencia?|3.11 Quienes fueron las (mínimo 3) personas que tuvieron influencia y efecto en tu vida? Cuál fué esa influencia?]]
- 

### [[Ax - 16#3.12 Quienes fueron las (mínimo 3) personas en las que sientes que ejerciste mas influencia este año? Cual fué ese efecto o influencia?|3.12 Quienes fueron las (mínimo 3) personas en las que sientes que ejerciste mas influencia este año? Cual fué ese efecto o influencia?]]
- 

## [[Ax - 16#4. Lo que mas resaltó de este año que estoy cerrando es|4. Lo que mas resaltó de este año que estoy cerrando.]]
### [[Ax - 16#4.1 Los (mínimo 3) mejores momentos que viviste el año que estas cerrando son|4.1 Los (mínimo 3) mejores momentos que viviste el año que estas cerrando son:]]
- 
- 
- 
### [[Ax - 16#4.2 Los (mínimo 3) logros mas importantes que lograste el año que termina fueron|4.2 Los (mínimo 3) logros mas importantes que lograste el año que termina fueron:]]
- 
- 
- 
### [[Ax - 16#4.3 Los (mínimo 3) retos mas importantes a los que te enfrentaste el año que estas cerrando fueron|4.3 Los (mínimo 3) retos mas importantes a los que te enfrentaste el año que estas cerrando fueron: ]]
- 
- 
- 

## [[Ax - 16#5. Crecimiento y evolución personal|5. Crecimiento y evolución personal]]
### [[Ax - 16#5.1 De este año que cierro, requiero perdonar|5.1 De este año que cierro, requiero perdonar:]]
- 

### [[Ax - 16#5.2 De este año que cierro, requiero soltar|5.2 De este año que cierro, requiero soltar:]]
- 

### [[Ax - 16#5.3 De este año que cierro, soy consciente de que cerré o requiero cerrar los ciclos|5.3 De este año que cierro, soy consciente de que cerré o requiero cerrar los ciclos: ]]
- 

### [[Ax - 16#5.4 Cierro este año y me despido de|5.4 Cierro este año y me despido de:]]
- 
### [[Ax - 16#5.5 Este año voy a|5.5 Este año voy a:|5.5 De este año que finaliza, agradezco profundamente:]]


## [[Ax - 16#6. Proceso final de cierre.|6. Proceso final de cierre.]]
### [[Ax - 16#6.1 Cuales son las palabras que podrían definir mejor el año que estas terminando?|6.1 Cuales son las palabras que podrían definir mejor el año que estas terminando?]]

### [[Ax - 16#6.2 Imagina que el año que termina es una película, que nombre le pondrías?|6.2 Imagina que el año que termina es una película, que nombre le pondrías?]]

### [[Ax - 16#6.3 Despide el año, escribe lo que salga de tu inspiración. Es momento de cerrar el año.|6.3 Despide el año, escribe lo que salga de tu inspiración. Es momento de cerrar el año.]]

