// src/modules/modales/datePickerModal.ts
import { Modal, App } from 'obsidian';
import { DateTime } from 'luxon';

export class DatePickerModal extends Modal {
    private resolver: (value: string | null) => void;
    private dateInput: HTMLInputElement;
    private format: string;

    constructor(app: App, initialDate?: string, format: string = 'yyyy-MM-dd') {
        super(app);
        this.format = format;
    }

    onOpen() {
        const { contentEl } = this;
        
        contentEl.createEl('h2', { text: 'Que día se va a publicar la pieza?' });
        
        this.dateInput = contentEl.createEl('input', { type: 'date' });
        
        // Si hay una fecha inicial, establecerla
        if (this.initialDate) {
            // Convertir desde el formato especificado a formato ISO para input date
            const date = DateTime.fromFormat(this.initialDate, this.format);
            this.dateInput.value = date.toISODate();
        } else {
            // Usar la fecha actual
            this.dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        const buttonContainer = contentEl.createEl('div', { cls: 'button-container' });
        
        const cancelButton = buttonContainer.createEl('button', { text: 'Cancelar' });
        cancelButton.addEventListener('click', () => {
            this.close();
            this.resolver(null);
        });
        
        const confirmButton = buttonContainer.createEl('button', { text: 'Confirmar' });
        confirmButton.addEventListener('click', () => {
            const selectedDate = this.dateInput.value;
            // Convertir de formato ISO a formato preferido
            const formattedDate = DateTime.fromISO(selectedDate).toFormat(this.format);
            this.close();
            this.resolver(formattedDate);
        });
        
        // Estilos básicos
        buttonContainer.style.marginTop = '20px';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '10px';
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    waitForInput(): Promise<string | null> {
        return new Promise((resolve) => {
            this.resolver = resolve;
        });
    }
}