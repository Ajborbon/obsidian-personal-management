// src/modules/noteLifecycleManager/API/utils/NavigationUtils.ts

/**
 * Utilidades para navegación en Obsidian
 */
export class NavigationUtils {
    /**
     * Navega a una tarea específica en una nota con resaltado de línea
     */
    static navegarATareaConResaltado(
      path: string,
      lineNumber: number,
      textoTarea?: string,
      nuevaPestaña: boolean = true
    ): void {
      try {
        // Verificar que la ruta es válida
        const file = app.vault.getAbstractFileByPath(path);
        if (!file) {
          new app.Notice(`Archivo no encontrado: ${path}`);
          return;
        }
        
        // Intentar abrir el archivo, opcionalmente en una nueva pestaña
        const leaf = app.workspace.getLeaf(nuevaPestaña);
        leaf.openFile(file).then(() => {
          // Aplicar resaltado después de que el archivo se haya abierto completamente
          setTimeout(() => {
            const editor = leaf.view.editor;
            if (!editor) return;
            
            if (lineNumber > 0) {
              // Mover cursor y pantalla a la línea
              editor.setCursor({ line: lineNumber - 1, ch: 0 });
              editor.scrollIntoView(
                { from: { line: lineNumber - 1, ch: 0 }, to: { line: lineNumber - 1, ch: 0 } },
                true
              );
              
              // Aplicar resaltado visual 
              this.resaltarLineaTemporalmente(editor, lineNumber - 1);
            } 
            // Si no tenemos número de línea pero tenemos texto, buscamos el texto
            else if (textoTarea) {
              const contenido = editor.getValue();
              const lineas = contenido.split('\n');
              
              for (let i = 0; i < lineas.length; i++) {
                // Buscar texto limpio o con marcadores de tarea
                const textoLimpio = textoTarea.replace(/^-\s*\[[^\]]+\]\s*/, '').trim();
                const lineaLimpia = lineas[i].replace(/^-\s*\[[^\]]+\]\s*/, '').trim();
                
                if (lineas[i].includes(textoTarea) || lineaLimpia.includes(textoLimpio)) {
                  // Mover cursor y pantalla a la línea encontrada
                  editor.setCursor({ line: i, ch: 0 });
                  editor.scrollIntoView(
                    { from: { line: i, ch: 0 }, to: { line: i, ch: lineas[i].length } },
                    true
                  );
                  
                  // Aplicar resaltado visual
                  this.resaltarLineaTemporalmente(editor, i);
                  break;
                }
              }
            }
          }, 300);
        });
      } catch (error) {
        console.error('Error en navegarATareaConResaltado:', error);
        new app.Notice(`Error al navegar: ${error.message}`);
      }
    }
    
    /**
     * Resalta temporalmente una línea en el editor
     */
    private static resaltarLineaTemporalmente(editor: any, lineIndex: number): void {
      try {
        // Usar CM6 o CM5 dependiendo del editor
        if (editor.cm && editor.cm.state) {
          // Editor moderno (CM6)
          const lineDiv = editor.cm.dom.querySelector('.cm-content');
          if (lineDiv) {
            const lineElements = lineDiv.querySelectorAll('.cm-line');
            if (lineElements && lineElements.length > lineIndex) {
              lineElements[lineIndex].classList.add('highlighted-line');
              
              setTimeout(() => {
                lineElements[lineIndex].classList.remove('highlighted-line');
              }, 2000);
            }
          }
        } else {
          // Editor clásico (CM5)
          const lineDiv = editor.lineDiv || editor.getScrollerElement();
          if (lineDiv) {
            const lineElements = lineDiv.querySelectorAll('.CodeMirror-line');
            if (lineElements && lineElements.length > lineIndex) {
              lineElements[lineIndex].classList.add('highlighted-line');
              
              setTimeout(() => {
                lineElements[lineIndex].classList.remove('highlighted-line');
              }, 2000);
            }
          }
        }
      } catch (error) {
        console.error('Error al resaltar línea:', error);
      }
    }
  }