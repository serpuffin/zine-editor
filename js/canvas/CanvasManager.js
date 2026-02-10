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

        // Handle text scaling to prevent distortion
        this.canvas.on('object:scaling', (e) => this.onObjectScaling(e));

        // Keyboard shortcuts for layer reordering
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    onObjectScaling(e) {
        const obj = e.target;

        // Removed text types from this check. 
        // Only apply the "reset scale" logic to shapes if you want them to resize cleanly.
        if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle') {
            const newWidth = obj.width * obj.scaleX;
            const newHeight = obj.height * obj.scaleY;

            obj.set({
                width: newWidth,
                height: newHeight, // Don't forget height for shapes!
                scaleX: 1,
                scaleY: 1
            });

            obj.setCoords();
        }
        // Text objects will now use default Fabric.js behavior (scaling up/down correctly)
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
                    <select class="select" 
                        onchange="window.zineEditor?.canvasManager.updateObjectProperty('fontFamily', this.value)">
                        <option value="Inter" ${obj.fontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
                        <option value="Outfit" ${obj.fontFamily === 'Outfit' ? 'selected' : ''}>Outfit</option>
                        <option value="Playfair Display" ${obj.fontFamily === 'Playfair Display' ? 'selected' : ''}>Playfair Display</option>
                        <option value="Roboto Mono" ${obj.fontFamily === 'Roboto Mono' ? 'selected' : ''}>Roboto Mono</option>
                        <option value="Oswald" ${obj.fontFamily === 'Oswald' ? 'selected' : ''}>Oswald</option>
                        <option value="Permanent Marker" ${obj.fontFamily === 'Permanent Marker' ? 'selected' : ''}>Permanent Marker</option>
                        <option value="Bangers" ${obj.fontFamily === 'Bangers' ? 'selected' : ''}>Bangers</option>
                        <option value="Special Elite" ${obj.fontFamily === 'Special Elite' ? 'selected' : ''}>Special Elite</option>
                        <option value="Lobster" ${obj.fontFamily === 'Lobster' ? 'selected' : ''}>Lobster</option>
                        <option value="Pacifico" ${obj.fontFamily === 'Pacifico' ? 'selected' : ''}>Pacifico</option>
                        <option value="Arial" ${obj.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                        <option value="Times New Roman" ${obj.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                        <option value="Courier New" ${obj.fontFamily === 'Courier New' ? 'selected' : ''}>Courier New</option>
                        <option value="Georgia" ${obj.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
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
            >
                <div style="pointer-events: none;">
                    <span>${type} ${index + 1}</span>
                    <span style="font-size: 0.8em; color: #888; margin-left: 8px;">(Layer ${index})</span>
                </div>
            </div>
            `;
        });

        panel.innerHTML = html;

        // Attach event listeners programmatically for proper event handling
        const layerItems = panel.querySelectorAll('.layer-item');
        layerItems.forEach((item, index) => {
            // Click to select
            item.addEventListener('click', () => {
                this.selectObject(index);
            });

            // Drag and drop events
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index.toString());
                item.classList.add('dragging');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const targetIndex = index;

                if (fromIndex !== targetIndex) {
                    this.reorderObjects(fromIndex, targetIndex);
                }
            });

            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
            });
        });
    }



    reorderObjects(fromIndex, targetIndex) {
        const objects = this.canvas.getObjects();
        const objectToMove = objects[fromIndex];

        if (objectToMove) {
            // Remove the object from canvas
            this.canvas.remove(objectToMove);

            // Re-insert at the target index
            // Fabric.js maintains objects in a private array, we need to insert at the right position
            this.canvas.insertAt(objectToMove, targetIndex);

            this.canvas.requestRenderAll();
            this.updateLayersPanel();
        }
    }

    handleKeyDown(e) {
        // Only handle arrow keys when an object is selected
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject) return;

        // Check if user is typing in an input field
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            return;
        }

        const objects = this.canvas.getObjects();
        const currentIndex = objects.indexOf(activeObject);

        if (currentIndex === -1) return;

        let targetIndex = null;

        switch (e.key) {
            case 'ArrowUp':
                // Move up in layer stack (higher z-index)
                if (currentIndex < objects.length - 1) {
                    targetIndex = currentIndex + 1;
                }
                e.preventDefault();
                break;
            case 'ArrowDown':
                // Move down in layer stack (lower z-index)
                if (currentIndex > 0) {
                    targetIndex = currentIndex - 1;
                }
                e.preventDefault();
                break;
        }

        if (targetIndex !== null) {
            this.reorderObjects(currentIndex, targetIndex);
            // Keep the object selected after reordering
            this.canvas.setActiveObject(activeObject);
            this.canvas.requestRenderAll();
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
        } else if (prop === 'fontFamily') {
            // 1. Set property immediately
            obj.set(prop, value);

            const fontName = value;
            const fontString = `normal normal 400 12px "${fontName}"`;

            if (document.fonts) {
                document.fonts.load(fontString).then(() => {
                    // --- NEW FIX START - fixing the text overflow issue when resizing fonts after typing ---
                    // Check if the user is currently editing (typing) in this box
                    const wasEditing = obj.isEditing;
                    // Save cursor position so we don't lose their place
                    const selectionStart = obj.selectionStart;
                    const selectionEnd = obj.selectionEnd;

                    // 1. Force exit editing mode. 
                    // This destroys the hidden textarea and unlocks the dimensions.
                    if (wasEditing) {
                        obj.exitEditing();
                    }

                    // 2. Clear Cache (from previous fix)
                    if (fabric.charWidthsCache && fabric.charWidthsCache[fontName]) {
                        delete fabric.charWidthsCache[fontName];
                    }

                    // 3. Apply Font & Recalculate
                    obj.set('fontFamily', fontName);

                    if (obj.initDimensions) {
                        obj.initDimensions();
                    }

                    // 4. Restore Editing Mode
                    // We re-create the editing session with the NEW correct dimensions
                    if (wasEditing) {
                        obj.enterEditing();
                        // Restore cursor position
                        obj.selectionStart = selectionStart;
                        obj.selectionEnd = selectionEnd;
                    }
                    // --- NEW FIX END ---

                    obj.dirty = true;
                    obj.setCoords();
                    this.canvas.requestRenderAll();
                }).catch((err) => {
                    console.error('Error loading font:', err);
                });
            }
        }

        // Update object coordinates for proper rendering
        obj.setCoords();

        // Trigger modified event for history tracking
        this.canvas.fire('object:modified', { target: obj });

        this.canvas.requestRenderAll();

        // Refresh the properties panel to show updated values
        this.updatePropertiesPanel(obj);
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

    // ========================================
    // MASTER PAGES & SPREAD VIEW RENDERING
    // ========================================

    async renderPageWithMaster(pageData, masterData) {
        this.clear();

        // Load master objects first (bottom layer)
        if (masterData) {
            await new Promise((resolve) => {
                this.canvas.loadFromJSON(masterData, () => {
                    // Mark all master objects for locking
                    this.lockMasterObjects();
                    resolve();
                });
            });
        }

        // Load page objects on top (without clearing canvas)
        if (pageData && pageData.objects) {
            await new Promise((resolve) => {
                // Use enlivenObjects to load objects without clearing canvas
                fabric.util.enlivenObjects(pageData.objects, (objects) => {
                    objects.forEach(obj => {
                        obj.isPageObject = true; // Mark as page object
                        this.canvas.add(obj);
                    });
                    this.canvas.requestRenderAll();
                    resolve();
                }, '');
            });
        }

        this.updateLayersPanel();
    }

    lockMasterObjects() {
        const objects = this.canvas.getObjects();
        objects.forEach(obj => {
            // Mark objects with a custom property to identify master objects
            if (!obj.isPageObject) {
                obj.selectable = false;
                obj.evented = false;
                obj.isMasterObject = true;
                // Visual indicator - slight opacity
                if (obj.opacity === undefined || obj.opacity === 1) {
                    obj.set('opacity', 0.85);
                }
            }
        });
        this.canvas.requestRenderAll();
    }

    unlockAllObjects() {
        const objects = this.canvas.getObjects();
        objects.forEach(obj => {
            obj.selectable = true;
            obj.evented = true;
            obj.isMasterObject = false;
            // Restore opacity
            if (obj.opacity === 0.85) {
                obj.set('opacity', 1);
            }
        });
        this.canvas.requestRenderAll();
    }

    async renderSpread(leftPageData, rightPageData, leftMasterData, rightMasterData, pageWidth) {
        this.clear();

        // Helper to add objects with offset without clearing canvas
        const addObjectsWithOffset = async (data, offsetX, offsetY, isMaster = false) => {
            if (!data || !data.objects) return;

            return new Promise((resolve) => {
                fabric.util.enlivenObjects(data.objects, (objects) => {
                    objects.forEach(obj => {
                        obj.set({
                            left: obj.left + offsetX,
                            top: obj.top + offsetY
                        });
                        obj.setCoords();

                        // Mark objects appropriately
                        if (isMaster) {
                            obj.isMasterObject = true;
                        } else {
                            obj.isPageObject = true;
                        }

                        this.canvas.add(obj);
                    });
                    resolve();
                }, '');
            });
        };

        // Left page (master + content)
        if (leftMasterData) {
            await addObjectsWithOffset(leftMasterData, 0, 0, true);
        }
        if (leftPageData) {
            await addObjectsWithOffset(leftPageData, 0, 0, false);
        }

        // Right page (master + content)
        if (rightMasterData) {
            await addObjectsWithOffset(rightMasterData, pageWidth, 0, true);
        }
        if (rightPageData) {
            await addObjectsWithOffset(rightPageData, pageWidth, 0, false);
        }

        // Lock master objects
        this.lockMasterObjects();

        // Draw spine guide
        this.drawSpineGuide(pageWidth);

        this.canvas.requestRenderAll();
        this.updateLayersPanel();
    }

    async loadJSONWithOffset(json, offsetX, offsetY) {
        if (!json) return;

        return new Promise((resolve) => {
            this.canvas.loadFromJSON(json, () => {
                // After loading, offset all newly loaded objects
                const objects = this.canvas.getObjects();
                objects.forEach(obj => {
                    if (!obj._offsetApplied) {
                        obj.set({
                            left: obj.left + offsetX,
                            top: obj.top + offsetY
                        });
                        obj._offsetApplied = true;
                        obj.setCoords();
                    }
                });
                this.canvas.requestRenderAll();
                resolve();
            });
        });
    }

    drawSpineGuide(xPosition) {
        // Draw a dashed vertical line at the center (spine/fold)
        const spine = new fabric.Line(
            [xPosition, 0, xPosition, this.baseHeight],
            {
                stroke: '#999',
                strokeWidth: 1,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
                isSpineGuide: true,
                excludeFromExport: true
            }
        );

        this.canvas.add(spine);
        this.canvas.sendToBack(spine);
    }

    // Enhanced loadJSON to support offset parameters
    async loadJSON(json, offsetX = 0, offsetY = 0) {
        if (!json) return;

        return new Promise((resolve) => {
            this.canvas.loadFromJSON(json, () => {
                if (offsetX !== 0 || offsetY !== 0) {
                    const objects = this.canvas.getObjects();
                    objects.forEach(obj => {
                        obj.set({
                            left: obj.left + offsetX,
                            top: obj.top + offsetY
                        });
                        obj.setCoords();
                    });
                }
                this.canvas.requestRenderAll();
                this.updateLayersPanel();
                resolve();
            });
        });
    }
}

