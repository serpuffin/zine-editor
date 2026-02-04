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
        const pdfWidth = firstPage.width * 0.352778; // Convert pixels to mm (72 DPI)
        const pdfHeight = firstPage.height * 0.352778;

        // Create PDF
        const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight]
        });

        // Save current page index to restore later
        const currentIndex = this.pageManager.currentPageIndex;

        // Export each page
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];

            // Switch to this page to render it
            await this.pageManager.switchToPage(i);

            // Get canvas as image
            const imgData = this.pageManager.canvasManager.canvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 2 // Higher resolution for print
            });

            // Add page to PDF (first page is already created)
            if (i > 0) {
                pdf.addPage([pdfWidth, pdfHeight]);
            }

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }

        // Restore original page
        await this.pageManager.switchToPage(currentIndex);

        // Save PDF
        const filename = `zine-${Date.now()}.pdf`;
        pdf.save(filename);

        console.log(`📄 Exported ${pages.length} page(s) to ${filename}`);
    }

    // Export single page
    async exportPage(pageIndex) {
        const { jsPDF } = window.jspdf;

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
            format: [pdfWidth, pdfHeight]
        });

        // Switch to page and export
        const currentIndex = this.pageManager.currentPageIndex;
        await this.pageManager.switchToPage(pageIndex);

        const imgData = this.pageManager.canvasManager.canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2
        });

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Restore page
        await this.pageManager.switchToPage(currentIndex);

        // Save
        pdf.save(`zine-page-${pageIndex + 1}-${Date.now()}.pdf`);
    }
}
