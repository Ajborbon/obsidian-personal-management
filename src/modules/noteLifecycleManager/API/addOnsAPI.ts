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
  
// Función para generar el texto de relaciones de una nota
// Añadir esta función a la clase addOnsAPI en src/modules/noteLifecycleManager/API/addOnsAPI.ts
// En src/modules/noteLifecycleManager/API/addOnsAPI.ts

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
 * Genera un árbol de referencias a la nota actual de forma recursiva
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
    const contenedor = dv.el("div", "", { cls: "backlinks-tree" });
    
    if (profundidadActual === 0) {
        // Añadir título personalizado solo en la raíz
        const tipoNota = paginaActual.typeName || "Nota";
        const alias = paginaActual.file.aliases && paginaActual.file.aliases.length > 0 
            ? paginaActual.file.aliases[0] 
            : (paginaActual.titulo || paginaActual.file.name);
            
        const titulo = dv.el("h3", `Referencias a ${tipoNota} "${alias}"`, { cls: "backlinks-tree-title" });
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
        const errorMsg = dv.el("p", "Error al obtener páginas de Dataview", { cls: "backlinks-tree-error" });
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
        const errorMsg = dv.el("p", "Error al procesar referencias", { cls: "backlinks-tree-error" });
        contenedor.appendChild(errorMsg);
        return contenedor;
    }
    
    // Si no hay referencias, mostrar mensaje
    if (referenciasDirectas.length === 0) {
        if (profundidadActual === 0) {
            const mensaje = dv.el("p", "No se encontraron referencias a esta nota", { cls: "backlinks-tree-empty" });
            contenedor.appendChild(mensaje);
        }
        return contenedor;
    }
    
    // Crear lista para mostrar referencias
    const lista = dv.el("ul", "", { cls: `backlinks-tree-level-${profundidadActual}` });
    
    // Añadir cada referencia a la lista
    for (const referencia of referenciasDirectas) {
        try {
            // Evitar ciclos
            if (visitadas.has(referencia.file.path)) {
                continue;
            }
            
            // Crear elemento de lista
            const item = dv.el("li", "", { cls: "backlinks-tree-item" });
            
            // Añadir tipo y enlace
            const tipo = referencia.typeName || "Nota";
            const tipoEl = dv.el("span", `[${tipo}] `, { cls: "backlinks-tree-type" });
            item.appendChild(tipoEl);
            
            // Determinar el texto para mostrar en el enlace
            let nombreMostrado = "";
            try {
                nombreMostrado = referencia.file.aliases && referencia.file.aliases.length > 0
                    ? referencia.file.aliases[0] 
                    : (referencia.titulo || referencia.file.name);
            } catch (e) {
                nombreMostrado = referencia.file.name || "Sin nombre";
            }
            
            // Crear enlace usando el método correcto para enlaces clicables
            try {
                // Primero intentamos con fileLink
                const enlace = dv.el("a", nombreMostrado, {
                    attr: {
                        href: referencia.file.path,
                        "data-href": referencia.file.path,
                        class: "internal-link"
                    }
                });
                
                // Asegurar que el enlace es clicable
                enlace.addEventListener("click", (event) => {
                    event.preventDefault();
                    const target = event.target;
                    const href = target.getAttribute("data-href");
                    if (href) {
                        // Intenta abrir con la API de Obsidian
                        app.workspace.openLinkText(href, "", false);
                    }
                });
                
                item.appendChild(enlace);
            } catch (e) {
                console.error("Error al crear enlace con método primario:", e);
                
                // Plan B: usar createEl de Obsidian directamente
                try {
                    const enlace = document.createElement("a");
                    enlace.textContent = nombreMostrado;
                    enlace.href = `obsidian://open?vault=${encodeURIComponent(app.vault.getName())}&file=${encodeURIComponent(referencia.file.path)}`;
                    enlace.classList.add("internal-link");
                    item.appendChild(enlace);
                } catch (e2) {
                    console.error("Error al crear enlace con método alternativo:", e2);
                    // Fallback final: texto plano
                    const textoPlano = dv.el("span", nombreMostrado);
                    item.appendChild(textoPlano);
                }
            }
            
            // Buscar recursivamente referencias a esta referencia
            try {
                // Paso el set de visitadas como copia para no afectar otros niveles
                const nuevoVisitadas = new Set([...visitadas]);
                nuevoVisitadas.add(referencia.file.path);
                
                const subReferencias = this.generarArbolReferencias(
                    referencia, dv, profundidadMaxima, 
                    nuevoVisitadas, profundidadActual + 1
                );
                
                // Verificar que el resultado es un nodo DOM válido
                if (subReferencias && subReferencias.nodeType) {
                    // Verificar si tiene contenido útil
                    if (subReferencias.children && subReferencias.children.length > 0) {
                        // Verificar si hay más que solo el título
                        const tieneContenidoUtil = subReferencias.children.length > 1 || 
                            (subReferencias.children.length === 1 && 
                             !subReferencias.children[0].classList.contains("backlinks-tree-title"));
                        
                        if (tieneContenidoUtil) {
                            item.appendChild(subReferencias);
                        }
                    }
                }
            } catch (e) {
                console.error("Error en la recursión para " + referencia.file.path, e);
                const errorMsg = dv.el("span", " (Error al obtener subreferencias)", { cls: "backlinks-tree-error" });
                item.appendChild(errorMsg);
            }
            
            // Añadir el item a la lista
            lista.appendChild(item);
            
        } catch (e) {
            console.error("Error al procesar referencia:", e);
            // Continuar con la siguiente referencia
            continue;
        }
    }
    
    // Añadir la lista al contenedor
    try {
        if (lista && lista.nodeType) {
            contenedor.appendChild(lista);
        }
    } catch (e) {
        console.error("Error al añadir lista al contenedor:", e);
        const errorMsg = dv.el("p", "Error al generar estructura de árbol", { cls: "backlinks-tree-error" });
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
            const mensaje = dv.el("p", "No se encontró frontmatter en esta nota.", { cls: "notion-links-message" });
            contenedor.appendChild(mensaje);
            return contenedor;
        }
        
        // Obtener el valor de typeName si existe
        const typeName = meta.typeName || "Elemento";
        
        // Filtrar las claves que comiencen con "link-" y sean URLs válidas
        const linkFields = Object.entries(meta)
            .filter(([key, value]) => key.startsWith("link-") && typeof value === "string" && value.startsWith("http"))
            .map(([key, value]) => ({
                url: value
            }));
        
        // Renderizar el mensaje si se encuentra al menos un enlace válido
        if (linkFields.length > 0) {
            linkFields.forEach(field => {
                // Crear un párrafo para cada enlace
                const parrafo = document.createElement("p");
                parrafo.classList.add("notion-link-item");
                
                // Crear texto
                parrafo.textContent = `${typeName} sincronizado en Notion en `;
                
                // Crear enlace
                const enlace = document.createElement("a");
                enlace.href = field.url;
                enlace.textContent = field.url;
                enlace.target = "_blank"; // Abrir en nueva pestaña
                enlace.rel = "noopener noreferrer"; // Seguridad para enlaces externos
                
                // Añadir el enlace al párrafo
                parrafo.appendChild(enlace);
                
                // Añadir el párrafo al contenedor
                contenedor.appendChild(parrafo);
            });
        } else {
            const mensaje = dv.el("p", "No se encontraron enlaces sincronizados en Notion.", { cls: "notion-links-message" });
            contenedor.appendChild(mensaje);
        }
    } catch (error) {
        console.error("Error al procesar enlaces sincronizados:", error);
        const errorMsg = dv.el("p", "Error al procesar enlaces sincronizados. Consulta la consola para más detalles.", { cls: "notion-links-error" });
        contenedor.appendChild(errorMsg);
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
        return dv.el("div", datos.error, { cls: "tiempo-stats-error" });
      }
      
      // Obtener estadísticas y registros
      const { estadisticas, registros, proyecto } = datos;
      
      // Crear contenedor principal
      const contenedor = dv.el("div", "", { cls: "tiempo-stats-container" });
      
      // Si no hay registros, mostrar mensaje y salir
      if (!registros || registros.length === 0) {
        const mensajeVacio = dv.el("p", "No se encontraron registros de tiempo para este proyecto.", 
            { cls: "tiempo-stats-empty-message" });
        contenedor.appendChild(mensajeVacio);
        return contenedor;
      }
      
      // === SECCIÓN 1: ESTADÍSTICAS PRINCIPALES ===
      const statsContainer = dv.el("div", "", { cls: "tiempo-stats-summary" });
      
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
          valor: estadisticas.ultimos7Dias.formateado,
          icono: "📅"
        },
        {
          titulo: "Últimos 30 días",
          valor: estadisticas.ultimos30Dias.formateado,
          icono: "📆"
        }
      ];
      
      // Crear grid para las tarjetas
      const statsGrid = dv.el("div", "", { cls: "tiempo-stats-grid" });
      
      // Añadir cada tarjeta al grid
      for (const stat of infoEstadisticas) {
        const tarjeta = dv.el("div", "", { cls: "tiempo-stat-card" });
        
        const icono = dv.el("span", stat.icono, { cls: "tiempo-stat-icon" });
        const titulo = dv.el("div", stat.titulo, { cls: "tiempo-stat-title" });
        const valor = dv.el("div", stat.valor, { cls: "tiempo-stat-value" });
        
        tarjeta.appendChild(icono);
        tarjeta.appendChild(titulo);
        tarjeta.appendChild(valor);
        
        statsGrid.appendChild(tarjeta);
      }
      
      statsContainer.appendChild(statsGrid);
      contenedor.appendChild(statsContainer);
      
      // === SECCIÓN 2: TABLA DE REGISTROS ===
      // Título de la sección
      const tituloTabla = dv.el("h3", "Registros de tiempo", { cls: "tiempo-table-title" });
      contenedor.appendChild(tituloTabla);
      
      // Crear la tabla
      const tabla = dv.el("table", "", { cls: "tiempo-registros-table" });
      
      // Crear encabezados
      const encabezado = dv.el("thead", "");
      const filaEncabezado = dv.el("tr", "");
      
      const encabezados = ["Descripción", "Duración", "Fecha", "Contexto"];
      
      for (const textoEncabezado of encabezados) {
        const th = dv.el("th", textoEncabezado);
        filaEncabezado.appendChild(th);
      }
      
      encabezado.appendChild(filaEncabezado);
      tabla.appendChild(encabezado);
      
      // Crear cuerpo de la tabla
      const cuerpo = dv.el("tbody", "");
      
      // Añadir filas con los datos
      for (const registro of registros) {
        const fila = dv.el("tr", "");
        
        // Columna: Descripción con enlace a la nota
        const celdaDescripcion = dv.el("td", "");
        
        try {
          // Texto de la descripción
          const textoDescripcion = document.createTextNode(registro.descripcion);
          celdaDescripcion.appendChild(textoDescripcion);
          
          // Agregar enlace
          const enlaceSpan = dv.el("span", "", { cls: "tiempo-ver-mas" });
          enlaceSpan.appendChild(document.createTextNode(" ("));
          
          // Crear enlace usando dataview
          try {
            const enlace = dv.el("a", "ver", { 
              attr: { 
                href: registro.path,
                "data-href": registro.path,
                class: "internal-link" 
              } 
            });
            
            // Hacer el enlace clicable
            enlace.addEventListener("click", (event) => {
              event.preventDefault();
              const href = event.target.getAttribute("data-href");
              if (href) {
                // Abrir con API de Obsidian
                app.workspace.openLinkText(href, "", false);
              }
            });
            
            enlaceSpan.appendChild(enlace);
          } catch (e) {
            // Si falla, crear texto plano
            enlaceSpan.appendChild(document.createTextNode("ver registro"));
          }
          
          enlaceSpan.appendChild(document.createTextNode(")"));
          celdaDescripcion.appendChild(enlaceSpan);
        } catch (e) {
          celdaDescripcion.textContent = registro.descripcion || "Sin descripción";
        }
        
        fila.appendChild(celdaDescripcion);
        
        // Columna: Duración
        const celdaDuracion = dv.el("td", registro.tiempoFormateado);
        fila.appendChild(celdaDuracion);
        
        // Columna: Fecha
        const textoFecha = registro.horaFinal || registro.horaInicio;
        const celdaFecha = dv.el("td", textoFecha);
        fila.appendChild(celdaFecha);
        
        // Columna: Contexto (asunto)
        const celdaContexto = dv.el("td", registro.asuntoAlias || "Sin contexto");
        fila.appendChild(celdaContexto);
        
        cuerpo.appendChild(fila);
      }
      
      tabla.appendChild(cuerpo);
      contenedor.appendChild(tabla);
      
      return contenedor;
    } catch (error) {
      console.error("Error al mostrar estadísticas de tiempo:", error);
      return dv.el("div", "Error al mostrar estadísticas: " + error.message, { cls: "tiempo-stats-error" });
    }
  }


  }