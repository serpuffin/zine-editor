// History Manager - Handles undo/redo functionality
export class HistoryManager {
    constructor(canvasManager, maxHistory = 50) {
        this.canvasManager = canvasManager;
        this.maxHistory = maxHistory;
        this.undoStack = [];
        this.redoStack = [];
        this.isRestoring = false; // Flag to prevent recording during undo/redo

        // Save initial state
        this.saveState();

        // Set up canvas event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = this.canvasManager.canvas;

        // Save state after object modifications
        canvas.on('object:modified', () => this.onCanvasChange());
        canvas.on('object:added', () => this.onCanvasChange());
        canvas.on('object:removed', () => this.onCanvasChange());
    }

    onCanvasChange() {
        // Don't record changes during undo/redo operations
        if (this.isRestoring) return;

        this.saveState();
    }

    saveState() {
        // Get current canvas state as JSON
        const state = JSON.stringify(this.canvasManager.canvas.toJSON());

        // Don't save if it's the same as the last state
        if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === state) {
            return;
        }

        // Add to undo stack
        this.undoStack.push(state);

        // Clear redo stack when new action is performed
        this.redoStack = [];

        // Limit history size
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }

        this.updateButtonStates();
    }

    undo() {
        if (this.undoStack.length <= 1) {
            console.log('⏪ Nothing to undo');
            return false;
        }

        this.isRestoring = true;

        // Move current state to redo stack
        const currentState = this.undoStack.pop();
        this.redoStack.push(currentState);

        // Get previous state
        const previousState = this.undoStack[this.undoStack.length - 1];

        // Restore previous state
        this.restoreState(previousState);

        this.updateButtonStates();
        console.log('⏪ Undo');

        return true;
    }

    redo() {
        if (this.redoStack.length === 0) {
            console.log('⏩ Nothing to redo');
            return false;
        }

        this.isRestoring = true;

        // Get next state from redo stack
        const nextState = this.redoStack.pop();

        // Add to undo stack
        this.undoStack.push(nextState);

        // Restore state
        this.restoreState(nextState);

        this.updateButtonStates();
        console.log('⏩ Redo');

        return true;
    }

    restoreState(stateJSON) {
        const state = JSON.parse(stateJSON);

        this.canvasManager.canvas.loadFromJSON(state, () => {
            this.canvasManager.canvas.requestRenderAll();
            this.canvasManager.updateLayersPanel();
            this.canvasManager.clearPropertiesPanel();
            this.isRestoring = false;
        });
    }

    updateButtonStates() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length <= 1;
        }
        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
        }
    }

    // Clear history (e.g., when switching pages)
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.saveState(); // Save current state as initial
    }

    // Get current history info for debugging
    getInfo() {
        return {
            undoCount: this.undoStack.length - 1, // -1 because first state is initial
            redoCount: this.redoStack.length
        };
    }
}
