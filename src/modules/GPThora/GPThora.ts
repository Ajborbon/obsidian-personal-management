import { App, Modal, Plugin } from 'obsidian';

export default class GPThoraPlugin extends Plugin {
    constructor(app: App) {
        super(app);
    }

    async onload() {
        this.addCommand({
            id: 'show-local-time',
            name: 'Hora Local',
            callback: () => this.showLocalTimeModal()
          });
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
        const { contentEl } = this ;
        contentEl.empty();

        const now = new Date();
        const hours = now.getHours() % 12 || 12;
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
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
        const { contentEl } = this ;
        contentEl.empty();
    }
}
