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

        // CONVERSION: Convert pixels to mm (1 px = 0.264583 mm at 96dpi, or use your specific ratio)
        // Your exportPage uses 0.352778 (which assumes 72DPI: 1/72 inch * 25.4 mm)
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

        // Exit spread view if active
        if (wasInSpreadView) {
            // We need to wait for spread view toggle to complete fully
            await this.pageManager.toggleSpreadView();
            // Small delay to ensure canvas is ready
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Export each page
        for (let i = 0; i < pages.length; i++) {
            // Switch to this page to render it
            await this.pageManager.switchToPage(i);

            // Wait for rendering to complete
            await new Promise(resolve => setTimeout(resolve, 200));

            // Temporarily hide master objects and guides for cleaner export
            const canvas = this.pageManager.canvasManager.canvas;

            // Ensure white background for JPEG export
            const originalBg = canvas.backgroundColor;
            canvas.setBackgroundColor('#ffffff', () => canvas.renderAll());

            const hiddenObjects = [];
            canvas.getObjects().forEach(obj => {
                if (obj.isSpineGuide || obj.excludeFromExport) {
                    obj.visible = false;
                    hiddenObjects.push(obj);
                }
            });

            canvas.requestRenderAll();

            // Use JPEG for better compatibility and smaller file size
            // Reduced multiplier to 1.0 to ensure valid PDF generation
            const imgData = canvas.toDataURL({
                format: 'jpeg',
                quality: 1.0,
                multiplier: 1.0
            });

            // Restore hidden objects and background
            hiddenObjects.forEach(obj => obj.visible = true);
            canvas.setBackgroundColor(originalBg, () => canvas.renderAll());
            canvas.requestRenderAll();

            // Add new page to PDF if not the first one
            if (i > 0) {
                // FIXED: Explicitly pass orientation to addPage
                pdf.addPage([pdfWidth, pdfHeight], orientation);
            }

            try {
                // Use mm dimensions for placement
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
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

        const pdfWidth = page.width * 0.352778;
        const pdfHeight = page.height * 0.352778;

        const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight],
            compress: true
        });

        // Switch to page and export
        const currentIndex = this.pageManager.currentPageIndex;
        await this.pageManager.switchToPage(pageIndex);

        const canvas = this.pageManager.canvasManager.canvas;

        // Ensure white background for JPEG
        const originalBg = canvas.backgroundColor;
        canvas.setBackgroundColor('#ffffff', () => canvas.renderAll());

        const imgData = canvas.toDataURL({
            format: 'jpeg',
            quality: 1.0,
            multiplier: 1.0
        });

        // Restore background
        canvas.setBackgroundColor(originalBg, () => canvas.renderAll());

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        // Restore page
        await this.pageManager.switchToPage(currentIndex);

        // Save
        pdf.save(`zine-page-${pageIndex + 1}-${Date.now()}.pdf`);
    }
}