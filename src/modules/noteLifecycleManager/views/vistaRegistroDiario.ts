import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import { DateTime, Duration } from 'luxon';
import { registroTiempoAPI } from "../../moduloRegistroTiempo/API/registroTiempoAPI";

export class VistaRegistroDiario extends ItemView {
    intervalId: number;
 

    constructor(leaf: WorkspaceLeaf, public plugin: any) {
        super(leaf);
        this.plugin = plugin;
        this.registroTiempoAPI = new registroTiempoAPI(this.plugin);
    }

    getViewType() {
        return "vista-registro-diario";
    }

    getDisplayText() {
        return "Registro Diario";
    }

    getIcon() {
        return "file-clock"; // Este es un ejemplo, cambia "documento" por el nombre del ícono que desees usar
    }

    async onOpen() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            this.contentEl.setText("No hay un archivo activo.");
            return;
        }

        await this.actualizarVista(activeFile); // Puedes usar this.file dentro de actualizarVista
    
        //await this.actualizarVista(); // Actualiza la vista inmediatamente al abrir

        this.intervalId = window.setInterval(async () => {
            await this.actualizarVista(activeFile); // Actualiza la vista cada 10 segundos
        }, 5000);
    }
    
    onClose() {
        clearInterval(this.intervalId); // Limpia el intervalo al cerrar la vista
    }

    async actualizarVista(activeFile) {
        this.contentEl.empty(); // Limpia el contenido existente antes de actualizar
        
        const fechaHoy = DateTime.fromFormat(activeFile.basename.split(" ")[0], 'yyyy-MM-dd', { locale: 'es' });
        const folder = this.plugin.settings.folder_RegistroTiempo;
        const files = this.app.vault.getMarkdownFiles().filter(file => file.path.includes(folder));

        let totalDia = 0;
        let registrosHoy = [];

        for (let file of files) {
            let metadata = this.app.metadataCache.getFileCache(file)?.frontmatter;
            if (metadata?.horaInicio) {
                let horaInicio = DateTime.fromFormat(metadata.horaInicio, 'yyyy-MM-dd EEEE HH:mm', { locale: 'es' });
                if (horaInicio.startOf('day').ts === fechaHoy.startOf('day').ts) {
                    registrosHoy.push({ path: file.path, frontmatter: metadata });
                    totalDia += parseInt(metadata.tiempoTrabajado || '0');
                }
            }
        }

        registrosHoy.sort((a, b) => {
            let fechaA = DateTime.fromFormat(a.frontmatter.horaInicio, 'yyyy-MM-dd EEEE HH:mm', { locale: 'es' }).ts;
            let fechaB = DateTime.fromFormat(b.frontmatter.horaInicio, 'yyyy-MM-dd EEEE HH:mm', { locale: 'es' }).ts;
            return fechaA - fechaB;
        });
        const titulo = this.contentEl.createEl('h2', { text: `Registros de tiempo del ${fechaHoy.toFormat('EEEE, DD')}.`});
        titulo.style.textAlign = 'center';
        
        // Creación de elementos HTML directamente
        const table = this.contentEl.createEl('table', { cls: 'table-resumenSemanal' });
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        ['Registro', 'Descripción', 'Periodo', 'Tiempo', 'Estado', 'Id', 'Acción'].forEach(header => {
            headerRow.createEl('th', { text: header });
        });

        const tbody = table.createEl('tbody');
        registrosHoy.forEach(registro => {
            const row = tbody.createEl('tr');
            // Aquí rellenas las celdas de la fila
            this.fillRowWithData(row, registro);
        });

        this.contentEl.appendChild(table);
    }

    fillRowWithData(row, registro) {
        const tdArchivo = row.createEl('td');
        const linkEl = document.createElement('a');
        linkEl.textContent = registro.frontmatter.aliases[0];  // Usa el alias como texto del enlace
        linkEl.href = '#';
        linkEl.addEventListener('click', async (ev) => {
            ev.preventDefault(); // Evita la navegación predeterminada del enlace
            const file = this.app.vault.getAbstractFileByPath(registro.path);
            if (file instanceof TFile) {
                // Abre el archivo en una nueva hoja de espacio de trabajo
                await this.app.workspace.getLeaf(true).openFile(file, { focus: true });
            }
        });
        tdArchivo.appendChild(linkEl);
        
        row.createEl('td', { text: registro.frontmatter.descripcion });
        row.createEl('td', { text: `${DateTime.fromFormat(registro.frontmatter.horaInicio, 'yyyy-MM-dd EEEE HH:mm', { locale: 'es' }).toFormat('h:mm a')} / ${DateTime.fromFormat(registro.frontmatter.horaFinal, 'yyyy-MM-dd EEEE HH:mm', { locale: 'es' }).toFormat('h:mm a')}`});
        
        // Calcula y muestra el tiempo en formato de días, horas y minutos
        const tdPeriodo = row.createEl('td');
        if (registro.frontmatter.estado === "🟢") {
            // Calcula el tiempo desde ahora hasta la hora de inicio
            let ahora = DateTime.local();
            let inicio = DateTime.fromFormat(registro.frontmatter.horaInicio, 'yyyy-MM-dd EEEE HH:mm', { locale: 'es' });
            let duracion = ahora.diff(inicio, ['days', 'hours', 'minutes']);
            tdPeriodo.textContent = this.formatDuration(duracion);
        } else {
            // Muestra el tiempo trabajado en milisegundos convertido a formato legible
            let tiempoTrabajado = this.formatDuration(registro.frontmatter.tiempoTrabajado);
            tdPeriodo.textContent = tiempoTrabajado;
        }
        
        row.createEl('td', { text: registro.frontmatter.estado });
        row.createEl('td', { text: registro.frontmatter.id });

        const actionCell = row.createEl('td');
        if (registro.frontmatter.estado === "🟢") {
            actionCell.appendChild(this.createButtonTable('Cerrar', async () => {
                await this.registroTiempoAPI.cerrarRegistro(registro.frontmatter.id);
            }));
        } else {
            actionCell.appendChild(this.createButtonTable('Retomar', () => {
                this.retomarTarea(registro.frontmatter.id);
            }));
        }
    }

    // Función auxiliar para formatear la duración de Luxon a un formato legible
    formatDuration(ms) {
            if (ms === null || ms === undefined || isNaN(ms)) {
                return "No definido";
            } else {
                // Convertir milisegundos a minutos, horas y días
                let minutos = Math.floor(ms / (1000 * 60));
                let horas = Math.floor(minutos / 60);
                minutos = minutos % 60; // Resto de la división para obtener los minutos sobrantes
                let dias = Math.floor(horas / 24);
                horas = horas % 24; // Resto de la división para obtener las horas sobrantes
        
                // Formatear el string de salida
                if (dias > 0) {
                    return `${dias} d ${horas} h ${minutos} min`;
                } else if (horas > 0) {
                    return `${horas} h ${minutos} min`;
                } else {
                    return `${minutos} min`;
                }
            }
    }

    createButtonTable(buttonText, onClickCallback) {
        const button = document.createElement('button');
        button.textContent = buttonText;
        button.type = 'button';
        button.classList.add('your-button-class');

        button.addEventListener('click', onClickCallback);

        return button;
    }
    
    async retomarTarea(id) { 
        // Asegúrate de reemplazar 'ruta/al/archivo.md' con la ruta exacta del archivo que deseas obtener
        debugger;
        const filePath = `Plantillas/${this.plugin.settings[`folder_RegistroTiempo`]}/Plt - RegistroTiempo.md`;
        const template = app.vault.getAbstractFileByPath(filePath);

        if (template instanceof TFile) {
            // Ahora 'file' es tu archivo deseado, y puedes trabajar con él como necesites
            console.log("Archivo encontrado:", template);
        } else {
            // Si el archivo no se encontró, 'file' será null
            console.log("Archivo no encontrado.");
        }
        const filename = "Retomar " + id;
        const folder = app.vault.getAbstractFileByPath("Inbox");
        const tp = this.getTp();
        let crearNota = tp.file.static_functions.get("create_new")
        await crearNota (template, filename, false, folder).basename;
      }

    getTp(){
        if (!this.plugin || !this.plugin.app.plugins.enabledPlugins.has('templater-obsidian')) {
            console.error('El plugin Templater no está habilitado.');
            return;
        }   
        let tpGen = this.plugin.app.plugins.plugins["templater-obsidian"].templater;
        tpGen = tpGen.functions_generator.internal_functions.modules_array;
        let tp = {}
        // get an instance of modules
        tp.file = tpGen.find(m => m.name == "file");
        tp.system = tpGen.find(m => m.name == "system");

        if (!tp.file) {
        console.error("No se pudo acceder al objeto de funciones actuales de Templater.");
        return;
        }
        console.log('tp con propiedades "file" se ha cargado satisfactoriamente');
        return tp;
    }
    


    // Opcional: Implementa onClose si necesitas limpieza al cerrar la vista.
}