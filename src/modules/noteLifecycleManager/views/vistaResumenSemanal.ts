import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import { DateTime } from 'luxon';

export class VistaResumenSemanal extends ItemView {
    intervalId: number;
 

    constructor(leaf: WorkspaceLeaf, public plugin: any) {
        super(leaf);
    }

    getViewType() {
        return "vista-resumen-semanal";
    }

    getDisplayText() {
        return "Resumen Semanal";
    }

    getIcon() {
        return "history"; // Este es un ejemplo, cambia "documento" por el nombre del ícono que desees usar
    }

    async onOpen() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            this.contentEl.setText("No hay un archivo activo.");
            return;
        }

        const fileCache = this.app.metadataCache.getFileCache(activeFile);
        await this.actualizarVista(fileCache); // Puedes usar this.file dentro de actualizarVista
    
        //await this.actualizarVista(); // Actualiza la vista inmediatamente al abrir

        this.intervalId = window.setInterval(async () => {
            await this.actualizarVista(fileCache); // Actualiza la vista cada 10 segundos
        }, 10000);
    }
    
    onClose() {
        clearInterval(this.intervalId); // Limpia el intervalo al cerrar la vista
    }

    async actualizarVista(fileCache) {
        this.contentEl.empty(); // Limpia el contenido existente antes de actualizar
    
        
        const inicioWStr = fileCache.frontmatter?.inicioW; 
        if (!inicioWStr) {
            this.contentEl.setText("La configuración de inicioW no está establecida.");
            return;
        }
        const folderDiario = "Estructura/Journal/Diario/Notas";
        const inicioW = DateTime.fromFormat(inicioWStr, "yyyy-MM-dd EEEE", { locale: "es" });
        const finW = inicioW.plus({ days: 6 }); // Ajuste para asegurar que el fin es el domingo de la misma semana
    
        const archivosDiario = this.app.vault.getFiles()
            .filter(file => file.path.startsWith(folderDiario) && file.extension === 'md');
    
        const bitacoras = archivosDiario
            .map(file => {
                const fechaArchivo = DateTime.fromISO(file.basename.substring(0, 10));
                const datos = this.app.metadataCache.getFileCache(file)?.frontmatter;
                return {
                    archivo: file.basename,
                    path: file.path,
                    fechaArchivo,
                    datos
                };
            })
            .filter(({ fechaArchivo }) => fechaArchivo >= inicioW && fechaArchivo <= finW)
            .sort((a, b) => a.fechaArchivo.toMillis() - b.fechaArchivo.toMillis());
    
        // Crear título con las fechas de la semana
        let trim = finW.quarter;
        let sem = (finW.weekNumber - (finW.quarter - 1)*13)
        if (sem==0){sem = 13}

        const titulo = this.contentEl.createEl('h2', { text: `Resumen de la semana ${sem} - Q${trim} / W${finW.toFormat('WW')}.`});
        const subtitulo = this.contentEl.createEl('h3', { text: `Desde el ${inicioW.toFormat('EEEE, DD')} al ${finW.toFormat('EEEE, DD')}` });
        titulo.style.textAlign = 'center';
        subtitulo.style.textAlign = 'center';
        // Crear tabla
        const table = document.createElement('table');
        table.className = 'table-resumenSemanal';
    
        // Crear cabecera de la tabla
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Día', 'Resumen'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
    
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        bitacoras.forEach(({ archivo, path, datos }) => {
            const tr = document.createElement('tr');
    
            const tdArchivo = document.createElement('td');
            const linkEl = document.createElement('a');
            linkEl.textContent = archivo;
            linkEl.href = path;
            linkEl.onclick = async (ev) => {
                ev.preventDefault();
                const file = this.app.vault.getAbstractFileByPath(path);
                if (file instanceof TFile) {
                    await this.app.workspace.getLeaf(false).openFile(file, { eState: { focus: true } });
                }
            };
            tdArchivo.appendChild(linkEl);
    
            const tdResumen = document.createElement('td');
            const ul = document.createElement('ul');
            (datos.titulo || ['Sin título']).forEach(titulo => {
                const li = document.createElement('li');
                li.textContent = titulo;
                ul.appendChild(li);
            });
            tdResumen.appendChild(ul);
    
            tr.appendChild(tdArchivo);
            tr.appendChild(tdResumen);
    
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
    
        // Agregar la tabla al contenedor
        this.contentEl.appendChild(table);
    }
    
    


    // Opcional: Implementa onClose si necesitas limpieza al cerrar la vista.
}