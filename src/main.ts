  import { Plugin } from 'obsidian';
  import { activateModuloBase } from "./modules/moduloBase/index";
  import { activateModuloRegistroTiempo } from "./modules/moduloRegistroTiempo/index";

  export default class ManagementPlugin extends Plugin {
      async onload() {
        console.log('Iniciando carga de plugin de gestión personal AJB');
        //activateModuloBase(this); 
        activateModuloRegistroTiempo(this); 
        
      }

      async onunload() {
          // Código de limpieza aquí
          console.log('Descargando mi plugin de ejemplo.');
          return Promise.resolve();
      }
  }
