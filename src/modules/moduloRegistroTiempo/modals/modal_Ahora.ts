import { Modal, App, TFile, Notice } from 'obsidian';

export class modal_Ahora extends Modal {
    file: TFile;
    app: App;
    horaInicioInput: HTMLInputElement;

    constructor(app: App, file: TFile) {
        super(app);
        this.app = app;
        this.file = file;
    }

    async onOpen() {
        const { contentEl } = this;
        const metadata = this.app.metadataCache.getFileCache(this.file);
        const aliases = metadata?.frontmatter?.aliases || "Actividad sin alias";
        // Convertir horaInicioStr a formato "YYYY-MM-DDTHH:MM" para datetime-local
        const horaInicioStr = metadata?.frontmatter?.horaInicio ? window.moment(metadata.frontmatter.horaInicio, "YYYY-MM-DD dddd HH:mm").format("YYYY-MM-DDTHH:mm") : '';

        // Configura el título del modal y muestra el alias de la tarea
        contentEl.createEl('h2', { text: `Registro de actividad.` });
        contentEl.createEl('p', { text: `Tarea: "${aliases}"` });
        if (horaInicioStr) {
            // Usar moment para parsear la fecha de inicio y calcular la diferencia
            const horaInicio = window.moment(horaInicioStr, "YYYY-MM-DD dddd HH:mm");
            const ahora = window.moment();
            const diff = ahora.diff(horaInicio);
            const duracion = window.moment.duration(diff);
            const diffFormatted = `${duracion.hours()}h ${duracion.minutes()}m`;

            contentEl.createEl('p', { text: `Esta actividad lleva ${diffFormatted} en ejecución.` });
        } else {
            contentEl.createEl('p', { text: "No se pudo determinar el tiempo de inicio de la actividad." });
        }
        // Input para la hora de inicio con tipo datetime-local
        contentEl.createEl('p', { text: 'Hora de inicio:' });
        this.horaInicioInput = contentEl.createEl('input', {
            type: 'datetime-local',
            value: horaInicioStr
        });

        // Botón para guardar cambios
        const saveButton = contentEl.createEl('button', { text: 'Guardar cambios' });
        saveButton.onclick = () => this.guardarCambios();
    }

    async guardarCambios() {
        const nuevaHoraInicioLocal = this.horaInicioInput.value;
        // Asegurar que la nueva hora tiene valor antes de intentar formatear
        if (!nuevaHoraInicioLocal) {
            new Notice("Por favor, seleccione una hora de inicio.");
            return;
        }

        // Convertir de "YYYY-MM-DDTHH:MM" a "YYYY-MM-DD dddd HH:mm"
        const nuevaHoraInicio = window.moment(nuevaHoraInicioLocal).format("YYYY-MM-DD dddd HH:mm");

        try {
            // Leer el contenido actual del archivo
            const contenidoOriginal = await this.app.vault.read(this.file);
            // Reemplazar la línea de horaInicio con el nuevo valor formateado
            const contenidoActualizado = contenidoOriginal.replace(/(horaInicio: ).*/, `$1${nuevaHoraInicio}`);
            
            // Guardar los cambios en el archivo
            await this.app.vault.modify(this.file, contenidoActualizado);

            // Cerrar el modal después de guardar los cambios
            this.close();
            new Notice("Hora de inicio actualizada correctamente.");
        } catch (error) {
            console.error("Error al guardar cambios en la nota:", error);
            new Notice("Error al guardar los cambios en la nota.");
        }
    }
}
