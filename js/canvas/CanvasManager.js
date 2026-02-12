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
                        <optgroup label="📦 Local Fonts">
                        <option value="Andorra One" ${obj.fontFamily === 'Andorra One' ? 'selected' : ''}>Andorra One</option>
                        <option value="Aporrheton" ${obj.fontFamily === 'Aporrheton' ? 'selected' : ''}>Aporrheton</option>
                        <option value="Asterisk Mono" ${obj.fontFamily === 'Asterisk Mono' ? 'selected' : ''}>Asterisk Mono</option>
                        <option value="Bold Pixels" ${obj.fontFamily === 'Bold Pixels' ? 'selected' : ''}>Bold Pixels</option>
                        <option value="Brigadier" ${obj.fontFamily === 'Brigadier' ? 'selected' : ''}>Brigadier</option>
                        <option value="Bubble Sans" ${obj.fontFamily === 'Bubble Sans' ? 'selected' : ''}>Bubble Sans</option>
                        <option value="Cafe24 Dongdong" ${obj.fontFamily === 'Cafe24 Dongdong' ? 'selected' : ''}>Cafe24 Dongdong</option>
                        <option value="Circo" ${obj.fontFamily === 'Circo' ? 'selected' : ''}>Circo</option>
                        <option value="Dot Matrix" ${obj.fontFamily === 'Dot Matrix' ? 'selected' : ''}>Dot Matrix</option>
                        <option value="Expanse" ${obj.fontFamily === 'Expanse' ? 'selected' : ''}>Expanse</option>
                        <option value="Foundation Titles Hand" ${obj.fontFamily === 'Foundation Titles Hand' ? 'selected' : ''}>Foundation Titles Hand</option>
                        <option value="Glitch Goblin" ${obj.fontFamily === 'Glitch Goblin' ? 'selected' : ''}>Glitch Goblin</option>
                        <option value="Gnocchi" ${obj.fontFamily === 'Gnocchi' ? 'selected' : ''}>Gnocchi</option>
                        <option value="Good Old DOS" ${obj.fontFamily === 'Good Old DOS' ? 'selected' : ''}>Good Old DOS</option>
                        <option value="Gothica" ${obj.fontFamily === 'Gothica' ? 'selected' : ''}>Gothica</option>
                        <option value="Hexagothic" ${obj.fontFamily === 'Hexagothic' ? 'selected' : ''}>Hexagothic</option>
                        <option value="Honchokomodo" ${obj.fontFamily === 'Honchokomodo' ? 'selected' : ''}>Honchokomodo</option>
                        <option value="LT Superior Mono" ${obj.fontFamily === 'LT Superior Mono' ? 'selected' : ''}>LT Superior Mono</option>
                        <option value="Leap" ${obj.fontFamily === 'Leap' ? 'selected' : ''}>Leap</option>
                        <option value="Left Hand" ${obj.fontFamily === 'Left Hand' ? 'selected' : ''}>Left Hand</option>
                        <option value="Lulu Monospace" ${obj.fontFamily === 'Lulu Monospace' ? 'selected' : ''}>Lulu Monospace</option>
                        <option value="MADE Mountain" ${obj.fontFamily === 'MADE Mountain' ? 'selected' : ''}>MADE Mountain</option>
                        <option value="Marsh Stencil" ${obj.fontFamily === 'Marsh Stencil' ? 'selected' : ''}>Marsh Stencil</option>
                        <option value="Metal Blackletter" ${obj.fontFamily === 'Metal Blackletter' ? 'selected' : ''}>Metal Blackletter</option>
                        <option value="Nevermind Compact" ${obj.fontFamily === 'Nevermind Compact' ? 'selected' : ''}>Nevermind Compact</option>
                        <option value="Nevermind Mono" ${obj.fontFamily === 'Nevermind Mono' ? 'selected' : ''}>Nevermind Mono</option>
                        <option value="Nevermind Rounded Mono" ${obj.fontFamily === 'Nevermind Rounded Mono' ? 'selected' : ''}>Nevermind Rounded Mono</option>
                        <option value="Panoptic Monospace" ${obj.fontFamily === 'Panoptic Monospace' ? 'selected' : ''}>Panoptic Monospace</option>
                        <option value="Paper Inko" ${obj.fontFamily === 'Paper Inko' ? 'selected' : ''}>Paper Inko</option>
                        <option value="Paragon" ${obj.fontFamily === 'Paragon' ? 'selected' : ''}>Paragon</option>
                        <option value="Pelicula" ${obj.fontFamily === 'Pelicula' ? 'selected' : ''}>Pelicula</option>
                        <option value="Pitagon Sans Mono" ${obj.fontFamily === 'Pitagon Sans Mono' ? 'selected' : ''}>Pitagon Sans Mono</option>
                        <option value="Pixform" ${obj.fontFamily === 'Pixform' ? 'selected' : ''}>Pixform</option>
                        <option value="Pochwara" ${obj.fontFamily === 'Pochwara' ? 'selected' : ''}>Pochwara</option>
                        <option value="QR Comic" ${obj.fontFamily === 'QR Comic' ? 'selected' : ''}>QR Comic</option>
                        <option value="Radio Newsman" ${obj.fontFamily === 'Radio Newsman' ? 'selected' : ''}>Radio Newsman</option>
                        <option value="Scorn" ${obj.fontFamily === 'Scorn' ? 'selected' : ''}>Scorn</option>
                        <option value="Sefa" ${obj.fontFamily === 'Sefa' ? 'selected' : ''}>Sefa</option>
                        <option value="Shehroz" ${obj.fontFamily === 'Shehroz' ? 'selected' : ''}>Shehroz</option>
                        <option value="Space Grotesk" ${obj.fontFamily === 'Space Grotesk' ? 'selected' : ''}>Space Grotesk</option>
                        <option value="Stampcraft" ${obj.fontFamily === 'Stampcraft' ? 'selected' : ''}>Stampcraft</option>
                        <option value="Start Story" ${obj.fontFamily === 'Start Story' ? 'selected' : ''}>Start Story</option>
                        <option value="Stone Tomb" ${obj.fontFamily === 'Stone Tomb' ? 'selected' : ''}>Stone Tomb</option>
                        <option value="Super Ghost" ${obj.fontFamily === 'Super Ghost' ? 'selected' : ''}>Super Ghost</option>
                        <option value="Super Golden" ${obj.fontFamily === 'Super Golden' ? 'selected' : ''}>Super Golden</option>
                        <option value="Super Midnight" ${obj.fontFamily === 'Super Midnight' ? 'selected' : ''}>Super Midnight</option>
                        <option value="TASA Explorer" ${obj.fontFamily === 'TASA Explorer' ? 'selected' : ''}>TASA Explorer</option>
                        <option value="TASA Orbiter" ${obj.fontFamily === 'TASA Orbiter' ? 'selected' : ''}>TASA Orbiter</option>
                        <option value="TJF Anomaly" ${obj.fontFamily === 'TJF Anomaly' ? 'selected' : ''}>TJF Anomaly</option>
                        <option value="Terminal Grotesque" ${obj.fontFamily === 'Terminal Grotesque' ? 'selected' : ''}>Terminal Grotesque</option>
                        <option value="Touchscreen" ${obj.fontFamily === 'Touchscreen' ? 'selected' : ''}>Touchscreen</option>
                        <option value="Yomogi" ${obj.fontFamily === 'Yomogi' ? 'selected' : ''}>Yomogi</option>
                        <option value="Yourmate" ${obj.fontFamily === 'Yourmate' ? 'selected' : ''}>Yourmate</option>
                        </optgroup>
                        <optgroup label="🌐 Google Fonts">
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
                        </optgroup>
                        <optgroup label="💻 System Fonts">
                        <option value="Arial" ${obj.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                        <option value="Times New Roman" ${obj.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                        <option value="Courier New" ${obj.fontFamily === 'Courier New' ? 'selected' : ''}>Courier New</option>
                        <option value="Georgia" ${obj.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
                        </optgroup>
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
        objects.forEach((obj, index) => {
            const isSelected = this.canvas.getActiveObject() === obj;
            const type = obj.type === 'i-text' || obj.type === 'text' ? 'Text' : obj.type === 'image' ? 'Image' : 'Shape';

            // Logic: Use custom Name if set, otherwise fallback to Type + Index
            const displayName = obj.customName || `${type} ${index + 1}`;

            html += `
            <div class="layer-item ${isSelected ? 'selected' : ''}" 
                draggable="true"
                data-index="${index}"
            >
                <div style="display: flex; align-items: center; width: 100%; overflow: hidden;">
                    <span class="layer-name" style="pointer-events: auto; cursor: text; font-weight: 500; margin-right: 8px;" title="Double-click to rename">${displayName}</span>
                    <span style="font-size: 0.8em; color: #888; white-space: nowrap;">(Layer ${index})</span>
                </div>
            </div>
            `;
        });

        panel.innerHTML = html;

        // Attach event listeners
        const layerItems = panel.querySelectorAll('.layer-item');
        layerItems.forEach((item, index) => {
            // 1. Selection Click
            item.addEventListener('click', () => {
                this.selectObject(index);
            });

            // 2. Drag and Drop
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

        // 3. NEW: Rename Listener (Double Click on the name span)
        const nameSpans = panel.querySelectorAll('.layer-name');
        nameSpans.forEach((span, index) => {
            span.addEventListener('dblclick', (e) => {
                // Stop propagation so we don't trigger other layer actions immediately
                e.stopPropagation();
                this.startRenamingLayer(index, span);
            });
        });
    }

    startRenamingLayer(index, spanElement) {
        const objects = this.canvas.getObjects();
        const obj = objects[index];
        if (!obj) return;

        const currentName = spanElement.innerText;

        // Create an input field to replace the span
        const input = document.createElement('input');
        input.type = 'text';
        input.value = obj.customName || currentName; // Use raw custom name if available for editing

        // Inline styles to match the dark theme
        input.style.width = '100%';
        input.style.minWidth = '60px';
        input.style.background = '#0f0f14';
        input.style.color = 'white';
        input.style.border = '1px solid #7C3AED'; // Primary accent color
        input.style.borderRadius = '4px';
        input.style.padding = '2px 4px';
        input.style.fontSize = '12px';
        input.style.fontFamily = 'inherit';
        input.style.outline = 'none';

        // Save function
        const saveName = () => {
            const newName = input.value.trim();
            if (newName) {
                obj.customName = newName;
                // Important: Trigger object modified so Undo/Redo and AutoSave catch this change
                this.canvas.fire('object:modified', { target: obj });
            }
            // Re-render the panel to show normal text again
            this.updateLayersPanel();
        };

        // Event listeners for the input
        input.addEventListener('blur', saveName);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Trigger save
            } else if (e.key === 'Escape') {
                this.updateLayersPanel(); // Cancel
            }
        });

        // Prevent clicks in the input from triggering layer drag/selection
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('mousedown', (e) => e.stopPropagation());

        // Swap span for input
        spanElement.replaceWith(input);
        input.focus();
        input.select();
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
            const fontName = value;

            // 1. Construct a precise font string using the object's current attributes
            const fontWeight = obj.fontWeight || 'normal';
            const fontStyle = obj.fontStyle || 'normal';
            // We use a safe default size for loading, but inherit style/weight
            const fontString = `${fontStyle} ${fontWeight} 12px "${fontName}"`;

            // 2. Set the font immediately so the visual update starts
            obj.set('fontFamily', fontName);
            this.canvas.requestRenderAll();

            if (document.fonts) {
                document.fonts.load(fontString).then(() => {
                    // 3. Use a timeout to allow the browser's Canvas context to sync with the loaded font
                    setTimeout(() => {
                        // Check if object is still valid
                        if (!this.canvas.contains(obj)) return;

                        // Save state
                        const wasEditing = obj.isEditing;
                        const selectionStart = obj.selectionStart;
                        const selectionEnd = obj.selectionEnd;

                        // Force exit editing to unlock dimensions
                        if (wasEditing) {
                            obj.exitEditing();
                        }

                        // --- CRITICAL FIX: Robust Cache Clearing ---
                        // Clear both exact name and lowercase name to ensure stale width data is gone
                        if (fabric.charWidthsCache) {
                            delete fabric.charWidthsCache[fontName];
                            delete fabric.charWidthsCache[fontName.toLowerCase()];
                        }

                        // Force recalculation
                        obj.dirty = true;
                        obj.initDimensions();

                        // Restore state
                        if (wasEditing) {
                            obj.enterEditing();
                            obj.selectionStart = selectionStart;
                            obj.selectionEnd = selectionEnd;
                        }

                        obj.setCoords();
                        this.canvas.requestRenderAll();

                        // Update UI to reflect the new accurate bounding box
                        this.updatePropertiesPanel(obj);
                    }, 10); // 10ms delay is usually enough to catch the 'lazy' render
                }).catch((err) => {
                    console.error('Error loading font:', err);
                });
            }
        } else {
            // Handle all other simple properties
            obj.set(prop, value);
        }

        // Common updates for all property changes
        if (prop !== 'fontFamily') {
            obj.setCoords();
            this.canvas.fire('object:modified', { target: obj });
            this.canvas.requestRenderAll();
            this.updatePropertiesPanel(obj);
        }
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
        // Include 'customName' in the export so layer names are saved
        return this.canvas.toJSON(['customName']);
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

