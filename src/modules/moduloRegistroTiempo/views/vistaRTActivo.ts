/*
 * Filename: /src/modules/moduloRegistroTiempo/views/vistaRTActivo.ts
 * Path: /src/modules/moduloRegistroTiempo/views
 * Created Date: 2025-02-23 21:01:25
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 23:58:34
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */

// import breakAudio from "../../../../Recursos/Break.mp3";
import { ItemView, WorkspaceLeaf, Plugin, TFile } from "obsidian";
import { DateTime, Duration } from "luxon"; // Asegúrate de tener Luxon disponible para manipular fechas y horas
import { registroTiempoAPI } from "../API/registroTiempoAPI";
import { starterAPI } from "../../noteLifecycleManager/API/starterAPI";

export class VistaRegistroActivo extends ItemView {
    plugin : Plugin;
    constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
        super(leaf);
        this.plugin = plugin;
        this.registroTiempoAPI = new registroTiempoAPI(this.plugin);
    }

    getViewType() {
        return "vista-registro-activo";
    }

    getDisplayText() {
        return "Registro Activo";
    }

    getIcon() {
        return "checkmark"; // Cambia a un ícono adecuado para registros activos
    }

    async onOpen() {
        await this.actualizarVista(); // Actualiza la vista inmediatamente al abrir
    
        this.intervalId = setInterval(async () => {
            await this.actualizarVista(); // Actualiza la vista cada 5 segundos
        }, 5000);
    }
    
    onClose() {
        clearInterval(this.intervalId); // Limpia el intervalo al cerrar la vista
    }


    async actualizarVista() {
        // 1. Guardar la posición de scroll actual del contenedor de la tabla, si existe.
        let scrollTop = 0;
        let scrollLeft = 0;
        const oldTableWrapper = this.containerEl.querySelector(".table-wrapper");
        if (oldTableWrapper) {
            scrollTop = oldTableWrapper.scrollTop;
            scrollLeft = oldTableWrapper.scrollLeft;
        }
    
        // 2. Vaciar el contenedor principal y configurar la clase base.
        this.containerEl.empty();
        this.containerEl.classList.add("registro-tiempo-container");
    
        const folder = this.plugin.settings.folder_RegistroTiempo;
        const files = app.vault.getMarkdownFiles().filter(file => file.path.includes(folder));
        let registrosActivos = [];
    
        // Buscar registros activos (estado 🟢)
        for (let file of files) {
            let metadata = app.metadataCache.getFileCache(file)?.frontmatter;
            if (metadata?.estado === "🟢") {
                let registroActivo = { file };
                Object.assign(registroActivo, metadata);
                registrosActivos.push(registroActivo);
            }
        }
    
        if (registrosActivos.length === 0) {
            // Contenedor para el mensaje y el botón si no hay registros activos.
            const messageContainer = this.containerEl.createEl('div', { cls: 'message-container' });
            messageContainer.createEl('p', { text: 'No hay ningún registro de tiempo ejecutándose.' });
    
            const botonCrear = messageContainer.createEl('button', { cls: 'registro-tiempo-btn' });
            botonCrear.textContent = '+ Registro Tiempo';
            botonCrear.onclick = async () => {
                const starterAPInstance = new starterAPI(this.plugin);
                await starterAPInstance.createNote("RegistroTiempo");
            };
    
            this.containerEl.appendChild(messageContainer);
            this.containerEl.createEl('div', { cls: 'separador' });
        } else if (registrosActivos.length > 0) {
            const registroEnEjecucion = registrosActivos[0];
    
            const activeContainer = this.containerEl.createEl("div", { cls: "active-time-container" });
    
            // Título
            activeContainer.createEl("h4", { text: "Registro de Tiempo en Ejecución", cls: "registro-tiempo-titulo" });
    
            // Alias
            const aliasContainer = activeContainer.createEl("p", { cls: "registro-alias" });

            // Primero intenta aliases[1], si no existe, usa aliases[0], y si tampoco existe, "Sin alias"
            const aliasText = registroEnEjecucion.aliases && registroEnEjecucion.aliases[1]
            ? registroEnEjecucion.aliases[1]
            : registroEnEjecucion.aliases && registroEnEjecucion.aliases[0]
                ? registroEnEjecucion.aliases[0]
                : "Sin alias";

            aliasContainer.innerHTML = `<strong>Alias:</strong> ${aliasText}`;
            // Descripción (Visible en la Vista)
            const descripcionContainer = activeContainer.createEl("p", { cls: "registro-descripcion" });
            descripcionContainer.innerHTML = `<strong>Descripción:</strong> ${registroEnEjecucion.descripcion || "Sin descripción"}`;
    
            // Tiempo en ejecución
            const tiempoContainer = activeContainer.createEl("p", { cls: "tiempo-ejecucion", text: "Tiempo transcurrido: Calculando..." });
            this.actualizarTiempoEnEjecucion(tiempoContainer, registroEnEjecucion.horaInicio);
    
            // Contenedor de botones alineados
            const botonesContainer = activeContainer.createEl("div", { cls: "registro-botones-container" });
    
            // Botón para cambiar la descripción
            const changeDescButton = document.createElement("button");
            changeDescButton.innerHTML = "✏️ <span class='button-text'>  Descripción</span>";
            changeDescButton.classList.add("change-desc-btn");
            changeDescButton.addEventListener("click", async () => {
                const nuevaDescripcion = await this.mostrarPrompt("Nueva Descripción:", registroEnEjecucion.descripcion || "");
                if (nuevaDescripcion !== null) {
                    const file = registroEnEjecucion.file;
                    if (!file) return;
    
                    const fileContent = await this.app.vault.read(file);
                    let frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter || {};
    
                    frontmatter.descripcion = nuevaDescripcion;
                    const newContent = this.reescribirFrontmatter(fileContent, frontmatter);
                    await this.app.vault.modify(file, newContent);
    
                    // Actualizar la vista para reflejar el cambio
                    this.actualizarVista();
                }
            });
    
            // Botón para detener el registro
            const stopButton = document.createElement("button");
            stopButton.innerHTML = "✋🏼 <span class='button-text'> Detener Registro</span>";
            stopButton.classList.add("stop-time-btn");
            stopButton.addEventListener("click", async () => {
                try {
                    console.log("Botón 'Cerrar Tarea' presionado.");
                    if (!registroEnEjecucion.file || !(registroEnEjecucion.file instanceof TFile)) {
                        console.error("No se encontró el archivo del registro en ejecución.");
                        return;
                    }
                    await this.registroTiempoAPI.cerrarRegistro(registroEnEjecucion.file);
                    console.log("Registro cerrado correctamente.");
                    this.actualizarVista();
                } catch (error) {
                    console.error("Error al cerrar la tarea:", error);
                }
            });
    
            // Agregar botones al contenedor
            botonesContainer.appendChild(changeDescButton);
            botonesContainer.appendChild(stopButton);
    
            activeContainer.appendChild(botonesContainer);
            activeContainer.appendChild(aliasContainer);
            activeContainer.appendChild(descripcionContainer);
            activeContainer.appendChild(tiempoContainer);
            this.containerEl.appendChild(activeContainer);
        }
    
        // Mostrar registros finalizados
        let registrosFinalizados = [];
        for (let file of files) {
            let metadata = app.metadataCache.getFileCache(file)?.frontmatter;
            if (metadata?.estado === "🔵") {
                let registroFinalizado = { file };
                Object.assign(registroFinalizado, metadata);
                registrosFinalizados.push(registroFinalizado);
            }
        }
    
        registrosFinalizados.sort((a, b) => b.id - a.id);
        let top5RegistrosActivos = registrosFinalizados.slice(0, 15);
    
        if (top5RegistrosActivos.length > 0) {
            const tableWrapper = this.containerEl.createEl("div", { cls: "table-wrapper" });
            const table = tableWrapper.createEl("table", { cls: "styled-table" });
            const header = table.createEl("tr");
            ["Alias", "Descripción", "Retomar"].forEach(text => header.createEl("th", { text: text }));
    
            top5RegistrosActivos.forEach(registro => {
                const row = table.createEl("tr");
    
                // Alias con enlace
                const aliasCell = row.createEl("td");
                const aliasText = registro.aliases && registro.aliases[1]
                    ? registro.aliases[1]
                    : registro.aliases && registro.aliases[0]
                        ? registro.aliases[0]
                        : "Sin alias";
    
                const aliasLink = aliasCell.createEl("a", {
                    text: aliasText,
                    cls: "clickable-alias",
                    href: "#"
                });
                aliasLink.addEventListener("click", async () => {
                    let file = app.vault.getAbstractFileByPath(registro.file.path);
                    if (file instanceof TFile) {
                        await app.workspace.getLeaf(true).openFile(file);
                    }
                });
    
                row.createEl("td", { text: registro.descripcion || "No Definida" });
    
                // Botón "Retomar"
                const buttonCell = row.createEl("td");
                const button = this.createButtonTable("⏱️", () => {
                    this.registroTiempoAPI.retomarTarea(registro.id);
                });
                button.classList.add("retomar-btn");
                button.setAttribute("aria-label", "Retomar");
                buttonCell.appendChild(button);
            });
    
            this.containerEl.appendChild(tableWrapper);
    
            // 3. Restaurar la posición de scroll en el nuevo contenedor de tabla.
            tableWrapper.scrollTop = scrollTop;
            tableWrapper.scrollLeft = scrollLeft;
        } else {
            this.containerEl.createEl("p", { text: "No hay registros finalizados." });
        }
    }
    
    /**
     * Función para actualizar dinámicamente el tiempo en ejecución
     */
/**
 * Función para actualizar dinámicamente el tiempo en ejecución
 */
alertaEjecutada25: boolean = false;

actualizarTiempoEnEjecucion(element: HTMLElement, horaInicio: string) {
    const extraerHora = (fechaStr: string): Date | null => {
        const match = fechaStr.match(/(\d{4}-\d{2}-\d{2})\s+\w+\s+(\d{2}:\d{2})/);
        if (match) {
            return new Date(`${match[1]}T${match[2]}:00`);
        }
        return null;
    };

    const inicio = extraerHora(horaInicio);
    if (!inicio) {
        element.textContent = "Tiempo transcurrido: No disponible";
        return;
    }

    const calcularTiempo = () => {
        const ahora = new Date();
        const diferencia = Math.floor((ahora.getTime() - inicio.getTime()) / 1000);
        const horas = Math.floor(diferencia / 3600);
        const minutos = Math.floor((diferencia % 3600) / 60);
        const segundos = diferencia % 60;

        element.textContent = `Tiempo transcurrido: ${horas}h ${minutos}m ${segundos}s`;

        // Cuando se alcanza o supera 25 minutos (1500 segundos)
        if (diferencia >= 1500) {
            element.classList.add("tiempo-rojo");            
        } else {
            element.classList.remove("tiempo-rojo");
  
        }
    };

    // Actualiza inmediatamente y luego cada segundo
    calcularTiempo();
    setInterval(calcularTiempo, 1000);
}
    
/**
 * Función para mostrar un prompt y obtener un nuevo valor
 */
async mostrarPrompt(mensaje: string, valorActual: string): Promise<string | null> {
    return new Promise((resolve) => {
        const modal = document.createElement("div");
        modal.classList.add("prompt-modal");

        const label = document.createElement("label");
        label.textContent = mensaje;

        const input = document.createElement("input");
        input.type = "text";
        input.value = valorActual; // Prellenar con la descripción actual

        const buttonContainer = document.createElement("div");

        const aceptar = document.createElement("button");
        aceptar.textContent = "Aceptar";
        aceptar.addEventListener("click", () => {
            resolve(input.value.trim() || null); // Retorna el texto escrito
            modal.remove();
        });

        const cancelar = document.createElement("button");
        cancelar.textContent = "Cancelar";
        cancelar.addEventListener("click", () => {
            resolve(null); // Cancelar sin cambios
            modal.remove();
        });

        // Permitir confirmar con "Enter"
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                aceptar.click();
            }
        });

        buttonContainer.appendChild(aceptar);
        buttonContainer.appendChild(cancelar);
        modal.appendChild(label);
        modal.appendChild(input);
        modal.appendChild(buttonContainer);
        document.body.appendChild(modal);

        input.focus(); // Enfocar el input automáticamente
    });
}

    createButtonTable(buttonText, onClickCallback) {
        
        const button = document.createElement('button');
        button.textContent = buttonText;
        button.type = 'button'; // Asegúrate de que no se enviará un formulario al hacer clic en él
        button.classList.add('your-button-class'); // Agrega una clase para el estilo del botón si es necesario

        // Añade el evento de clic al botón
        button.addEventListener('click', onClickCallback);

        return button;
    }
    
/**
 * Reescribe el frontmatter en un archivo Markdown, preservando la estructura original.
 */
reescribirFrontmatter(content: string, frontmatter: Record<string, any>): string {
    const yamlStart = content.indexOf('---');
    const yamlEnd = content.indexOf('---', yamlStart + 3);

    if (yamlStart === -1 || yamlEnd === -1) {
        return content; // Si no hay frontmatter, no modificar nada.
    }

    // Convertir el frontmatter en YAML formateado correctamente
    let nuevoFrontmatter = '---\n';

    for (const key in frontmatter) {
        const value = frontmatter[key];

        if (Array.isArray(value)) {
            // Si el campo es una lista, asegurarse de que cada elemento se formatee correctamente
            nuevoFrontmatter += `${key}:\n`;
            value.forEach(item => {
                if (typeof item === "string" && item.match(/^\[\[.*\]\]$/)) {
                    nuevoFrontmatter += `  - "${item}"\n`;
                } else {
                    nuevoFrontmatter += `  - ${JSON.stringify(item)}\n`;
                }
            });
        } else if (typeof value === "string") {
            if (value.match(/^\[\[.*\]\]$/)) {
                nuevoFrontmatter += `${key}: "${value}"\n`;
            } else {
                nuevoFrontmatter += `${key}: ${JSON.stringify(value)}\n`;
            }
        } else {
            nuevoFrontmatter += `${key}: ${value}\n`;
        }
    }

    nuevoFrontmatter += '---\n';

    // Obtener el contenido posterior al frontmatter
    let contenidoRestante = content.slice(yamlEnd + 3).trimStart(); // Eliminar saltos de línea extra

    // Agregar una línea en blanco solo si hay contenido restante
    return nuevoFrontmatter + (contenidoRestante ? '\n' + contenidoRestante : '');
}
    
}
