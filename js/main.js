// Main application entry point
import { CanvasManager } from './canvas/CanvasManager.js';
import { PageManager } from './pages/PageManager.js';
import { ToolManager } from './tools/ToolManager.js';
import { StateManager } from './utils/StateManager.js';
import { HistoryManager } from './utils/HistoryManager.js';
import { PDFExporter } from './export/PDFExporter.js';

class ZineEditor {
    constructor() {
        this.canvasManager = null;
        this.pageManager = null;
        this.toolManager = null;
        this.stateManager = null;
        this.historyManager = null;
        this.pdfExporter = null;

        this.init();
    }

    async init() {
        console.log('🚀 Initializing Zine Editor...');

        // Initialize managers
        this.stateManager = new StateManager();
        this.canvasManager = new CanvasManager('main-canvas');
        this.historyManager = new HistoryManager(this.canvasManager);
        this.pageManager = new PageManager(this.canvasManager, this.stateManager);
        this.toolManager = new ToolManager(this.canvasManager);
        this.pdfExporter = new PDFExporter(this.pageManager);

        // Initialize first page
        await this.pageManager.addPage();

        // Set up event listeners
        this.setupEventListeners();

        // Load saved state if exists
        this.loadState();

        console.log('✅ Zine Editor ready!');
    }

    setupEventListeners() {
        // Toolbar actions
        document.getElementById('save-btn').addEventListener('click', () => this.save());
        document.getElementById('export-json-btn').addEventListener('click', () => this.exportJSON());
        document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-input').click());
        document.getElementById('import-input').addEventListener('change', (e) => this.importJSON(e));
        document.getElementById('export-pdf-btn').addEventListener('click', () => this.exportPDF());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.redo());

        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => this.canvasManager.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.canvasManager.zoomOut());
        document.getElementById('zoom-fit').addEventListener('click', () => this.canvasManager.zoomToFit());

        // Page management
        document.getElementById('add-page-btn').addEventListener('click', () => {
            const sizeSelect = document.getElementById('page-size-select');
            const selectedSize = sizeSelect.value;
            this.pageManager.addPage(selectedSize);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Autosave every 30 seconds
        setInterval(() => this.autoSave(), 30000);
    }

    // ... (keep handleKeyboard, deleteSelectedObject as is, or use multi_replace for targeted edits if they are far apart)
    // Actually, I'm replacing a large chunk because I need to add methods.

    // Let me target specific chunks for safer edits.
    // I will return to previous strategy and use targeted replacements.


    handleKeyboard(e) {
        // Check if user is typing in an input field or editing text on canvas
        const activeElement = document.activeElement;
        const isTypingInInput = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.tagName === 'SELECT' ||
            activeElement.isContentEditable
        );

        // Check if editing text on Fabric.js canvas
        const activeObject = this.canvasManager.canvas.getActiveObject();
        const isEditingCanvasText = activeObject &&
            (activeObject.type === 'i-text' || activeObject.type === 'text') &&
            activeObject.isEditing;

        // Ctrl/Cmd + Z: Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }

        // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
        if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
            e.preventDefault();
            this.redo();
        }

        // Ctrl/Cmd + S: Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.save();
        }

        // Tool shortcuts - but only if not editing text
        if (!e.ctrlKey && !e.metaKey) {
            // Only process shortcuts if not editing text anywhere
            if (!isTypingInInput && !isEditingCanvasText) {
                switch (e.key.toLowerCase()) {
                    case 'v':
                        this.toolManager.setTool('select');
                        break;
                    case 't':
                        this.toolManager.setTool('text');
                        break;
                    case 'i':
                        this.toolManager.setTool('image');
                        break;
                    case 's':
                        this.toolManager.setTool('shape');
                        break;
                }
            }
        }

        // Delete: Remove selected object
        // Only if NOT editing text
        if ((e.key === 'Delete' || e.key === 'Backspace') && !isTypingInInput && !isEditingCanvasText) {
            if (activeObject) {
                this.canvasManager.canvas.remove(activeObject);
                this.canvasManager.updateLayersPanel();
                this.canvasManager.canvas.requestRenderAll();
            }
        }

        // +/-: Zoom
        // Only if NOT editing text
        if ((e.key === '+' || e.key === '=') && !isTypingInInput && !isEditingCanvasText) {
            e.preventDefault();
            this.canvasManager.zoomIn();
        }
        if (e.key === '-' && !isTypingInInput && !isEditingCanvasText) {
            e.preventDefault();
            this.canvasManager.zoomOut();
        }
    }

    deleteSelectedObject() {
        const activeObject = this.canvasManager.canvas.getActiveObject();
        if (activeObject) {
            this.canvasManager.canvas.remove(activeObject);
            this.canvasManager.updateLayersPanel();
            this.canvasManager.canvas.requestRenderAll();
        }
    }

    save() {
        this.stateManager.save({
            pages: this.pageManager.getState(),
            currentPage: this.pageManager.currentPageIndex
        });

        // Visual feedback
        const btn = document.getElementById('save-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Saved!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }

    exportJSON() {
        const state = {
            pages: this.pageManager.getState(),
            currentPage: this.pageManager.currentPageIndex,
            version: '1.0',
            exportedAt: Date.now()
        };
        this.stateManager.exportToFile(state);
    }

    async importJSON(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const state = await this.stateManager.importFromFile(file);
            if (confirm('Importing will overwrite your current work. Continue?')) {
                // Load state
                if (state && state.pages) {
                    await this.pageManager.loadState(state);
                    console.log('📂 Imported project');
                } else {
                    alert('Invalid project file');
                }
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import project file');
        }

        // Reset input
        e.target.value = '';
    }


    autoSave() {
        this.stateManager.save({
            pages: this.pageManager.getState(),
            currentPage: this.pageManager.currentPageIndex
        });
        console.log('📝 Auto-saved');
    }

    loadState() {
        const state = this.stateManager.load();
        if (state && state.pages && state.pages.length > 0) {
            // Restore pages
            this.pageManager.loadState(state);
            console.log('📂 Loaded previous session');
        }
    }

    undo() {
        this.historyManager.undo();
    }

    redo() {
        this.historyManager.redo();
    }

    async exportPDF() {
        try {
            await this.pdfExporter.export();
            console.log('📄 PDF exported successfully');
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Failed to export PDF. Please try again.');
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.zineEditor = new ZineEditor();
    });
} else {
    window.zineEditor = new ZineEditor();
}
