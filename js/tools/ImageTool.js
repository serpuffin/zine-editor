// Image Tool - Handles image upload and placement
export class ImageTool {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.active = false;
        this.fileInput = document.getElementById('image-upload-input');

        this.setupFileInput();
    }

    setupFileInput() {
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadImage(file);
            }
            // Reset input
            e.target.value = '';
        });
    }

    activate() {
        this.active = true;

        // Trigger file input
        this.fileInput.click();

        console.log('🖼️ Image tool activated');
    }

    deactivate() {
        this.active = false;
    }

    loadImage(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const imgUrl = e.target.result;

            fabric.Image.fromURL(imgUrl, (img) => {
                // Scale image to fit canvas if it's too large
                const maxWidth = this.canvasManager.canvas.width * 0.8;
                const maxHeight = this.canvasManager.canvas.height * 0.8;

                if (img.width > maxWidth || img.height > maxHeight) {
                    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                    img.scale(scale);
                }

                // Center the image
                img.set({
                    left: (this.canvasManager.canvas.width - img.width * img.scaleX) / 2,
                    top: (this.canvasManager.canvas.height - img.height * img.scaleY) / 2
                });

                this.canvasManager.canvas.add(img);
                this.canvasManager.canvas.setActiveObject(img);
                this.canvasManager.canvas.requestRenderAll();

                console.log('🖼️ Image added');
            });
        };

        reader.readAsDataURL(file);
    }

    // Helper method to add image from URL
    addImageFromURL(url, options = {}) {
        return new Promise((resolve, reject) => {
            fabric.Image.fromURL(url, (img) => {
                if (!img) {
                    reject(new Error('Failed to load image'));
                    return;
                }

                // Apply options
                img.set(options);

                this.canvasManager.canvas.add(img);
                this.canvasManager.canvas.requestRenderAll();

                resolve(img);
            });
        });
    }
}
