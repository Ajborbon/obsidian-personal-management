/*
 * Filename: /src/modules/noteLifecycleManager/API/addOnsAPI.ts
 * Path: /src/modules/noteLifecycleManager/API
 * Created Date: 2024-03-19 09:32:03
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:48:35
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


export class addOnsAPI {
    constructor(plugin) {
      this.plugin = plugin;
    }
  
    crearPrevNext(paginas, pagIndice, dv) {
        let pagina = dv.current();
        let indice;
        for (let a = 0; a < paginas.length; a++) {
            if (paginas[a].file.name == pagina.file.name) {
                indice = a;
            }
        }
    
        let links = [];
        if (indice == 0 && paginas.length == 1) {
            links[0] = "";
            links[1] = "";
        } else if (indice == 0) {
            links[0] = "";
            links[1] = "➡️ " + dv.func.link(paginas[indice + 1].file.path, this.determinarTextoEnlace(paginas[indice + 1]));
        } else if (indice == (paginas.length - 1)) {
            links[0] = dv.func.link(paginas[indice - 1].file.path, this.determinarTextoEnlace(paginas[indice - 1])) + " ⬅️";
            links[1] = "";
        } else {
            links[0] = dv.func.link(paginas[indice - 1].file.path, this.determinarTextoEnlace(paginas[indice - 1])) + " ⬅️";
            links[1] = "➡️ " + dv.func.link(paginas[indice + 1].file.path, this.determinarTextoEnlace(paginas[indice + 1]));
        }
    
        dv.paragraph(links[0] + " ==" + dv.func.link(pagIndice.file.path, pagIndice.titulo || pagIndice.file.name) + "== " + links[1]);
    }

    determinarTextoEnlace(pagina) {
        if (pagina.titulo) {
            return pagina.titulo;
        } else if (pagina.aliases && pagina.aliases.length > 0) {
            return pagina.aliases[0];
        } else {
            return pagina.file.name;
        }
    }
  


/**
 * Genera texto de relaciones con enlaces funcionales y formateado con CSS
 * @param pagina La página actual obtenida a través de dv.current()
 * @param dv El objeto dataview para acceder a sus funciones
 * @returns Objeto HTML para ser usado con dv.paragraph()
 */
generarTextoRelaciones(pagina, dv) {
    // Primero generamos el texto con enlaces funcionales
    let texto = `${pagina.typeName || "Entregable"} relacionado a `;
    const relaciones = [];
    
    // Asunto
    if (pagina.asunto && Array.isArray(pagina.asunto)) {
        const asuntoLinks = [];
        for (const entryObj of pagina.asunto) {
            const path = entryObj.path || entryObj;
            if (typeof path === 'string' && path.length > 0) {
                try {
                    const asuntoPage = dv.page(path);
                    if (asuntoPage && asuntoPage.file) {
                        const alias = asuntoPage.file.aliases?.[0] || asuntoPage.titulo || asuntoPage.file.name;
                        asuntoLinks.push(dv.fileLink(asuntoPage.file.path, false, alias));
                    } else {
                        asuntoLinks.push("asunto no encontrado");
                    }
                } catch (e) {
                    asuntoLinks.push("asunto no encontrado");
                }
            }
        }
        
        if (asuntoLinks.length > 0) {
            relaciones.push(`asunto: ${asuntoLinks.join(", ")}`);
        } else {
            relaciones.push("asunto: asunto no encontrado");
        }
    }

    // Proyectos GTD
    if (pagina.proyectoGTD && (Array.isArray(pagina.proyectoGTD) || typeof pagina.proyectoGTD === 'string')) {
        const proyectoLinks = [];
        const proyectoArray = Array.isArray(pagina.proyectoGTD) 
            ? pagina.proyectoGTD 
            : [pagina.proyectoGTD];
        
        for (const entryObj of proyectoArray) {
            const path = entryObj.path || entryObj;
            if (typeof path === 'string' && path.length > 0) {
                try {
                    const proyectoPage = dv.page(path);
                    if (proyectoPage && proyectoPage.file) {
                        const alias = proyectoPage.file.aliases?.[0] || proyectoPage.titulo || proyectoPage.file.name;
                        proyectoLinks.push(dv.fileLink(proyectoPage.file.path, false, alias));
                    }
                } catch (e) {
                    // Si la página no se encuentra, podemos extraer el título del path o la entrada original
                    if (typeof entryObj === 'string' && entryObj.includes('|')) {
                        const partes = entryObj.split('|');
                        proyectoLinks.push(partes[partes.length - 1].replace(']]', ''));
                    } else {
                        // Intentamos encontrar el nombre desde el path
                        const pathParts = path.split('/');
                        const fileName = pathParts[pathParts.length - 1].replace('.md', '');
                        proyectoLinks.push(fileName);
                    }
                }
            }
        }
        
        if (proyectoLinks.length > 0) {
            relaciones.push(`PGTD: ${proyectoLinks.join(", ")}`);
        }
    }

    // Áreas de interés
    if (pagina.areaInteres && (Array.isArray(pagina.areaInteres) || typeof pagina.areaInteres === 'string')) {
        const areaLinks = [];
        const areaArray = Array.isArray(pagina.areaInteres) 
            ? pagina.areaInteres 
            : [pagina.areaInteres];
        
        for (const entryObj of areaArray) {
            const path = entryObj.path || entryObj;
            if (typeof path === 'string' && path.length > 0) {
                try {
                    const areaPage = dv.page(path);
                    if (areaPage && areaPage.file) {
                        const alias = areaPage.file.aliases?.[0] || areaPage.titulo || areaPage.file.name;
                        areaLinks.push(dv.fileLink(areaPage.file.path, false, alias));
                    }
                } catch (e) {
                    // Si la página no se encuentra, podemos extraer el título del path o la entrada original
                    if (typeof entryObj === 'string' && entryObj.includes('|')) {
                        const partes = entryObj.split('|');
                        areaLinks.push(partes[partes.length - 1].replace(']]', ''));
                    } else {
                        // Intentamos encontrar el nombre desde el path
                        const pathParts = path.split('/');
                        const fileName = pathParts[pathParts.length - 1].replace('.md', '');
                        areaLinks.push(fileName);
                    }
                }
            }
        }
        
        if (areaLinks.length > 0) {
            relaciones.push(`AI: ${areaLinks.join(", ")}`);
        }
    }

    // Área de vida
    if (pagina.areaVida) {
        let areaVidaText = pagina.areaVida;
        
        // Si el área de vida es una referencia, procesar de manera similar
        if (typeof pagina.areaVida === 'string' && pagina.areaVida.includes('[[')) {
            // Es una referencia wiki, obtener el nombre amigable
            const match = pagina.areaVida.match(/\[\[(.*?)\|(.*?)\]\]/);
            if (match && match.length >= 3) {
                areaVidaText = match[2];
            } else {
                areaVidaText = pagina.areaVida.replace(/\[\[|\]\]/g, '');
            }
        }
        
        relaciones.push(`AV: ${areaVidaText}`);
    }

    // Unir todas las relaciones
    texto += relaciones.join(", ");
    
    // Añadir el estado al final
    if (pagina.estado) {
        texto += ` en estado ${pagina.estado}`;
    }
    
    // Envolver el contenido en un span con clase para estilos CSS
    // Creamos un elemento HTML utilizando las funciones de Dataview
    return dv.el("span", texto, { cls: "nota-relaciones" });
}


/**
 * Genera un árbol de referencias a la nota actual de forma recursiva con elementos toggle
 * @param paginaActual La página actual
 * @param dv Objeto dataview para acceder a sus funciones
 * @param profundidadMaxima Profundidad máxima de recursión (defecto: 3)
 * @param visitadas Set de IDs de páginas ya visitadas para evitar ciclos
 * @param profundidadActual Profundidad actual de recursión
 * @returns Elemento HTML con la estructura de árbol
 */
generarArbolReferencias(paginaActual, dv, profundidadMaxima = 3, visitadas = new Set(), profundidadActual = 0) {
    // Validar que paginaActual tenga las propiedades necesarias
    if (!paginaActual || !paginaActual.file) {
        console.error("Error: paginaActual no tiene las propiedades necesarias", paginaActual);
        return dv.el("div", "Error: No se puede generar el árbol de referencias.", { cls: "backlinks-tree-error" });
    }
    
    // Crear el contenedor principal
    const contenedor = document.createElement("div");
    contenedor.className = "backlinks-tree";
    
    if (profundidadActual === 0) {
        // Añadir título personalizado solo en la raíz
        const tipoNota = paginaActual.typeName || "Nota";
        const alias = paginaActual.file.aliases && paginaActual.file.aliases.length > 0 
            ? paginaActual.file.aliases[0] 
            : (paginaActual.titulo || paginaActual.file.name);
            
        const titulo = document.createElement("h3");
        titulo.className = "backlinks-tree-title";
        titulo.textContent = `Referencias a ${tipoNota} "${alias}"`;
        contenedor.appendChild(titulo);
    }
    
    // Si hemos llegado a la profundidad máxima, no seguimos explorando
    if (profundidadActual >= profundidadMaxima) {
        return contenedor;
    }
    
    // Marcar esta página como visitada para evitar ciclos
    visitadas.add(paginaActual.file.path);
    
    // Obtener todas las páginas que hacen referencia directa a la página actual
    let todasLasPaginas;
    try {
        todasLasPaginas = dv.pages();
    } catch (e) {
        console.error("Error al obtener páginas:", e);
        const errorMsg = document.createElement("p");
        errorMsg.className = "backlinks-tree-error";
        errorMsg.textContent = "Error al obtener páginas de Dataview";
        contenedor.appendChild(errorMsg);
        return contenedor;
    }
    
    // Filtrar las páginas que referencian a la actual a través de 'asunto'
    let referenciasDirectas = [];
    try {
        referenciasDirectas = todasLasPaginas.filter(p => {
            if (!p.asunto) return false;
            
            // Normalizar asunto a array
            const asuntos = Array.isArray(p.asunto) ? p.asunto : [p.asunto];
            
            for (const asunto of asuntos) {
                // Si asunto es un objeto con path y coincide con la página actual
                if (asunto && typeof asunto === 'object' && asunto.path === paginaActual.file.path) {
                    return true;
                }
                
                // Si asunto es una cadena con el formato [[ruta|alias]]
                if (typeof asunto === 'string' && asunto.includes(paginaActual.file.path)) {
                    return true;
                }
                
                // Si asunto es una cadena y coincide con el alias o nombre de la página actual
                if (typeof asunto === 'string') {
                    // Verificar coincidencia con aliases
                    const aliases = paginaActual.file.aliases || [];
                    for (const alias of aliases) {
                        if (asunto.includes(alias)) {
                            return true;
                        }
                    }
                    
                    // Verificar coincidencia con el nombre del archivo
                    if (asunto.includes(paginaActual.file.name)) {
                        return true;
                    }
                }
            }
            
            return false;
        });
    } catch (e) {
        console.error("Error al filtrar referencias:", e);
        const errorMsg = document.createElement("p");
        errorMsg.className = "backlinks-tree-error";
        errorMsg.textContent = "Error al procesar referencias";
        contenedor.appendChild(errorMsg);
        return contenedor;
    }
    
    // Si no hay referencias, mostrar mensaje
    if (referenciasDirectas.length === 0) {
        if (profundidadActual === 0) {
            const mensaje = document.createElement("p");
            mensaje.className = "backlinks-tree-empty";
            mensaje.textContent = "No se encontraron referencias a esta nota";
            contenedor.appendChild(mensaje);
        }
        return contenedor;
    }
    
    // Crear lista para mostrar referencias
    const lista = document.createElement("ul");
    lista.className = `backlinks-tree-level-${profundidadActual}`;
    
    // Añadir cada referencia a la lista
    for (const referencia of referenciasDirectas) {
        try {
            // Evitar ciclos
            if (visitadas.has(referencia.file.path)) {
                continue;
            }
            
            // Crear elemento de lista
            const item = document.createElement("li");
            item.className = "backlinks-tree-item";
            
            // Crear contenedor para el elemento toggle y su contenido
            const itemContainer = document.createElement("div");
            itemContainer.className = "backlinks-tree-item-container";
            
            // Añadir tipo y enlace al contenedor principal
            const tipo = referencia.typeName || "Nota";
            const tipoEl = document.createElement("span");
            tipoEl.className = "backlinks-tree-type";
            tipoEl.textContent = `[${tipo}] `;
            itemContainer.appendChild(tipoEl);
            
            // Determinar el texto para mostrar en el enlace
            let nombreMostrado = "";
            try {
                nombreMostrado = referencia.file.aliases && referencia.file.aliases.length > 0
                    ? referencia.file.aliases[0] 
                    : (referencia.titulo || referencia.file.name);
            } catch (e) {
                nombreMostrado = referencia.file.name || "Sin nombre";
            }
            
           // CORRECCIÓN AQUÍ - Manejo de enlaces para abrir en nueva pestaña
            const enlace = document.createElement("a");
            enlace.textContent = nombreMostrado;
            enlace.className = "internal-link";

            // En lugar de construir una URL obsidian://, usamos data-href para almacenar la ruta del archivo
            enlace.setAttribute("data-href", referencia.file.path);

            // Usamos la API de Obsidian para manejar el clic y la apertura del archivo en nueva pestaña
            enlace.addEventListener("click", (event) => {
                event.preventDefault();
                const path = event.target.getAttribute("data-href");
                if (path) {
                    // Modificación: el tercer parámetro en 'true' le indica a Obsidian que abra en una nueva hoja
                    app.workspace.openLinkText(path, "", true);
                }
            });

            itemContainer.appendChild(enlace);
            
            // Intentar obtener recursivamente referencias a esta referencia
            try {
                // Nuevo conjunto de visitadas para no afectar otros niveles
                const nuevoVisitadas = new Set([...visitadas]);
                nuevoVisitadas.add(referencia.file.path);
                
                // Verificar si hay subreferencias antes de crear el toggle
                const subReferencias = this.generarArbolReferencias(
                    referencia, dv, profundidadMaxima, 
                    nuevoVisitadas, profundidadActual + 1
                );
                
                // Si hay contenido útil en las subreferencias
                if (subReferencias.children && subReferencias.children.length > 0) {
                    // Verificar si hay más que solo el título
                    const tieneContenidoUtil = subReferencias.children.length > 1 || 
                        (subReferencias.children.length === 1 && 
                         !subReferencias.children[0].classList.contains("backlinks-tree-title"));
                    
                    if (tieneContenidoUtil) {
                        // Crear el elemento toggle (botón que indica si hay subreferencias)
                        const toggleButton = document.createElement("span");
                        toggleButton.className = "backlinks-tree-toggle";
                        toggleButton.textContent = "►"; // Triángulo a la derecha (cerrado)
                        
                        // Insertar el toggle al inicio del itemContainer
                        itemContainer.insertBefore(toggleButton, itemContainer.firstChild);
                        
                        // Añadir contenedor para subreferencias que será toggleable
                        const subContainer = document.createElement("div");
                        subContainer.className = "backlinks-tree-subcontainer";
                        subContainer.style.display = "none"; // Oculto por defecto
                        subContainer.appendChild(subReferencias);
                        
                        // Añadir evento al toggle
                        toggleButton.addEventListener("click", () => {
                            if (subContainer.style.display === "none") {
                                subContainer.style.display = "block";
                                toggleButton.textContent = "▼"; // Triángulo hacia abajo (abierto)
                                toggleButton.classList.add("open");
                            } else {
                                subContainer.style.display = "none";
                                toggleButton.textContent = "►"; // Triángulo a la derecha (cerrado)
                                toggleButton.classList.remove("open");
                            }
                        });
                        
                        // Añadir el subcontainer después del itemContainer
                        item.appendChild(itemContainer);
                        item.appendChild(subContainer);
                    } else {
                        // Si no hay subreferencias útiles, solo añadir el itemContainer
                        item.appendChild(itemContainer);
                    }
                } else {
                    // Si no hay ninguna subreferencia, solo añadir el itemContainer
                    item.appendChild(itemContainer);
                }
            } catch (e) {
                console.error("Error en la recursión para " + referencia.file.path, e);
                const errorMsg = document.createElement("span");
                errorMsg.className = "backlinks-tree-error";
                errorMsg.textContent = " (Error al obtener subreferencias)";
                itemContainer.appendChild(errorMsg);
                item.appendChild(itemContainer);
            }
            
            // Añadir el item completo a la lista
            lista.appendChild(item);
            
        } catch (e) {
            console.error("Error al procesar referencia:", e);
            // Continuar con la siguiente referencia
            continue;
        }
    }
    
    // Añadir la lista al contenedor
    try {
        contenedor.appendChild(lista);
    } catch (e) {
        console.error("Error al añadir lista al contenedor:", e);
        const errorMsg = document.createElement("p");
        errorMsg.className = "backlinks-tree-error";
        errorMsg.textContent = "Error al generar estructura de árbol";
        contenedor.appendChild(errorMsg);
    }
    
    return contenedor;
}


/**
 * Muestra enlaces sincronizados en Notion desde el frontmatter 
 * que comienzan con el prefijo "link-"
 * @param dv El objeto dataview para acceder a sus funciones
 * @param pagina La página actual (normalmente dv.current())
 * @returns El contenedor con los resultados
 */
mostrarEnlacesSincronizados(dv, pagina) {
    // Crear contenedor para los resultados
    const contenedor = dv.el("div", "", { cls: "notion-links-container" });
    
    try {
        // Obtener el frontmatter
        const meta = pagina.file.frontmatter;
        if (!meta) {
            // Si no hay frontmatter, no mostramos nada para ahorrar espacio
            return contenedor;
        }
        
        // Obtener el valor de typeName si existe
        const typeName = meta.typeName || "Elemento";
        
        // Función para verificar si una URL es válida (más que solo https://)
        const isValidUrl = (url) => {
            return typeof url === 'string' && 
                   url.startsWith('http') && 
                   url.length > 8; // Más largo que solo "https://"
        };
        
        // Recopilamos todos los enlaces relevantes
        const enlaces = [];
        
        // 1. Enlaces que comienzan con "link-" (Notion)
        Object.entries(meta)
            .filter(([key, value]) => key.startsWith("link-") && isValidUrl(value))
            .forEach(([key, value]) => enlaces.push({
                label: "Notion",
                url: value
            }));
        
        // 2. Enlaces específicos según el tipo de elemento
        if (typeName === "Campaña" && isValidUrl(meta.indicadores)) {
            enlaces.push({
                label: "Indicadores de campaña",
                url: meta.indicadores
            });
        }
        
        if (typeName === "Entregable") {
            if (isValidUrl(meta.piezaNube)) {
                enlaces.push({
                    label: "Pieza en la nube",
                    url: meta.piezaNube
                });
            }
            
            if (isValidUrl(meta.urlCanva)) {
                enlaces.push({
                    label: "Diseño en Canva",
                    url: meta.urlCanva
                });
            }
        }
        
        // Si no hay enlaces, no mostramos nada
        if (enlaces.length === 0) {
            return contenedor;
        }
        
        // Mostrar cada enlace
        enlaces.forEach(enlace => {
            // Crear un párrafo para cada enlace
            const parrafo = document.createElement("p");
            parrafo.classList.add("notion-link-item");
            
            // Crear texto con la etiqueta específica
            parrafo.textContent = `${typeName} - ${enlace.label} en `;
            
            // Crear enlace
            const linkElement = document.createElement("a");
            linkElement.href = enlace.url;
            linkElement.textContent = enlace.url;
            linkElement.target = "_blank"; // Abrir en nueva pestaña
            linkElement.rel = "noopener noreferrer"; // Seguridad para enlaces externos
            
            // Añadir el enlace al párrafo
            parrafo.appendChild(linkElement);
            
            // Añadir el párrafo al contenedor
            contenedor.appendChild(parrafo);
        });
        
    } catch (error) {
        console.error("Error al procesar enlaces sincronizados:", error);
        // No mostramos mensaje de error para ahorrar espacio
    }
    
    return contenedor;
}
// -------

/**
 * Procesa y prepara las estadísticas de tiempo para un proyecto
 * @param proyectoPath Ruta completa del archivo del proyecto
 * @returns Objeto con todas las estadísticas y registros procesados
 */
async obtenerEstadisticasTiempo(proyectoPath) {
    try {
      // Obtener carpeta de registros de tiempo desde la configuración
      const folderRT = this.plugin.settings.folder_RegistroTiempo;
      
      // Función para formatear duración en milisegundos a formato legible
      const formatDuration = (ms) => {
        if (ms === null || ms === undefined || isNaN(ms)) {
          return "No definido";
        } else {
          // Convertir milisegundos a minutos, horas y días
          let minutos = Math.floor(ms / (1000 * 60));
          let horas = Math.floor(minutos / 60);
          minutos = minutos % 60;
          let dias = Math.floor(horas / 24);
          horas = horas % 24;
          
          // Formatear el string de salida
          if (dias > 0) {
            return `${dias} d ${horas} h ${minutos} min`;
          } else if (horas > 0) {
            return `${horas} h ${minutos} min`;
          } else {
            return `${minutos} min`;
          }
        }
      };
      
      // Función para calcular tiempo transcurrido desde una fecha
      const tiempoDesde = (fechaString) => {
        if (!fechaString) return "Desconocido";
        
        try {
          // Extraer fecha y hora de formatos comunes
          let fecha;
          if (fechaString.includes(' ')) {
            // Formato "YYYY-MM-DD día HH:mm"
            const partes = fechaString.split(' ');
            const fechaSolo = partes[0]; // YYYY-MM-DD
            const horaSolo = partes[partes.length - 1]; // HH:mm
            fecha = new Date(`${fechaSolo}T${horaSolo}`);
          } else {
            fecha = new Date(fechaString);
          }
          
          if (isNaN(fecha.getTime())) {
            return "Fecha inválida";
          }
          
          const ahora = new Date();
          const diferencia = ahora.getTime() - fecha.getTime();
          
          // Convertir a días/horas/minutos
          const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
          const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
          
          if (dias > 30) {
            return `hace ${Math.floor(dias / 30)} meses`;
          } else if (dias > 0) {
            return `hace ${dias} días`;
          } else if (horas > 0) {
            return `hace ${horas} horas`;
          } else {
            return `hace ${minutos} minutos`;
          }
        } catch (e) {
          console.error("Error al procesar fecha:", e);
          return "Error en fecha";
        }
      };
      
      // Obtener el proyecto y su alias/título
      const proyectoFile = app.vault.getAbstractFileByPath(proyectoPath);
      if (!proyectoFile) {
        return { error: "Proyecto no encontrado" };
      }
      
      const metadataProyecto = app.metadataCache.getFileCache(proyectoFile)?.frontmatter;
      const proyectoAlias = metadataProyecto?.aliases?.[0] || metadataProyecto?.titulo || proyectoFile.basename;
      
      // Fecha actual y límites para los períodos
      const ahora = new Date();
      const limite7Dias = new Date(ahora);
      limite7Dias.setDate(ahora.getDate() - 7);
      const limite30Dias = new Date(ahora);
      limite30Dias.setDate(ahora.getDate() - 30);
      
      // Buscar todos los registros de tiempo relacionados con este proyecto
      // Esto es lo más pesado y lo hacemos una sola vez en el plugin
      let registros = [];
      const allFiles = app.vault.getMarkdownFiles()
        .filter(file => file.path.startsWith(folderRT + "/"));
      
      // Procesar cada archivo de registro de tiempo
      for (const file of allFiles) {
        try {
          const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
          if (!metadata) continue;
          
          // Verificar si este registro está relacionado con el proyecto actual
          let estaRelacionado = false;
          
          // Comprobar proyectoGTD
          if (metadata.proyectoGTD) {
            if (Array.isArray(metadata.proyectoGTD)) {
              // Para cada elemento del array proyectoGTD
              for (const proyecto of metadata.proyectoGTD) {
                // Eliminar corchetes de wiklinks
                const proyectoLimpio = proyecto.replace(/\[\[|\]\]/g, '');
                
                // Comprobar si contiene la ruta o el nombre del proyecto
                if (proyectoLimpio.includes(proyectoPath) || 
                    proyectoLimpio.includes(proyectoFile.basename) ||
                    (proyectoAlias && proyectoLimpio.includes(proyectoAlias))) {
                  estaRelacionado = true;
                  break;
                }
              }
            } else if (typeof metadata.proyectoGTD === 'string') {
              // Si es un string, hacer la misma comprobación
              const proyectoLimpio = metadata.proyectoGTD.replace(/\[\[|\]\]/g, '');
              if (proyectoLimpio.includes(proyectoPath) || 
                  proyectoLimpio.includes(proyectoFile.basename) ||
                  (proyectoAlias && proyectoLimpio.includes(proyectoAlias))) {
                estaRelacionado = true;
              }
            }
          }
          
          // Si está relacionado, añadirlo a los registros
          if (estaRelacionado) {
            // Obtener información de asunto si existe
            let asuntoAlias = null;
            if (metadata.asunto && metadata.asunto.length > 0) {
              try {
                // Intentar extraer el asunto (formato wiki)
                const asuntoStr = metadata.asunto[0];
                // Extraer la ruta del asunto de formato [[ruta|alias]]
                const asuntoMatch = asuntoStr.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
                if (asuntoMatch) {
                  const asuntoPath = asuntoMatch[1];
                  const asuntoFile = app.vault.getAbstractFileByPath(asuntoPath + ".md");
                  if (asuntoFile) {
                    const asuntoMetadata = app.metadataCache.getFileCache(asuntoFile)?.frontmatter;
                    asuntoAlias = asuntoMetadata?.aliases?.[0] || asuntoMetadata?.titulo || asuntoFile.basename;
                  }
                }
              } catch (e) {
                console.error("Error procesando asunto:", e);
              }
            }
            
            // Crear objeto de registro con toda la información necesaria
            const registro = {
              path: file.path,
              basename: file.basename,
              descripcion: metadata.descripcion || "Sin descripción",
              tiempoTrabajado: metadata.tiempoTrabajado || 0,
              estado: metadata.estado || "🔄",
              horaInicio: metadata.horaInicio || metadata.fecha || "Desconocido",
              horaFinal: metadata.horaFinal || "",
              asuntoAlias: asuntoAlias,
              aliases: metadata.aliases || [],
            };
            
            registros.push(registro);
          }
        } catch (error) {
          console.error(`Error procesando archivo ${file.path}:`, error);
        }
      }
      
      // Ordenar registros por horaFinal descendente
      registros.sort((a, b) => {
        // Primero intentamos ordenar por horaFinal
        if (a.horaFinal && b.horaFinal) {
          return new Date(b.horaFinal).getTime() - new Date(a.horaFinal).getTime();
        }
        // Si no hay horaFinal, ordenamos por horaInicio
        return new Date(b.horaInicio).getTime() - new Date(a.horaInicio).getTime();
      });
      
      // Calcular estadísticas
      let totalTiempoTrabajado = 0;
      let ultimaActividad = registros.length > 0 ? (registros[0].horaFinal || registros[0].horaInicio) : null;
      let tiempoUltimos7Dias = 0;
      let tiempoUltimos30Dias = 0;
      
      // Procesar cada registro para calcular estadísticas
      for (let registro of registros) {
        // Sumar tiempo total
        totalTiempoTrabajado += registro.tiempoTrabajado;
        
        // Verificar si está en los últimos períodos
        let fechaRegistro;
        if (registro.horaFinal) {
          // Extraer fecha de formato "YYYY-MM-DD día HH:mm"
          const partes = registro.horaFinal.split(' ');
          const fechaSolo = partes[0]; // YYYY-MM-DD
          fechaRegistro = new Date(fechaSolo);
        } else if (registro.horaInicio) {
          // Extraer fecha de otros formatos posibles
          const partesFecha = registro.horaInicio.split(' ');
          fechaRegistro = new Date(partesFecha[0]);
        }
        
        if (fechaRegistro) {
          if (fechaRegistro >= limite7Dias) {
            tiempoUltimos7Dias += registro.tiempoTrabajado;
          }
          if (fechaRegistro >= limite30Dias) {
            tiempoUltimos30Dias += registro.tiempoTrabajado;
          }
        }
        
        // Añadir propiedad formateada para mostrar en la tabla
        registro.tiempoFormateado = formatDuration(registro.tiempoTrabajado);
      }
      
      // Crear y retornar objeto con toda la información procesada
      return {
        proyecto: {
          path: proyectoPath,
          nombre: proyectoFile.basename,
          alias: proyectoAlias
        },
        estadisticas: {
          totalTiempoTrabajado: {
            valor: totalTiempoTrabajado,
            formateado: formatDuration(totalTiempoTrabajado)
          },
          numSesiones: registros.length,
          ultimaActividad: {
            fecha: ultimaActividad,
            tiempoDesde: ultimaActividad ? tiempoDesde(ultimaActividad) : "Sin actividad"
          },
          ultimos7Dias: {
            valor: tiempoUltimos7Dias,
            formateado: formatDuration(tiempoUltimos7Dias)
          },
          ultimos30Dias: {
            valor: tiempoUltimos30Dias,
            formateado: formatDuration(tiempoUltimos30Dias)
          }
        },
        registros: registros
      };
    } catch (error) {
      console.error("Error en obtenerEstadisticasTiempo:", error);
      return { error: "Error procesando estadísticas de tiempo: " + error.message };
    }
  }
  
  /**
   * Genera el HTML para mostrar las estadísticas de tiempo
   * @param dv Objeto dataview para crear elementos
   * @param datos Objeto con los datos obtenidos de obtenerEstadisticasTiempo
   * @returns Elemento HTML con las estadísticas visualizadas
   */

  mostrarEstadisticasTiempo(dv, datos) {
    try {
      // Si hay error, mostrar mensaje
      if (datos.error) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "tiempo-stats-error";
        errorDiv.textContent = datos.error;
        return errorDiv;
      }
      
      // Obtener estadísticas y registros
      const { estadisticas, registros, proyecto } = datos;
      
      // Crear contenedor principal
      const contenedor = document.createElement("div");
      contenedor.className = "tiempo-stats-container";
      contenedor.style.padding = "16px 0"; // Mantener padding vertical, eliminar horizontal
      contenedor.style.width = "100%";
      contenedor.style.boxSizing = "border-box";
      
      // Si no hay registros, mostrar mensaje y salir
      if (!registros || registros.length === 0) {
        const mensajeVacio = document.createElement("p");
        mensajeVacio.className = "tiempo-stats-empty-message";
        mensajeVacio.textContent = "No se encontraron registros de tiempo para este proyecto.";
        contenedor.appendChild(mensajeVacio);
        return contenedor;
      }
      
      // === SECCIÓN 1: ESTADÍSTICAS PRINCIPALES ===
      const statsContainer = document.createElement("div");
      statsContainer.className = "tiempo-stats-summary";
      
      // Crear tarjetas de estadísticas
      const infoEstadisticas = [
        {
          titulo: "Tiempo Total",
          valor: estadisticas.totalTiempoTrabajado.formateado,
          icono: "⏱️"
        },
        {
          titulo: "Sesiones",
          valor: estadisticas.numSesiones,
          icono: "🔄"
        },
        {
          titulo: "Última Actividad",
          valor: estadisticas.ultimaActividad.tiempoDesde,
          icono: "🕒"
        },
        {
          titulo: "Últimos 7 días",
          valor: estadisticas.ultimos7Dias?.formateado || "N/A",
          icono: "📅"
        },
        {
          titulo: "Últimos 30 días",
          valor: estadisticas.ultimos30Dias?.formateado || "N/A",
          icono: "📆"
        }
      ];
      
      // Crear grid para las tarjetas
      const statsGrid = document.createElement("div");
      statsGrid.className = "tiempo-stats-grid";
      
      // Añadir cada tarjeta al grid
      for (const stat of infoEstadisticas) {
        const tarjeta = document.createElement("div");
        tarjeta.className = "tiempo-stat-card";
        
        const icono = document.createElement("span");
        icono.className = "tiempo-stat-icon";
        icono.textContent = stat.icono;
        
        const titulo = document.createElement("div");
        titulo.className = "tiempo-stat-title";
        titulo.textContent = stat.titulo;
        
        const valor = document.createElement("div");
        valor.className = "tiempo-stat-value";
        valor.textContent = stat.valor;
        
        tarjeta.appendChild(icono);
        tarjeta.appendChild(titulo);
        tarjeta.appendChild(valor);
        
        statsGrid.appendChild(tarjeta);
      }
      
      statsContainer.appendChild(statsGrid);
      contenedor.appendChild(statsContainer);
      
      // === SECCIÓN 2: SESIÓN ACTIVA (si existe) ===
      if (estadisticas.sesionActiva) {
        const activoContainer = document.createElement("div");
        activoContainer.className = "tiempo-sesion-activa-container";
        
        // Título de la sección
        const tituloActivo = document.createElement("h3");
        tituloActivo.className = "tiempo-activo-title";
        tituloActivo.textContent = "Sesión activa";
        activoContainer.appendChild(tituloActivo);
        
        // Encontrar el registro activo
        const registroActivo = registros.find(r => r.estado === "🟢");
        
        if (registroActivo) {
          // Crear tarjeta de sesión activa
          const tarjetaActiva = document.createElement("div");
          tarjetaActiva.className = "tiempo-activo-card";
          
          // Descripción
          const descActiva = document.createElement("div");
          descActiva.className = "tiempo-activo-descripcion";
          descActiva.textContent = registroActivo.descripcion;
          tarjetaActiva.appendChild(descActiva);
          
          // Tiempo en ejecución
          const tiempoEjecucion = document.createElement("div");
          tiempoEjecucion.className = "tiempo-ejecucion";
          tiempoEjecucion.id = `tiempo-ejecucion-${estadisticas.sesionActiva.id}`;
          tiempoEjecucion.textContent = estadisticas.sesionActiva.tiempoFormateado;
          tarjetaActiva.appendChild(tiempoEjecucion);
          
          // Botón para ir al registro
          const enlaceRegistro = document.createElement("a");
          enlaceRegistro.className = "tiempo-activo-enlace internal-link";
          enlaceRegistro.href = registroActivo.path;
          enlaceRegistro.setAttribute("data-href", registroActivo.path);
          enlaceRegistro.textContent = "Ver registro completo";
          
          // Hacer clicable el enlace
          enlaceRegistro.addEventListener("click", (event) => {
            event.preventDefault();
            const href = enlaceRegistro.getAttribute("data-href");
            if (href) {
              app.workspace.openLinkText(href, "", false);
            }
          });
          
          tarjetaActiva.appendChild(enlaceRegistro);
          activoContainer.appendChild(tarjetaActiva);
        }
        
        contenedor.appendChild(activoContainer);
      }
      
      // === SECCIÓN 3: TABLA DE REGISTROS ===
      // Título de la sección
      const tituloTabla = document.createElement("h3");
      tituloTabla.className = "tiempo-table-title";
      tituloTabla.textContent = "Registros de tiempo";
      contenedor.appendChild(tituloTabla);
      
      // Crear la tabla con estilos directos para evitar espacios no deseados
      const tabla = document.createElement("table");
      tabla.className = "tiempo-registros-table";
      tabla.style.width = "100%";
      tabla.style.tableLayout = "fixed";
      tabla.style.borderCollapse = "collapse";
      tabla.style.margin = "0";
      tabla.style.padding = "0";
      
      // Crear encabezados
      const encabezado = document.createElement("thead");
      const filaEncabezado = document.createElement("tr");
      
      // Definir encabezados y sus estilos
      const encabezados = [
        { texto: "Descripción", ancho: "60%", align: "left" },
        { texto: "Duración", ancho: "15%", align: "center" },
        { texto: "Fecha", ancho: "25%", align: "left" }
      ];
      
      for (const { texto, ancho, align } of encabezados) {
        const th = document.createElement("th");
        th.textContent = texto;
        th.style.width = ancho;
        th.style.textAlign = align;
        th.style.padding = "10px";
        if (texto === "Descripción") {
          th.style.paddingLeft = "0"; // Eliminar padding izquierdo del primer encabezado
        }
        filaEncabezado.appendChild(th);
      }
      
      encabezado.appendChild(filaEncabezado);
      tabla.appendChild(encabezado);
      
      // Crear cuerpo de la tabla
      const cuerpo = document.createElement("tbody");
      
      // Añadir filas con los datos
      for (const registro of registros) {
        const fila = document.createElement("tr");
        
        // Columna: Descripción con enlace a la nota
        const celdaDescripcion = document.createElement("td");
        celdaDescripcion.style.width = "60%";
        celdaDescripcion.style.paddingLeft = "0"; // Eliminar padding izquierdo
        celdaDescripcion.style.whiteSpace = "normal";
        celdaDescripcion.style.wordWrap = "break-word";
        celdaDescripcion.style.wordBreak = "break-word";
        celdaDescripcion.style.overflowWrap = "break-word";
        
        try {
          // Contenedor para la descripción que fuerce el salto de línea
          const descripcionDiv = document.createElement("div");
          descripcionDiv.style.display = "inline";
          descripcionDiv.style.whiteSpace = "normal";
          descripcionDiv.style.wordWrap = "break-word";
          descripcionDiv.style.wordBreak = "break-word";
          descripcionDiv.textContent = registro.descripcion || "Sin descripción";
          celdaDescripcion.appendChild(descripcionDiv);
          
          // Agregar enlace
          const enlaceSpan = document.createElement("span");
          enlaceSpan.className = "tiempo-ver-mas";
          enlaceSpan.appendChild(document.createTextNode(" ("));
          
          // Crear enlace
          const enlace = document.createElement("a");
          enlace.className = "internal-link";
          enlace.href = registro.path;
          enlace.setAttribute("data-href", registro.path);
          enlace.textContent = "ver";
          
          // Hacer clicable el enlace
          enlace.addEventListener("click", (event) => {
            event.preventDefault();
            const href = enlace.getAttribute("data-href");
            if (href) {
              app.workspace.openLinkText(href, "", false);
            }
          });
          
          enlaceSpan.appendChild(enlace);
          enlaceSpan.appendChild(document.createTextNode(")"));
          celdaDescripcion.appendChild(enlaceSpan);
        } catch (e) {
          celdaDescripcion.textContent = registro.descripcion || "Sin descripción";
        }
        
        fila.appendChild(celdaDescripcion);
        
        // Columna: Duración (centrada)
        const celdaDuracion = document.createElement("td");
        celdaDuracion.style.width = "15%";
        celdaDuracion.style.textAlign = "center";
        celdaDuracion.textContent = registro.tiempoFormateado;
        fila.appendChild(celdaDuracion);
        
        // Columna: Fecha
        const celdaFecha = document.createElement("td");
        celdaFecha.style.width = "25%";
        celdaFecha.style.whiteSpace = "normal";
        celdaFecha.style.wordWrap = "break-word";
        celdaFecha.textContent = registro.horaFinal || registro.horaInicio;
        fila.appendChild(celdaFecha);
        
        cuerpo.appendChild(fila);
      }
      
      tabla.appendChild(cuerpo);
      contenedor.appendChild(tabla);
      
      return contenedor;
    } catch (error) {
      console.error("Error al mostrar estadísticas de tiempo:", error);
      const errorDiv = document.createElement("div");
      errorDiv.className = "tiempo-stats-error";
      errorDiv.textContent = "Error al mostrar estadísticas: " + error.message;
      return errorDiv;
    }
  }

// ---- TAREAS

/**
 * Genera un árbol de tareas pendientes y en progreso de la nota actual y sus referencias
 * @param {Object} paginaActual - La página actual obtenida a través de dv.current()
 * @param {Object} dv - El objeto dataview para acceder a sus funciones
 * @param {Number} profundidadMaxima - Profundidad máxima de recursión (defecto: 3)
 * @param {Set} visitadas - Set de IDs de páginas ya visitadas para evitar ciclos
 * @param {Number} profundidadActual - Profundidad actual de recursión
 * @param {Boolean} esReferenciaNidada - Indica si es una referencia nidada (para evitar duplicación)
 * @returns {HTMLElement} - Elemento HTML con la estructura de árbol de tareas
 */
async generarArbolTareas(paginaActual, dv, profundidadMaxima = 3, visitadas = new Set(), profundidadActual = 0, esReferenciaNidada = false) {
    // Validar que paginaActual tenga las propiedades necesarias
    if (!paginaActual || !paginaActual.file) {
        console.error("Error: paginaActual no tiene las propiedades necesarias", paginaActual);
        return dv.el("div", "Error: No se puede generar el árbol de tareas.", { cls: "tasks-tree-error" });
    }
    
    console.log(`Procesando tareas de: ${paginaActual.file.path} (profundidad: ${profundidadActual}, esReferenciaNidada: ${esReferenciaNidada})`);
    
    // Crear el contenedor principal
    const contenedor = document.createElement("div");
    contenedor.className = "tasks-tree";
    
    if (profundidadActual === 0) {
        // Añadir título personalizado solo en la raíz
        const tipoNota = paginaActual.typeName || "Nota";
        const alias = paginaActual.file.aliases && paginaActual.file.aliases.length > 0 
            ? paginaActual.file.aliases[0] 
            : (paginaActual.titulo || paginaActual.file.name);
            
        const titulo = document.createElement("h3");
        titulo.className = "tasks-tree-title";
        titulo.textContent = "Tareas pendientes";
        contenedor.appendChild(titulo);
    }
    
    // Si hemos llegado a la profundidad máxima, no seguimos explorando
    if (profundidadActual >= profundidadMaxima) {
        return contenedor;
    }
    
    // Marcar esta página como visitada para evitar ciclos
    visitadas.add(paginaActual.file.path);
    
    // Extraer tareas de la página actual
    let tareas;
    try {
        tareas = await this.extraerTareasDePagina(paginaActual, dv);
        console.log(`Encontradas ${tareas.length} tareas en ${paginaActual.file.path}`);
    } catch (e) {
        console.error(`Error al extraer tareas de ${paginaActual.file.path}:`, e);
        tareas = [];
    }
    
    // Obtener todas las páginas que hacen referencia directa a la página actual
    let todasLasPaginas;
    try {
        todasLasPaginas = dv.pages();
    } catch (e) {
        console.error("Error al obtener páginas:", e);
        const errorMsg = document.createElement("p");
        errorMsg.textContent = "Error al obtener páginas de Dataview";
        errorMsg.className = "tasks-tree-error";
        contenedor.appendChild(errorMsg);
        
        // Aún así, mostramos las tareas de la página actual si las hay
        if (tareas.length > 0) {
            this.agregarTareasAContenedor(tareas, contenedor, dv, paginaActual);
        }
        
        return contenedor;
    }
    
    // Filtrar las páginas que referencian a la actual a través de 'asunto'
    let referenciasDirectas = [];
    try {
        // Función segura para verificar si un asunto hace referencia a la página actual
        const referenciaAPaginaActual = (asunto) => {
            try {
                // Si asunto es un objeto con path y coincide con la página actual
                if (asunto && typeof asunto === 'object' && asunto.path === paginaActual.file.path) {
                    return true;
                }
                
                // Si asunto es una cadena
                if (typeof asunto === 'string') {
                    // Verificar si contiene la ruta completa
                    if (asunto.includes(paginaActual.file.path)) {
                        return true;
                    }
                    
                    // Verificar coincidencia con aliases (si existen)
                    if (paginaActual.file.aliases && Array.isArray(paginaActual.file.aliases)) {
                        for (const alias of paginaActual.file.aliases) {
                            if (alias && asunto.includes(alias)) {
                                return true;
                            }
                        }
                    }
                    
                    // Verificar coincidencia con el nombre del archivo
                    if (paginaActual.file.name && asunto.includes(paginaActual.file.name)) {
                        return true;
                    }
                    
                    // Verificamos si el archivo tiene titulo o aliases
                    const titulo = paginaActual.titulo || paginaActual.title;
                    if (titulo && asunto.includes(titulo)) {
                        return true;
                    }
                }
                
                return false;
            } catch (err) {
                console.warn("Error al verificar referencia:", err);
                return false;
            }
        };
        
        // Filtrar las páginas con manejo de errores mejorado
        referenciasDirectas = todasLasPaginas.filter(p => {
            try {
                if (!p || !p.asunto) return false;
                
                // Normalizar asunto a array
                const asuntos = Array.isArray(p.asunto) ? p.asunto : [p.asunto];
                
                // Verificar cada asunto
                for (const asunto of asuntos) {
                    if (referenciaAPaginaActual(asunto)) {
                        return true;
                    }
                }
                
                return false;
            } catch (err) {
                console.warn("Error al filtrar página:", err, p);
                return false;
            }
        });
        
        console.log(`Encontradas ${referenciasDirectas.length} referencias directas a ${paginaActual.file.path}`);
    } catch (e) {
        console.error("Error al filtrar referencias:", e);
        const errorMsg = document.createElement("p");
        errorMsg.textContent = "Error al procesar referencias";
        errorMsg.className = "tasks-tree-error";
        contenedor.appendChild(errorMsg);
        
        // Aún así, mostramos las tareas de la página actual si las hay
        if (tareas.length > 0) {
            this.agregarTareasAContenedor(tareas, contenedor, dv, paginaActual);
        }
        
        return contenedor;
    }
    
    // Verificar si tenemos tareas en la página actual o en referencias
    const hayTareasEnActual = tareas.length > 0;
    
    // Primero verificamos si alguna referencia tiene tareas
    const referenciasConTareas = [];
    const referenciasConTareasHeredadas = []; // Nuevo array para referencias sin tareas propias pero con tareas heredadas
    
    // Procesar todas las referencias directas, incluso si no tienen tareas propias
    for (const referencia of referenciasDirectas) {
        // Evitar ciclos
        if (visitadas.has(referencia.file.path)) {
            continue;
        }
        
        try {
            // Extraer tareas propias de la referencia
            const tareasReferencia = await this.extraerTareasDePagina(referencia, dv);
            
            // CAMBIO AQUÍ: Comprobar si esta referencia tiene referencias anidadas con tareas
            // Aunque no tenga tareas propias, necesitamos explorar más profundo
            let tieneTareasHeredadas = false;
            let refAnidadasConTareas = [];
            
            // Crear copia del conjunto visitadas para evitar afectar a otras ramas
            const nuevoVisitadas = new Set([...visitadas]);
            nuevoVisitadas.add(referencia.file.path);
            
            // Buscar recursivamente en profundidad
            const resultadoAnidado = await this.generarArbolTareas(
                referencia, dv, profundidadMaxima, 
                nuevoVisitadas, profundidadActual + 1,
                true // Es una referencia nidada
            );
            
            // Verificar si el resultado anidado contiene tareas (buscando elementos con clase .tasks-item)
            if (resultadoAnidado && resultadoAnidado.nodeType) {
                const tareasAnidadas = resultadoAnidado.querySelectorAll('.tasks-item');
                tieneTareasHeredadas = tareasAnidadas.length > 0;
                
                if (tieneTareasHeredadas) {
                    // Guardar el resultado anidado para usarlo después
                    refAnidadasConTareas.push({
                        referencia,
                        resultado: resultadoAnidado
                    });
                }
            }
            
            if (tareasReferencia.length > 0) {
                // Esta referencia tiene tareas propias
                referenciasConTareas.push({
                    referencia,
                    tareas: tareasReferencia,
                    refAnidadas: refAnidadasConTareas
                });
            } else if (tieneTareasHeredadas) {
                // Esta referencia no tiene tareas propias, pero tiene subreferencias con tareas
                referenciasConTareasHeredadas.push({
                    referencia,
                    tareas: [], // No tiene tareas propias
                    refAnidadas: refAnidadasConTareas
                });
            }
        } catch (e) {
            console.error(`Error al procesar referencia ${referencia.file.path}:`, e);
        }
    }
    
    // Combinar ambos tipos de referencias para procesarlas juntas
    const todasLasReferenciasConTareas = [...referenciasConTareas, ...referenciasConTareasHeredadas];
    const hayTareasEnReferencias = todasLasReferenciasConTareas.length > 0;
    
    // Si no hay tareas en la página actual ni en referencias, y no estamos en la raíz,
    // no mostramos nada (para optimizar espacio)
    if (!hayTareasEnActual && !hayTareasEnReferencias && profundidadActual > 0) {
        return contenedor;
    }
    
    // Si tenemos tareas en la página actual, las mostramos, pero solo si no es una referencia nidada
    // o si es la raíz (profundidadActual === 0)
    if (hayTareasEnActual && (!esReferenciaNidada || profundidadActual === 0)) {
        // Crear sección para las tareas de la página actual
        const seccionActual = document.createElement("div");
        seccionActual.className = "tasks-node-current";
        
        // Crear encabezado solo si hay referencias directas (para diferenciar)
        if (hayTareasEnReferencias) {
            const encabezadoActual = document.createElement("div");
            encabezadoActual.className = "tasks-node-header";
            encabezadoActual.textContent = "Tareas directas";
            seccionActual.appendChild(encabezadoActual);
        }
        
        // Agregar las tareas de la página actual
        this.agregarTareasAContenedor(tareas, seccionActual, dv, paginaActual);
        
        // Añadir la sección al contenedor principal
        contenedor.appendChild(seccionActual);
    }
    
    // Si tenemos referencias con tareas (propias o heredadas), procesamos cada una
    if (hayTareasEnReferencias) {
        // Crear sección para las tareas de referencias
        const seccionReferencias = document.createElement("div");
        seccionReferencias.className = "tasks-refs-container";
        
        // Solo añadimos encabezado si hay tareas tanto en actual como en referencias
        if (hayTareasEnActual && (!esReferenciaNidada || profundidadActual === 0)) {
            const encabezadoRefs = document.createElement("div");
            encabezadoRefs.className = "tasks-refs-header";
            encabezadoRefs.textContent = "Tareas en notas relacionadas";
            seccionReferencias.appendChild(encabezadoRefs);
        }
        
        // Crear lista para las referencias
        const listaRefs = document.createElement("ul");
        listaRefs.className = "tasks-refs-list";
        
        // Procesar cada referencia con tareas (propias o heredadas)
        for (const { referencia, tareas, refAnidadas } of todasLasReferenciasConTareas) {
            // Crear elemento para esta referencia
            const itemRef = document.createElement("li");
            itemRef.className = "tasks-ref-item";
            
            // Crear encabezado con información de la referencia
            const headerRef = this.crearEncabezadoReferencia(referencia, dv, tareas.length);
            itemRef.appendChild(headerRef);
            
            // Si tiene tareas propias, mostrarlas
            if (tareas.length > 0) {
                // Crear contenedor colapsable para las tareas
                const tareasContainer = document.createElement("div");
                tareasContainer.className = "tasks-container";
                // Añadir atributo de datos para identificar a qué nota pertenece este contenedor
                tareasContainer.setAttribute("data-path", referencia.file.path);
                
                // Agregar las tareas de esta referencia
                this.agregarTareasAContenedor(tareas, tareasContainer, dv, referencia);
                
                // Agregar el contenedor de tareas al elemento de referencia
                itemRef.appendChild(tareasContainer);
            }
            
            // Si tiene subreferencias con tareas, mostrarlas
            if (refAnidadas && refAnidadas.length > 0) {
                for (const { resultado } of refAnidadas) {
                    if (resultado && resultado.nodeType) {
                        // Quitar el título repetido si existe
                        const tituloRepetido = resultado.querySelector('.tasks-tree-title');
                        if (tituloRepetido) {
                            tituloRepetido.remove();
                        }
                        
                        // Aplicar clase especial para sub-referencias
                        resultado.classList.add('tasks-subrefs-container');
                        
                        // Agregar sub-referencias al elemento actual
                        itemRef.appendChild(resultado);
                    }
                }
            }
            
            // Añadir el elemento de referencia a la lista
            listaRefs.appendChild(itemRef);
        }
        
        // Añadir la lista de referencias a la sección
        seccionReferencias.appendChild(listaRefs);
        
        // Añadir la sección al contenedor principal
        contenedor.appendChild(seccionReferencias);
    }
    
    // Si no hay tareas en absoluto y estamos en la raíz, mostrar mensaje
    if (!hayTareasEnActual && !hayTareasEnReferencias && profundidadActual === 0) {
        const mensaje = document.createElement("p");
        mensaje.textContent = "No se encontraron tareas pendientes o en progreso";
        mensaje.className = "tasks-tree-empty";
        contenedor.appendChild(mensaje);
    }
    
    return contenedor;
}

/**
 * Extrae las tareas pendientes y en progreso de una página
 * @param {Object} pagina - La página de la que extraer tareas
 * @param {Object} dv - El objeto dataview
 * @returns {Array} - Array de objetos con las tareas extraídas
 */
async extraerTareasDePagina(pagina, dv) {
    try {
        // Verificar que pagina.file existe
        if (!pagina || !pagina.file || !pagina.file.path) {
            console.warn("Página o archivo no válido:", pagina);
            return [];
        }
        
        // Obtener el contenido del archivo de manera segura
        let contenido;
        try {
            // Primero intentamos con el método de Dataview si está disponible
            if (dv && typeof dv.io !== 'undefined' && typeof dv.io.load === 'function') {
                contenido = await dv.io.load(pagina.file.path);
            } 
            // Si no funciona, usamos el método de Obsidian
            else {
                const archivo = app.vault.getAbstractFileByPath(pagina.file.path);
                if (archivo && archivo instanceof app.TFile) {
                    contenido = await app.vault.read(archivo);
                } else {
                    throw new Error("No se pudo encontrar el archivo");
                }
            }
        } catch (readError) {
            console.warn(`No se pudo leer el archivo ${pagina.file.path}:`, readError);
            return [];
        }
        
        // Si no pudimos obtener el contenido, retornamos array vacío
        if (!contenido) {
            console.warn(`No se pudo obtener contenido para ${pagina.file.path}`);
            return [];
        }
        
        // Dividir el contenido en líneas
        const lineas = contenido.split('\n');
        
        // Array para almacenar las tareas encontradas
        const tareas = [];
        
        // Analizar cada línea buscando tareas
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            
            // Expresión regular para detectar tareas pendientes (- [ ]) o en progreso (- [/])
            const tareaRegex = /^(\s*)-\s*\[([ \/])\]\s*(.+)$/;
            const coincidencia = tareaRegex.exec(linea);
            
            if (coincidencia) {
                // Extraer las partes de la tarea
                const indentacion = coincidencia[1];
                const estado = coincidencia[2] === ' ' ? 'pendiente' : 'progreso';
                const texto = coincidencia[3].trim();
                
                // Crear objeto para la tarea
                const tarea = {
                    texto,
                    estado,
                    indentacion: indentacion.length,
                    lineaIndice: i,
                    lineaOriginal: linea
                };
                
                // Añadir la tarea al array
                tareas.push(tarea);
            }
        }
        
        return tareas;
    } catch (error) {
        console.error(`Error al extraer tareas de ${pagina?.file?.path || 'página desconocida'}:`, error);
        return []; // Retornar array vacío en caso de error
    }
}

/**
 * Crea el encabezado para una referencia con contador de tareas
 * @param {Object} referencia - La referencia para la que crear el encabezado
 * @param {Object} dv - El objeto dataview
 * @param {Number} numTareas - Número de tareas en esta referencia
 * @returns {HTMLElement} - Elemento HTML con el encabezado
 */
crearEncabezadoReferencia(referencia, dv, numTareas) {
    // Crear el contenedor del encabezado
    const header = document.createElement("div");
    header.className = "tasks-ref-header";

    // Añadir botón de expansión/colapso
    const toggleBtn = document.createElement("span");
    toggleBtn.textContent = "▼";
    toggleBtn.className = "tasks-toggle-btn";
    toggleBtn.setAttribute("data-state", "expanded");
    toggleBtn.setAttribute("title", "Colapsar/Expandir");
    
    // Añadir handler para colapsar/expandir
    toggleBtn.addEventListener("click", function(event) {
        const currentState = this.getAttribute("data-state");
        const newState = currentState === "expanded" ? "collapsed" : "expanded";
        this.setAttribute("data-state", newState);
        this.textContent = newState === "expanded" ? "▼" : "▶";
        
        // Obtener el elemento padre del botón (header) y luego el elemento padre del header (li)
        const headerElement = this.closest(".tasks-ref-header");
        if (headerElement && headerElement.parentNode) {
            const listItem = headerElement.parentNode;
            
            // Obtener todos los contenedores secundarios - tanto tasks-container como tasks-subrefs-container
            const containers = listItem.querySelectorAll('.tasks-container, .tasks-subrefs-container');
            
            // Cambiar la visibilidad de todos los contenedores encontrados
            containers.forEach(container => {
                container.style.display = newState === "expanded" ? "block" : "none";
            });
        }
        
        // Detener propagación para que no interfiera con otros clics
        event.stopPropagation();
    });
    
    // Añadir botón de expansión al encabezado
    header.appendChild(toggleBtn);
    
    // Determinar el texto para mostrar
    let nombreMostrado = referencia.file.aliases && referencia.file.aliases.length > 0
        ? referencia.file.aliases[0]
        : (referencia.titulo || referencia.file.name);
        
    // Tipo de la nota (si está disponible)
    const tipo = referencia.typeName;
    if (tipo) {
        const tipoSpan = document.createElement("span");
        tipoSpan.className = "tasks-ref-type";
        tipoSpan.textContent = `[${tipo}] `;
        header.appendChild(tipoSpan);
    }
    
    // Crear el enlace a la nota
    try {
        const enlace = document.createElement("a");
        enlace.className = "internal-link tasks-ref-link";
        enlace.href = referencia.file.path;
        enlace.setAttribute("data-href", referencia.file.path);
        enlace.textContent = nombreMostrado;
        
        // Asegurar que el enlace es clicable usando la API de Obsidian
        enlace.addEventListener("click", (event) => {
            event.preventDefault();
            app.workspace.openLinkText(referencia.file.path, "", true);
        });
        
        header.appendChild(enlace);
    } catch (e) {
        console.error("Error al crear enlace:", e);
        const textoPlano = document.createElement("span");
        textoPlano.className = "tasks-ref-name";
        textoPlano.textContent = nombreMostrado;
        header.appendChild(textoPlano);
    }
    
    // Añadir contador de tareas
    const contador = document.createElement("span");
    contador.className = "tasks-count";
    contador.textContent = `(${numTareas})`;
    header.appendChild(contador);
    
    return header;
}

/**
 * Agrega un conjunto de tareas a un contenedor DOM
 * @param {Array} tareas - Array de objetos de tareas
 * @param {HTMLElement} contenedor - Contenedor al que añadir las tareas
 * @param {Object} dv - Objeto dataview
 * @param {Object} pagina - Página a la que pertenecen las tareas
 */
agregarTareasAContenedor(tareas, contenedor, dv, pagina) {
    if (!tareas || tareas.length === 0) return;
    
    // Crear lista para las tareas
    const lista = document.createElement("ul");
    lista.className = "tasks-list";
    
    // Añadir cada tarea como ítem de lista
    for (const tarea of tareas) {
        const item = document.createElement("li");
        item.className = `tasks-item tasks-${tarea.estado}`;
        item.setAttribute("data-linea", tarea.lineaIndice);
        
        // Crear el indicador de estado (checkbox)
        const checkbox = document.createElement("span");
        checkbox.className = `tasks-checkbox tasks-checkbox-${tarea.estado}`;
        checkbox.textContent = tarea.estado === 'pendiente' ? "☐" : "◔";
        
        // Añadir listener al checkbox para navegar a la tarea
        checkbox.addEventListener("click", () => {
            this.navegarATarea(pagina.file.path, tarea.lineaIndice);
        });
        
        // Crear contenedor para el texto de la tarea
        const textoSpan = document.createElement("span");
        textoSpan.className = "tasks-text";
        textoSpan.textContent = tarea.texto;
        
        // Añadir listener al texto para navegar a la tarea
        textoSpan.addEventListener("click", () => {
            this.navegarATarea(pagina.file.path, tarea.lineaIndice);
        });
        
        // Añadir los elementos al ítem
        item.appendChild(checkbox);
        item.appendChild(textoSpan);
        
        // Añadir el ítem a la lista
        lista.appendChild(item);
    }
    
    // Añadir la lista al contenedor
    contenedor.appendChild(lista);
}

/**
 * Navega a una tarea específica en una nota
 * @param {string} path - Ruta de la nota
 * @param {number} linea - Número de línea de la tarea
 */
navegarATarea(path, linea) {
    if (!path) {
        console.error("No se proporcionó una ruta de archivo válida");
        return;
    }
    
    // Navegar a la nota y posicionar en la línea de la tarea
    try {
        // Obtener el archivo
        const archivo = app.vault.getAbstractFileByPath(path);
        
        if (!archivo) {
            console.warn(`No se encontró el archivo: ${path}`);
            return;
        }
        
        // Verificar si podemos usar eState para posicionarse en una línea específica
        const canUseEState = typeof app.workspace.openLinkText === 'function';
        
        if (canUseEState) {
            // Esta es la forma más moderna de abrir archivos en Obsidian
            app.workspace.openLinkText(path, "", true, { eState: { line: linea } });
        } else {
            // Alternativa: abrir el archivo y luego intentar ir a la línea
            const leaf = app.workspace.getLeaf(false);
            leaf.openFile(archivo).then(() => {
                // Intentar posicionar en la línea después de que se abra el archivo
                setTimeout(() => {
                    if (leaf.view && leaf.view.editor) {
                        const editor = leaf.view.editor;
                        editor.setCursor({ line: linea, ch: 0 });
                        editor.scrollIntoView({ from: { line: linea, ch: 0 }, to: { line: linea, ch: 0 } }, true);
                    }
                }, 100);
            });
        }
    } catch (e) {
        console.error("Error al navegar a la tarea:", e);
        
        // Fallback más robusto - mostrar mensaje al usuario
        try {
            // Intentar abrir el archivo sin posicionarse en una línea específica
            const archivo = app.vault.getAbstractFileByPath(path);
            if (archivo) {
                app.workspace.getLeaf(false).openFile(archivo);
            } else {
                new Notice("No se pudo encontrar el archivo: " + path);
            }
        } catch (err) {
            console.error("Error en el fallback de navegación:", err);
            new Notice("Error al abrir el archivo: " + err.message);
        }
    }
}


/**
 * Obtiene y procesa notas vinculadas a una nota actual, con opciones de ordenamiento
 * @param params Objeto con parámetros como notaActualPath y sortOrder
 * @returns Objeto con la tabla HTML y metadatos
 */
async obtenerNotasVinculadas(params) {
    console.log("[DEBUG] Iniciando obtenerNotasVinculadas con parámetros:", params);
    
    try {
        // Extraer parámetros
        const { notaActualPath, sortOrder = "hits" } = params;
        console.log("[DEBUG] notaActualPath:", notaActualPath);
        console.log("[DEBUG] sortOrder:", sortOrder);
        
        if (!notaActualPath) {
            console.error("[ERROR] No se proporcionó la ruta de la nota actual");
            return { error: "No se proporcionó la ruta de la nota actual" };
        }
        
        // Obtener la nota actual
        const currentNote = app.vault.getAbstractFileByPath(notaActualPath);
        console.log("[DEBUG] currentNote:", currentNote?.path || "No encontrada");
        
        if (!currentNote) {
            console.error("[ERROR] No se pudo encontrar la nota actual en la ruta:", notaActualPath);
            return { error: "No se pudo encontrar la nota actual" };
        }
        
        // Calcular la fecha actual (inicio del día)
        const today = window.moment().startOf("day");
        console.log("[DEBUG] Fecha actual:", today.format("YYYY-MM-DD"));
        
        // Filtrar notas vinculadas
        const allFiles = app.vault.getMarkdownFiles();
        console.log("[DEBUG] Total de archivos markdown:", allFiles.length);
        
        let linkedNotes = [];
        let processingErrors = 0;
        let notesWithAsunto = 0;
        let notesTypeEntregable = 0;
        let possibleMatches = 0;
        
        for (const file of allFiles) {
            try {
                console.log("[DEBUG] Procesando archivo:", file.path);
                
                const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
                
                if (!metadata) {
                    console.log("[DEBUG] Archivo sin frontmatter:", file.path);
                    continue;
                }
                
                console.log("[DEBUG] Metadata typeName:", metadata.typeName);
                console.log("[DEBUG] Metadata asunto:", JSON.stringify(metadata.asunto));
                
                if (metadata.typeName !== "Entregable") {
                    console.log("[DEBUG] Archivo no es un Entregable, se salta");
                    continue;
                }
                
                notesTypeEntregable++;
                
                if (!metadata.asunto) {
                    console.log("[DEBUG] Entregable sin asunto, se salta");
                    continue;
                }
                
                notesWithAsunto++;
                
                // Verificar si esta nota hace referencia a la nota actual
                let isLinked = false;
                
                console.log("[DEBUG] Comprobando si referencia a la nota actual:", notaActualPath);
                console.log("[DEBUG] Tipo de asunto:", typeof metadata.asunto);
                
                if (Array.isArray(metadata.asunto)) {
                    console.log("[DEBUG] asunto es un array con", metadata.asunto.length, "elementos");
                    
                    // Para cada elemento en el array asunto
                    for (const asunto of metadata.asunto) {
                        console.log("[DEBUG] Elemento asunto:", JSON.stringify(asunto));
                        
                        if (asunto && typeof asunto === 'object' && asunto.path) {
                            console.log("[DEBUG] asunto tiene path:", asunto.path);
                            console.log("[DEBUG] ¿Coincide con notaActualPath?", asunto.path === notaActualPath);
                            
                            if (asunto.path === notaActualPath) {
                                isLinked = true;
                                possibleMatches++;
                                console.log("[DEBUG] ¡COINCIDENCIA ENCONTRADA en path!");
                                break;
                            }
                        } else if (typeof asunto === 'string') {
                            console.log("[DEBUG] asunto es string:", asunto);
                            console.log("[DEBUG] ¿Incluye notaActualPath?", asunto.includes(notaActualPath));
                            
                            if (asunto.includes(notaActualPath)) {
                                isLinked = true;
                                possibleMatches++;
                                console.log("[DEBUG] ¡COINCIDENCIA ENCONTRADA en string!");
                                break;
                            }
                            
                            // También buscar en el contenido del enlace wiki
                            const wikiLinkMatch = asunto.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
                            if (wikiLinkMatch) {
                                const linkPath = wikiLinkMatch[1];
                                console.log("[DEBUG] Detectado enlace wiki, path:", linkPath);
                                
                                if (linkPath === currentNote.basename || linkPath === notaActualPath) {
                                    isLinked = true;
                                    possibleMatches++;
                                    console.log("[DEBUG] ¡COINCIDENCIA ENCONTRADA en wikilink!");
                                    break;
                                }
                            }
                        }
                    }
                } else if (typeof metadata.asunto === 'object' && metadata.asunto.path) {
                    console.log("[DEBUG] asunto es un objeto con path:", metadata.asunto.path);
                    console.log("[DEBUG] ¿Coincide con notaActualPath?", metadata.asunto.path === notaActualPath);
                    
                    if (metadata.asunto.path === notaActualPath) {
                        isLinked = true;
                        possibleMatches++;
                        console.log("[DEBUG] ¡COINCIDENCIA ENCONTRADA en objeto!");
                    }
                } else if (typeof metadata.asunto === 'string') {
                    console.log("[DEBUG] asunto es un string simple:", metadata.asunto);
                    console.log("[DEBUG] ¿Incluye notaActualPath?", metadata.asunto.includes(notaActualPath));
                    
                    if (metadata.asunto.includes(notaActualPath)) {
                        isLinked = true;
                        possibleMatches++;
                        console.log("[DEBUG] ¡COINCIDENCIA ENCONTRADA en string simple!");
                    }
                    
                    // También buscar en el contenido del enlace wiki
                    const wikiLinkMatch = metadata.asunto.match(/\[\[(.*?)(?:\|(.*?))?\]\]/);
                    if (wikiLinkMatch) {
                        const linkPath = wikiLinkMatch[1];
                        console.log("[DEBUG] Detectado enlace wiki en string simple, path:", linkPath);
                        
                        // Comparar tanto con el nombre de archivo como con la ruta
                        const matchesPath = linkPath === notaActualPath;
                        const matchesBasename = linkPath === currentNote.basename;
                        
                        console.log("[DEBUG] ¿Coincide con ruta completa?", matchesPath);
                        console.log("[DEBUG] ¿Coincide con nombre de archivo?", matchesBasename);
                        
                        if (matchesPath || matchesBasename) {
                            isLinked = true;
                            possibleMatches++;
                            console.log("[DEBUG] ¡COINCIDENCIA ENCONTRADA en wikilink simple!");
                        }
                    }
                }
                
                if (isLinked) {
                    console.log("[DEBUG] ✅ Nota vinculada encontrada:", file.path);
                    
                    // Procesar la nota
                    let hits = parseFloat(metadata.hits);
                    if (isNaN(hits)) {
                        console.log("[DEBUG] hits no es un número, estableciendo a 0");
                        hits = 0;
                    }
                    
                    const alias = metadata.aliases?.[0] || file.basename;
                    const estado = metadata.estado || "Sin estado";
                    
                    let diferenciaDias = null;
                    if (metadata.publicacion) {
                        console.log("[DEBUG] Tiene fecha de publicación:", metadata.publicacion);
                        const pubDate = window.moment(metadata.publicacion.toString(), "YYYY-MM-DD").startOf("day");
                        
                        if (pubDate.isValid()) {
                            diferenciaDias = pubDate.diff(today, "days");
                            console.log("[DEBUG] diferenciaDias calculado:", diferenciaDias);
                        } else {
                            console.log("[DEBUG] La fecha de publicación no es válida");
                        }
                    }
                    
                    linkedNotes.push({ 
                        alias, 
                        hits, 
                        estado, 
                        diferenciaDias,
                        file
                    });
                    
                    console.log("[DEBUG] Nota añadida al resultado con alias:", alias);
                } else {
                    console.log("[DEBUG] No está vinculada, se omite");
                }
            } catch (error) {
                processingErrors++;
                console.error(`[ERROR] Error procesando archivo ${file.path}:`, error);
            }
        }
        
        console.log(`[DEBUG] Proceso completado. Notas vinculadas encontradas: ${linkedNotes.length}`);
        console.log(`[DEBUG] Estadísticas de procesamiento:`);
        console.log(`[DEBUG] - Total archivos procesados: ${allFiles.length}`);
        console.log(`[DEBUG] - Notas tipo Entregable: ${notesTypeEntregable}`);
        console.log(`[DEBUG] - Notas con asunto: ${notesWithAsunto}`);
        console.log(`[DEBUG] - Posibles coincidencias: ${possibleMatches}`);
        console.log(`[DEBUG] - Errores de procesamiento: ${processingErrors}`);
        
        if (linkedNotes.length === 0) {
            console.log("[DEBUG] No se encontraron notas vinculadas");
            
            // Crear mensaje de información
            const infoElement = document.createElement("div");
            infoElement.innerHTML = `<p>No se encontraron entregables vinculados a esta nota.</p>
                                     <p><small>Estadísticas: ${notesTypeEntregable} entregables procesados, 
                                     ${notesWithAsunto} con asunto, ${possibleMatches} posibles coincidencias.</small></p>`;
            
            return {
                tablaElement: infoElement,
                totalNotas: 0,
                totalHits: 0
            };
        }
        
        // Ordenar notas según el criterio
        console.log("[DEBUG] Ordenando notas por:", sortOrder);
        
        if (sortOrder === "hits") {
            linkedNotes.sort((a, b) => b.hits - a.hits);
        } else {
            const safeDiff = d => d == null ? Infinity : d;
            linkedNotes.sort((a, b) => {
                if (a.estado === "🔵" && b.estado !== "🔵") return 1;
                if (b.estado === "🔵" && a.estado !== "🔵") return -1;
                return safeDiff(a.diferenciaDias) - safeDiff(b.diferenciaDias);
            });
        }
        
        console.log("[DEBUG] Creando tabla HTML");
        
        // Crear la tabla HTML
        const tablaElement = this.crearTablaNotasVinculadas(linkedNotes);
        
        const totalHits = linkedNotes.reduce((sum, nota) => sum + nota.hits, 0);
        console.log("[DEBUG] Total hits:", totalHits);
        
        return {
            tablaElement,
            totalNotas: linkedNotes.length,
            totalHits
        };
    } catch (error) {
        console.error("[ERROR] Error en obtenerNotasVinculadas:", error);
        
        // Crear elemento de error
        const errorElement = document.createElement("div");
        errorElement.innerHTML = `<p style="color: red;">Error al procesar notas vinculadas: ${error.message}</p>
                                 <p>Revisa la consola para más detalles.</p>`;
        
        return { 
            error: "Error al procesar notas vinculadas: " + error.message,
            tablaElement: errorElement
        };
    }
}

/**
 * Crea una tabla HTML con las notas vinculadas
 * @param notas Array de objetos con información de notas
 * @returns Elemento HTML de la tabla
 */
crearTablaNotasVinculadas(notas) {
    // Función auxiliar para determinar el color según los días hasta publicación
    const colorKey = (nota) => {
        if (nota.estado === "🔵") return "gray";
        if (nota.diferenciaDias == null) return "inherit";
        if (nota.diferenciaDias > 6) return "green";
        if (nota.diferenciaDias >= 3) return "#e6b800";
        if (nota.diferenciaDias >= 1) return "orange";
        return "red";
    };
    
    try {
        // Crear el elemento tabla
        const table = document.createElement('table');
        table.className = 'dataview table';
        table.style.width = '100%';
        
        // Crear encabezado
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ["Nota", "Hits", "Estado", "Días hasta Publicación"];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        // Agregar filas de datos
        notas.forEach(nota => {
            const row = document.createElement('tr');
            
            // Celda para el enlace de la nota - SOLUCIÓN CORREGIDA
            const cellNota = document.createElement('td');
            const link = document.createElement('a');
            link.className = 'internal-link';
            link.textContent = nota.alias;
            
            // Usar data-href en lugar de href con obsidian://
            link.setAttribute('data-href', nota.file.path);
            
            // Hacer clicable el enlace con el método seguro de Obsidian
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const path = event.target.getAttribute('data-href');
                if (path) {
                    app.workspace.openLinkText(path, "", false);
                }
            });
            
            cellNota.appendChild(link);
            row.appendChild(cellNota);
            
            // Celda para hits
            const cellHits = document.createElement('td');
            cellHits.textContent = nota.hits;
            row.appendChild(cellHits);
            
            // Celda para estado
            const cellEstado = document.createElement('td');
            cellEstado.textContent = nota.estado;
            row.appendChild(cellEstado);
            
            // Celda para días hasta publicación
            const cellDias = document.createElement('td');
            const color = colorKey(nota);
            const diasTexto = (nota.diferenciaDias != null) 
                ? `${nota.diferenciaDias} días` 
                : "No definido";
            
            const spanDias = document.createElement('span');
            spanDias.style.color = color;
            spanDias.style.fontWeight = 'bold';
            spanDias.textContent = diasTexto;
            
            cellDias.appendChild(spanDias);
            row.appendChild(cellDias);
            
            tbody.appendChild(row);
        });
        
        // Agregar fila de totales
        const totalRow = document.createElement('tr');
        
        const totalLabelCell = document.createElement('td');
        const totalLabel = document.createElement('strong');
        totalLabel.textContent = 'Total';
        totalLabelCell.appendChild(totalLabel);
        totalRow.appendChild(totalLabelCell);
        
        const totalHits = notas.reduce((sum, nota) => sum + nota.hits, 0);
        
        const totalValueCell = document.createElement('td');
        const totalValue = document.createElement('strong');
        totalValue.textContent = totalHits.toString();
        totalValueCell.appendChild(totalValue);
        totalRow.appendChild(totalValueCell);
        
        // Celdas vacías para completar la fila
        totalRow.appendChild(document.createElement('td')); // estado
        totalRow.appendChild(document.createElement('td')); // días
        
        tbody.appendChild(totalRow);
        table.appendChild(tbody);
        
        return table;
    } catch (error) {
        console.error("Error al crear tabla de notas vinculadas:", error);
        const errorElement = document.createElement("div");
        errorElement.textContent = "Error al generar tabla: " + error.message;
        errorElement.style.color = "red";
        return errorElement;
    }
}

//--- Selector de Estado

/**
 * Genera un selector visual de estado para la nota
 * @param params Objeto con parámetros como notaActualPath y estadoActual 
 * @returns Elemento DOM con el selector de estado
 */
async generarSelectorEstado(params) {
    try {
        // Extraer parámetros
        const { notaActualPath, estadoActual } = params;
        
        if (!notaActualPath) {
            console.error("No se proporcionó la ruta de la nota actual");
            return null;
        }
        
        // Obtener el archivo actual
        const currentFile = app.vault.getAbstractFileByPath(notaActualPath);
        if (!currentFile) {
            console.error("No se pudo encontrar el archivo actual:", notaActualPath);
            return null;
        }
        
        // Configuración para los estados
        const estados = [
            { emoji: "🟢", label: "Avanzando", color: "#4caf50" },
            { emoji: "🟡", label: "En Pausa", color: "#ffc107" },
            { emoji: "🔴", label: "Detenida", color: "#f44336" },
            { emoji: "🔵", label: "Archivada", color: "#2196f3" }
        ];
        
        // Determinar el estado actual de la nota
        const estadoInicial = estadoActual || "🟡"; // Valor por defecto
        
        // Crear el componente principal
        const container = document.createElement("div");
        container.className = "estado-selector-container";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.gap = "10px";
        container.style.maxWidth = "500px";
        container.style.margin = "0 auto";
        container.style.padding = "8px";
        container.style.borderRadius = "4px";
        container.style.backgroundColor = "var(--background-secondary-alt)";
        
        // Etiqueta "Estado:"
        const labelEl = document.createElement("span");
        labelEl.className = "estado-label";
        labelEl.textContent = "Estado:";
        labelEl.style.fontWeight = "500";
        labelEl.style.fontSize = "0.9em";
        container.appendChild(labelEl);
        
        // Crear contenedor para los botones
        const optionsContainer = document.createElement("div");
        optionsContainer.className = "estado-options";
        optionsContainer.style.display = "flex";
        optionsContainer.style.gap = "6px";
        optionsContainer.style.flex = "1";
        container.appendChild(optionsContainer);
        
        // Indicador del estado actual (aparece a la derecha)
        const currentStateIndicator = document.createElement("div");
        currentStateIndicator.className = "current-state-indicator";
        currentStateIndicator.style.display = "flex";
        currentStateIndicator.style.alignItems = "center";
        currentStateIndicator.style.marginLeft = "8px";
        currentStateIndicator.style.fontSize = "0.85em";
        currentStateIndicator.style.opacity = "0.8";
        currentStateIndicator.style.whiteSpace = "nowrap";
        
        const estadoInfo = estados.find(e => e.emoji === estadoInicial) || estados[0];
        currentStateIndicator.textContent = estadoInfo.label;
        container.appendChild(currentStateIndicator);
        
        // Función para actualizar el estado usando la API nativa de Obsidian
        const updateState = async (newState) => {
            try {
                // Utilizar la API de Obsidian para modificar el frontmatter
                await app.fileManager.processFrontMatter(currentFile, frontmatter => {
                    frontmatter.estado = newState;
                });
                
                // Actualizar la visualización del estado actual
                const newEstadoInfo = estados.find(e => e.emoji === newState);
                currentStateIndicator.textContent = newEstadoInfo.label;
                
                // Actualizar estilos de botones
                optionsContainer.querySelectorAll("button").forEach(btn => {
                    const btnEstado = btn.getAttribute("data-estado");
                    const estadoData = estados.find(e => e.emoji === btnEstado);
                    
                    if (btnEstado === newState) {
                        btn.style.backgroundColor = estadoData.color;
                        btn.style.color = "white";
                        btn.style.transform = "scale(1.1)";
                        btn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
                    } else {
                        btn.style.backgroundColor = `${estadoData.color}22`;
                        btn.style.color = estadoData.color;
                        btn.style.transform = "none";
                        btn.style.boxShadow = "none";
                    }
                });
                
                // Mostrar notificación de éxito
                new Notice(`Estado cambiado a ${newEstadoInfo.label}`);
            } catch (error) {
                console.error("Error al actualizar el estado:", error);
                new Notice("Error al actualizar el estado. Consulta la consola para más detalles.");
            }
        };
        
        // Crear botones para cada estado
        estados.forEach(estado => {
            const boton = document.createElement("button");
            boton.className = "estado-btn";
            boton.setAttribute("data-estado", estado.emoji);
            boton.setAttribute("title", estado.label);
            boton.style.flex = "1";
            boton.style.border = "none";
            boton.style.borderRadius = "4px";
            boton.style.padding = "6px 0";
            boton.style.cursor = "pointer";
            boton.style.transition = "all 0.2s ease";
            boton.style.display = "flex";
            boton.style.alignItems = "center";
            boton.style.justifyContent = "center";
            
            // Establecer color según estado actual
            if (estadoInicial === estado.emoji) {
                boton.style.backgroundColor = estado.color;
                boton.style.color = "white";
                boton.style.transform = "scale(1.1)";
                boton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
            } else {
                boton.style.backgroundColor = `${estado.color}22`;
                boton.style.color = estado.color;
            }
            
            const emojiSpan = document.createElement("span");
            emojiSpan.textContent = estado.emoji;
            emojiSpan.style.fontSize = "18px";
            boton.appendChild(emojiSpan);
            
            // Eventos de ratón
            boton.addEventListener("mouseover", () => {
                if (estadoInicial !== estado.emoji) {
                    boton.style.backgroundColor = `${estado.color}44`;
                    boton.style.transform = "translateY(-2px)";
                }
            });
            
            boton.addEventListener("mouseout", () => {
                if (estadoInicial !== estado.emoji) {
                    boton.style.backgroundColor = `${estado.color}22`;
                    boton.style.transform = "none";
                }
            });
            
            // Evento de clic
            boton.addEventListener("click", () => {
                updateState(estado.emoji);
            });
            
            optionsContainer.appendChild(boton);
        });
        
        return container;
    } catch (error) {
        console.error("Error en generarSelectorEstado:", error);
        return null;
    }
}


  }