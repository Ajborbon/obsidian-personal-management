  import { Plugin } from 'obsidian';

  export default class SamplePlugin extends Plugin {
      async onload() {
        // Código de inicialización aquí
	    console.log('Cargando mi plugin de ejemplo.');
	    return Promise.resolve();
      }

      async onunload() {
          // Código de limpieza aquí
          console.log('Descargando mi plugin de ejemplo.');
          return Promise.resolve();
      }
  }
