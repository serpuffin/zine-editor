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

        this.baseWidth = 612;
        this.baseHeight = 792;

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
                    onfocus="this.select()"
                    onchange="window.zineEditor?.canvasManager.updateObjectProperty('left', parseFloat(this.value))">
            </div>
            <div class="form-group">
                <label class="form-label">Position Y</label>
                <input type="number" class="input input-number" value="${Math.round(obj.top)}" 
                    onfocus="this.select()"
                    onchange="window.zineEditor?.canvasManager.updateObjectProperty('top', parseFloat(this.value))">
            </div>
            <div class="form-group">
                <label class="form-label">Width</label>
                <input type="number" class="input input-number" value="${Math.round(obj.width * obj.scaleX)}" 
                    onfocus="this.select()"
                    onchange="window.zineEditor?.canvasManager.updateObjectProperty('width', parseFloat(this.value))">
            </div>
            <div class="form-group">
                <label class="form-label">Height</label>
                <input type="number" class="input input-number" value="${Math.round(obj.height * obj.scaleY)}" 
                    onfocus="this.select()"
                    onchange="window.zineEditor?.canvasManager.updateObjectProperty('height', parseFloat(this.value))">
            </div>
            <div class="form-group">
                <label class="form-label">Rotation</label>
                <input type="number" class="input input-number" value="${Math.round(obj.angle)}" 
                    onfocus="this.select()"
                    onchange="window.zineEditor?.canvasManager.updateObjectProperty('angle', parseFloat(this.value))">
            </div>
            <div class="form-group">
                <label class="form-label">Opacity</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="range" class="input-range" min="0" max="100" value="${Math.round((obj.opacity || 1) * 100)}" 
                        oninput="this.nextElementSibling.value = this.value; window.zineEditor?.canvasManager.updateObjectProperty('opacity', this.value / 100)">
                    <input type="number" class="input input-number" style="width: 50px;" min="0" max="100" value="${Math.round((obj.opacity || 1) * 100)}"
                        onfocus="this.select()"
                        onchange="this.previousElementSibling.value = this.value; window.zineEditor?.canvasManager.updateObjectProperty('opacity', this.value / 100)">
                </div>
            </div>
            <div class="divider"></div>
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
                    <label class="form-label">Alignment</label>
                    <div class="btn-group">
                        <button class="btn-icon ${obj.textAlign === 'left' ? 'active' : ''}" 
                            onclick="window.zineEditor?.canvasManager.updateObjectProperty('textAlign', 'left')" title="Align Left">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="17" y1="10" x2="3" y2="10"></line>
                                <line x1="21" y1="6" x2="3" y2="6"></line>
                                <line x1="21" y1="14" x2="3" y2="14"></line>
                                <line x1="17" y1="18" x2="3" y2="18"></line>
                            </svg>
                        </button>
                        <button class="btn-icon ${obj.textAlign === 'center' ? 'active' : ''}" 
                            onclick="window.zineEditor?.canvasManager.updateObjectProperty('textAlign', 'center')" title="Align Center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="21" y1="6" x2="3" y2="6"></line>
                                <line x1="17" y1="10" x2="7" y2="10"></line>
                                <line x1="19" y1="14" x2="5" y2="14"></line>
                                <line x1="21" y1="18" x2="3" y2="18"></line>
                            </svg>
                        </button>
                        <button class="btn-icon ${obj.textAlign === 'right' ? 'active' : ''}" 
                            onclick="window.zineEditor?.canvasManager.updateObjectProperty('textAlign', 'right')" title="Align Right">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="21" y1="10" x2="7" y2="10"></line>
                                <line x1="21" y1="6" x2="3" y2="6"></line>
                                <line x1="21" y1="14" x2="3" y2="14"></line>
                                <line x1="21" y1="18" x2="7" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Font Size</label>
                    <input type="number" class="input input-number" value="${obj.fontSize}" 
                        onfocus="this.select()"
                        onchange="window.zineEditor?.canvasManager.updateObjectProperty('fontSize', parseFloat(this.value))">
                </div>
                <div class="form-group">
                    <label class="form-label">Text Color</label>
                    <input type="color" class="input input-color" value="${obj.fill}" 
                        onchange="window.zineEditor?.canvasManager.updateObjectProperty('fill', this.value)">
                </div>
        `;
        } else if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle' || obj.type === 'line') {
            html += `
            <div class="divider"></div>
                <div class="form-group">
                    <label class="form-label">Fill Color</label>
                    <input type="color" class="input input-color" value="${obj.fill}" 
                        onchange="window.zineEditor?.canvasManager.updateObjectProperty('fill', this.value)">
                </div>
                <div class="form-group">
                    <label class="form-label">Stroke Color</label>
                    <input type="color" class="input input-color" value="${obj.stroke}" 
                        onchange="window.zineEditor?.canvasManager.updateObjectProperty('stroke', this.value)">
                </div>
                <div class="form-group">
                    <label class="form-label">Stroke Width</label>
                    <input type="number" class="input input-number" value="${obj.strokeWidth}" 
                        onchange="window.zineEditor?.canvasManager.updateObjectProperty('strokeWidth', parseFloat(this.value))">
                </div>
        `;
        }

        html += `
            <div class="divider"></div>
                <button class="btn btn-danger btn-full" onclick="window.zineEditor?.deleteSelectedObject()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete Object
                </button>
        `;

        html += '</div>';
        panel.innerHTML = html;
    }

    clearPropertiesPanel() {
        const panel = document.getElementById('properties-panel');
        const backgroundColor = this.canvas.backgroundColor;

        // Convert to hex if it's not already
        let bgColorValue = backgroundColor;
        if (bgColorValue === '#ffffff') bgColorValue = '#FFFFFF';

        panel.innerHTML = `
            <div class="properties-content">
                <div class="section-header">Page Properties</div>
                <div class="form-group">
                    <label class="form-label">Background Color</label>
                    <input type="color" class="input input-color" value="${bgColorValue}" 
                        onchange="window.zineEditor?.canvasManager.updateObjectProperty('backgroundColor', this.value)">
                </div>
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
        // Fabric.js stores objects bottom-up (0 is bottom). 
        // We want to show them top-down (0 is top), so we iterate in reverse or display accordingly.
        // Standard layers panels usually show Top layer at the top.
        // So index N (topmost) should be displayed first in the list?
        // Let's stick to the current bottom-up order for now or reverse it?
        // The existing code iterates objects (0 to N), so it displays bottom layer first.
        // Let's keep it simple and consistent with index for now, but make it draggable.

        objects.forEach((obj, index) => {
            const isSelected = this.canvas.getActiveObject() === obj;
            const type = obj.type === 'i-text' ? 'Text' : obj.type === 'image' ? 'Image' : 'Shape';
            html += `
            <div class="layer-item ${isSelected ? 'selected' : ''}" 
                draggable="true"
                data-index="${index}"
                onclick="window.zineEditor?.canvasManager.selectObject(${index})"
                ondragstart="window.zineEditor?.canvasManager.handleDragStart(event, ${index})"
                ondragover="window.zineEditor?.canvasManager.handleDragOver(event)"
                ondrop="window.zineEditor?.canvasManager.handleDrop(event, ${index})"
            >
                <div style="pointer-events: none;">
                    <span>${type} ${index + 1}</span>
                    <span style="font-size: 0.8em; color: #888; margin-left: 8px;">(Layer ${index})</span>
                </div>
            </div>
            `;
        });

        panel.innerHTML = html;
    }

    handleDragStart(e, index) {
        e.dataTransfer.setData('text/plain', index);
        e.dataTransfer.effectAllowed = 'move';
        // Add a class for styling being dragged?
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDrop(e, targetIndex) {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));

        if (fromIndex !== targetIndex) {
            this.reorderObjects(fromIndex, targetIndex);
        }
    }

    reorderObjects(fromIndex, targetIndex) {
        const objects = this.canvas.getObjects();
        const objectToMove = objects[fromIndex];

        if (objectToMove) {
            // Move object in fabric canvas
            this.canvas.moveTo(objectToMove, targetIndex);
            this.canvas.requestRenderAll();
            this.updateLayersPanel();
        }
    }

    selectObject(index) {
        const objects = this.canvas.getObjects();
        if (objects[index]) {
            this.canvas.setActiveObject(objects[index]);
            this.canvas.requestRenderAll();
        }
    }

    updateObjectProperty(prop, value) {
        if (prop === 'backgroundColor') {
            this.canvas.backgroundColor = value;
            this.canvas.requestRenderAll();
            return;
        }

        const obj = this.canvas.getActiveObject();
        if (!obj) return;

        if (prop === 'opacity') {
            obj.set('opacity', parseFloat(value));
        } else if (prop === 'width') {
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

        // Update canvas scaling
        this.canvas.setZoom(this.zoom);

        // Update canvas dimensions to match zoom
        if (this.baseWidth && this.baseHeight) {
            this.canvas.setDimensions({
                width: this.baseWidth * this.zoom,
                height: this.baseHeight * this.zoom
            });
        }

        this.updateZoomDisplay();
        this.canvas.requestRenderAll();
    }

    zoomToFit() {
        const wrapper = this.canvas.wrapperEl.parentElement; // .canvas-wrapper or similar
        if (!wrapper) return;

        const availableWidth = wrapper.clientWidth - 40; // 40px padding
        const availableHeight = wrapper.clientHeight - 40;

        if (this.baseWidth && this.baseHeight) {
            const scaleX = availableWidth / this.baseWidth;
            const scaleY = availableHeight / this.baseHeight;
            const fitZoom = Math.min(scaleX, scaleY);

            // Limit fit zoom to reasonable bounds
            this.setZoom(fitZoom);

            // Center the view? Fabric usually handles 0,0 at top left.
            // With setDimensions updating size, the canvas will shrink to fit.
        }
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
        this.baseWidth = width;
        this.baseHeight = height;

        // Reset zoom when changing page size? Or keep it?
        // Let's keep zoom but re-apply dimensions
        this.setZoom(this.zoom);
    }
}
