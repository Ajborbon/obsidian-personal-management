// src/modules/dataviewQueries/QueryRenderer.ts
import { ButtonStyle } from './interfaces/ButtonStyle';

export class QueryRenderer {
    private createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .custom-query-container {
                background-color: var(--background-secondary);
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 16px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .custom-query-title {
                font-size: 1.1em;
                font-weight: bold;
                margin-bottom: 12px;
                color: var(--text-normal);
            }
            
            .custom-button-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 8px;
            }
            
            .custom-button {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.95em;
                font-weight: 500;
                transition: all 0.2s ease;
                color: white;
                gap: 8px;
            }
            
            .custom-button:hover {
                transform: translateY(-1px);
                filter: brightness(1.1);
            }
            
            .custom-button:active {
                transform: translateY(0px);
            }
            
            .button-today { background-color: #4CAF50; }
            .button-overdue { background-color: #f44336; }
            .button-upcoming { background-color: #2196F3; }
            .button-start { background-color: #FF9800; }
        `;
        return style;
    }

    renderTaskButtons(dv: any, container: HTMLElement) {
        const gp = dv.app.plugins.plugins['obsidian-personal-management'];
        if (!gp) {
            dv.paragraph("⚠️ Plugin de Gestión Personal no encontrado");
            return;
        }

        container.appendChild(this.createStyles());

        const mainContainer = container.createEl('div', {
            cls: 'custom-query-container'
        });

        mainContainer.createEl('div', {
            text: '📋 Gestión de Tareas',
            cls: 'custom-query-title'
        });

        const buttonGrid = mainContainer.createEl('div', {
            cls: 'custom-button-grid'
        });

        const buttons = [
            {
                text: 'Tareas de Hoy',
                icon: '📅',
                class: 'button-today',
                action: () => gp.tareasAPI.mostrarTareasHoy()
            },
            {
                text: 'Tareas Vencidas',
                icon: '⚠️',
                class: 'button-overdue',
                action: () => gp.tareasAPI.mostrarTareasVencidas()
            },
            {
                text: 'Tareas Próximas',
                icon: '🎯',
                class: 'button-upcoming',
                action: () => gp.tareasAPI.mostrarTareasProximas()
            },
            {
                text: 'Por Iniciar',
                icon: '🚀',
                class: 'button-start',
                action: () => gp.tareasAPI.mostrarTareasStartVencidas()
            }
        ];

        buttons.forEach(btn => this.createButton(buttonGrid, btn));
    }

    private createButton(container: HTMLElement, config: ButtonStyle) {
        const button = container.createEl('button', {
            cls: `custom-button ${config.class}`
        });

        button.createEl('span', {
            text: config.icon
        });

        button.createEl('span', {
            text: config.text
        });

        button.addEventListener('click', async () => {
            try {
                button.style.opacity = '0.7';
                new Notice('Actualizando vista...');
                await config.action();
            } catch (error) {
                console.error('Error:', error);
                new Notice('Error al actualizar tareas');
            } finally {
                button.style.opacity = '1';
            }
        });
    }
}