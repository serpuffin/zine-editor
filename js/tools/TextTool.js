// Text Tool - Handles text creation and editing
export class TextTool {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.active = false;
    }

    activate() {
        this.active = true;
        this.canvasManager.canvas.defaultCursor = 'text';

        // Add click handler to create text
        this.clickHandler = (e) => {
            if (!this.active) return;

            const pointer = this.canvasManager.canvas.getPointer(e.e);
            this.addText(pointer.x, pointer.y);
        };

        this.canvasManager.canvas.on('mouse:down', this.clickHandler);
    }

    deactivate() {
        this.active = false;
        this.canvasManager.canvas.defaultCursor = 'default';

        if (this.clickHandler) {
            this.canvasManager.canvas.off('mouse:down', this.clickHandler);
        }
    }

    addText(x, y) {
        const text = new fabric.IText('Add your text here', {
            left: x,
            top: y,
            fontFamily: 'Inter',
            fontSize: 24,
            fill: '#1a1a24',
            editable: true,
            // Disable object caching for text to ensure crisp rendering during edits
            objectCaching: false
        });

        // --- NEW SAFETY FIX ---
        // When user starts typing, force a clean measurement of characters
        text.on('editing:entered', () => {
            const fontName = text.fontFamily;
            if (fabric.charWidthsCache && fabric.charWidthsCache[fontName]) {
                delete fabric.charWidthsCache[fontName];
            }
            text.initDimensions();
        });
        // ----------------------

        this.canvasManager.canvas.add(text);
        this.canvasManager.canvas.setActiveObject(text);

        // Enter edit mode immediately
        text.enterEditing();
        text.selectAll();

        this.canvasManager.canvas.requestRenderAll();

        console.log('📝 Text added');
    }

    // Helper method to add text programmatically
    addTextAt(x, y, content = 'Add your text here', options = {}) {
        const defaultOptions = {
            left: x,
            top: y,
            fontFamily: 'Inter',
            fontSize: 24,
            fill: '#1a1a24',
            editable: true
        };

        const text = new fabric.IText(content, { ...defaultOptions, ...options });

        this.canvasManager.canvas.add(text);
        this.canvasManager.canvas.setActiveObject(text);
        this.canvasManager.canvas.requestRenderAll();

        return text;
    }
}
