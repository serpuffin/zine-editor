// PDF Exporter - Generates PDF from pages using jsPDF
export class PDFExporter {
    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async export() {
        const { jsPDF } = window.jspdf;

        if (!jsPDF) {
            throw new Error('jsPDF library not loaded');
        }

        const pages = this.pageManager.getAllPages();

        if (pages.length === 0) {
            throw new Error('No pages to export');
        }

        // Get first page to determine PDF dimensions
        const firstPage = pages[0];

        // CONVERSION: 1 px at 72 DPI = 0.352778 mm
        const PX_TO_MM = 0.352778;
        const pdfWidth = firstPage.width * PX_TO_MM;
        const pdfHeight = firstPage.height * PX_TO_MM;
        const orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait';

        // Initialize jsPDF with 'mm'
        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: [pdfWidth, pdfHeight],
            compress: true
        });

        // Save current page index to restore later
        const currentIndex = this.pageManager.currentPageIndex;
        const wasInSpreadView = this.pageManager.isSpreadView;

        // Exit spread view if active to ensure we process single pages correctly
        if (wasInSpreadView) {
            await this.pageManager.toggleSpreadView();
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // --- QUALITY SETTINGS ---
        // 1.0 = 72 DPI (Screen)
        // 4.16 = ~300 DPI (Print)
        // We use 4.0 for a balance of high quality and performance
        const EXPORT_SCALE_FACTOR = 4;

        // Export each page
        for (let i = 0; i < pages.length; i++) {
            // Switch to this page to render it
            await this.pageManager.switchToPage(i);

            // Wait for rendering to complete (vital for fonts)
            await new Promise(resolve => setTimeout(resolve, 200));

            const canvas = this.pageManager.canvasManager.canvas;

            // Temporarily hide guides for cleaner export
            const hiddenObjects = [];
            canvas.getObjects().forEach(obj => {
                if (obj.isSpineGuide || obj.excludeFromExport) {
                    obj.visible = false;
                    hiddenObjects.push(obj);
                }
            });

            // Ensure white background
            const originalBg = canvas.backgroundColor;
            // Set background specifically for export to ensure no transparency
            canvas.setBackgroundColor('#ffffff', () => canvas.renderAll());
            canvas.requestRenderAll();

            // --- HIGH RES EXPORT ---
            // format: 'png' ensures text remains crisp (no jpeg artifacts)
            // multiplier: scales the canvas up to create more pixels
            const imgData = canvas.toDataURL({
                format: 'png',
                multiplier: EXPORT_SCALE_FACTOR
            });

            // Restore hidden objects and background
            hiddenObjects.forEach(obj => obj.visible = true);
            canvas.setBackgroundColor(originalBg, () => canvas.renderAll());
            canvas.requestRenderAll();

            // Add new page to PDF if not the first one
            if (i > 0) {
                pdf.addPage([pdfWidth, pdfHeight], orientation);
            }

            try {
                // We fit the HIGH RES image into the PHYSICAL size box (pdfWidth x pdfHeight)
                // This condenses the pixels, creating high DPI
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            } catch (err) {
                console.error(`Error adding page ${i + 1} to PDF:`, err);
                throw new Error(`Failed to add page ${i + 1} to PDF: ${err.message}`);
            }
        }

        // Restore original page and view mode
        await this.pageManager.switchToPage(currentIndex);
        if (wasInSpreadView) {
            await this.pageManager.toggleSpreadView();
        }

        // Save PDF
        const filename = `zine-${Date.now()}.pdf`;
        pdf.save(filename);

        console.log(`📄 Exported ${pages.length} page(s) to ${filename}`);
    }

    // Export single page
    async exportPage(pageIndex) {
        const { jsPDF } = window.jspdf;

        if (!jsPDF) {
            throw new Error('jsPDF library not loaded');
        }

        const pages = this.pageManager.getAllPages();
        const page = pages[pageIndex];

        if (!page) {
            throw new Error('Page not found');
        }

        const PX_TO_MM = 0.352778;
        const pdfWidth = page.width * PX_TO_MM;
        const pdfHeight = page.height * PX_TO_MM;
        const orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait';

        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: [pdfWidth, pdfHeight],
            compress: true
        });

        // Switch to page and export
        const currentIndex = this.pageManager.currentPageIndex;
        await this.pageManager.switchToPage(pageIndex);

        const canvas = this.pageManager.canvasManager.canvas;

        // Hide guides
        const hiddenObjects = [];
        canvas.getObjects().forEach(obj => {
            if (obj.isSpineGuide || obj.excludeFromExport) {
                obj.visible = false;
                hiddenObjects.push(obj);
            }
        });

        // Ensure white background
        const originalBg = canvas.backgroundColor;
        canvas.setBackgroundColor('#ffffff', () => canvas.renderAll());

        // --- HIGH RES EXPORT ---
        const EXPORT_SCALE_FACTOR = 4;

        const imgData = canvas.toDataURL({
            format: 'png',
            multiplier: EXPORT_SCALE_FACTOR
        });

        // Restore state
        hiddenObjects.forEach(obj => obj.visible = true);
        canvas.setBackgroundColor(originalBg, () => canvas.renderAll());

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Restore page
        await this.pageManager.switchToPage(currentIndex);

        // Save
        pdf.save(`zine-page-${pageIndex + 1}-${Date.now()}.pdf`);
    }
}