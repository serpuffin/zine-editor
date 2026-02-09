// Page Manager - Handles multi-page document structure
export class PageManager {
    constructor(canvasManager, stateManager) {
        this.canvasManager = canvasManager;
        this.stateManager = stateManager;
        this.pages = [];
        this.currentPageIndex = -1;

        // Default page sizes (width x height in pixels at 72 DPI)
        this.pageSizes = {
            letter: { width: 612, height: 792, name: 'Letter (8.5" × 11")' },
            letterHalf: { width: 396, height: 612, name: 'Half Letter (5.5" × 8.5")' },
            letterQuarter: { width: 306, height: 396, name: 'Quarter Letter (4.25" × 5.5")' },
            a4: { width: 595, height: 842, name: 'A4 (210mm × 297mm)' },
            square: { width: 612, height: 612, name: 'Square (8.5" × 8.5")' },
        };

        this.defaultSize = 'letter';
    }

    async addPage(size = this.defaultSize) {
        const pageSize = this.pageSizes[size];

        // Save current page state before switching
        if (this.currentPageIndex >= 0) {
            await this.saveCurrentPage();
        }

        // Create new page
        const newPage = {
            id: Date.now() + Math.random(),
            size: size,
            width: pageSize.width,
            height: pageSize.height,
            canvasData: null,
            thumbnail: null
        };

        this.pages.push(newPage);
        this.currentPageIndex = this.pages.length - 1;

        // Update canvas dimensions
        this.canvasManager.setDimensions(pageSize.width, pageSize.height);
        this.canvasManager.clear();

        // Update UI
        this.updatePagesUI();

        console.log(`📄 Added page ${this.pages.length}`);

        return newPage;
    }

    async deletePage(index) {
        if (this.pages.length <= 1) {
            alert('Cannot delete the last page');
            return;
        }

        this.pages.splice(index, 1);

        // Adjust current page index
        if (this.currentPageIndex >= this.pages.length) {
            this.currentPageIndex = this.pages.length - 1;
        }

        // Load the current page
        await this.switchToPage(this.currentPageIndex);

        this.updatePagesUI();
        console.log(`🗑️ Deleted page ${index + 1}`);
    }

    async switchToPage(index) {
        if (index < 0 || index >= this.pages.length || index === this.currentPageIndex) {
            return;
        }

        // Save current page
        await this.saveCurrentPage();

        // Switch to new page
        this.currentPageIndex = index;
        const page = this.pages[index];

        // Update canvas dimensions
        this.canvasManager.setDimensions(page.width, page.height);

        // Load page data
        if (page.canvasData) {
            await this.canvasManager.loadJSON(page.canvasData);
        } else {
            this.canvasManager.clear();
        }

        this.updatePagesUI();
        console.log(`📖 Switched to page ${index + 1}`);
    }

    async saveCurrentPage() {
        if (this.currentPageIndex < 0) return;

        const page = this.pages[this.currentPageIndex];
        page.canvasData = this.canvasManager.getJSON();

        // Generate thumbnail
        page.thumbnail = this.generateThumbnail();
    }

    generateThumbnail() {
        // Create a smaller version of the canvas for thumbnail
        const scale = 0.1; // 10% of original size
        return this.canvasManager.canvas.toDataURL({
            format: 'png',
            multiplier: scale
        });
    }

    updatePagesUI() {
        const pagesList = document.getElementById('pages-list');

        let html = '';
        this.pages.forEach((page, index) => {
            const isActive = index === this.currentPageIndex;
            const pageSize = this.pageSizes[page.size];

            html += `
                <div class="page-item ${isActive ? 'active' : ''}" 
                    draggable="true"
                    data-index="${index}"
                    onclick="window.zineEditor?.pageManager.switchToPage(${index})"
                    ondragstart="window.zineEditor?.pageManager.handlePageDragStart(event, ${index})"
                    ondragover="window.zineEditor?.pageManager.handlePageDragOver(event)"
                    ondrop="window.zineEditor?.pageManager.handlePageDrop(event, ${index})"
                    ondragend="window.zineEditor?.pageManager.handlePageDragEnd(event)">
                    <div class="page-drag-handle" style="pointer-events: none;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5">
                            <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                            <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                        </svg>
                    </div>
                    <div class="page-thumbnail" style="pointer-events: none;">
                        ${page.thumbnail ? `<img src="${page.thumbnail}" alt="Page ${index + 1}">` : ''}
                    </div>
                    <div class="page-info" style="pointer-events: none;">
                        <div class="page-name">Page ${index + 1}</div>
                        <div class="page-size">${pageSize.name}</div>
                    </div>
                    <button class="page-delete" onclick="event.stopPropagation(); window.zineEditor?.pageManager.deletePage(${index})" 
                        title="Delete page">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            `;
        });

        pagesList.innerHTML = html;
    }

    // State management
    getState() {
        // Make sure current page is saved
        if (this.currentPageIndex >= 0) {
            const page = this.pages[this.currentPageIndex];
            page.canvasData = this.canvasManager.getJSON();
        }

        return this.pages;
    }

    async loadState(state) {
        if (!state.pages || state.pages.length === 0) return;

        this.pages = state.pages;
        this.currentPageIndex = state.currentPage || 0;

        // Load current page
        const page = this.pages[this.currentPageIndex];
        this.canvasManager.setDimensions(page.width, page.height);

        if (page.canvasData) {
            await this.canvasManager.loadJSON(page.canvasData);
        }

        this.updatePagesUI();
    }

    // Get all pages for export
    getAllPages() {
        // Save current page first
        if (this.currentPageIndex >= 0) {
            const page = this.pages[this.currentPageIndex];
            page.canvasData = this.canvasManager.getJSON();
        }

        return this.pages;
    }

    // Page reordering methods
    async movePage(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        if (fromIndex < 0 || fromIndex >= this.pages.length) return;
        if (toIndex < 0 || toIndex >= this.pages.length) return;

        // Save current page before reordering
        await this.saveCurrentPage();

        // Remove page from old position and insert at new position
        const [page] = this.pages.splice(fromIndex, 1);
        this.pages.splice(toIndex, 0, page);

        // Update current page index if affected
        if (this.currentPageIndex === fromIndex) {
            this.currentPageIndex = toIndex;
        } else if (fromIndex < this.currentPageIndex && toIndex >= this.currentPageIndex) {
            this.currentPageIndex--;
        } else if (fromIndex > this.currentPageIndex && toIndex <= this.currentPageIndex) {
            this.currentPageIndex++;
        }

        this.updatePagesUI();
        console.log(`📄 Moved page from position ${fromIndex + 1} to ${toIndex + 1}`);
    }

    handlePageDragStart(e, index) {
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    }

    handlePageDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Add visual feedback
        const target = e.target.closest('.page-item');
        if (target && !target.classList.contains('dragging')) {
            // Remove drag-over class from all items first
            document.querySelectorAll('.page-item.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            target.classList.add('drag-over');
        }
    }

    handlePageDrop(e, targetIndex) {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));

        // Remove visual feedback
        document.querySelectorAll('.page-item.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });

        if (fromIndex !== targetIndex) {
            this.movePage(fromIndex, targetIndex);
        }
    }

    handlePageDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.page-item.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }
}
