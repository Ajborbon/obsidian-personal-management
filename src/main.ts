  import { Plugin } from 'obsidian';
  import { activateModuloBase } from "./modules/moduloBase/index";
  import { activateModuloRegistroTiempo } from "./modules/moduloRegistroTiempo/index";
  import {activateModuloBusquedaAvanzada} from "./modules/M_busquedaAvanzada/activadores"
  export default class ManagementPlugin extends Plugin {
      async onload() {
        console.log('Iniciando carga de plugin de Gestión Personal');
        //activateModuloBase(this); 
        activateModuloRegistroTiempo(this); 
        activateModuloBusquedaAvanzada(this);
      }

      async onunload() {
          // Código de limpieza aquí
          console.log('Descargando plugin Gestión Personal');
          return Promise.resolve();
      }
  }
