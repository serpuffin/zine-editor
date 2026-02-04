// Main application entry point
import { CanvasManager } from './canvas/CanvasManager.js';
import { PageManager } from './pages/PageManager.js';
import { ToolManager } from './tools/ToolManager.js';
import { StateManager } from './utils/StateManager.js';
import { PDFExporter } from './export/PDFExporter.js';

class ZineEditor {
    constructor() {
        this.canvasManager = null;
        this.pageManager = null;
        this.toolManager = null;
        this.stateManager = null;
        this.pdfExporter = null;

        this.init();
    }

    async init() {
        console.log('🚀 Initializing Zine Editor...');

        // Initialize managers
        this.stateManager = new StateManager();
        this.canvasManager = new CanvasManager('main-canvas');
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

    handleKeyboard(e) {
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
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const activeObject = this.canvasManager.canvas.getActiveObject();
            if (activeObject) {
                this.canvasManager.canvas.remove(activeObject);
                this.canvasManager.canvas.requestRenderAll();
            }
        }

        // +/-: Zoom
        if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            this.canvasManager.zoomIn();
        }
        if (e.key === '-') {
            e.preventDefault();
            this.canvasManager.zoomOut();
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
        // TODO: Implement undo functionality
        console.log('⏪ Undo');
    }

    redo() {
        // TODO: Implement redo functionality
        console.log('⏩ Redo');
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
