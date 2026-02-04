// Canvas Manager - Handles Fabric.js canvas instance
export class CanvasManager {
    constructor(canvasId) {
        this.canvasElement = document.getElementById(canvasId);
        this.canvas = null;
        this.zoom = 1.0;
        this.minZoom = 0.1;
        this.maxZoom = 5.0;

        this.init();
    }

    init() {
        // Initialize Fabric.js canvas
        this.canvas = new fabric.Canvas(this.canvasElement, {
            backgroundColor: '#ffffff',
            width: 612,  // 8.5 inches at 72 DPI (letter size)
            height: 792, // 11 inches at 72 DPI
            preserveObjectStacking: true,
            selection: true
        });

        // Set up canvas events
        this.setupEvents();

        // Update zoom display
        this.updateZoomDisplay();

        console.log('✅ Canvas initialized');
    }

    setupEvents() {
        // Object selection
        this.canvas.on('selection:created', (e) => this.onSelectionChange(e));
        this.canvas.on('selection:updated', (e) => this.onSelectionChange(e));
        this.canvas.on('selection:cleared', (e) => this.onSelectionCleared(e));

        // Object modification
        this.canvas.on('object:modified', (e) => this.onObjectModified(e));
        this.canvas.on('object:added', (e) => this.onObjectAdded(e));
        this.canvas.on('object:removed', (e) => this.onObjectRemoved(e));
    }

    onSelectionChange(e) {
        const selected = e.selected[0];
        if (selected) {
            this.updatePropertiesPanel(selected);
        }
        this.updateLayersPanel();
    }

    onSelectionCleared(e) {
        this.clearPropertiesPanel();
        this.updateLayersPanel();
    }

    onObjectModified(e) {
        console.log('Object modified:', e.target);
        // TODO: Add to undo stack
    }

    onObjectAdded(e) {
        console.log('Object added:', e.target);
        this.updateLayersPanel();
    }

    onObjectRemoved(e) {
        console.log('Object removed:', e.target);
        this.updateLayersPanel();
    }

    updatePropertiesPanel(obj) {
        const panel = document.getElementById('properties-panel');

        let html = '<div class="properties-content">';

        // Common properties
        html += `
            <div class="form-group">
                <label class="form-label">Position X</label>
                <input type="number" class="input input-number" value="${Math.round(obj.left)}" 
                    onchange="window.zineEditor?.canvasManager.updateObjectProperty('left', parseFloat(this.value))">
            </div>
            <div class="form-group">
                <label class="form-label">Position Y</label>
                <input type="number" class="input input-number" value="${Math.round(obj.top)}" 
                    onchange="window.zineEditor?.canvasManager.updateObjectProperty('top', parseFloat(this.value))">
            </div>
            <div class="form-group">
                <label class="form-label">Width</label>
                <input type="number" class="input input-number" value="${Math.round(obj.width * obj.scaleX)}" 
                    onchange="window.zineEditor?.canvasManager.updateObjectProperty('width', parseFloat(this.value))">
            </div>
            <div class="form-group">
                <label class="form-label">Height</label>
                <input type="number" class="input input-number" value="${Math.round(obj.height * obj.scaleY)}" 
                    onchange="window.zineEditor?.canvasManager.updateObjectProperty('height', parseFloat(this.value))">
            </div>
            <div class="form-group">
                <label class="form-label">Rotation</label>
                <input type="number" class="input input-number" value="${Math.round(obj.angle)}" 
                    onchange="window.zineEditor?.canvasManager.updateObjectProperty('angle', parseFloat(this.value))">
            </div>
        `;

        // Type-specific properties
        if (obj.type === 'i-text' || obj.type === 'text') {
            html += `
                <div class="divider"></div>
                <div class="form-group">
                    <label class="form-label">Font Family</label>
                    <select class="select" value="${obj.fontFamily}" 
                        onchange="window.zineEditor?.canvasManager.updateObjectProperty('fontFamily', this.value)">
                        <option value="Inter">Inter</option>
                        <option value="Outfit">Outfit</option>
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Font Size</label>
                    <input type="number" class="input input-number" value="${obj.fontSize}" 
                        onchange="window.zineEditor?.canvasManager.updateObjectProperty('fontSize', parseFloat(this.value))">
                </div>
                <div class="form-group">
                    <label class="form-label">Text Color</label>
                    <input type="color" class="input input-color" value="${obj.fill}" 
                        onchange="window.zineEditor?.canvasManager.updateObjectProperty('fill', this.value)">
                </div>
            `;
        }

        html += '</div>';
        panel.innerHTML = html;
    }

    clearPropertiesPanel() {
        const panel = document.getElementById('properties-panel');
        panel.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p>Select an element to edit its properties</p>
            </div>
        `;
    }

    updateLayersPanel() {
        const panel = document.getElementById('layers-panel');
        const objects = this.canvas.getObjects();

        if (objects.length === 0) {
            panel.innerHTML = '<div class="empty-state"><p>No objects on canvas</p></div>';
            return;
        }

        let html = '';
        objects.forEach((obj, index) => {
            const isSelected = this.canvas.getActiveObject() === obj;
            const type = obj.type === 'i-text' ? 'Text' : obj.type === 'image' ? 'Image' : 'Shape';
            html += `
                <div class="layer-item ${isSelected ? 'selected' : ''}" onclick="window.zineEditor?.canvasManager.selectObject(${index})">
                    <span>${type} ${index + 1}</span>
                </div>
            `;
        });

        panel.innerHTML = html;
    }

    selectObject(index) {
        const objects = this.canvas.getObjects();
        if (objects[index]) {
            this.canvas.setActiveObject(objects[index]);
            this.canvas.requestRenderAll();
        }
    }

    updateObjectProperty(prop, value) {
        const obj = this.canvas.getActiveObject();
        if (!obj) return;

        if (prop === 'width') {
            obj.scaleX = value / obj.width;
        } else if (prop === 'height') {
            obj.scaleY = value / obj.height;
        } else {
            obj.set(prop, value);
        }

        this.canvas.requestRenderAll();
    }

    // Zoom methods
    zoomIn() {
        this.setZoom(this.zoom * 1.2);
    }

    zoomOut() {
        this.setZoom(this.zoom / 1.2);
    }

    setZoom(newZoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        this.canvas.setZoom(this.zoom);
        this.updateZoomDisplay();
        this.canvas.requestRenderAll();
    }

    zoomToFit() {
        // Reset zoom to fit canvas in viewport
        this.setZoom(1.0);
        this.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
        this.canvas.requestRenderAll();
    }

    updateZoomDisplay() {
        const display = document.getElementById('zoom-level');
        if (display) {
            display.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }

    // Canvas state methods
    clear() {
        this.canvas.clear();
        this.canvas.backgroundColor = '#ffffff';
        this.updateLayersPanel();
        this.clearPropertiesPanel();
    }

    getJSON() {
        return this.canvas.toJSON();
    }

    loadJSON(json) {
        return new Promise((resolve) => {
            this.canvas.loadFromJSON(json, () => {
                this.canvas.requestRenderAll();
                this.updateLayersPanel();
                resolve();
            });
        });
    }

    setDimensions(width, height) {
        this.canvas.setDimensions({
            width: width,
            height: height
        });
        this.canvas.requestRenderAll();
    }
}
