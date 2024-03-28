import { Modal, App, TFile, Notice } from 'obsidian';
import { YAMLUpdaterAPI } from '../../noteLifecycleManager/API/YAMLUpdaterAPI';

export class modal_cambioHF extends Modal {
    file: TFile;
    app: App;
    horaFinalInput: HTMLInputElement;

    constructor(plugin: Plugin, file: TFile) {
        super(plugin.app);
        this.plugin = plugin;
        this.file = file;
    }

    async onOpen() {
        debugger;
        this.containerEl.classList.add("modalInbox");
        const { contentEl } = this;
        debugger;
        const metadata = this.plugin.app.metadataCache.getFileCache(this.file.file);
        const aliases = metadata?.frontmatter?.aliases || "Actividad sin alias";
        // Convertir horaInicioStr a formato "YYYY-MM-DDTHH:MM" para datetime-local
        const horaFinStr = metadata?.frontmatter?.horaFinal ? window.moment(metadata.frontmatter.horaFinal, "YYYY-MM-DD dddd HH:mm").format("YYYY-MM-DDTHH:mm") : '';

        // Configura el título del modal y muestra el alias de la tarea
        contentEl.createEl('h2', { text: `Cambio hora cierre de registro.` });
        contentEl.createEl('p', { text: `Tarea: "${aliases[0]}"` });
        
        // Input para la hora de inicio con tipo datetime-local
        contentEl.createEl('p', { text: 'Hora de cierre registro:' });
        this.horaFinalInput = contentEl.createEl('input', {
            type: 'datetime-local',
            value: horaFinStr
        });

        // Botón para guardar cambios
        const saveButton = contentEl.createEl('button', { text: 'Guardar cambios' });
        saveButton.onclick = () => this.guardarCambios();
    }

    async guardarCambios() {
        const nuevaHoraFinalLocal = this.horaFinalInput.value;
        // Asegurar que la nueva hora tiene valor antes de intentar formatear
        if (!nuevaHoraFinalLocal) {
            new Notice("Por favor, seleccione una hora de cierre.");
            return;
        }

        // Convertir de "YYYY-MM-DDTHH:MM" a "YYYY-MM-DD dddd HH:mm"
        const nuevaHoraFinal = window.moment(nuevaHoraFinalLocal).format("YYYY-MM-DD dddd HH:mm");

        try {
            debugger;
            // Ejecutar YAML Update
            let campos = ["fecha",`horaFinal_${nuevaHoraFinal}`,`tiempoTrabajado_${nuevaHoraFinal}`, "estado_🔵"];
            let resultado = await this.plugin.YAMLUpdaterAPI.actualizarNota(this.file, campos);




            // Cerrar el modal después de guardar los cambios
            this.close();
            new Notice("Hora de Finalización actualizada correctamente.");
        } catch (error) {
            console.error("Error al guardar cambios en la nota:", error);
            new Notice("Error al guardar los cambios en la nota.");
        }
    }
}
