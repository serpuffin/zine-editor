// Tool Manager - Manages tool selection and activation
import { TextTool } from './TextTool.js';
import { ImageTool } from './ImageTool.js';

export class ToolManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.currentTool = 'select';
        this.tools = {};

        // Initialize tools
        this.tools.text = new TextTool(canvasManager);
        this.tools.image = new ImageTool(canvasManager);

        this.setupToolButtons();
    }

    setupToolButtons() {
        const toolButtons = document.querySelectorAll('.tool-btn');

        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                this.setTool(tool);
            });
        });
    }

    setTool(toolName) {
        // Deactivate current tool
        if (this.tools[this.currentTool]) {
            this.tools[this.currentTool].deactivate();
        }

        this.currentTool = toolName;

        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === toolName);
        });

        // Activate new tool
        if (this.tools[toolName]) {
            this.tools[toolName].activate();
        } else if (toolName === 'select') {
            // Select tool is default canvas behavior
            this.canvasManager.canvas.isDrawingMode = false;
            this.canvasManager.canvas.selection = true;
        } else if (toolName === 'shape') {
            this.addRectangle();
        }

        console.log(`🛠️ Tool: ${toolName}`);
    }

    addRectangle() {
        const rect = new fabric.Rect({
            left: 100,
            top: 100,
            width: 200,
            height: 150,
            fill: '#9B87F5',
            stroke: '#7C3AED',
            strokeWidth: 2,
            rx: 8,
            ry: 8
        });

        this.canvasManager.canvas.add(rect);
        this.canvasManager.canvas.setActiveObject(rect);
        this.canvasManager.canvas.requestRenderAll();

        // Switch back to select tool
        this.setTool('select');
    }
}
