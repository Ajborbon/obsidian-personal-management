import { Modal, App } from 'obsidian';

export class SpinnerModal extends Modal {
    private initialValue: number;
    private currentValue: number;
    private resolver: ((value: number | null) => void) | null = null;
    private numberDisplay: HTMLElement | null = null;

    constructor(app: App, initialValue: number = 1, max: number = 100) {
        super(app);
        const min = 1;
        this.initialValue = Math.max(min, Math.min(max, initialValue));
        this.currentValue = this.initialValue;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('number-selector-modal');

        // Contenedor principal
        const container = contentEl.createDiv({ cls: 'number-selector-container' });

        // Título
        container.createEl('h2', { text: '¿Cuántos Hits representa este entregable?' });

        // Contenedor de controles
        const controlsContainer = container.createDiv({ cls: 'controls-container' });

        // Botón de decremento
        const decrementBtn = controlsContainer.createEl('button', { 
            text: '▲', 
            cls: 'increment-btn' 
        });
        decrementBtn.addEventListener('click', () => this.changeValue(1));

        // Display de número
        this.numberDisplay = controlsContainer.createEl('div', { 
            text: this.currentValue.toString(), 
            cls: 'number-display' 
        });

        // Botón de incremento
        const incrementBtn = controlsContainer.createEl('button', { 
            text: '▼', 
            cls: 'decrement-btn' 
        });
        incrementBtn.addEventListener('click', () => this.changeValue(-1));

        // Botón de confirmación
        const confirmBtn = container.createEl('button', { 
            text: 'Confirmar', 
            cls: 'confirm-btn' 
        });
        confirmBtn.addEventListener('click', () => this.confirm());

        // Botón de cancelar
        const cancelBtn = container.createEl('button', { 
            text: 'Cancelar', 
            cls: 'cancel-btn' 
        });
        cancelBtn.addEventListener('click', () => this.cancel());

        // Añadir estilos CSS
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
            .number-selector-modal {
                text-align: center;
                padding: 20px;
            }
            .number-selector-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }
            .controls-container {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .number-display {
                font-size: 24px;
                font-weight: bold;
                width: 50px;
                text-align: center;
            }
            .increment-btn, .decrement-btn {
                background: none;
                border: 1px solid #ccc;
                padding: 5px 10px;
                cursor: pointer;
            }
            .confirm-btn, .cancel-btn {
                margin: 0 10px;
                padding: 10px 15px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(styleEl);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        if (this.resolver && this.currentValue === null) {
            this.resolver(null);
        }
    }

    private changeValue(direction: number) {
        if (!this.numberDisplay) return;
        
        this.currentValue += direction;
        this.numberDisplay.textContent = this.currentValue.toString();
    }

    private confirm() {
        if (this.resolver) {
            this.resolver(this.currentValue);
        }
        this.close();
    }

    private cancel() {
        if (this.resolver) {
            this.resolver(null);
        }
        this.close();
    }

    openAndAwaitSelection(): Promise<number | null> {
        return new Promise((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }
}