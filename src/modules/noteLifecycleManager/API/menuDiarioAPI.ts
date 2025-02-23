/*
 * Filename: /src/modules/noteLifecycleManager/API/menuDiarioAPI.ts
 * Path: /src/modules/noteLifecycleManager/API
 * Created Date: 2024-03-07 16:09:16
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:48:50
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


import {Notice, TFile} from 'obsidian'
import {DateTime, Duration} from 'luxon'
import { starterAPI } from './starterAPI';
import { utilsAPI } from '../../moduloRegistroTiempo/API/utilsAPI';
import { registroTiempoAPI } from '../../moduloRegistroTiempo/API/registroTiempoAPI';

export class menuHoyAPI {
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.app = plugin.app;  // Guarda una referencia a la aplicación Obsidian para acceder a sus métodos y propiedades
        this.registroTiempoAPI = new registroTiempoAPI(this.plugin);
    }

    // Función para crear y mostrar el botón inicial "Menú hoy"
    async mostrarMenu(dv) {
        dv.container.innerHTML = ''; // Limpiar el contenedor

        const botonMenuHoy = document.createElement('button');
        botonMenuHoy.textContent = 'Menú hoy';
        dv.container.appendChild(botonMenuHoy);

        botonMenuHoy.onclick = async () => {
            await this.mostrarBotones(dv); // Mostrar los botones adicionales al hacer clic
        };
    }

    // Método modificado para adaptarse al contexto del plugin
    async mostrarBotones(dv) {
        dv.container.innerHTML = ''; // Limpiar el contenedor para remover el botón de menú

        const botones = [
            "Hábitos", "Balance", "Registro de Tareas", "Notas día", "Personales"
        ];

        // Crear y mostrar cada botón
        botones.forEach(textoBoton => {
            const boton = document.createElement('button');
            boton.textContent = textoBoton;
            boton.onclick = async () => {
                switch(textoBoton) {
                    case 'Balance':
                        await this.mostrarBotonBalancePersonal(dv);
                        break;
                    case 'Hábitos':
                        await this.mostrarFormularioHabitos(dv);
                        break;
                    case 'Registro de Tareas':
                        await this.mostrarBotonRegistroTareas(dv);
                        break;
                    case 'Notas día':
                        await this.mostrarBotonesNotasDía(dv);
                        break;
                    case 'Personales':
                        await this.mostrarBotonesNotasPersonales(dv);
                        break;
                    default:
                        console.log(`${textoBoton} presionado.`);
                        break;
                }
            };
            dv.container.appendChild(boton);
        });

        const botonSalir = this.agregarBotonSalir(dv);
        dv.container.appendChild(botonSalir);
    }

    // Método para agregar el botón de recarga y su lógica (Ejemplo adaptado)
    agregarBotonSalir(dv) {
        const botonRecarga = document.createElement('button');
        botonRecarga.textContent = 'Salir';
        botonRecarga.onclick = async () => {
            await this.mostrarMenu(dv); // Restablecer a la vista del botón de menú inicial
        };
        return botonRecarga;
    }

     // Método para actualizar campos YAML
     async updateYAMLFields(filePath, YAMLfield, valor) {
        try {
            // Ruta al archivo que se va a modificar
            const file = app.vault.getAbstractFileByPath(filePath);
            if (file instanceof TFile) {
                // Leer y actualizar el frontmatter usando processFrontMatter
                try{
                  
                await app.fileManager.processFrontMatter(file, frontmatter => {
                    // Actualizar el valor del campo especificado
                    
                    frontmatter[YAMLfield] = valor;
                });
                // Opcional: Notificar al usuario que la actualización fue exitosa
                new Notice('YAML actualizado con éxito.');
            } catch (err) {
                console.error("Error al actualizar el frontmatter", err);
              }
            }
        } catch (err) {
            console.error("Archivo no encontrado", err);
            new Notice('Error al actualizar el YAML.');
        }
    }

    // Método adaptado para mostrarBotonBalancePersonal
    async mostrarBotonBalancePersonal(dv) {
        // Limpiar el contenedor
        dv.container.innerHTML = '';
    
        // Mensaje inicial
        const mensaje = document.createElement('h2');
        mensaje.textContent = 'Evalúa el balance de tu vida hoy';
        dv.container.appendChild(mensaje);
    
        const instrucciones = document.createElement('p');
        instrucciones.textContent = 'Evalúa de 1 a 5 cada área:';
        dv.container.appendChild(instrucciones);
    
        // Áreas a evaluar
        const areas = [
            "Productividad", "Espiritual", "Salud", "Rutinas",
            "Vida Social", "Familiar", "Aprendizajes", "Creatividad"
        ];
    
        // Obtener el archivo actual y su metadata
        const file = app.workspace.getActiveFile();
        let metadata;
        if (file instanceof TFile) {
            metadata = app.metadataCache.getFileCache(file)?.frontmatter;
        }
    
        // Crear input range para cada área
        areas.forEach(area => {
            const safeName = area.toLowerCase().replace(/ /g, '_');
            
            const currentVal = metadata && metadata[safeName] ? metadata[safeName] : 0;
    
            const contenedorArea = document.createElement('div');
            contenedorArea.classList.add('area-evaluacion');
    
            const label = document.createElement('label');
            label.textContent = area + ': ';
            label.htmlFor = safeName;
    
            const input = document.createElement('input');
            input.type = 'range';
            input.id = safeName;
            input.name = safeName;
            input.min = '1';
            input.max = '5';
            input.value = currentVal.toString(); // Usar valor actual o 0
    
            const valorLabel = document.createElement('span');
            valorLabel.textContent = input.value; // Mostrar el valor actual al lado
    
            input.oninput = () => valorLabel.textContent = input.value; // Actualizar el valor mostrado al mover el range
    
            contenedorArea.appendChild(label);
            contenedorArea.appendChild(input);
            contenedorArea.appendChild(valorLabel);
            dv.container.appendChild(contenedorArea);
        });
    
        // Botón para guardar los valores
        const botonGuardar = document.createElement('button');
        botonGuardar.textContent = 'Guardar';
        botonGuardar.onclick = async () => {
            if (file instanceof TFile) {
                for (const area of areas) {
                    const safeName = area.toLowerCase().replace(/ /g, '_');
                    const inputElement = document.getElementById(safeName) as HTMLInputElement;
                    const valor = parseInt(inputElement.value, 10);
                    await this.updateYAMLFields(file.path, safeName, valor);
                }
                new Notice('Balances actualizados con éxito.');
            } else {
                new Notice('No se pudo obtener el archivo actual.');
            }
        };
        dv.container.appendChild(botonGuardar);
    
        // Agregar botón de salir si necesario
        const botonSalir = this.agregarBotonSalir(dv);
        dv.container.appendChild(botonSalir);
    }


    async mostrarFormularioHabitos(dv) {
        // Limpiar el contenedor
        dv.container.innerHTML = '';
        
        const habitos = [
            "Club 5am",
            "Registro Akáshiko",
            "Gimnasio",
            "Comer Saludable",
            "Leer libro",
            "Escribir bitácora el mismo día",
            "Crear plan día siguiente",
            "Me fuí a dormir antes de las 10:30pm"
        ];
    
        // Función para cargar y marcar checkboxes seleccionados previamente
        const cargarCheckboxesSeleccionados = async () => {
            const file = app.workspace.getActiveFile();
            // Leer el archivo para obtener el campo 'habitos' del YAML
            const fileContent = await app.vault.read(file);
            const frontMatter = app.metadataCache.getFileCache(file)?.frontmatter;
            const existingHabits = frontMatter?.habitos || [];
    
            habitos.forEach(habito => {
                const container = document.createElement('div');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = habito;
                checkbox.name = 'habitos';
                checkbox.value = habito;
                checkbox.checked = existingHabits.includes(habito);
    
                const label = document.createElement('label');
                label.htmlFor = habito;
                label.textContent = habito;
    
                container.appendChild(checkbox);
                container.appendChild(label);
    
                dv.container.appendChild(container);
            });
        };
    
        await cargarCheckboxesSeleccionados();
    
        // Crear y configurar el botón de guardar
        const guardarBtn = document.createElement('button');
        guardarBtn.textContent = 'Guardar';
        guardarBtn.onclick = async () => {
            const file = app.workspace.getActiveFile();
            const checkboxes = Array.from(document.querySelectorAll('input[name="habitos"]:checked'));
            const selectedHabits = checkboxes.map(checkbox => checkbox.value);
    
            // Actualizar el campo 'habitos' en el archivo YAML usando el método updateYAMLFields
            await this.updateYAMLFields(file.path, 'habitos', selectedHabits);
        };
    
        // Añadir el botón de guardar al contenedor
        dv.container.appendChild(guardarBtn);

        // Agregar botón de salir si necesario
        const botonSalir = this.agregarBotonSalir(dv);
        dv.container.appendChild(botonSalir);
    }
    
    // Método adaptado para mostrarBotonBalancePersonal
    async mostrarBotonRegistroTareas(dv) {
        
        // Limpiar el contenedor
        dv.container.innerHTML = '';
        let botones;
        const utilsAPInstance = new utilsAPI(this.plugin);
        const activo = await utilsAPInstance.buscarRegistrosActivos(app)
        if (activo instanceof TFile){ // Verifica si hay algun archivo activo 
            botones = ["Cerradas Hoy", "Registros Hoy", "Nuevo Registro Tiempo", "Cerrar Registro Tiempo"];
        }else{
            botones = ["Cerradas Hoy", "Registros Hoy", "Nuevo Registro Tiempo"];
        }

        // Crear y mostrar cada botón
        botones.forEach(textoBoton => {
            const boton = document.createElement('button');
            boton.textContent = textoBoton;
            boton.onclick = async () => {
                switch(textoBoton) {
                    case 'Cerradas Hoy':
                        await this.mostrarCerradasHoy(dv);
                        break;
                    case 'Registros Hoy':
                        await this.mostrarRegistrosHoy(dv);
                        break;
                    case 'Cerrar Registro Tiempo':
                        debugger;
                        await this.registroTiempoAPI.cerrarRegistro(activo);
                        break;
                    case 'Nuevo Registro Tiempo':
                        const starterAPInstance = new starterAPI(this.plugin)
                        await starterAPInstance.createNote("RegistroTiempo");
                        break;
                    default:
                        console.log(`${textoBoton} presionado.`);
                        break;
                }
            };
            dv.container.appendChild(boton);
        });

        const botonSalir = this.agregarBotonSalir(dv);
        dv.container.appendChild(botonSalir);
    }

    async mostrarCerradasHoy(dv) {
        dv.container.innerHTML = '';
    
        const activo = app.workspace.getActiveFile();
        let fechaActivo = activo?.basename.split(" ")[0];
        const hoy = new Date(fechaActivo).setHours(0, 0, 0, 0);
    
        const files = app.vault.getMarkdownFiles();
        
        let tareasPromesas = files.map(async (file) => {
            let contenido = await app.vault.read(file);
            let tareasExtraidas = extraerTareas(contenido);
        
            const frontMatter = app.metadataCache.getFileCache(file)?.frontmatter;
            const alias = frontMatter?.aliases ? frontMatter.aliases[0] : null;
            const filePath = file.path;
        
            return {
                filePath,
                alias,
                tareas: tareasExtraidas.filter(tarea => {
                    let fechaTarea = new Date(tarea.completionDate).setHours(0, 0, 0, 0);
                    return tarea.completed && tarea.completionDate && fechaTarea === hoy;
                })
            };
        });
        
        let resultados = await Promise.all(tareasPromesas);
        let totalTareasCerradas = resultados.reduce((total, { tareas }) => total + tareas.length, 0);

        // Mensaje sobre el estado de las tareas cerradas hoy
        if (totalTareasCerradas > 0) {
            dv.header(3, `Hoy se han cerrado ${totalTareasCerradas} tareas.`);
            
             // Crear la tabla HTML
        const table = document.createElement('table');
        table.classList.add('table'); // Agregar una clase para la tabla para el estilo
        table.style.width = '100%';
    
        // Añadir encabezados de tabla
        const headerRow = document.createElement('tr');
        let headers = ["Nota", "Tareas Cerradas"];
        headers.forEach(headerText => {
            let header = document.createElement('th');
            header.textContent = headerText;
            header.style.textAlign = 'center';
            headerRow.appendChild(header);
        });
        table.appendChild(headerRow);
    
        // Añadir filas de datos a la tabla
        resultados.forEach(({filePath, alias, tareas}) => {
            if (tareas.length > 0) {
                let row = document.createElement('tr');
    
                // Columna de enlace centrado verticalmente
                let linkCell = document.createElement('td');
                linkCell.style.verticalAlign = 'middle';
                let a = document.createElement('a');
                a.setAttribute('href', `obsidian://open?vault=${app.vault.getName()}&file=${encodeURIComponent(filePath)}`);
                a.textContent = alias || filePath;
                linkCell.appendChild(a);
                row.appendChild(linkCell);
    
                // Columna de tareas cerradas
                let tasksCell = document.createElement('td');
                let tasksList = document.createElement('ul');
                tareas.forEach(tarea => {
                    let li = document.createElement('li');
                    li.textContent = tarea.text;
                    tasksList.appendChild(li);
                });
                tasksCell.appendChild(tasksList);
                row.appendChild(tasksCell);
    
                table.appendChild(row);
            }
        });
    
        // Añadir la tabla al contenedor de Dataview
        dv.container.appendChild(table);
        
        } else {
            dv.paragraph("No hay tareas cerradas hoy.");
        }
            
        const botonSalir = this.agregarBotonSalir(dv);
        dv.container.appendChild(botonSalir);
    
    function extraerTareas(contenido) {
        const tareas = [];
        const lineas = contenido.split("\n");
    
        for (const linea of lineas) {
            const tareaRegex = /^\s*-\s*\[(x|X| )\]\s*(.+)$/;
            const match = tareaRegex.exec(linea);
    
            if (match) {
                const completada = match[1].toLowerCase() === 'x';
                let textoTarea = match[2];
                let fechaCompletitud = null;
    
                const fechaRegex = /\[completion:: (\d{4}-\d{2}-\d{2})\]/;
                const fechaMatch = fechaRegex.exec(textoTarea);
                if (fechaMatch) {
                    fechaCompletitud = fechaMatch[1];
                    textoTarea = textoTarea.replace(fechaRegex, '').trim();
                }
    
                tareas.push({
                    text: textoTarea,
                    completed: completada,
                    completionDate: fechaCompletitud,
                });
            }
        }
    
        return tareas;
    }
    
    
}


    async mostrarRegistrosHoy(dv) {
           // Obtener el leaf activo actual
           const activeLeaf = app.workspace.activeLeaf;

           // Obtener el path del TFile asociado con el leaf activo, si existe
           const currentFilePath = activeLeaf.view?.file?.path;
   
           // Crear una nueva división a la derecha del leaf activo
           const newLeaf = await app.workspace.splitActiveLeaf('vertical');
   
           // Configurar el nuevo leaf para mostrar tu vista personalizada
           // y pasar el path del TFile como parte del estado
    
           await newLeaf.setViewState({
               type: "vista-registro-diario",
           });
    
           app.workspace.revealLeaf(newLeaf);    
}

    createButtonTable(buttonText, onClickCallback) {
        const button = document.createElement('button');
        button.textContent = buttonText;
        button.type = 'button'; // Asegúrate de que no se enviará un formulario al hacer clic en él
        button.classList.add('your-button-class'); // Agrega una clase para el estilo del botón si es necesario

        // Añade el evento de clic al botón
        button.addEventListener('click', onClickCallback);

        return button;
    }
    // Crea la nota desde el templater de RegistroTiempo
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

}
    
