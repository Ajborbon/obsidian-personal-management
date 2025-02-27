import { App, Modal } from 'obsidian';

export class PedidosClienteModal extends Modal {
    private resolver: (value: { pedidos: string, pendientes: boolean } | null) => void;
    private textarea: HTMLTextAreaElement;
    private checkbox: HTMLInputElement;
    
    constructor(app: App) {
        super(app);
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('pedidos-cliente-modal');
        
        // Título
        this.titleEl.setText("Pedidos al cliente");
        
        // Contenedor principal
        const container = contentEl.createDiv({ cls: 'pedidos-cliente-container' });
        
        // Título descriptivo
        container.createEl('h3', { text: '¿Hay algo que se deba pedir al cliente?' });
        
        // Área de texto para los pedidos
        this.textarea = container.createEl('textarea', {
            attr: {
                rows: '6',
                placeholder: 'Escribe aquí tus pedidos al cliente...'
            }
        });
        
        // Contenedor del checkbox personalizado
        const checkboxContainer = container.createEl('div', { cls: 'custom-checkbox-container' });
        
        // Checkbox oculto (para funcionalidad)
        this.checkbox = checkboxContainer.createEl('input', {
            attr: {
                type: 'checkbox',
                id: 'pendientes-checkbox',
                class: 'hidden-checkbox'
            }
        });
        
        // Checkbox visual personalizado
        const customCheckbox = checkboxContainer.createEl('div', { 
            cls: 'custom-checkbox'
        });
        
        // Label para el checkbox
        const checkboxLabel = checkboxContainer.createEl('label', {
            text: 'Marcar como pendiente del cliente',
            attr: {
                for: 'pendientes-checkbox',
                class: 'checkbox-label'
            }
        });
        
        // Auto-activar el checkbox cuando se escribe en el textarea
        this.textarea.addEventListener('input', () => {
            if (this.textarea.value.trim() !== '') {
                this.checkbox.checked = true;
                customCheckbox.classList.add('checked');
            } else {
                this.checkbox.checked = false;
                customCheckbox.classList.remove('checked');
            }
        });
        
        // Hacer que el checkbox personalizado responda a los clics
        customCheckbox.addEventListener('click', () => {
            this.checkbox.checked = !this.checkbox.checked;
            if (this.checkbox.checked) {
                customCheckbox.classList.add('checked');
            } else {
                customCheckbox.classList.remove('checked');
            }
        });
        
        // También hacer que el label active/desactive el checkbox
        checkboxLabel.addEventListener('click', () => {
            this.checkbox.checked = !this.checkbox.checked;
            if (this.checkbox.checked) {
                customCheckbox.classList.add('checked');
            } else {
                customCheckbox.classList.remove('checked');
            }
        });
        
        // Contenedor de botones
        const buttonContainer = container.createEl('div', { cls: 'button-container' });
        
        // Botón de cancelar
        const cancelarBtn = buttonContainer.createEl('button', {
            text: 'Cancelar',
            cls: 'mod-secondary'
        });
        cancelarBtn.addEventListener('click', () => this.cancel());
        
        // Botón de confirmación
        const confirmarBtn = buttonContainer.createEl('button', {
            text: 'Confirmar',
            cls: 'mod-cta'
        });
        confirmarBtn.addEventListener('click', () => this.confirm());
        
        // Aplicamos estilos en línea para garantizar que funcionen
        contentEl.createEl('style', {
            text: `
                .pedidos-cliente-modal .pedidos-cliente-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding: 16px;
                    width: 100%;
                    box-sizing: border-box;
                }
                
                .pedidos-cliente-modal h3 {
                    font-size: 16px;
                    margin: 0 0 8px 0;
                    font-weight: 500;
                }
                
                .pedidos-cliente-modal textarea {
                    width: 100%;
                    min-height: 120px;
                    resize: vertical;
                    padding: 8px;
                    font-size: 14px;
                    line-height: 1.4;
                    border-radius: 4px;
                    margin-bottom: 8px;
                }
                
                /* Estilo para el contenedor del checkbox personalizado */
                .pedidos-cliente-modal .custom-checkbox-container {
                    display: flex;
                    align-items: center;
                    padding: 4px 0;
                    margin-bottom: 8px;
                    cursor: pointer;
                }
                
                /* Ocultar el checkbox real */
                .pedidos-cliente-modal .hidden-checkbox {
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                    height: 0;
                    width: 0;
                }
                
                /* Crear un checkbox personalizado */
                .pedidos-cliente-modal .custom-checkbox {
                    width: 18px;
                    height: 18px;
                    border: 1px solid #888;
                    border-radius: 3px;
                    margin-right: 10px;
                    position: relative;
                    flex-shrink: 0;
                    background-color: var(--background-primary, #fff);
                }
                
                /* Estilo para cuando está marcado - crear una X */
                .pedidos-cliente-modal .custom-checkbox.checked::before,
                .pedidos-cliente-modal .custom-checkbox.checked::after {
                    content: '';
                    position: absolute;
                    width: 3px;
                    height: 12px;
                    background-color: var(--text-normal, #333);
                    top: 2px;
                }
                
                .pedidos-cliente-modal .custom-checkbox.checked::before {
                    left: 9px;
                    transform: rotate(45deg);
                }
                
                .pedidos-cliente-modal .custom-checkbox.checked::after {
                    left: 9px;
                    transform: rotate(-45deg);
                }
                
                /* Estilo para la etiqueta del checkbox */
                .pedidos-cliente-modal .checkbox-label {
                    font-size: 14px;
                    cursor: pointer;
                    user-select: none;
                    white-space: nowrap;
                }
                
                .pedidos-cliente-modal .button-container {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 8px;
                }
                
                .pedidos-cliente-modal .button-container button {
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                }
            `
        });
    }
    
    private confirm() {
        // Obtenemos los valores actuales
        const pedidos = this.textarea.value.trim();
        const pendientes = this.checkbox.checked;
        
        // Guardamos y "limpiamos" el resolver para que onClose no lo invoque
        const resolver = this.resolver;
        this.resolver = null;
        
        // Cerramos el modal y resolvemos la promesa con los datos
        this.close();
        resolver({
            pedidos: pedidos,
            pendientes: pendientes
        });
    }
    
    private cancel() {
        const resolver = this.resolver;
        this.resolver = null;
        this.close();
        resolver(null);
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Si el resolver sigue activo (por ejemplo, si se cierra el modal de forma inesperada), lo resolvemos con null
        if (this.resolver) {
            this.resolver(null);
            this.resolver = null;
        }
    }
    
    openAndAwaitSelection(): Promise<{ pedidos: string, pendientes: boolean } | null> {
        return new Promise((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }
}