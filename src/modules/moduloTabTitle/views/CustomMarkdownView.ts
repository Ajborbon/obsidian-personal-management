// src/modules/moduloTabTitle/views/CustomMarkdownView.ts
import { MarkdownView, WorkspaceLeaf } from 'obsidian';

export class CustomMarkdownView extends MarkdownView {
    private customTitle: string | null = null;

    getDisplayText(): string {
        return this.customTitle || super.getDisplayText();
    }

    setCustomTitle(title: string | null) {
        this.customTitle = title;
        this.leaf.tabHeaderInnerTitleEl.textContent = title || this.file?.basename || '';
    }
}