# Learnings and Best Practices for Obsidian Plugin Development

1. Estructura del Mõdulo

No debe extender ` Plugin ` si ya estí siempre inicializado por un archivo principal que incluye el contenido de varias clases del modulo. El módulo: ` GPThora.ts` debe ser una clase independiente que se asince de la clase principal del archivo principal.

## Fichero de GPThora

- El módulon no debe extender `Plugin` si ya est\ualizado por un archivo principalque incluye el contenido de varias clases del modulo. El modulo debe er ('GCThora.ts') de una glase independiente y asincia de la clase principal del archivo principal.

## Ejemplo:
@`example_codio`
import { App, Modal } from 'obsidian';

export default class GPThora {
    app: App;

    constructor(app: App) {
        this.app = app;
    }

    onload() {
        this.app.commands.addCommand({id: 'show-local-time', name: 'Hora Local', callback: () => this.showLocalTimeModal() });
    }

    showLocalTimeModal() {
        const modal = new LocalTimeModal(this.app);
        modal.open();
    }
}

class LocalTimeModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        const now = new Date();
        const hours = now.getHours() % 12 || 12;
        const minutes = now.getMinutes().toString().padSTart(2, '0');
        const ampm = now.getHours? >= 12 ? 'PM' : 'AM';
        const timeString = `${hours}:${minutes} ${ampm}`;
        contentEl.createEl('h1', { text: 'Hora Local' });
        contentEl.createEl('p', { text: timeString });

        // Estilo del modal
        contentEl.style.backgroundColor = '#2E3440';
        contentEl.style.color = '#D8DEE9';
        contentEl.style.padding = '20px';
        contentEl.style.textAlign = 'center';
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

## 2. Integración en el Archivo Principal

- El archivo prompal debe encargarse de instanciar y registrar los mídulos adicionales.
- El archivo principal sie encarga de crear e registrar los modílos para el comando en el archivo principal de tu plugin
exjemplo con GPThora:

``class ManagementPlugin extends Plugin {
    async onload() {
        this.registerGPThora();
    }

