/*
 * Filename: /src/modules/moduloRegistroTiempo/views/vistaRTActivo.ts
 * Path: /src/modules/moduloRegistroTiempo/views
 * Created Date: 2024-03-14 10:41:55
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:47:48
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


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
        this.containerEl.empty(); // Limpia el contenido existente antes de actualizar

        const folder = this.plugin.settings.folder_RegistroTiempo; // Ajusta esto al directorio donde guardas tus registros
        const files = app.vault.getMarkdownFiles().filter(file => file.path.includes(folder));
        let registrosActivos = [];

        for (let file of files) {
            let metadata = app.metadataCache.getFileCache(file)?.frontmatter;

            if (metadata?.estado === "🟢") {
                let registroActivo = {file}; // Asumiendo que quieres guardar el path del archivo
                Object.assign(registroActivo, metadata); // Agrega el metadata al objeto registroActivo
                registrosActivos.push(registroActivo); // Añade el registro activo al array              
            }
        }

        // Crea la tabla HTML para mostrar la información
        if (registrosActivos.length === 0) {
            this.containerEl.createEl('p', { text: 'No hay ningún registro de tiempo ejecutandose.' });
            const botonCrear = this.containerEl.createEl('button');
            botonCrear.textContent = '+ Registro Tiempo';
            botonCrear.onclick = async () => {
                const starterAPInstance = new starterAPI(this.plugin)
                await starterAPInstance.createNote("RegistroTiempo");
            };
            this.containerEl.createEl('div', {cls: 'separador'});
            // Logica para crear tabla sencilla de 5 ultimos RT
            let registrosFinalizados = [];
            for (let file of files) {
                let metadata = app.metadataCache.getFileCache(file)?.frontmatter;

                if (metadata?.estado === "🔵") {
                    let registroFinalizado = {file}; // Asumiendo que quieres guardar el path del archivo
                    Object.assign(registroFinalizado, metadata); // Agrega el metadata al objeto registroActivo
                    registrosFinalizados.push(registroFinalizado); // Añade el registro activo al array              
                }
            }
            // Ordena los registros activos por el campo 'id' de manera descendente
            registrosFinalizados.sort((a, b) => b.id - a.id);
            // Selecciona los primeros 5 registros después de ordenar
            
            let top5RegistrosActivos = registrosFinalizados.slice(0, 8);
            // Ahora top5RegistrosActivos contiene los 5 archivos con los ID más altos


            if (top5RegistrosActivos.length > 0) {
                this.containerEl.classList.add("table-container");
                const table = this.containerEl.createEl('table', {cls: 'table-small'});
                table.style.width = '100%';
                const header = table.createEl('tr');
                ["Alias", "Descripción", "Retomar"].forEach(text => header.createEl('th', {text: text}));
                
                top5RegistrosActivos.forEach(registro => {
                    
                    const row = table.createEl('tr');
                    /* Sin Link
                    row.createEl('td', {text: registro.aliases[0]});
                    */
                   // Con link
                   // Crea una celda para el alias
                          // Crea una celda para el alias
                    const aliasCell = row.createEl('td');
                    // Crea un elemento span para contener el alias como texto
                    const aliasLink = aliasCell.createEl('span', {
                        text: registro.aliases[0],
                        cls: 'clickable-alias' // Una clase para estilizar, si es necesario
                    });
                    
                    // Establece el comportamiento al hacer clic en el alias
                    aliasLink.addEventListener('click', async () => {
                        debugger;
                        // Obtiene el archivo por su ruta
                        let file = app.vault.getAbstractFileByPath(registro.file.path);
                        if (file instanceof TFile) {
                            // Abre el archivo
                            await app.workspace.getLeaf(true).openFile(file);
                        }
                    });
                    row.createEl('td', {text: registro.descripcion || "No Definida"});
                   // Crea una nueva celda para el botón
                   const buttonCell = row.createEl('td');
                   // Crea el botón y añádelo a la nueva celda
                   const button = this.createButtonTable('⏱️', () => {
                        this.registroTiempoAPI.retomarTarea(registro.id);
                   });
                       buttonCell.appendChild(button);
                   });
                    
            } else {
                this.containerEl.createEl('p', {text: 'No hay registros finalizados.'});
            }

        }else if (registrosActivos.length === 1){
            this.containerEl.classList.add("vista-RT");
            let alias = registrosActivos[0].aliases ? registrosActivos[0].aliases[0] : 'Sin alias';
            let descripcion = registrosActivos[0].descripcion ? registrosActivos[0].descripcion : 'Sin descripcion';
            let partes = registrosActivos[0].horaInicio.split(' ');
            let fechaHoraISO = `${partes[0]}T${partes[2]}`;
            let inicio = DateTime.fromISO(fechaHoraISO);
            let ahora = DateTime.now();
            let diferencia = ahora.diff(inicio);
            let tiempo = Duration.fromMillis(diferencia.toMillis()).toFormat('h:mm')
            this.containerEl.createEl('h5', { text: 'Tarea Actual'});

            this.containerEl.createEl('span', { text: 'Nombre: '});
            // Modificado para crear un elemento span clickeable para el alias
            const aliasSpan = this.containerEl.createEl('span', {
                text: alias,
                cls: 'clickable-alias' // Asegúrate de tener esta clase para estilizar el span como un link
            });
            aliasSpan.addEventListener('click', async () => {
                let file = app.vault.getAbstractFileByPath(registrosActivos[0].file.path);
                if (file instanceof TFile) {
                    await app.workspace.getLeaf(true).openFile(file);
                }
            });

            this.containerEl.createEl('span', { text: '\n' + descripcion });
            this.containerEl.createEl('p', { text: 'Esta tarea lleva: ' + tiempo });
            const botonera = this.containerEl.createEl('div');
            const botonCerrar = botonera.createEl('button');
            botonCerrar.textContent = 'Cerrar Tarea';
            botonCerrar.onclick = async () => {
                await this.registroTiempoAPI.cerrarRegistro(registrosActivos[0].file); // Restablecer a la vista del botón de menú inicial
            };
            const botonDetalle = botonera.createEl('button');
            botonDetalle.textContent = 'Cambiar Descripción';
            botonDetalle.onclick = async () => {
                await this.registroTiempoAPI.detalleRegistro(registrosActivos[0].file); // Restablecer a la vista del botón de menú inicial
            };
        } else {
            this.containerEl.createEl('p', {text: ' Hay un error con la cantidad de registros activos.'});
        }
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
    
    
}
